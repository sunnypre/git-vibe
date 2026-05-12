# Story 1.4: Interactive Staging Toggle (The "Surgical Toggle")

Status: done

## Story

As a user,
I want to toggle file staging using the space-bar with instant visual feedback,
so that I can surgically prepare my commit without typing file paths.

## Acceptance Criteria

1. **Given** the Staging View is active with a list of changed files
2. **When** I navigate with arrow keys and press Space on a file
3. **Then** the system executes `git add` if it was unstaged, or `git reset` if it was staged
4. **And** the UI immediately refreshes the file's status icon ([ ] vs [x]) and semantic color
5. **And** the cursor (>) remains on the current line.

## Tasks / Subtasks

- [x] Extend Git Infrastructure (AC: 3)
  - [x] Add `StageAsync(string path)` to `IGitService` and `GitService` using `git add`.
  - [x] Add `UnstageAsync(string path)` to `IGitService` and `GitService` using `git reset`.
- [x] Implement Navigation Logic in MainLoop (AC: 2)
  - [x] Add `_selectedIndex` state to `MainLoop`.
  - [x] Handle `ConsoleKey.UpArrow` and `ConsoleKey.DownArrow` to move the cursor.
  - [x] Constrain `_selectedIndex` to the bounds of the file list.
- [x] Implement Toggle Action in MainLoop (AC: 3, 4, 5)
  - [x] Handle `ConsoleKey.Spacebar` on the current file.
  - [x] Call `StageAsync` or `UnstageAsync` based on current file status.
  - [x] Trigger immediate state refresh and re-render.
- [x] Update StagingView for Focus Rendering (AC: 5)
  - [x] Update `StagingView` to accept `selectedIndex`.
  - [x] Render a bold pointer `>` and highlight the background of the selected row.
- [x] Verification & Testing
  - [x] Create `Tests/GitServiceTests.cs` to verify staging commands.
  - [x] Update `Tests/StagingViewTests.cs` to verify focus rendering.
  - [x] Manual verification of "The Surgical Toggle" feel.

## Dev Notes

- **Architecture Compliance:** Follow the "Refresh Strategy" from `architecture.md`: Auto-refresh after mutation commands.
- **Process Pattern:** Use `IGitProcess` for all Git operations.
- **UI Performance:** Ensure sub-50ms latency for the toggle and navigation.
- **State Boundary:** The `MainLoop` owns the `_selectedIndex` as it's transient UI state, while `GitService` provides the snapshot of `GitFile`s.

### Project Structure Notes

- Files to modify:
  - `Infrastructure/Git/GitService.cs`
  - `Features/Shared/MainLoop.cs`
  - `Features/Staging/StagingView.cs`
- New files:
  - `Tests/GitServiceTests.cs`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#The-Surgical-Toggle]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns-The-Refresh-Strategy]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

### Review Findings

- [x] [Review][Decision] Staged File Icon Suppression — StagingView.cs (line 94) explicitly removes status icons for staged files. This reduces visual consistency with the unstaged section. Should we restore these icons or keep the minimal look for staged files?
- [x] [Review][Patch] Aggressive Polling & Performance [Features/Shared/MainLoop.cs:39-40]
- [x] [Review][Patch] Selection Displacement/Instability [Features/Shared/MainLoop.cs:42-44]
- [x] [Review][Patch] Partial Staging (XY Codes) Bug [Core/Models/GitFile.cs, Features/Shared/MainLoop.cs]
- [x] [Review][Patch] Resource Waste in MainLoop [Features/Shared/MainLoop.cs]
- [x] [Review][Patch] Missing Cancellation Support [Infrastructure/Git/GitService.cs]
- [x] [Review][Patch] Initial Repository State Failure [Infrastructure/Git/GitService.cs:48]
- [x] [Review][Patch] Silent Git Failures [Infrastructure/Git/GitService.cs]
- [x] [Review][Patch] Incomplete Selection Highlighting [Features/Staging/StagingView.cs:37, 55]
- [x] [Review][Patch] Unstaged Status Icon Formatting [Features/Staging/StagingView.cs:54]

### File List

- Infrastructure/Git/GitService.cs (Modified)
- Features/Shared/MainLoop.cs (Modified)
- Features/Staging/StagingView.cs (Modified)
- Tests/GitServiceTests.cs (New)
- Tests/StagingViewTests.cs (Modified)
