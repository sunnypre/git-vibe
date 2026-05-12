using System.Diagnostics;
using GitVibe.Core.Models;

namespace GitVibe.Infrastructure.Git;

public interface IGitProcess
{
    Task<GitResult> RunAsync(params string[] arguments);
    Task<GitResult> RunAsync(CancellationToken ct, params string[] arguments);
}

public class GitProcess : IGitProcess
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);

    public Task<GitResult> RunAsync(params string[] arguments) => RunAsync(CancellationToken.None, arguments);

    public async Task<GitResult> RunAsync(CancellationToken ct, params string[] arguments)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "git",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        foreach (var arg in arguments)
        {
            startInfo.ArgumentList.Add(arg);
        }

        using var process = new Process { StartInfo = startInfo };
        
        process.Start();

        var outputTask = process.StandardOutput.ReadToEndAsync(ct);
        var errorTask = process.StandardError.ReadToEndAsync(ct);

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        linkedCts.CancelAfter(DefaultTimeout);

        try
        {
            await process.WaitForExitAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }

            if (ct.IsCancellationRequested)
                throw;

            return new GitResult(-1, "", "Command timed out after " + DefaultTimeout.TotalSeconds + "s");
        }

        return new GitResult(
            process.ExitCode,
            await outputTask,
            await errorTask
        );
    }
}
