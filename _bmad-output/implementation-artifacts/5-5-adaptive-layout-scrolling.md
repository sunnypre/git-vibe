# Story 5.5: Adaptive Layout & Scrollable Components

Status: review

## Story

As a user,
I want the TUI to adapt to my terminal size and provide scrolling for large lists,
so that I can use the tool effectively even on smaller screens or in constrained windows.

## Acceptance Criteria

- [x] **Given** a small terminal window or a large number of files/branches, **When** the content exceeds the available screen height, **Then** the Action Pane and Navigation Sidebar provide vertical scrolling.
- [x] **When** the terminal width is constrained, **Then** the layout adjusts proportions dynamically (e.g., narrowing the sidebar) to keep the Action Pane functional.
- [x] **And** the status bar legend gracefully handles overflow or wraps to avoid being cut off.

## Tasks / Subtasks

- [x] Implement Proportional Scaling in `MainLoop.cs` (AC: 2)
  - [x] Replace fixed `.Size(20)` for Sidebar with `.Ratio(1)` or a smaller fixed size if width is low.
  - [x] Use `AnsiConsole.Console.Profile.Width` to detect resizing in the `AnsiConsole.Live` loop.
- [x] Implement Vertical Scrolling for Staging View (AC: 1)
  - [x] Add `scrollOffset` and `pageSize` state to `MainLoop`.
  - [x] Update `StagingView` to take `scrollOffset` and `pageSize` and use `.Skip().Take()` on items.
  - [x] Update `MainLoop` input handling for `PageUp`, `PageDown` and auto-adjust `scrollOffset` when navigating.
- [x] Implement Vertical Scrolling for Branching View (AC: 1)
  - [x] Update `BranchingView` to support pagination/scrolling patterns.
- [x] Implement Legend Wrapping in `StatusBarView.cs` (AC: 3)
  - [x] Detect if legend string exceeds available width.
  - [x] Implement simple wrapping or a paging mechanism for the legend.
- [x] Add "Window Too Small" guard (AC: 2)
  - [x] If terminal height/width is below a minimum threshold (e.g., 10 rows, 40 cols), show a "Please resize" message instead of crashing.

### Review Findings (AI)

- [ ] [Review][Patch] High GC Pressure and Resource Leak in `MainLoop`. [Features/Shared/MainLoop.cs]
- [ ] [Review][Patch] Input Latency in Main Loop (buffer not drained). [Features/Shared/MainLoop.cs]
- [x] [Review][Defer] Brittle Parsing of Branch Names (pre-existing). [Core/Models/GitBranch.cs] — deferred, pre-existing
- [x] [Review][Defer] Architectural Drift: `MainLoop` as God Object. [Features/Shared/MainLoop.cs] — deferred, pre-existing
- [x] [Review][Defer] Encoding Corruption in `VibeTheme.cs`. [Styles/VibeTheme.cs] — deferred, pre-existing
- [x] [Review][Defer] Missing Multi-line Commit Support. [Features/Shared/MainLoop.cs] — deferred, pre-existing
- [x] [Review][Defer] Inconsistent `Unstage` Behavior. [Infrastructure/Git/GitService.cs] — deferred, pre-existing
- [x] [Review][Defer] Incomplete Command Splitting Regex. [Infrastructure/Git/GitService.cs] — deferred, pre-existing
- [x] [Review][Defer] Brittle Initialization in `StartAsync`. [Features/Shared/MainLoop.cs] — deferred, pre-existing

## Dev Notes

- **Architecture Pattern:** Follow the "Snapshot-Based Refresh" and "View Suffix" patterns defined in `architecture.md`.
- **Spectre.Console Nuances:** `Layout` ratio logic is responsive, but `LiveDisplay` needs manual triggers if the terminal width changes.
- **Scrolling Logic:** Since `Spectre.Console` lacks a native scrollable table, we must manually slice the data before passing it to the `Table` renderable.

### Source Tree Components

- `Features/Shared/MainLoop.cs`: Primary layout and input orchestration.
- `Features/Staging/StagingView.cs`: Data slicing for file list.
- `Features/Branching/BranchingView.cs`: Data slicing for branch list.
- `Features/Shared/StatusBarView.cs`: Legend wrapping logic.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#UI Architecture (Frontend)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy]
- [Source: Features/Shared/MainLoop.cs]
- [Source: Styles/VibeTheme.cs]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (via Gemini CLI)

### Implementation Plan

1.  **Terminal Guard:** Added a check at the start of the `while` loop in `MainLoop.cs` to detect if the terminal is below 40x10. If so, a message is displayed using `Align` to center it, and the loop continues (skipping the main UI render).
2.  **Proportional Scaling:** Moved `sidebarSize` calculation inside the `while` loop. If width < 80, the sidebar shrinks to 15 chars.
3.  **Scrolling (View Level):** Refactored `StagingView` and `BranchingView` to handle `scrollOffset` and `pageSize`. Both now generate all potential rows (including headers and empty rows) and then slice them using `.Skip(scrollOffset).Take(pageSize)`. This ensures headers scroll naturally with the items.
4.  **Scrolling (MainLoop Level):** Added `stagingScrollOffset` and `branchingScrollOffset`. Implemented auto-scrolling logic that keeps the `selectedIndex` within the visible window. Added `PageUp` and `PageDown` support.
5.  **Legend Wrapping:** Updated `StatusBarView` to use `maxWidth` to select between three legend variants (Full, Short, and Minimal) based on terminal width.

### File List

- `Features/Shared/MainLoop.cs`
- `Features/Staging/StagingView.cs`
- `Features/Branching/BranchingView.cs`
- `Features/Shared/StatusBarView.cs`
- `Tests/StagingViewTests.cs`
- `Tests/BranchingViewTests.cs`

### Completion Notes

Implementation is robust against terminal resizing and handles large repositories by providing vertical scrolling and page navigation. Terminal size guard prevents crashes in tiny windows. All tests pass.
