using GitVibe.Core.Models;

namespace GitVibe.Features.Staging;

public record StagingViewItem(GitFile File, bool IsStagedSection);
