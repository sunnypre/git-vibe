namespace GitVibe.Core.Models;

public enum GitStatus
{
    Unmodified,
    Modified,
    Added,
    Deleted,
    Renamed,
    Copied,
    Untracked,
    Ignored,
    Unmerged
}

public record GitFile(string Path, string? OriginalPath, GitStatus StagedStatus, GitStatus UnstagedStatus)
{
    public bool IsStaged => StagedStatus != GitStatus.Unmodified && StagedStatus != GitStatus.Untracked;
    public bool IsUnstaged => UnstagedStatus != GitStatus.Unmodified;
    public bool IsUntracked => StagedStatus == GitStatus.Untracked || UnstagedStatus == GitStatus.Untracked;

    public static GitFile FromPorcelain(string line)
    {
        if (line.Length < 4)
            throw new ArgumentException("Invalid git porcelain line", nameof(line));

        char x = line[0];
        char y = line[1];
        string pathPart = line[3..];

        string path;
        string? originalPath = null;

        if (x == 'R' || x == 'C')
        {
            // Renames/Copies can be "old -> new" or "\"old\" -> \"new\""
            // The separator " -> " is guaranteed to be between the two paths in porcelain v1.
            var lastArrowIndex = pathPart.LastIndexOf(" -> ", StringComparison.Ordinal);
            if (lastArrowIndex != -1)
            {
                originalPath = DecodePath(pathPart[..lastArrowIndex]);
                path = DecodePath(pathPart[(lastArrowIndex + 4)..]);
            }
            else
            {
                path = DecodePath(pathPart);
            }
        }
        else
        {
            path = DecodePath(pathPart);
        }

        return new GitFile(
            path,
            originalPath,
            ParseStatus(x),
            ParseStatus(y)
        );
    }

    private static string DecodePath(string path)
    {
        path = path.Trim();
        if (path.StartsWith('"') && path.EndsWith('"'))
        {
            path = path[1..^1];
            // Decode C-style octal escapes (e.g. \303\251)
            return UnescapeGitPath(path);
        }
        return path;
    }

    private static string UnescapeGitPath(string path)
    {
        if (!path.Contains('\\')) return path;

        var bytes = new List<byte>();
        for (int i = 0; i < path.Length; i++)
        {
            if (path[i] == '\\' && i + 3 < path.Length && char.IsDigit(path[i + 1]) && char.IsDigit(path[i + 2]) && char.IsDigit(path[i + 3]))
            {
                string octal = path.Substring(i + 1, 3);
                bytes.Add(Convert.ToByte(octal, 8));
                i += 3;
            }
            else if (path[i] == '\\' && i + 1 < path.Length)
            {
                // Handle common escapes like \\, \", \t, etc.
                bytes.Add(path[i + 1] switch
                {
                    '\\' => (byte)'\\',
                    '"' => (byte)'"',
                    't' => (byte)'\t',
                    'n' => (byte)'\n',
                    'r' => (byte)'\r',
                    _ => (byte)path[i + 1]
                });
                i++;
            }
            else
            {
                bytes.Add((byte)path[i]);
            }
        }
        return System.Text.Encoding.UTF8.GetString(bytes.ToArray());
    }

    private static GitStatus ParseStatus(char code) => code switch
    {
        ' ' => GitStatus.Unmodified,
        'M' => GitStatus.Modified,
        'A' => GitStatus.Added,
        'D' => GitStatus.Deleted,
        'R' => GitStatus.Renamed,
        'C' => GitStatus.Copied,
        'U' => GitStatus.Unmerged,
        '?' => GitStatus.Untracked,
        '!' => GitStatus.Ignored,
        _ => GitStatus.Unmodified
    };
}
