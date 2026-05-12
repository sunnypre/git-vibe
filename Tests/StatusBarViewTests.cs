using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class StatusBarViewTests
{
    [Fact]
    public void Render_ShouldContainBranchName()
    {
        // Arrange
        var console = new TestConsole();
        var branchName = "main";
        var view = new StatusBarView(branchName);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("main", console.Output);
    }

    [Fact]
    public void Render_ShouldContainHotkeyLegend()
    {
        // Arrange
        var console = new TestConsole();
        var view = new StatusBarView("main");

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("Space", console.Output);
        Assert.Contains("C", console.Output);
        Assert.Contains("B", console.Output);
        Assert.Contains("R", console.Output);
        Assert.Contains("Esc", console.Output);
    }

    [Fact]
    public void Render_ShouldShowRefreshingIndicator()
    {
        // Arrange
        var console = new TestConsole();
        var view = new StatusBarView("main", isRefreshing: true);

        // Act
        console.Write(view);

        // Assert
        Assert.Contains("Refreshing...", console.Output);
    }
}
