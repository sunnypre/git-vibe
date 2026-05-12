using GitVibe.Core.Models;
using Xunit;

namespace GitVibe.Tests;

public class GitBranchTests
{
    [Theory]
    [InlineData("* main", "main", true, false, 0, 0)]
    [InlineData("  feature/branch [ahead 1]", "feature/branch", false, false, 1, 0)]
    [InlineData("  origin/main [behind 2]", "origin/main", false, false, 0, 2)]
    [InlineData("  remotes/origin/HEAD -> origin/main", "remotes/origin/HEAD -> origin/main", false, true, 0, 0)]
    [InlineData("  complex/branch [ahead 1, behind 2]", "complex/branch", false, false, 1, 2)]
    [InlineData("* (HEAD detached at 123abc4)", "(HEAD detached at 123abc4)", true, false, 0, 0)]
    [InlineData("  feature/[JIRA-123] [ahead 3]", "feature/[JIRA-123]", false, false, 3, 0)]
    public void FromBranchLine_ParsesCorrectly(string line, string expectedName, bool expectedActive, bool expectedRemote, int expectedAhead, int expectedBehind)
    {
        // Act
        var branch = GitBranch.FromBranchLine(line);

        // Assert
        Assert.Equal(expectedName, branch.Name);
        Assert.Equal(expectedActive, branch.IsActive);
        Assert.Equal(expectedRemote, branch.IsRemote);
        Assert.Equal(expectedAhead, branch.AheadCount);
        Assert.Equal(expectedBehind, branch.BehindCount);
    }
}
