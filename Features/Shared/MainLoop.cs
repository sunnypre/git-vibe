using GitVibe.Core.Models;
using GitVibe.Features.Staging;
using GitVibe.Features.Branching;
using GitVibe.Infrastructure.Git;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public enum View
{
    Staging,
    Branching
}

public class MainLoop(
    ILogger<MainLoop> logger, 
    IHostApplicationLifetime lifetime,
    IGitService gitService) : IHostedService, IDisposable
{
    private CancellationTokenSource? _loopCts;
    private readonly char[] _illegalBranchChars = ['~', '^', ':', '?', '*', '[', ' ', '@', '{', '}', '\\'];
    
    private int _isBackgroundLoading = 0;
    private int _spinnerIndex = 0;
    private readonly object _stateLock = new();
    
    private string _branch = "Unknown";
    private List<GitFile> _files = [];
    private List<GitBranch> _branches = [];
    private string? _errorMessage = null;
    private DateTime? _errorDisplayUntil = null;
    private bool _needsRedraw = true;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("MainLoop starting...");
        
        _loopCts?.Cancel();
        _loopCts?.Dispose();
        _loopCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        
        _ = Task.Run(() => RunLoopAsync(_loopCts.Token), cancellationToken);

        return Task.CompletedTask;
    }

    private async Task RunLoopAsync(CancellationToken ct)
    {
        if (Console.IsInputRedirected)
        {
            logger.LogWarning("Input is redirected. MainLoop cannot run in non-interactive mode.");
            return;
        }

        try
        {
            var width = AnsiConsole.Console.Profile.Width;
            var height = AnsiConsole.Console.Profile.Height;

            if (width < 40 || height < 10)
            {
                AnsiConsole.Clear();
                AnsiConsole.Write(new Align(new Markup("[bold red]Terminal Too Small[/]\nPlease resize to at least 40x10"), HorizontalAlignment.Center, VerticalAlignment.Middle));
                await Task.Delay(2000, ct);
                return;
            }

            var sidebarSize = width < 80 ? 15 : 20;
            var innerLayout = new Layout("Main")
                .SplitColumns(
                    new Layout("Sidebar").Size(sidebarSize),
                    new Layout("Action")
                );

            var rootLayout = new Layout("Root")
                .SplitRows(
                    innerLayout,
                    new Layout("Footer").Size(1)
                );

            var currentView = View.Staging;
            string? selectedPath = null;
            var isCommitOverlayActive = false;
            var isPushPromptActive = false;
            var isCommandOverlayActive = false;
            var isOutputOverlayActive = false;
            var isDiffOverlayActive = false;
            var isSearchOverlayActive = false;
            var isBranchCreationOverlayActive = false;
            var isUpstreamPromptActive = false;
            var commitMessage = string.Empty;
            var rawCommand = "git ";
            var searchQuery = string.Empty;
            var branchNameInput = string.Empty;
            var currentDiffContent = string.Empty;
            var diffFilename = string.Empty;
            var diffScrollOffset = 0;
            var stagingScrollOffset = 0;
            var branchingScrollOffset = 0;
            var selectedIndex = 0;
            GitResult? lastCommandResult = null;
            
            var branchSelectedIndex = 0;

            List<StagingViewItem> cachedViewItems = [];
            string? lastSearchQuery = null;
            List<GitFile> lastFilesSnapshot = [];

            await AnsiConsole.Live(rootLayout)
                .AutoClear(false)
                .StartAsync(async ctx =>
                {
                    // Initial Fetch
                    await RefreshGitStateAsync(ct);

                    while (!ct.IsCancellationRequested)
                    {
                        var currentWidth = AnsiConsole.Console.Profile.Width;
                        var currentHeight = AnsiConsole.Console.Profile.Height;
                        var pageSize = currentHeight - 4; 

                        if (currentWidth < 40 || currentHeight < 10)
                        {
                            ctx.UpdateTarget(new Align(new Markup("[bold red]Terminal Too Small[/]\nPlease resize to at least 40x10"), HorizontalAlignment.Center, VerticalAlignment.Middle));
                            await Task.Delay(500, ct);
                            lock (_stateLock) { _needsRedraw = true; }
                            continue;
                        }

                        // Local snapshots for thread-safe rendering
                        string currentBranch;
                        List<GitFile> currentFiles;
                        List<GitBranch> currentBranches;
                        string? currentError;
                        bool isLoading;

                        lock (_stateLock)
                        {
                            // Clear expired error messages
                            if (_errorDisplayUntil.HasValue && DateTime.Now > _errorDisplayUntil.Value)
                            {
                                _errorMessage = null;
                                _errorDisplayUntil = null;
                                _needsRedraw = true;
                            }

                            currentBranch = _branch;
                            currentFiles = _files;
                            currentBranches = _branches;
                            currentError = _errorMessage;
                            isLoading = _isBackgroundLoading == 1;

                            if (isLoading)
                            {
                                _spinnerIndex = (_spinnerIndex + 1) % 1000;
                                _needsRedraw = true;
                            }
                        }

                        // Unified list for Staging View - only recalculate if needed
                        if (!ReferenceEquals(currentFiles, lastFilesSnapshot) || searchQuery != lastSearchQuery)
                        {
                            cachedViewItems = currentFiles
                                .Select(f => new StagingViewItem(f, f.IsStaged))
                                .OrderBy(i => i.File.Path, StringComparer.OrdinalIgnoreCase)
                                .ToList();

                            if (!string.IsNullOrEmpty(searchQuery))
                            {
                                cachedViewItems = cachedViewItems.Where(i => i.File.Path.Contains(searchQuery, StringComparison.OrdinalIgnoreCase)).ToList();
                            }

                            lastFilesSnapshot = currentFiles;
                            lastSearchQuery = searchQuery;

                            // Update selection only on change
                            var foundIndex = cachedViewItems.FindIndex(i => i.File.Path == selectedPath);
                            if (foundIndex != -1)
                            {
                                selectedIndex = foundIndex;
                            }
                            else
                            {
                                selectedIndex = Math.Clamp(selectedIndex, 0, Math.Max(0, cachedViewItems.Count - 1));
                            }

                            if (cachedViewItems.Count > 0)
                            {
                                selectedPath = cachedViewItems[selectedIndex].File.Path;
                            }
                        }

                        var viewItems = cachedViewItems;

                        if (branchSelectedIndex >= currentBranches.Count) branchSelectedIndex = Math.Max(0, currentBranches.Count - 1);

                        // Auto-scroll logic
                        if (currentView == View.Staging && viewItems.Count > 0)
                        {
                            var selectedRow = StagingView.GetSelectedRowIndex(viewItems, selectedIndex);
                            if (selectedRow < stagingScrollOffset) stagingScrollOffset = selectedRow;
                            if (selectedRow >= stagingScrollOffset + pageSize) stagingScrollOffset = selectedRow - pageSize + 1;
                        }
                        else if (currentView == View.Branching && currentBranches.Count > 0)
                        {
                            var selectedRow = BranchingView.GetSelectedRowIndex(currentBranches, branchSelectedIndex);
                            if (selectedRow < branchingScrollOffset) branchingScrollOffset = selectedRow;
                            if (selectedRow >= branchingScrollOffset + pageSize) branchingScrollOffset = selectedRow - pageSize + 1;
                        }

                        bool localNeedsRedraw;
                        lock (_stateLock) { localNeedsRedraw = _needsRedraw; }

                        if (localNeedsRedraw)
                        {
                            var sidebarSizeFixed = currentWidth < 80 ? 15 : 20;
                            innerLayout["Sidebar"].Size(sidebarSizeFixed);

                            IRenderable activeView;
                            string viewTitle;

                            if (currentView == View.Staging)
                            {
                                activeView = new StagingView(viewItems, selectedIndex, stagingScrollOffset, pageSize);
                                viewTitle = "GitVibe Staging";
                            }
                            else
                            {
                                activeView = new BranchingView(currentBranches, branchSelectedIndex, branchingScrollOffset, pageSize);
                                viewTitle = "GitVibe Branching";
                            }

                            var statusBar = new StatusBarView(currentBranch, isLoading, _spinnerIndex);

                            var filesSidebarColor = currentView == View.Staging ? "blue" : "grey";
                            var branchesSidebarColor = currentView == View.Branching ? "blue" : "grey";

                            innerLayout["Sidebar"].Update(
                                new Panel(new Markup($"[{filesSidebarColor}]Files[/]\n[{branchesSidebarColor}]Branches[/]"))
                                    .Header(" [bold blue]Menu[/] ")
                                    .Border(BoxBorder.None)
                            );

                            var actionContent = currentError != null 
                                ? (IRenderable)new Rows(activeView, new Panel(new Markup($"[red]Error:[/] {Markup.Escape(currentError)}")).BorderColor(Color.Red))
                                : (viewItems.Count == 0 && !string.IsNullOrEmpty(searchQuery))
                                    ? new Panel(new Align(new Markup("[yellow]No matches found.[/]"), HorizontalAlignment.Center, VerticalAlignment.Middle)).Expand()
                                    : activeView;

                            innerLayout["Action"].Update(
                                new Panel(actionContent)
                                    .Header($" [bold blue]{viewTitle}[/] ")
                                    .Border(BoxBorder.Double)
                                    .Expand()
                            );

                            rootLayout["Footer"].Update(statusBar);

                            IRenderable finalView;
                            if (isCommitOverlayActive) finalView = new Align(new CommitOverlay(commitMessage), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isPushPromptActive) finalView = new Align(new PushPromptOverlay(), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isCommandOverlayActive) finalView = new Align(new CommandOverlay(rawCommand), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isBranchCreationOverlayActive) finalView = new Align(new BranchCreationOverlay(branchNameInput), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isUpstreamPromptActive) finalView = new Align(new UpstreamTrackingOverlay(), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isSearchOverlayActive) finalView = new Align(new SearchOverlay(searchQuery), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isDiffOverlayActive) finalView = new Align(new DiffView(diffFilename, currentDiffContent, diffScrollOffset), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            else if (isOutputOverlayActive && lastCommandResult != null)
                            {
                                finalView = lastCommandResult.Success 
                                    ? (IRenderable)new Align(new CommandOutputOverlay(lastCommandResult.Output), HorizontalAlignment.Center, VerticalAlignment.Middle)
                                    : new Align(new ErrorOverlay(lastCommandResult.Error), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            }
                            else if (currentError != null && !_errorDisplayUntil.HasValue) 
                            {
                                finalView = new Align(new ErrorOverlay(currentError), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            }
                            else
                            {
                                finalView = rootLayout;
                            }

                            ctx.UpdateTarget(finalView);
                            lock (_stateLock) { _needsRedraw = false; }
                        }

                        if (Console.KeyAvailable)
                        {
                            while (Console.KeyAvailable)
                            {
                                var key = Console.ReadKey(true);
                                lock (_stateLock) { _needsRedraw = true; }

                                if (isCommitOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isCommitOverlayActive = false; commitMessage = string.Empty; break;
                                        case ConsoleKey.Enter:
                                            if (!string.IsNullOrWhiteSpace(commitMessage))
                                            {
                                                isCommitOverlayActive = false;
                                                var msg = commitMessage;
                                                RunBackgroundGitTask(
                                                    async t => await gitService.CommitAsync(msg, t),
                                                    "Commit",
                                                    onSuccess: async r => {
                                                        if (await gitService.HasRemoteTrackingBranchAsync(ct)) 
                                                        {
                                                            isPushPromptActive = true;
                                                            lock (_stateLock) { _needsRedraw = true; }
                                                        }
                                                    });
                                                commitMessage = string.Empty;
                                            }
                                            break;
                                        case ConsoleKey.Backspace: if (commitMessage.Length > 0) commitMessage = commitMessage[..^1]; break;
                                        default: if (key.KeyChar >= 32) commitMessage += key.KeyChar; break;
                                    }
                                }
                                else if (isPushPromptActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Y:
                                            isPushPromptActive = false;
                                            RunBackgroundGitTask(async t => await gitService.PushAsync(t), "Push");
                                            break;
                                        case ConsoleKey.N:
                                        case ConsoleKey.Escape: isPushPromptActive = false; break;
                                    }
                                }
                                else if (isCommandOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isCommandOverlayActive = false; rawCommand = "git "; break;
                                        case ConsoleKey.Enter:
                                            isCommandOverlayActive = false;
                                            var cmd = rawCommand;
                                            RunBackgroundGitTask(
                                                async t => await gitService.RunRawAsync(cmd, t),
                                                "Raw Command",
                                                onSuccess: async r => {
                                                    lastCommandResult = r;
                                                    if (!r.Success || !string.IsNullOrWhiteSpace(r.Output)) isOutputOverlayActive = true;
                                                    lock (_stateLock) { _needsRedraw = true; }
                                                });
                                            rawCommand = "git ";
                                            break;
                                        case ConsoleKey.Backspace: if (rawCommand.Length > 4) rawCommand = rawCommand[..^1]; break;
                                        default: if (key.KeyChar >= 32) rawCommand += key.KeyChar; break;
                                    }
                                }
                                else if (isBranchCreationOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isBranchCreationOverlayActive = false; branchNameInput = string.Empty; break;
                                        case ConsoleKey.Enter:
                                            if (!string.IsNullOrWhiteSpace(branchNameInput))
                                            {
                                                isBranchCreationOverlayActive = false;
                                                var bName = branchNameInput.Trim();
                                                RunBackgroundGitTask(
                                                    async t => await gitService.CreateBranchAsync(bName, t),
                                                    "Create Branch",
                                                    onSuccess: async r => {
                                                        isUpstreamPromptActive = true;
                                                        lock (_stateLock) { _needsRedraw = true; }
                                                    });
                                                branchNameInput = string.Empty;
                                            }
                                            break;
                                        case ConsoleKey.Backspace: if (branchNameInput.Length > 0) branchNameInput = branchNameInput[..^1]; break;
                                        default:
                                            if (key.KeyChar >= 32 && !_illegalBranchChars.Contains(key.KeyChar))
                                                branchNameInput += key.KeyChar;
                                            break;
                                    }
                                }
                                else if (isUpstreamPromptActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Y:
                                            isUpstreamPromptActive = false;
                                            RunBackgroundGitTask(async t => await gitService.RunRawAsync("git push -u origin HEAD", t), "Set Upstream");
                                            break;
                                        case ConsoleKey.N:
                                        case ConsoleKey.Escape: isUpstreamPromptActive = false; break;
                                    }
                                }
                                else if (isSearchOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isSearchOverlayActive = false; searchQuery = string.Empty; break;
                                        case ConsoleKey.Enter: isSearchOverlayActive = false; break;
                                        case ConsoleKey.Backspace: if (searchQuery.Length > 0) searchQuery = searchQuery[..^1]; break;
                                        case ConsoleKey.UpArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Max(0, selectedIndex - 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            break;
                                        case ConsoleKey.DownArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Min(viewItems.Count - 1, selectedIndex + 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            break;
                                        case ConsoleKey.Spacebar:
                                            if (currentView == View.Staging && viewItems.Count > 0)
                                            {
                                                var item = viewItems[selectedIndex];
                                                RunBackgroundGitTask(
                                                    async t => item.IsStagedSection ? await gitService.UnstageAsync(item.File.Path, t) : await gitService.StageAsync(item.File.Path, t),
                                                    "Toggle Stage");
                                            }
                                            break;
                                        default: if (key.KeyChar >= 32 && key.KeyChar != '/') searchQuery += key.KeyChar; break;
                                    }
                                }
                                else if (isOutputOverlayActive)
                                {
                                    isOutputOverlayActive = false;
                                    lastCommandResult = null;
                                }
                                else if (isDiffOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isDiffOverlayActive = false; currentDiffContent = string.Empty; break;
                                        case ConsoleKey.UpArrow: diffScrollOffset = Math.Max(0, diffScrollOffset - 1); break;
                                        case ConsoleKey.DownArrow:
                                            var lineCount = currentDiffContent.Split('\n').Length;
                                            if (diffScrollOffset < lineCount - 1) diffScrollOffset++;
                                            break;
                                    }
                                }
                                else
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: lifetime.StopApplication(); return;
                                        case ConsoleKey.Tab: currentView = currentView == View.Staging ? View.Branching : View.Staging; break;
                                        case ConsoleKey.PageUp:
                                            if (currentView == View.Staging) { selectedIndex = Math.Max(0, selectedIndex - pageSize); selectedPath = viewItems.Count > 0 ? viewItems[selectedIndex].File.Path : null; }
                                            else if (currentView == View.Branching) branchSelectedIndex = Math.Max(0, branchSelectedIndex - pageSize);
                                            break;
                                        case ConsoleKey.PageDown:
                                            if (currentView == View.Staging) { selectedIndex = Math.Min(viewItems.Count - 1, selectedIndex + pageSize); selectedPath = viewItems.Count > 0 ? viewItems[selectedIndex].File.Path : null; }
                                            else if (currentView == View.Branching) branchSelectedIndex = Math.Min(currentBranches.Count - 1, branchSelectedIndex + pageSize);
                                            break;
                                        case ConsoleKey.UpArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Max(0, selectedIndex - 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            else if (currentView == View.Branching && currentBranches.Count > 0) branchSelectedIndex = Math.Max(0, branchSelectedIndex - 1);
                                            break;
                                        case ConsoleKey.DownArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Min(viewItems.Count - 1, selectedIndex + 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            else if (currentView == View.Branching && currentBranches.Count > 0) branchSelectedIndex = Math.Min(currentBranches.Count - 1, branchSelectedIndex + 1);
                                            break;
                                        case ConsoleKey.Enter:
                                        case ConsoleKey.D:
                                            if (currentView == View.Staging && viewItems.Count > 0)
                                            {
                                                var item = viewItems[selectedIndex];
                                                diffFilename = item.File.Path;
                                                currentDiffContent = await gitService.GetDiffAsync(diffFilename, item.IsStagedSection, ct);
                                                isDiffOverlayActive = true;
                                                diffScrollOffset = 0;
                                            }
                                            else if (key.Key == ConsoleKey.Enter && currentView == View.Branching && currentBranches.Count > 0)
                                            {
                                                var selectedBranch = currentBranches[branchSelectedIndex];
                                                if (!selectedBranch.IsActive)
                                                {
                                                    RunBackgroundGitTask(async t => await gitService.CheckoutBranchAsync(selectedBranch.Name, t), "Checkout");
                                                }
                                            }
                                            break;
                                        case ConsoleKey.A:
                                           if (currentView == View.Staging && viewItems.Count > 0)
                                           {
                                               if (string.IsNullOrEmpty(searchQuery))
                                               {
                                                   bool anyUnstaged = currentFiles.Any(f => f.IsUnstaged || f.IsUntracked);
                                                   RunBackgroundGitTask(async t => anyUnstaged ? await gitService.RunRawAsync("add -A", t) : await gitService.UnstageAllAsync(t), "Toggle All");
                                               }
                                               else
                                               {
                                                   bool anyVisibleUnstaged = viewItems.Any(i => i.File.IsUnstaged || i.File.IsUntracked);
                                                   var paths = anyVisibleUnstaged 
                                                        ? viewItems.Where(i => i.File.IsUnstaged || i.File.IsUntracked).Select(i => i.File.Path).ToList()
                                                        : viewItems.Where(i => i.File.IsStaged).Select(i => i.File.Path).ToList();
                                                   
                                                   var cmd = anyVisibleUnstaged ? "add -- " : "reset HEAD -- ";
                                                   RunBackgroundGitTask(async t => await gitService.RunRawAsync($"{cmd}{string.Join(" ", paths.Select(p => $"\"{p}\""))}", t), "Toggle Filtered");
                                               }
                                           }
                                           break;

                                        case ConsoleKey.B:
                                            if (currentView == View.Branching) { isBranchCreationOverlayActive = true; branchNameInput = string.Empty; }
                                            break;
                                        case ConsoleKey.Spacebar:
                                            if (currentView == View.Staging && viewItems.Count > 0)
                                            {
                                                var item = viewItems[selectedIndex];
                                                RunBackgroundGitTask(
                                                    async t => item.IsStagedSection ? await gitService.UnstageAsync(item.File.Path, t) : await gitService.StageAsync(item.File.Path, t),
                                                    "Toggle Stage");
                                            }
                                            break;
                                        case ConsoleKey.C:
                                            if (currentFiles.Any(f => f.IsStaged)) { isCommitOverlayActive = true; commitMessage = string.Empty; }
                                            else { lock(_stateLock) { _errorMessage = "No staged files to commit"; _errorDisplayUntil = DateTime.Now.AddSeconds(3); _needsRedraw = true; } }
                                            break;
                                        case ConsoleKey.G:
                                            if (key.Modifiers.HasFlag(ConsoleModifiers.Shift)) { isCommandOverlayActive = true; rawCommand = "git "; }
                                            break;
                                        case ConsoleKey.R: 
                                            RunBackgroundGitTask(async t => new GitResult(0, "", ""), "Manual Refresh");
                                            break;
                                        default:
                                            if (key.KeyChar == '/' && currentView == View.Staging)
                                            {
                                                isSearchOverlayActive = true;
                                                searchQuery = string.Empty;
                                            }
                                            break;
                                    }
                                }
                            }
                        }
                        else
                        {
                            await Task.Delay(50, ct);
                        }
                    }
                });
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in MainLoop");
            lifetime.StopApplication();
        }
    }

    private void RunBackgroundGitTask(
        Func<CancellationToken, Task<GitResult>> action,
        string taskName,
        bool triggerRefresh = true,
        Func<GitResult, Task>? onSuccess = null)
    {
        if (Interlocked.CompareExchange(ref _isBackgroundLoading, 1, 0) != 0)
        {
            lock (_stateLock)
            {
                _errorMessage = "Operation in progress...";
                _errorDisplayUntil = DateTime.Now.AddSeconds(2);
                _needsRedraw = true;
            }
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                var result = await action(_loopCts?.Token ?? CancellationToken.None);
                
                if (result.Success)
                {
                    if (onSuccess != null)
                    {
                        await onSuccess(result);
                    }

                    if (triggerRefresh)
                    {
                        await RefreshGitStateAsync(_loopCts?.Token ?? CancellationToken.None);
                    }
                }
                else
                {
                    lock (_stateLock)
                    {
                        _errorMessage = result.Error;
                        _errorDisplayUntil = DateTime.Now.AddSeconds(5);
                        _needsRedraw = true;
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Background task {TaskName} failed", taskName);
                lock (_stateLock)
                {
                    _errorMessage = $"Task {taskName} failed";
                    _errorDisplayUntil = DateTime.Now.AddSeconds(5);
                    _needsRedraw = true;
                }
            }
            finally
            {
                Interlocked.Exchange(ref _isBackgroundLoading, 0);
                lock (_stateLock)
                {
                    _needsRedraw = true;
                }
            }
        });
    }

    private async Task RefreshGitStateAsync(CancellationToken ct)
    {
        try
        {
            var nextBranch = await gitService.GetActiveBranchAsync(ct);
            var nextFiles = await gitService.GetStatusAsync(ct);
            var nextBranches = await gitService.GetBranchesAsync(ct);

            lock (_stateLock)
            {
                _branch = nextBranch;
                _files = nextFiles;
                _branches = nextBranches;
                _needsRedraw = true;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to refresh git state");
            lock (_stateLock)
            {
                _errorMessage = "Refresh Failed";
                _errorDisplayUntil = DateTime.Now.AddSeconds(3);
                _needsRedraw = true;
            }
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("MainLoop stopping...");
        _loopCts?.Cancel();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _loopCts?.Dispose();
        GC.SuppressFinalize(this);
    }
}
