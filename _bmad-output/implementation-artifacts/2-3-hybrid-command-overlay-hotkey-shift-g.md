# Story 2.3: Hybrid Command Overlay (Hotkey 'Shift+G')

Status: done

## Story

As a user,
I want a "Shift+G" escape hatch to run raw Git commands,
so that I have the full power of the CLI within the TUI.

## Acceptance Criteria

1. **Given** the TUI is active
2. **When** I press "Shift+G" (or 'G' if preferred, but spec says Shift+G)
3. **Then** an overlay input box opens with a pre-filled `git ` prefix
4. **And** I can type any Git subcommand (e.g., `checkout -b feat/new`)
5. **And** pressing `Enter` executes the command via the `IGitProcess`
6. **And** the TUI state is fully refreshed after the command executes (regardless of success/failure)
7. **And** pressing `Escape` cancels the overlay and returns to the staging view

## Tasks / Subtasks

- [x] Infrastructure: Command Parsing and Execution (AC: 5)
  - [x] Add `Task<GitResult> RunRawAsync(string command, CancellationToken ct = default)` to `IGitService`.
  - [x] Implement `RunRawAsync` by splitting the command string into arguments and calling `gitProcess.RunAsync`.
- [x] UI: Implement Command Overlay (AC: 3, 7)
  - [x] Create `Features/Shared/CommandOverlay.cs`.
  - [x] Render a centered panel with a single-line input field.
  - [x] Pre-fill with "git ".
  - [x] Add instructions: "[grey][[Enter]][/] Execute  [grey][[Esc]][/] Cancel".
- [x] Integration: Update MainLoop for Hybrid Command Flow (AC: 1, 2, 4, 6, 7)
  - [x] Update `MainLoop.cs` to handle `isCommandOverlayActive` state.
  - [x] Handle `Shift+G` key press to activate overlay.
  - [x] Capture user input for the raw command.
  - [x] On `Enter`: execute command, show "Refreshing...", and then refresh snapshot.
- [x] Verification & Testing
  - [x] Create `Tests/CommandOverlayTests.cs` to verify overlay rendering.
  - [x] Update `Tests/GitServiceTests.cs` to verify `RunRawAsync` command splitting.
  - [x] Manual verification of running `git branch` or `git checkout` via overlay.

## Dev Notes

- **Command Splitting:** Use a simple regex or a dedicated library if available, but for now, `command.Split(' ', StringSplitOptions.RemoveEmptyEntries)` should suffice for basic subcommands. Note: The `git ` prefix should be stripped or handled carefully.
- **Visuals:** The overlay should be visually distinct but consistent with `CommitOverlay`.
- **Refresh:** Always refresh the state after a raw command as it might have mutated the repo (e.g., `git reset --hard`).

### Project Structure Notes

- New Files:
  - `Features/Shared/CommandOverlay.cs`
- Modified Files:
  - `Infrastructure/Git/GitService.cs`
  - `Features/Shared/MainLoop.cs`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR5]

## Senior Developer Review (AI)

**Outcome:** Approved
**Date:** 2026-05-06

### Action Items
- [x] [High] Fix command splitting to support quoted strings (currently fails on `git commit -m "msg"`)
- [x] [Medium] CommandOverlay panel padding/size might clip very long commands
- [x] [Low] Pre-filling "git " is good, but backspacing it feels a bit clunky

### Review Follow-ups (AI)
- [x] [AI-Review] Implement robust argument parsing for `RunRawAsync`
- [x] [AI-Review] Add unit test for quoted command arguments


### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Implemented `RunRawAsync` in `GitService` with robust argument parsing (regex-based).
- Created `CommandOverlay` UI component.
- Integrated `Shift+G` hotkey and command execution loop in `MainLoop`.
- Added unit tests for overlay and service logic, including quoted arguments.

### File List

- `Infrastructure/Git/GitService.cs`
- `Features/Shared/CommandOverlay.cs`
- `Features/Shared/MainLoop.cs`
- `Tests/CommandOverlayTests.cs`
- `Tests/GitServiceTests.cs`
