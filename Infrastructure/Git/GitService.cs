using GitVibe.Core.Models;

namespace GitVibe.Infrastructure.Git;

public interface IGitService
{
    Task<bool> IsGitRepositoryAsync(CancellationToken ct = default);
    Task<string> GetActiveBranchAsync(CancellationToken ct = default);
    Task<List<GitFile>> GetStatusAsync(CancellationToken ct = default);
    Task<List<GitBranch>> GetBranchesAsync(CancellationToken ct = default);
    Task<GitResult> StageAsync(string path, CancellationToken ct = default);
    Task<GitResult> UnstageAsync(string path, CancellationToken ct = default);
    Task<GitResult> UnstageAllAsync(CancellationToken ct = default);
    Task<GitResult> CommitAsync(string message, CancellationToken ct = default);
    Task<bool> HasRemoteTrackingBranchAsync(CancellationToken ct = default);
    Task<GitResult> PushAsync(CancellationToken ct = default);
    Task<GitResult> RunRawAsync(string command, CancellationToken ct = default);
    Task<GitResult> CheckoutBranchAsync(string branchName, CancellationToken ct = default);
    Task<GitResult> CreateBranchAsync(string branchName, CancellationToken ct = default);
    Task<string> GetDiffAsync(string path, bool staged, CancellationToken ct = default);
    }

    public class GitService(IGitProcess gitProcess) : IGitService
    {
    public async Task<string> GetDiffAsync(string path, bool staged, CancellationToken ct = default)
    {
        var args = staged
            ? new[] { "diff", "--cached", "--color=never", "--", path }
            : new[] { "diff", "--color=never", "--", path };

        var result = await gitProcess.RunAsync(ct, args);
        return result.Success ? result.Output : $"Error fetching diff: {result.Error}";
    }
    public async Task<bool> IsGitRepositoryAsync(CancellationToken ct = default)
    {
        var result = await gitProcess.RunAsync(ct, "rev-parse", "--is-inside-work-tree");
        return result.Success && result.Output.Trim() == "true";
    }

    public async Task<string> GetActiveBranchAsync(CancellationToken ct = default)
    {
        var result = await gitProcess.RunAsync(ct, "branch", "--show-current");
        return result.Success ? result.Output.Trim() : "N/A";
    }

    public async Task<List<GitFile>> GetStatusAsync(CancellationToken ct = default)
    {
        var result = await gitProcess.RunAsync(ct, "status", "--porcelain");
        if (!result.Success)
            throw new Exception($"Git status failed: {result.Error}");

        // Handle both CRLF and LF, and ensure we don't have trailing empty entries from a final newline
        var normalizedOutput = result.Output.Replace("\r\n", "\n").Replace('\r', '\n');
        var lines = normalizedOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        return lines.Select(GitFile.FromPorcelain).ToList();
    }

    public async Task<List<GitBranch>> GetBranchesAsync(CancellationToken ct = default)
    {
        var result = await gitProcess.RunAsync(ct, "branch", "-a", "--format=%(HEAD)%(refname:short)%(upstream:track)");
        if (!result.Success)
            throw new Exception($"Git branch listing failed: {result.Error}");

        var normalizedOutput = result.Output.Replace("\r\n", "\n").Replace('\r', '\n');
        var lines = normalizedOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        return lines.Select(GitBranch.FromBranchLine).ToList();
    }

    public async Task<GitResult> StageAsync(string path, CancellationToken ct = default)
    {
        return await gitProcess.RunAsync(ct, "add", path);
    }

    public async Task<GitResult> UnstageAsync(string path, CancellationToken ct = default)
    {
        // Check if HEAD exists
        var revParse = await gitProcess.RunAsync(ct, "rev-parse", "HEAD");
        if (revParse.Success)
        {
            return await gitProcess.RunAsync(ct, "reset", "HEAD", "--", path);
        }
        else
        {
            // If no HEAD, we use 'rm --cached' to unstage
            return await gitProcess.RunAsync(ct, "rm", "--cached", "--", path);
        }
    }

    public async Task<GitResult> UnstageAllAsync(CancellationToken ct = default)
    {
        return await gitProcess.RunAsync(ct, "reset");
    }

    public async Task<GitResult> CommitAsync(string message, CancellationToken ct = default)
    {
        // Using -m with the message as a separate argument to prevent injection
        return await gitProcess.RunAsync(ct, "commit", "-m", message); 
    }

    public async Task<bool> HasRemoteTrackingBranchAsync(CancellationToken ct = default)
    {
        var result = await gitProcess.RunAsync(ct, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
        return result.Success;
    }

    public async Task<GitResult> PushAsync(CancellationToken ct = default)
    {
        return await gitProcess.RunAsync(ct, "push");
    }

    public async Task<GitResult> RunRawAsync(string command, CancellationToken ct = default)
    {
        var cmd = command.Trim();
        if (cmd.StartsWith("git ", StringComparison.OrdinalIgnoreCase))
        {
            cmd = cmd[4..].Trim();
        }
        else if (cmd.Equals("git", StringComparison.OrdinalIgnoreCase))
        {
            cmd = "";
        }

        if (string.IsNullOrWhiteSpace(cmd))
        {
            return new GitResult(1, "", "No git subcommand provided.");
        }

        // Robust splitting: handle quoted strings
        var args = System.Text.RegularExpressions.Regex.Matches(cmd, @"[^\s""]+|""([^""]*)""")
            .Select(m => m.Groups[1].Success ? m.Groups[1].Value : m.Value)
            .ToArray();

        return await gitProcess.RunAsync(ct, args);
    }

    public async Task<GitResult> CheckoutBranchAsync(string branchName, CancellationToken ct = default)
    {
        return await gitProcess.RunAsync(ct, "checkout", branchName);
    }

    public async Task<GitResult> CreateBranchAsync(string branchName, CancellationToken ct = default)
    {
        return await gitProcess.RunAsync(ct, "checkout", "-b", branchName);
    }
}
