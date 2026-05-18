using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class SearchOverlayTests
{
    [Fact]
    public void SearchOverlay_ShouldRenderPrompt()
    {
        // Arrange
        var console = new TestConsole();
        var query = "Program.cs";
        var overlay = new SearchOverlay(query);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Search / Filter", output);
        Assert.Contains("Filter by path", output);
        Assert.Contains(query, output);
        Assert.Contains("Clear & Close", output);
    }

    [Fact]
    public void SearchOverlay_ShouldHandleEmptyQuery()
    {
        // Arrange
        var console = new TestConsole();
        var query = "";
        var overlay = new SearchOverlay(query);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Filter by path", output);
    }
}
