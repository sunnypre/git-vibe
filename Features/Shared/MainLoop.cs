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
            var innerLayout = new Layout("Main")
                .SplitColumns(
                    new Layout("Sidebar").Size(20),
                    new Layout("Action")
                );

            var rootLayout = new Layout("Root")
                .SplitRows(
                    innerLayout,
                    new Layout("Footer").Size(1)
                );

            var dashboard = new Panel(rootLayout)
                .Border(BoxBorder.Double)
                .Expand();

            var centered = new Align(dashboard, HorizontalAlignment.Center, VerticalAlignment.Middle);

            var currentView = View.Staging;
            string? selectedPath = null;
            var isRefreshing = false;
            var isCommitOverlayActive = false;
            var isPushPromptActive = false;
            var isCommandOverlayActive = false;
            var isOutputOverlayActive = false;
            var isBranchCreationOverlayActive = false;
            var isUpstreamPromptActive = false;
            var commitMessage = string.Empty;
            var rawCommand = "git ";
            var branchNameInput = string.Empty;
            GitResult? lastCommandResult = null;
            string? errorMessage = null;
            DateTime? errorDisplayUntil = null;
            
            var branchSelectedIndex = 0;

            await AnsiConsole.Live(centered)
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
                        // Clear expired error messages
                        if (errorDisplayUntil.HasValue && DateTime.Now > errorDisplayUntil.Value)
                        {
                            errorMessage = null;
                            errorDisplayUntil = null;
                        }

                        // Flatten partial changes for Staging View
                        var viewItems = new List<StagingViewItem>();
                        foreach (var file in files)
                        {
                            if (file.IsStaged)
                                viewItems.Add(new StagingViewItem(file, true));
                            if (file.IsUnstaged || file.IsUntracked)
                                viewItems.Add(new StagingViewItem(file, false));
                        }

                        var selectedIndex = viewItems.FindIndex(i => i.File.Path == selectedPath);
                        if (selectedIndex == -1) selectedIndex = 0;
                        if (viewItems.Count > 0) selectedPath = viewItems[selectedIndex].File.Path;

                        if (branchSelectedIndex >= branches.Count) branchSelectedIndex = Math.Max(0, branches.Count - 1);

                        IRenderable activeView;
                        string viewTitle;

                        if (currentView == View.Staging)
                        {
                            activeView = new StagingView(viewItems, selectedIndex);
                            viewTitle = "GitVibe Staging";
                        }
                        else
                        {
                            activeView = new BranchingView(branches, branchSelectedIndex);
                            viewTitle = "GitVibe Branching";
                        }

                        var statusBar = new StatusBarView(branch, isRefreshing);

                        var filesSidebarColor = currentView == View.Staging ? "blue" : "grey";
                        var branchesSidebarColor = currentView == View.Branching ? "blue" : "grey";

                        innerLayout["Sidebar"].Update(
                            new Panel(new Markup($"[{filesSidebarColor}]Files[/]\n[{branchesSidebarColor}]Branches[/]"))
                                .Header(" [bold blue]Menu[/] ")
                                .Border(BoxBorder.Double)
                        );

                        var actionContent = errorMessage != null 
                            ? (IRenderable)new Rows(activeView, new Panel(new Markup($"[red]Error:[/] {Markup.Escape(errorMessage)}")).BorderColor(Color.Red))
                            : activeView;

                        innerLayout["Action"].Update(
                            new Panel(actionContent)
                                .Header($" [bold blue]{viewTitle}[/] ")
                                .Border(BoxBorder.Double)
                                .Expand()
                        );

                        rootLayout["Footer"].Update(statusBar);

                        IRenderable finalView;
                        if (isCommitOverlayActive)
                        {
                            finalView = new Rows(centered, new Align(new CommitOverlay(commitMessage), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (isPushPromptActive)
                        {
                            finalView = new Rows(centered, new Align(new PushPromptOverlay(), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (isCommandOverlayActive)
                        {
                            finalView = new Rows(centered, new Align(new CommandOverlay(rawCommand), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (isBranchCreationOverlayActive)
                        {
                            finalView = new Rows(centered, new Align(new BranchCreationOverlay(branchNameInput), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (isUpstreamPromptActive)
                        {
                            finalView = new Rows(centered, new Align(new UpstreamTrackingOverlay(), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (isOutputOverlayActive && lastCommandResult != null)
                        {
                            var overlay = lastCommandResult.Success 
                                ? (IRenderable)new CommandOutputOverlay(lastCommandResult.Output)
                                : new ErrorOverlay(lastCommandResult.Error);
                            finalView = new Rows(centered, new Align(overlay, HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else if (errorMessage != null && !errorDisplayUntil.HasValue) // Only show error overlay for permanent errors
                        {
                            finalView = new Rows(centered, new Align(new ErrorOverlay(errorMessage), HorizontalAlignment.Center, VerticalAlignment.Middle));
                        }
                        else
                        {
                            finalView = centered;
                        }

                        ctx.UpdateTarget(finalView);

                        if (isRefreshing)
                        {
                            try 
                            {
                                branch = await gitService.GetActiveBranchAsync(ct);
                                files = await gitService.GetStatusAsync(ct);
                                branches = await gitService.GetBranchesAsync(ct);
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
                            var key = Console.ReadKey(true);

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
                                        // AC 7: Detect and set upstream. Using RunRaw for MVP upstream setting.
                                        await gitService.RunRawAsync("git push -u origin HEAD", ct);
                                        break;
                                    case ConsoleKey.N:
                                    case ConsoleKey.Escape: isUpstreamPromptActive = false; break;
                                }
                            }
                            else if (isOutputOverlayActive)
                            {
                                isOutputOverlayActive = false;
                                lastCommandResult = null;
                            }
                            else
                            {
                                switch (key.Key)
                                {
                                    case ConsoleKey.Escape: lifetime.StopApplication(); return;
                                    case ConsoleKey.Tab: currentView = currentView == View.Staging ? View.Branching : View.Staging; break;
                                    case ConsoleKey.UpArrow:
                                        if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Max(0, selectedIndex - 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                        else if (currentView == View.Branching && branches.Count > 0) branchSelectedIndex = Math.Max(0, branchSelectedIndex - 1);
                                        break;
                                    case ConsoleKey.DownArrow:
                                        if (currentView == View.Staging && viewItems.Count > 0) { selectedIndex = Math.Min(viewItems.Count - 1, selectedIndex + 1); selectedPath = viewItems[selectedIndex].File.Path; }
                                        else if (currentView == View.Branching && branches.Count > 0) branchSelectedIndex = Math.Min(branches.Count - 1, branchSelectedIndex + 1);
                                        break;
                                    case ConsoleKey.Enter:
                                        if (currentView == View.Branching && branches.Count > 0)
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
