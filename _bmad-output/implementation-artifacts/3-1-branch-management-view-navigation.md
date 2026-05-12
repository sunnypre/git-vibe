# Story 3.1: Branch Management View (Navigation)

Status: done

## Story

As a user,
I want a dedicated view to see all local and remote branches,
So that I can understand my repository's context and history.

## Acceptance Criteria

1. **Given** I am in the Files view
2. **When** I press the tab/hotkey (e.g., `Tab`) to switch views
3. **Then** the UI switches to the Branching View
4. **And** a list of local and remote branches is displayed in a table
5. **And** icons indicate the active branch and pushed/unpushed state.
6. **And** the sidebar highlights "Branches" when it is the active view.

## Developer Context

This story introduces multi-view navigation to GitVibe. Currently, the application only supports the Staging View. You need to implement a "view state" and the infrastructure to fetch and display branches.

### Current State
- `MainLoop.cs` handles all logic in a single large loop.
- Only `GitFile` models are parsed.
- The sidebar is hardcoded to show "Files" and "Branches".

### Technical Requirements
- **Model:** Create `Core/Models/GitBranch.cs` record.
  - Fields: `string Name`, `bool IsActive`, `bool IsRemote`, `int AheadCount`, `int BehindCount`.
- **Service:** Update `IGitService` and `GitService` to include `GetBranchesAsync()`.
  - Suggestion: Use `git branch -a --format="%(HEAD)%(refname:short)%(upstream:track)"` or similar to parse status.
- **View:** Create `Features/Branching/BranchingView.cs`.
  - Use `Spectre.Console.Table` for the layout.
  - Columns: `Active` (icon), `Branch Name`, `Status` (Ahead/Behind icons).
- **Navigation:**
  - Update `MainLoop.cs` to include a `View` enum (`Staging`, `Branching`).
  - Listen for `Tab` key to toggle between views.
  - Ensure the sidebar markup reflects the active view (e.g., using different colors).

### Architecture Compliance
- Follow the feature-based structure (`Features/Branching/`).
- Maintain the Snapshot-Based state strategy. `MainLoop` should fetch both files and branches in its snapshot phase.
- Ensure `VibeTheme.cs` is updated with branch-specific icons (e.g., `BranchIcon`, `RemoteIcon`).

- [x] Model: Create `Core/Models/GitBranch.cs`
- [x] Service: Implement `GitService.GetBranchesAsync()`
- [x] UI: Create `Features/Branching/BranchingView.cs`
- [x] Integration: Update `MainLoop.cs` for View Switching
  - [x] Add `CurrentView` state.
  - [x] Handle `Tab` key for switching.
  - [x] Update Sidebar and Action Pane content based on `CurrentView`.
- [x] Verification & Testing
  - [x] Create `Tests/BranchingViewTests.cs`.
  - [x] Manual verification of view switching and branch listing.

### Review Findings
- [x] [Review][Patch] Scope Creep: Premature Branch Selection Logic — Implementation of branch selection logic (pointer, arrows) not requested in spec.
- [x] [Review][Patch] Massive GC Pressure & Polling Loop — `MainLoop.cs` re-instantiates Layout on every 50ms iteration.
- [x] [Review][Patch] Useless `CreateLayout` Stub — `MainLoop` contains `CreateLayout()` which returns "Placeholder" and is unused.
- [x] [Review][Patch] Fragile Branch Name Parsing — `GitBranch.FromBranchLine` uses `split('[', 2)` assuming `[` only at the end (fails on JIRA brackets).
- [x] [Review][Patch] Naive Remote Branch Detection — Checks `origin/` or `remotes/` hardcoded.
- [x] [Review][Patch] Unhandled Detached HEAD States — `GitService.GetBranchesAsync` blind to detached HEAD format.
- [x] [Review][Patch] Fails to parse localized tracking info — `GitBranch.cs` expects English terms for ahead/behind.
- [x] [Review][Defer] Broken Command Argument Parsing — `GitService.RunRawAsync` ignores quotes and escaping — deferred, pre-existing
- [x] [Review][Defer] Unflushed Input Buffer During Async Operations — `Console.KeyAvailable` buffer fills up during awaits — deferred, pre-existing
- [x] [Review][Defer] Blind `HEAD` Fallback in Unstage — `GitService.UnstageAsync` falls back to `rm --cached` if `rev-parse` fails — deferred, pre-existing
- [x] [Review][Defer] Unsafe "git " Command Truncation — Hardcoded string lengths and manual backspaces — deferred, pre-existing
- [x] [Review][Defer] Overzealous Command Output Overlays — Warns on any output text — deferred, pre-existing
- [x] [Review][Defer] Error State Race Conditions — `errorDisplayUntil` polling can silently overwrite newest errors — deferred, pre-existing
- [x] [Review][Defer] Appends unprintable control characters to input — `MainLoop.cs` — deferred, pre-existing
- [x] [Review][Defer] Command injection from pasted newlines — `MainLoop.cs` — deferred, pre-existing
- [x] [Review][Defer] UI appears frozen on long git operations — `MainLoop.cs` — deferred, pre-existing
- [x] [Review][Defer] Selection unexpectedly jumps to staged part of file on refresh — `MainLoop.cs` — deferred, pre-existing

## Dev Agent Record
- **Implementation Plan:**
  - Created `GitBranch` record with a porcelain parser.
  - Added `GetBranchesAsync` to `GitService` using `git branch -a`.
  - Created `BranchingView` using Spectre.Console.Table.
  - Refactored `MainLoop.cs` to support multiple views and navigation.
  - Added unit tests for the model and view.
- **Completion Notes:**
  - Multi-view navigation is now working with the Tab key.
  - Branches are fetched and displayed in a dedicated view.
  - Sidebar correctly highlights the active view.

## File List
- `Core/Models/GitBranch.cs`
- `Infrastructure/Git/GitService.cs`
- `Features/Branching/BranchingView.cs`
- `Features/Shared/MainLoop.cs`
- `Styles/VibeTheme.cs`
- `Tests/BranchingViewTests.cs`
- `Tests/GitBranchTests.cs`

## Change Log
- Initial implementation of Branch Management View and multi-view navigation.
