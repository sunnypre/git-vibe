# Story 2.4: Integrated Output & Error Display

Status: done

## Story

As a user,
I want to see the output and errors of my raw commands,
so that I can diagnose issues without leaving the tool.

## Acceptance Criteria

1. **Given** I execute a raw command via the overlay (from Story 2.3)
2. **When** the command completes
3. **Then** the stdout is displayed in a temporary output panel if successful
4. **And** if the command fails (non-zero exit code), an `ErrorOverlay` displays the stderr
5. **And** the user must press a key (e.g., `Esc` or `Enter`) to dismiss the error/output and return to the TUI
6. **And** the UI state remains consistent after dismissing the display

## Tasks / Subtasks

- [x] UI: Create Command Output Panel (AC: 3, 5)
  - [x] Create `Features/Shared/CommandOutputOverlay.cs`.
  - [x] Render a panel containing the text output of the last command.
  - [x] Use `BoxBorder.Double` and appropriate color (e.g., Green for success).
  - [x] Add instruction: "[grey]Press any key to continue...[/]".
- [x] Integration: Update MainLoop to Capture and Display Output (AC: 1, 2, 3, 4, 5)
  - [x] Update `MainLoop.cs` to handle `isOutputOverlayActive` and capture `GitResult`.
  - [x] After `RunRawAsync`, set `isOutputOverlayActive = true` if output/error exists.
  - [x] Display `CommandOutputOverlay` or `ErrorOverlay` modally.
  - [x] Handle key press to dismiss.
- [x] Verification & Testing
  - [x] Create `Tests/CommandOutputOverlayTests.cs`.
  - [x] Manual verification with a command that produces output (e.g., `git branch`) and one that fails (e.g., `git checkout non-existent`).

## Dev Notes

- **Output Capture:** `GitResult` already contains `Output` and `Error`.
- **Dismissal:** Uses a state toggle in the main loop to dismiss.

## Senior Developer Review (AI)

**Outcome:** Approved
**Date:** 2026-05-06

### Action Items
- [x] [Medium] Missing dismissal hints in Error UI (Addressed in CommandOutputOverlay, ErrorOverlay remains same but MainLoop handles dismissal)
- [x] [Medium] Redundant error-rendering logic (MainLoop consolidated modal vs timed errors)

### Review Follow-ups (AI)
- [x] [AI-Review] Consolidate error rendering and add dismissal hints


## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Created `CommandOutputOverlay` to show success messages.
- Updated `MainLoop` to show command results modally and handle dismissal.
- Verified with `CommandOutputOverlayTests`.

### File List

- `Features/Shared/CommandOutputOverlay.cs`
- `Features/Shared/MainLoop.cs`
- `Tests/CommandOutputOverlayTests.cs`
