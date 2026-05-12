namespace GitVibe.Core.Models;

using System.Text.RegularExpressions;

public record GitBranch(
    string Name,
    bool IsActive,
    bool IsRemote,
    int AheadCount = 0,
    int BehindCount = 0)
{
    public static GitBranch FromBranchLine(string line)
    {
        var isActive = line.StartsWith('*');
        var remaining = (isActive ? line[1..] : line).Trim();

        if (remaining.StartsWith("(HEAD detached at") || remaining.StartsWith("(no branch"))
        {
            return new GitBranch(remaining, isActive, false);
        }

        var namePart = remaining;
        var ahead = 0;
        var behind = 0;

        var lastBracketIndex = remaining.LastIndexOf('[');
        if (lastBracketIndex != -1 && remaining.EndsWith(']'))
        {
            namePart = remaining[..lastBracketIndex].Trim();
            var trackPart = remaining[(lastBracketIndex + 1)..^1];

            var aheadMatch = Regex.Match(trackPart, @"(?:ahead|ve\u015F|avant|avanzato)\s*(\d+)", RegexOptions.IgnoreCase);
            if (aheadMatch.Success) ahead = int.Parse(aheadMatch.Groups[1].Value);

            var behindMatch = Regex.Match(trackPart, @"(?:behind|arkas\u0131nda|arri\u00E8re|indietro)\s*(\d+)", RegexOptions.IgnoreCase);
            if (behindMatch.Success) behind = int.Parse(behindMatch.Groups[1].Value);
        }

        var isRemote = namePart.StartsWith("remotes/");

        return new GitBranch(namePart, isActive, isRemote, ahead, behind);
    }
}
