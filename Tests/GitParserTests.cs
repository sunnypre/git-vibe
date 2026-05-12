using GitVibe.Core.Models;
using Xunit;

namespace GitVibe.Tests;

public class GitParserTests
{
    [Theory]
    [InlineData(" M Program.cs", "Program.cs", GitStatus.Unmodified, GitStatus.Modified)]
    [InlineData("M  Program.cs", "Program.cs", GitStatus.Modified, GitStatus.Unmodified)]
    [InlineData("A  NewFile.cs", "NewFile.cs", GitStatus.Added, GitStatus.Unmodified)]
    [InlineData("?? Untracked.cs", "Untracked.cs", GitStatus.Untracked, GitStatus.Untracked)]
    [InlineData(" D Deleted.cs", "Deleted.cs", GitStatus.Unmodified, GitStatus.Deleted)]
    public void FromPorcelain_ShouldParseStandardLines(string line, string expectedPath, GitStatus expectedStaged, GitStatus expectedUnstaged)
    {
        // Act
        var file = GitFile.FromPorcelain(line);

        // Assert
        Assert.Equal(expectedPath, file.Path);
        Assert.Equal(expectedStaged, file.StagedStatus);
        Assert.Equal(expectedUnstaged, file.UnstagedStatus);
    }

    [Fact]
    public void FromPorcelain_ShouldHandleRenames()
    {
        // Arrange
        var line = "R  OldPath.cs -> NewPath.cs";

        // Act
        var file = GitFile.FromPorcelain(line);

        // Assert
        Assert.Equal("NewPath.cs", file.Path);
        Assert.Equal("OldPath.cs", file.OriginalPath);
        Assert.Equal(GitStatus.Renamed, file.StagedStatus);
    }

    [Fact]
    public void FromPorcelain_ShouldHandleSpacesInPaths()
    {
        // Arrange
        var line = " M \"File With Spaces.cs\"";

        // Act
        var file = GitFile.FromPorcelain(line);

        // Assert
        Assert.Equal("File With Spaces.cs", file.Path);
        Assert.Equal(GitStatus.Modified, file.UnstagedStatus);
    }

    [Fact]
    public void FromPorcelain_ShouldHandleOctalEscapes()
    {
        // Arrange
        // Git encodes "Élément.txt" as "\"\\303\\211l\\303\\251ment.txt\""
        var line = "A  \"\\303\\211l\\303\\251ment.txt\"";

        // Act
        var file = GitFile.FromPorcelain(line);

        // Assert
        Assert.Equal("Élément.txt", file.Path);
        Assert.Equal(GitStatus.Added, file.StagedStatus);
    }

    [Fact]
    public void FromPorcelain_ShouldHandleComplexRenames()
    {
        // Arrange
        // Rename where old path has " -> " inside quotes (unlikely for git, but we want to be robust)
        var line = "R  \"Old -> Path.cs\" -> NewPath.cs";

        // Act
        var file = GitFile.FromPorcelain(line);

        // Assert
        Assert.Equal("NewPath.cs", file.Path);
        Assert.Equal("Old -> Path.cs", file.OriginalPath);
        Assert.Equal(GitStatus.Renamed, file.StagedStatus);
    }
}
