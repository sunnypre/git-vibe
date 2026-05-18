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
    public void Render_WithScrollOffset_ShouldSkipItems()
    {
        // Arrange
        var console = new TestConsole();
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("File1.cs", null, GitStatus.Modified, GitStatus.Unmodified), true),
            new StagingViewItem(new GitFile("File2.cs", null, GitStatus.Modified, GitStatus.Unmodified), true),
            new StagingViewItem(new GitFile("File3.cs", null, GitStatus.Modified, GitStatus.Unmodified), true)
        };
        // Scroll offset 1 should skip "File1.cs"
        var view = new StagingView(files, scrollOffset: 1, pageSize: 2);

        // Act
        console.Write(view);

        // Assert
        Assert.DoesNotContain("File1.cs", console.Output);
        Assert.Contains("File2.cs", console.Output);
        Assert.Contains("File3.cs", console.Output);
    }

    [Fact]
    public void GetSelectedRowIndex_ShouldBeIndexItself()
    {
        // Arrange
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("Staged1.cs", null, GitStatus.Modified, GitStatus.Unmodified), true),
            new StagingViewItem(new GitFile("Unstaged1.cs", null, GitStatus.Unmodified, GitStatus.Modified), false)
        };

        // Act & Assert
        Assert.Equal(0, StagingView.GetSelectedRowIndex(files, 0));
        Assert.Equal(1, StagingView.GetSelectedRowIndex(files, 1));
    }

    [Fact]
    public void GetTotalRows_ShouldReturnCorrectCount()
    {
        // Arrange
        var files = new List<StagingViewItem>
        {
            new StagingViewItem(new GitFile("Staged1.cs", null, GitStatus.Modified, GitStatus.Unmodified), true),
            new StagingViewItem(new GitFile("Unstaged1.cs", null, GitStatus.Unmodified, GitStatus.Modified), false)
        };

        // Act & Assert
        Assert.Equal(2, StagingView.GetTotalRows(files));
    }
}
