using GitVibe.Core.Models;
using GitVibe.Features.Branching;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class BranchingViewTests
{
    [Fact]
    public void Render_EmptyBranches_ShowsEmptyMessage()
    {
        // Arrange
        var console = new TestConsole();
        var branches = new List<GitBranch>();
        var view = new BranchingView(branches);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("No branches found.", console.Output);
    }

    [Fact]
    public void Render_WithBranches_ShowsBranchNames()
    {
        // Arrange
        var console = new TestConsole();
        var branches = new List<GitBranch>
        {
            new GitBranch("main", true, false, 1, 0),
            new GitBranch("feature/test", false, false, 0, 2),
            new GitBranch("origin/main", false, true)
        };
        var view = new BranchingView(branches);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("main", console.Output);
        Assert.Contains("feature/test", console.Output);
        Assert.Contains("origin/main", console.Output);
        Assert.Contains("↑1", console.Output);
        Assert.Contains("↓2", console.Output);
    }

    [Fact]
    public void Render_WithSelection_ShowsPointer()
    {
        // Arrange
        var console = new TestConsole();
        var branches = new List<GitBranch>
        {
            new GitBranch("main", true, false, 0, 0),
            new GitBranch("feature/test", false, false, 0, 0)
        };
        var view = new BranchingView(branches, 1);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains(">", console.Output);
    }
}
