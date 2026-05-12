using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class CommitOverlayTests
{
    [Fact]
    public void CommitOverlay_ShouldRenderMessage()
    {
        // Arrange
        var console = new TestConsole();
        var message = "Feature: Add commit flow";
        var overlay = new CommitOverlay(message);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Commit Changes", output);
        Assert.Contains(message, output);
        Assert.Contains("Commit", output);
        Assert.Contains("Cancel", output);
    }

    [Fact]
    public void CommitOverlay_ShouldHandleEmptyMessage()
    {
        // Arrange
        var console = new TestConsole();
        var message = "";
        var overlay = new CommitOverlay(message);

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Commit Changes", output);
        Assert.Contains("Enter commit message", output);
    }
}
