# Story 1.5: Manual Refresh & State Consistency

Status: done

## Story

As a user,
I want to manually refresh the repository state using the 'R' key,
so that I can ensure the TUI is perfectly in sync with any external changes.

## Acceptance Criteria

1. **Given** the application is active
2. **When** I press the 'R' key
3. **Then** the system fetches a fresh `git status` snapshot
4. **And** a "Refreshing..." indicator is briefly visible in the footer
5. **And** the UI re-renders with the latest repository state.

## Tasks / Subtasks

- [x] Implement Visual Refresh Indicator in StatusBarView (AC: 4)
  - [x] Add `IsRefreshing` property or state to `StatusBarView`.
  - [x] Render "Refreshing..." text in the footer when `IsRefreshing` is true.
- [x] Implement Manual Refresh Logic in MainLoop (AC: 2, 3, 4, 5)
  - [x] Update `MainLoop` input handling for `ConsoleKey.R`.
  - [x] When 'R' is pressed, set a `_isRefreshing` flag.
  - [x] Trigger an immediate re-render with the refresh indicator.
  - [x] Perform the `GitService` calls and then clear the flag.
- [x] Refactor Refresh Pattern for Consistency (AC: 5)
  - [x] Ensure auto-refresh after `StageAsync` or `UnstageAsync` also shows the indicator if possible (or just ensure it's snappy).
  - [x] Optimize `MainLoop` to avoid redundant state fetching during rapid input.
- [x] Verification & Testing
  - [x] Create `Tests/StatusBarViewTests.cs` (or update) to verify refresh indicator rendering.
  - [x] Manual verification of the 'R' key behavior and visual feedback.

### Review Findings

- [x] [Review][Patch] Task/Resource Leakage in Input Loop [Features/Shared/MainLoop.cs:133]
- [x] [Review][Patch] UI Corruption on Git Error [Features/Shared/MainLoop.cs:157]
- [x] [Review][Patch] Responsiveness Gap in Staging [Features/Shared/MainLoop.cs:151]
- [x] [Review][Patch] Environment Crash (Non-Interactive) [Features/Shared/MainLoop.cs:133]
- [x] [Review][Patch] Missing Error Handling for Snapshots [Features/Shared/MainLoop.cs:40]
- [x] [Review][Defer] Inaccurate UI Legend [Features/Shared/StatusBarView.cs:22] — deferred, pre-existing

## Dev Notes

- **Architecture Compliance:** Follow the "Process Patterns: The Refresh Strategy" from `architecture.md`.
- **UI Performance:** The transition to/from "Refreshing..." should be smooth and not cause flickering.
- **State Boundary:** `MainLoop` manages the transient refresh state and coordinates with `StatusBarView`.

### Project Structure Notes

- Files to modify:
  - `Features/Shared/MainLoop.cs`
  - `Features/Shared/StatusBarView.cs`
- Files to update:
  - `Tests/StatusBarViewTests.cs`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns-The-Refresh-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR8]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Refined the `MainLoop` render sequence to ensure the "Refreshing..." indicator is visible *during* the execution of async Git commands.
- Verified that `StatusBarView` correctly renders the indicator when `isRefreshing` is true.
- Confirmed that the 'R' key, as well as staging/unstaging actions, trigger the visual refresh feedback.
- All 18 tests (including `StatusBarViewTests`) are passing.
- Applied 5 patches from code review: fixed task leakage, UI corruption on error, responsiveness gaps, environment safety, and snapshot error handling.

### File List

- `Features/Shared/MainLoop.cs`
- `Features/Shared/StatusBarView.cs`
- `Tests/StatusBarViewTests.cs`

### Change Log

- 2026-05-06: Implemented manual refresh logic and visual indicator. Improved render loop to avoid race conditions between rendering and data fetching.
- 2026-05-06: Applied code review patches for stability, performance, and correctness.

### Status

done
