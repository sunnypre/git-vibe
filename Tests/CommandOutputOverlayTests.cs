using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class CommandOutputOverlayTests
{
    [Fact]
    public void CommandOutputOverlay_ShouldRenderOutput()
    {
        // Arrange
        var console = new TestConsole().Width(80);
        var output = "branch-1\nbranch-2";
        var overlay = new CommandOutputOverlay(output);

        // Act
        console.Write(overlay);

        // Assert
        var consoleOutput = console.Output;
        Assert.Contains("Command Output", consoleOutput);
        Assert.Contains("branch-1", consoleOutput);
        Assert.Contains("branch-2", consoleOutput);
    }
}
