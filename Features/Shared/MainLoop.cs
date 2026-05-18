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
            var isRefreshing = false;
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
            string? errorMessage = null;
            DateTime? errorDisplayUntil = null;
            
            var branchSelectedIndex = 0;
            var needsRedraw = true;

            List<StagingViewItem> cachedViewItems = [];
            string? lastSearchQuery = null;
            List<GitFile> lastFiles = [];

            await AnsiConsole.Live(rootLayout)
                .AutoClear(false)
                .StartAsync(async ctx =>
                {
                    // Initial Fetch
                    string branch = "Unknown";
                    List<GitFile> files = [];
                    List<GitBranch> branches = [];
                    
                    try 
                    {
                        branch = await gitService.GetActiveBranchAsync(ct);
                        files = await gitService.GetStatusAsync(ct);
                        branches = await gitService.GetBranchesAsync(ct);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Initial git fetch failed");
                        errorMessage = "Git Initialization Failed";
                    }

                    while (!ct.IsCancellationRequested)
                    {
                        var width = AnsiConsole.Console.Profile.Width;
                        var height = AnsiConsole.Console.Profile.Height;
                        var pageSize = height - 4; // Account for Footer(1) and Action Panel Borders/Header(3)

                        if (width < 40 || height < 10)
                        {
                            ctx.UpdateTarget(new Align(new Markup("[bold red]Terminal Too Small[/]\nPlease resize to at least 40x10"), HorizontalAlignment.Center, VerticalAlignment.Middle));
                            await Task.Delay(500, ct);
                            needsRedraw = true;
                            continue;
                        }

                        // Clear expired error messages
                        if (errorDisplayUntil.HasValue && DateTime.Now > errorDisplayUntil.Value)
                        {
                            errorMessage = null;
                            errorDisplayUntil = null;
                            needsRedraw = true;
                        }

                        // Unified list for Staging View - only recalculate if needed
                        if (!ReferenceEquals(files, lastFiles) || searchQuery != lastSearchQuery)
                        {
                            cachedViewItems = files
                                .Select(f => new StagingViewItem(f, f.IsStaged))
                                .OrderBy(i => i.File.Path, StringComparer.OrdinalIgnoreCase)
                                .ToList();

                            if (!string.IsNullOrEmpty(searchQuery))
                            {
                                cachedViewItems = cachedViewItems.Where(i => i.File.Path.Contains(searchQuery, StringComparison.OrdinalIgnoreCase)).ToList();
                            }

                            lastFiles = files;
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

                        if (branchSelectedIndex >= branches.Count) branchSelectedIndex = Math.Max(0, branches.Count - 1);

                        // Auto-scroll logic (always keep in sync with selection)
                        if (currentView == View.Staging && viewItems.Count > 0)
                        {
                            var selectedRow = StagingView.GetSelectedRowIndex(viewItems, selectedIndex);
                            if (selectedRow < stagingScrollOffset) stagingScrollOffset = selectedRow;
                            if (selectedRow >= stagingScrollOffset + pageSize) stagingScrollOffset = selectedRow - pageSize + 1;
                        }
                        else if (currentView == View.Branching && branches.Count > 0)
                        {
                            var selectedRow = BranchingView.GetSelectedRowIndex(branches, branchSelectedIndex);
                            if (selectedRow < branchingScrollOffset) branchingScrollOffset = selectedRow;
                            if (selectedRow >= branchingScrollOffset + pageSize) branchingScrollOffset = selectedRow - pageSize + 1;
                        }

                        if (needsRedraw)
                        {
                            var sidebarSize = width < 80 ? 15 : 20;
                            innerLayout["Sidebar"].Size(sidebarSize);

                            IRenderable activeView;
                            string viewTitle;

                            if (currentView == View.Staging)
                            {
                                activeView = new StagingView(viewItems, selectedIndex, stagingScrollOffset, pageSize);
                                viewTitle = "GitVibe Staging";
                            }
                            else
                            {
                                activeView = new BranchingView(branches, branchSelectedIndex, branchingScrollOffset, pageSize);
                                viewTitle = "GitVibe Branching";
                            }

                            var statusBar = new StatusBarView(branch, isRefreshing);

                            var filesSidebarColor = currentView == View.Staging ? "blue" : "grey";
                            var branchesSidebarColor = currentView == View.Branching ? "blue" : "grey";

                            innerLayout["Sidebar"].Update(
                                new Panel(new Markup($"[{filesSidebarColor}]Files[/]\n[{branchesSidebarColor}]Branches[/]"))
                                    .Header(" [bold blue]Menu[/] ")
                                    .Border(BoxBorder.None)
                            );

                            var actionContent = errorMessage != null 
                                ? (IRenderable)new Rows(activeView, new Panel(new Markup($"[red]Error:[/] {Markup.Escape(errorMessage)}")).BorderColor(Color.Red))
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
                            else if (errorMessage != null && !errorDisplayUntil.HasValue) // Only show error overlay for permanent errors
                            {
                                finalView = new Align(new ErrorOverlay(errorMessage), HorizontalAlignment.Center, VerticalAlignment.Middle);
                            }
                            else
                            {
                                finalView = rootLayout;
                            }

                            ctx.UpdateTarget(finalView);
                            needsRedraw = false;
                        }

                        if (isRefreshing)
                        {
                            try 
                            {
                                branch = await gitService.GetActiveBranchAsync(ct);
                                files = await gitService.GetStatusAsync(ct);
                                branches = await gitService.GetBranchesAsync(ct);
                                needsRedraw = true;
                            }
                            catch (Exception ex)
                            {
                                logger.LogError(ex, "Failed to refresh git snapshot");
                                errorMessage = "Refresh Failed";   
                                errorDisplayUntil = DateTime.Now.AddSeconds(3);
                            }
                            finally
                            {
                                isRefreshing = false;
                            }
                            continue; 
                        }

                        if (Console.KeyAvailable)
                        {
                            while (Console.KeyAvailable)
                            {
                                var key = Console.ReadKey(true);
                                needsRedraw = true;

                                if (isCommitOverlayActive)
                                {
                                    switch (key.Key)
                                    {
                                        case ConsoleKey.Escape: isCommitOverlayActive = false; commitMessage = string.Empty; break;
                                        case ConsoleKey.Enter:
                                            if (!string.IsNullOrWhiteSpace(commitMessage))
                                            {
                                                isCommitOverlayActive = false;
                                                isRefreshing = true;
                                                var result = await gitService.CommitAsync(commitMessage, ct);
                                                if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); }
                                                else if (await gitService.HasRemoteTrackingBranchAsync(ct)) isPushPromptActive = true;
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
                                            isRefreshing = true;
                                            var result = await gitService.PushAsync(ct);
                                            if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); }
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
                                            isRefreshing = true;
                                            var result = await gitService.RunRawAsync(rawCommand, ct);
                                            lastCommandResult = result;
                                            if (!result.Success || !string.IsNullOrWhiteSpace(result.Output)) isOutputOverlayActive = true;
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
                                                isRefreshing = true;
                                                var result = await gitService.CreateBranchAsync(branchNameInput.Trim(), ct);
                                                if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); }
                                                else { isUpstreamPromptActive = true; }
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
                                            isRefreshing = true;
                                            await gitService.RunRawAsync("git push -u origin HEAD", ct);
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
                                                isRefreshing = true;
                                                var item = viewItems[selectedIndex];
                                                GitResult result = item.IsStagedSection ? await gitService.UnstageAsync(item.File.Path, ct) : await gitService.StageAsync(item.File.Path, ct);
                                                if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); isRefreshing = false; }
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
                                            else if (currentView == View.Branching) branchSelectedIndex = Math.Min(branches.Count - 1, branchSelectedIndex + pageSize);
                                            break;
                                        case ConsoleKey.UpArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Max(0, selectedIndex - 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            else if (currentView == View.Branching && branches.Count > 0) branchSelectedIndex = Math.Max(0, branchSelectedIndex - 1);
                                            break;
                                        case ConsoleKey.DownArrow:
                                            if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Min(viewItems.Count - 1, selectedIndex + 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                            else if (currentView == View.Branching && branches.Count > 0) branchSelectedIndex = Math.Min(branches.Count - 1, branchSelectedIndex + 1);
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
                                            else if (key.Key == ConsoleKey.Enter && currentView == View.Branching && branches.Count > 0)
                                            {
                                                var selectedBranch = branches[branchSelectedIndex];
                                                if (!selectedBranch.IsActive)
                                                {
                                                    isRefreshing = true;
                                                    var result = await gitService.CheckoutBranchAsync(selectedBranch.Name, ct);
                                                    if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); }
                                                }
                                            }
                                            break;
                                        case ConsoleKey.A:
                                           if (currentView == View.Staging && viewItems.Count > 0)
                                           {
                                               isRefreshing = true;
                                               GitResult result;

                                               if (string.IsNullOrEmpty(searchQuery))
                                               {
                                                   bool anyUnstaged = files.Any(f => f.IsUnstaged || f.IsUntracked);
                                                   result = anyUnstaged ? await gitService.RunRawAsync("add -A", ct) : await gitService.UnstageAllAsync(ct);
                                               }
                                               else
                                               {
                                                   bool anyVisibleUnstaged = viewItems.Any(i => i.File.IsUnstaged || i.File.IsUntracked);
                                                   if (anyVisibleUnstaged)
                                                   {
                                                       var paths = viewItems.Where(i => i.File.IsUnstaged || i.File.IsUntracked).Select(i => i.File.Path).ToList();
                                                       result = await gitService.RunRawAsync($"add -- {string.Join(" ", paths.Select(p => $"\"{p}\""))}", ct);
                                                   }
                                                   else
                                                   {
                                                       var paths = viewItems.Where(i => i.File.IsStaged).Select(i => i.File.Path).ToList();
                                                       result = await gitService.RunRawAsync($"reset HEAD -- {string.Join(" ", paths.Select(p => $"\"{p}\""))}", ct);
                                                   }
                                               }

                                               if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); isRefreshing = false; }
                                           }
                                           break;

                                        case ConsoleKey.B:
                                            if (currentView == View.Branching) { isBranchCreationOverlayActive = true; branchNameInput = string.Empty; }
                                            break;
                                        case ConsoleKey.Spacebar:
                                            if (currentView == View.Staging && viewItems.Count > 0)
                                            {
                                                isRefreshing = true;
                                                var item = viewItems[selectedIndex];
                                                GitResult result = item.IsStagedSection ? await gitService.UnstageAsync(item.File.Path, ct) : await gitService.StageAsync(item.File.Path, ct);
                                                if (!result.Success) { errorMessage = result.Error; errorDisplayUntil = DateTime.Now.AddSeconds(5); isRefreshing = false; }
                                            }
                                            break;
                                        case ConsoleKey.C:
                                            if (files.Any(f => f.IsStaged)) { isCommitOverlayActive = true; commitMessage = string.Empty; }
                                            else { errorMessage = "No staged files to commit"; errorDisplayUntil = DateTime.Now.AddSeconds(3); }
                                            break;
                                        case ConsoleKey.G:
                                            if (key.Modifiers.HasFlag(ConsoleModifiers.Shift)) { isCommandOverlayActive = true; rawCommand = "git "; }
                                            break;
                                        case ConsoleKey.R: isRefreshing = true; break;
                                        default:
                                            if (key.KeyChar == '/' && currentView == View.Staging)
                                            {
                                                isSearchOverlayActive = true;
                                                searchQuery = string.Empty;
                                            }
                                            break;
                                    }
                                }

                                if (isRefreshing) break;
                            }
                        }
                        else
                        {
                            if (errorDisplayUntil.HasValue && DateTime.Now > errorDisplayUntil.Value)
                            {
                                needsRedraw = true;
                            }
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
