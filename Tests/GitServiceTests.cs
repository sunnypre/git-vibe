using GitVibe.Core.Models;
using GitVibe.Infrastructure.Git;
using Xunit;

namespace GitVibe.Tests;

public class GitServiceTests
{
    private class MockGitProcess : IGitProcess
    {
        public string[]? LastArguments { get; private set; }
        public GitResult ResultToReturn { get; set; } = new GitResult(0, "", "");

        public Task<GitResult> RunAsync(params string[] arguments) => RunAsync(CancellationToken.None, arguments);

        public Task<GitResult> RunAsync(CancellationToken ct, params string[] arguments)
        {
            LastArguments = arguments;
            return Task.FromResult(ResultToReturn);
        }
    }

    [Fact]
    public async Task StageAsync_ShouldCallGitAdd()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var path = "test.txt";

        // Act
        await service.StageAsync(path);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("add", mockProcess.LastArguments[0]);
        Assert.Equal(path, mockProcess.LastArguments[1]);
    }

    [Fact]
    public async Task UnstageAsync_ShouldCallGitReset_WhenHeadExists()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        mockProcess.ResultToReturn = new GitResult(0, "HEAD", ""); // Mock rev-parse HEAD success
        var service = new GitService(mockProcess);
        var path = "test.txt";

        // Act
        await service.UnstageAsync(path);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("reset", mockProcess.LastArguments[0]);
        Assert.Equal("HEAD", mockProcess.LastArguments[1]);
        Assert.Equal("--", mockProcess.LastArguments[2]);
        Assert.Equal(path, mockProcess.LastArguments[3]);
    }

    [Fact]
    public async Task UnstageAsync_ShouldCallGitRm_WhenHeadDoesNotExist()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        mockProcess.ResultToReturn = new GitResult(128, "", "fatal: Not a valid object name HEAD"); // Mock rev-parse HEAD failure
        var service = new GitService(mockProcess);
        var path = "test.txt";

        // Act
        await service.UnstageAsync(path);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("rm", mockProcess.LastArguments[0]);
        Assert.Equal("--cached", mockProcess.LastArguments[1]);
        Assert.Equal("--", mockProcess.LastArguments[2]);
        Assert.Equal(path, mockProcess.LastArguments[3]);
    }

    [Fact]
    public async Task CommitAsync_ShouldCallGitCommitWithMessage()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var message = "Initial commit";

        // Act
        await service.CommitAsync(message);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("commit", mockProcess.LastArguments[0]);
        Assert.Equal("-m", mockProcess.LastArguments[1]);
        Assert.Equal(message, mockProcess.LastArguments[2]);
    }

    [Fact]
    public async Task HasRemoteTrackingBranchAsync_ShouldReturnTrue_WhenUpstreamExists()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        mockProcess.ResultToReturn = new GitResult(0, "origin/main", "");
        var service = new GitService(mockProcess);

        // Act
        var result = await service.HasRemoteTrackingBranchAsync();

        // Assert
        Assert.True(result);
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("rev-parse", mockProcess.LastArguments[0]);
        Assert.Equal("--abbrev-ref", mockProcess.LastArguments[1]);
        Assert.Equal("--symbolic-full-name", mockProcess.LastArguments[2]);
        Assert.Equal("@{u}", mockProcess.LastArguments[3]);
    }

    [Fact]
    public async Task HasRemoteTrackingBranchAsync_ShouldReturnFalse_WhenUpstreamDoesNotExist()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        mockProcess.ResultToReturn = new GitResult(128, "", "fatal: no upstream configured for branch 'main'");
        var service = new GitService(mockProcess);

        // Act
        var result = await service.HasRemoteTrackingBranchAsync();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task PushAsync_ShouldCallGitPush()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);

        // Act
        await service.PushAsync();

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("push", mockProcess.LastArguments[0]);
    }

    [Fact]
    public async Task RunRawAsync_ShouldSplitCommandAndRemoveGitPrefix()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var command = "git checkout -b feature/test";

        // Act
        await service.RunRawAsync(command);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal(3, mockProcess.LastArguments.Length);
        Assert.Equal("checkout", mockProcess.LastArguments[0]);
        Assert.Equal("-b", mockProcess.LastArguments[1]);
        Assert.Equal("feature/test", mockProcess.LastArguments[2]);
    }

    [Fact]
    public async Task RunRawAsync_ShouldWorkWithoutGitPrefix()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var command = "status --short";

        // Act
        await service.RunRawAsync(command);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal(2, mockProcess.LastArguments.Length);
        Assert.Equal("status", mockProcess.LastArguments[0]);
        Assert.Equal("--short", mockProcess.LastArguments[1]);
    }

    [Fact]
    public async Task RunRawAsync_ShouldHandleQuotedArguments()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var command = "git commit -m \"initial commit\"";

        // Act
        await service.RunRawAsync(command);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal(3, mockProcess.LastArguments.Length);
        Assert.Equal("commit", mockProcess.LastArguments[0]);
        Assert.Equal("-m", mockProcess.LastArguments[1]);
        Assert.Equal("initial commit", mockProcess.LastArguments[2]);
    }

    [Fact]
    public async Task CheckoutBranchAsync_ShouldCallGitCheckout()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var branch = "feature/test";

        // Act
        await service.CheckoutBranchAsync(branch);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("checkout", mockProcess.LastArguments[0]);
        Assert.Equal(branch, mockProcess.LastArguments[1]);
    }

    [Fact]
    public async Task CreateBranchAsync_ShouldCallGitCheckoutWithB()
    {
        // Arrange
        var mockProcess = new MockGitProcess();
        var service = new GitService(mockProcess);
        var branch = "feature/new";

        // Act
        await service.CreateBranchAsync(branch);

        // Assert
        Assert.NotNull(mockProcess.LastArguments);
        Assert.Equal("checkout", mockProcess.LastArguments[0]);
        Assert.Equal("-b", mockProcess.LastArguments[1]);
        Assert.Equal(branch, mockProcess.LastArguments[2]);
    }
}
