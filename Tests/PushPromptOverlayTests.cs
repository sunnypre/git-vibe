using GitVibe.Features.Shared;
using Spectre.Console.Testing;
using Xunit;

namespace GitVibe.Tests;

public class PushPromptOverlayTests
{
    [Fact]
    public void PushPromptOverlay_ShouldRenderPrompt()
    {
        // Arrange
        var console = new TestConsole();
        var overlay = new PushPromptOverlay();

        // Act
        console.Write(overlay);

        // Assert
        var output = console.Output;
        Assert.Contains("Git Push", output);
        Assert.Contains("Push changes to remote?", output);
        Assert.Contains("Yes", output);
        Assert.Contains("No", output);
    }
}
