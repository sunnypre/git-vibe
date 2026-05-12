# Story 2.1: The Commit Flow (Hotkey 'C')

Status: review

## Story

As a user,
I want to initiate a commit flow using the 'C' hotkey,
so that I can finalize my staged changes with a meaningful message.

## Acceptance Criteria

1. **Given** I have staged files in the staging view
2. **When** I press the 'C' key
3. **Then** a centered Commit Message Input panel appears with a double border
4. **And** I can type a multi-line message (or at least a single line with multi-line potential)
5. **And** pressing Enter (or a specific commit shortcut) executes `git commit -m "[message]"`
6. **And** pressing Escape cancels the flow and returns to the staging view.
7. **And** a successful commit triggers a full repository state refresh.
8. **And** a failed commit displays an error message to the user.

## Tasks / Subtasks

- [x] Infrastructure: Implement Commit Logic (AC: 5)
  - [x] Add `Task<GitResult> CommitAsync(string message, CancellationToken ct = default)` to `IGitService`.
  - [x] Implement `CommitAsync` in `GitService` using `git commit -m`.
- [x] UI: Implement Commit Overlay Component (AC: 3, 4)
  - [x] Create `Features/Shared/CommitOverlay.cs` (or similar View class).
  - [x] Use a `Panel` with `BoxBorder.Double` to frame the input.
  - [x] Ensure it supports multi-line input if possible within the TUI flow.
- [x] Integration: Update MainLoop for Commit Flow (AC: 2, 6, 7, 8)
  - [x] Update `MainLoop.cs` input handling for `ConsoleKey.C`.
  - [x] Implement state management to toggle between Staging view and Commit overlay.
  - [x] On 'C' press: verify if staged files exist; if so, trigger overlay.
  - [x] On Commit submission: call `GitService.CommitAsync`, then handle refresh/error.
  - [x] On Escape (within overlay): return to Staging view.
- [x] UI: Improve Error Handling (AC: 8)
  - [x] Implement or refine a reusable `ErrorOverlay` or error display pattern as per architecture.
- [x] Verification & Testing
  - [x] Create `Tests/GitServiceTests.cs` (or update) for `CommitAsync`.
  - [x] Create `Tests/CommitOverlayTests.cs` to verify overlay rendering.
  - [x] Manual verification of the 'C' key flow and message handling.

## Dev Notes

- **Architecture Compliance:** Follow the "Result Pattern" for `CommitAsync`. Ensure the UI re-renders correctly after the operation.
- **Process Patterns:** Trigger a snapshot refresh immediately following a successful commit (from `architecture.md#Process-Patterns-The-Refresh-Strategy`).
- **UI Interaction:** Since `MainLoop` uses `AnsiConsole.Live`, you may need to handle interactive prompts carefully. Consider using a custom input loop for the overlay that renders within the `Live` context or pauses it.
- **Styling:** Use `VibeTheme` (if available) or standard Spectre colors to ensure the overlay feels "alive".

### Project Structure Notes

- New Files:
  - `Features/Shared/CommitOverlay.cs`
- Modified Files:
  - `Infrastructure/Git/GitService.cs`
  - `Features/Shared/MainLoop.cs`
- Test Files:
  - `Tests/GitServiceTests.cs`
  - `Tests/CommitOverlayTests.cs`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns-The-Refresh-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Overlay-&-Modal-Patterns]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Implemented `CommitAsync` in `IGitService` and `GitService` following the Result Pattern.
- Created `CommitOverlay` component using Spectre `Panel` with `BoxBorder.Double` and `Yellow` styling.
- Updated `MainLoop` to handle the `C` hotkey, check for staged files, and manage the commit message input state.
- Integrated `CommitAsync` call with automatic state refresh and error handling.
- Added unit tests for `GitService.CommitAsync` and `CommitOverlay` rendering.
- Verified that the UI remains responsive during the commit flow.

### File List

- `Infrastructure/Git/GitService.cs`
- `Features/Shared/CommitOverlay.cs`
- `Features/Shared/MainLoop.cs`
- `Tests/GitServiceTests.cs`
- `Tests/CommitOverlayTests.cs`

### Change Log

- 2026-05-06: Implemented Story 2.1: The Commit Flow (Hotkey 'C').

### Review Findings

- [x] [Review][Patch] Architecture Violation: Vertical Modal Stacking [MainLoop.cs:122]
- [x] [Review][Patch] Missing Multi-line Support in Commit Overlay [MainLoop.cs:150]
- [x] [Review][Patch] Argument Injection in CommitAsync [GitService.cs:64]
- [x] [Review][Patch] Markup Injection in Status Bar/Views [StatusBarView.cs:22]
- [x] [Review][Patch] Deviation: Missing ErrorOverlay Component [MainLoop.cs:92]
- [x] [Review][Patch] Navigation Crash on Empty List [MainLoop.cs:69]
- [x] [Review][Patch] Broken Hotkey Legend (Branching/Search) [StatusBarView.cs:23]
- [x] [Review][Patch] Improper CancellationToken Usage [MainLoop.cs:51]
- [x] [Review][Patch] Stub Method: CreateLayout [MainLoop.cs:266]

### Status

done
