using GitVibe.Core.Models;
using GitVibe.Features.Staging;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class StagingViewTests
{
    [Fact]
    public void Render_ShouldContainFiles()
    {
        // Arrange
        var console = new TestConsole();
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("File1.cs", null, GitStatus.Modified, GitStatus.Unmodified), true),
            new StagingViewItem(new GitFile("File2.cs", null, GitStatus.Unmodified, GitStatus.Modified), false)
        };
        var view = new StagingView(files);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("File1.cs", console.Output);
        Assert.Contains("File2.cs", console.Output);
    }

    [Fact]
    public void Render_ShouldShowStagedStatus()
    {
        // Arrange
        var console = new TestConsole();
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("Staged.cs", null, GitStatus.Modified, GitStatus.Unmodified), true)
        };
        var view = new StagingView(files);

        // Act
        console.Write(view);

        // Assert
        // Assuming [x] is used for staged
        Assert.Contains("[x]", console.Output);
    }

    [Fact]
    public void Render_ShouldShowFocusPointer()
    {
        // Arrange
        var console = new TestConsole();
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("File1.cs", null, GitStatus.Unmodified, GitStatus.Modified), false),
            new StagingViewItem(new GitFile("File2.cs", null, GitStatus.Unmodified, GitStatus.Modified), false)
        };
        // Focus on second file
        var view = new StagingView(files, 1);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains(">", console.Output);
    }
}
