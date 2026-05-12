## Deferred from: code review (2026-05-06) of 1-3-the-surgical-staging-dashboard-mvp-layout.md
- Inactive Hotkey Legend: Space, C, B, R keys are not yet functional.

## Deferred from: code review of 1-5-manual-refresh-state-consistency (2026-05-06)
- **Inaccurate UI Legend:** The UI legend shows hotkeys (Space, C, B) for features that are not yet implemented or fully integrated in this story. [Features/Shared/StatusBarView.cs:22]

## Deferred from: code review of 3-1-branch-management-view-navigation (2026-05-06)
- Broken Command Argument Parsing — GitService.RunRawAsync ignores quotes and escaping
- Unflushed Input Buffer During Async Operations — Console.KeyAvailable buffer fills up during awaits
- Blind HEAD Fallback in Unstage — GitService.UnstageAsync falls back to rm --cached if rev-parse fails
- Unsafe "git " Command Truncation — Hardcoded string lengths and manual backspaces
- Overzealous Command Output Overlays — Warns on any output text
- Error State Race Conditions — errorDisplayUntil polling can silently overwrite newest errors
- Appends unprintable control characters to input — MainLoop.cs
- Command injection from pasted newlines — MainLoop.cs
- UI appears frozen on long git operations — MainLoop.cs
- Selection unexpectedly jumps to staged part of file on refresh — MainLoop.cs
