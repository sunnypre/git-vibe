namespace GitVibe.Core.Models;

public record GitResult(int ExitCode, string Output, string Error)
{
    public bool Success => ExitCode == 0;
}
