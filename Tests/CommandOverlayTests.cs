using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class CommandOverlayTests
{
    [Fact]
    public void CommandOverlay_ShouldRenderPrompt()
    {
        // Arrange
        var console = new TestConsole();
        var command = "git status";
        var overlay = new CommandOverlay(command);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Hybrid Command", output);
        Assert.Contains("Run raw Git command", output);
        Assert.Contains(command, output);
        Assert.Contains("Execute", output);
        Assert.Contains("Cancel", output);
    }

    [Fact]
    public void CommandOverlay_ShouldHandleEmptyCommand()
    {
        // Arrange
        var console = new TestConsole();
        var command = "";
        var overlay = new CommandOverlay(command);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("git ", output);
    }
}
