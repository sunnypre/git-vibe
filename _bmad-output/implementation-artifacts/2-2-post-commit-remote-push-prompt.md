# Story 2.2: Post-Commit Remote Push Prompt

Status: review

## Story

As a user,
I want to be prompted to push my changes after a successful commit,
so that I can easily keep my remote repository in sync.

## Acceptance Criteria

1. **Given** a successful commit has just been executed
2. **When** the system detects a remote tracking branch for the current branch
3. **Then** a prompt appears asking "Push changes to remote? (y/n)"
4. **And** selecting 'y' executes `git push`
5. **And** selecting 'n' or 'Escape' cancels the push and returns to the staging view
6. **And** the UI refreshes the state after the push operation completes (success or failure)
7. **And** a failed push displays an error message to the user

## Tasks / Subtasks

- [x] Infrastructure: Implement Push and Tracking Logic (AC: 2, 4)
  - [x] Add `Task<bool> HasRemoteTrackingBranchAsync(CancellationToken ct = default)` to `IGitService`.
  - [x] Add `Task<GitResult> PushAsync(CancellationToken ct = default)` to `IGitService`.
  - [x] Implement `HasRemoteTrackingBranchAsync` using `git rev-parse --abbrev-ref --symbolic-full-name @{u}`.
  - [x] Implement `PushAsync` using `git push`.
- [x] UI: Implement Push Prompt Overlay (AC: 3, 5)
  - [x] Create `Features/Shared/PushPromptOverlay.cs`.
  - [x] Use a `Panel` with `BoxBorder.Double` and `VibeTheme` styling.
  - [x] Display clear prompt text: "Push changes to remote? (y/n)".
- [x] Integration: Update MainLoop for Push Flow (AC: 1, 3, 5, 6, 7)
  - [x] Update `MainLoop.cs` to handle `isPushPromptActive` state.
  - [x] After successful `CommitAsync`, call `HasRemoteTrackingBranchAsync`.
  - [x] If true, set `isPushPromptActive = true`.
  - [x] Handle input for 'Y', 'N', and 'Escape' when push prompt is active.
  - [x] On 'Y': execute `PushAsync`, handle results (refresh and error display).
- [x] Verification & Testing
  - [x] Update `Tests/GitServiceTests.cs` to verify `HasRemoteTrackingBranchAsync` and `PushAsync`.
  - [x] Create `Tests/PushPromptOverlayTests.cs` to verify overlay rendering.
  - [x] Manual verification of the commit -> push prompt -> push/cancel flow.

## Dev Notes

- **Architecture Compliance:** Follow the "Result Pattern" for `PushAsync`.
- **Git Logic:** `git rev-parse --abbrev-ref --symbolic-full-name @{u}` is the most reliable way to check for an upstream branch. It will return a non-zero exit code if no upstream is set.
- **UI Interaction:** The `PushPromptOverlay` should be similar in style to `CommitOverlay`. Ensure it is rendered within the `AnsiConsole.Live` context in `MainLoop`.
- **State Management:** Ensure that the "Refreshing..." or "Pushing..." status is correctly shown during the long-running push operation.

### Project Structure Notes

- New Files:
  - `Features/Shared/PushPromptOverlay.cs`
- Modified Files:
  - `Infrastructure/Git/GitService.cs`
  - `Features/Shared/MainLoop.cs`
- Test Files:
  - `Tests/GitServiceTests.cs`
  - `Tests/PushPromptOverlayTests.cs`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns-The-Refresh-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Overlay-&-Modal-Patterns]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Implemented `HasRemoteTrackingBranchAsync` and `PushAsync` in `GitService`.
- Created `PushPromptOverlay` for visual confirmation.
- Integrated the push flow into `MainLoop.cs`.
- Verified with unit tests in `GitServiceTests.cs` and `PushPromptOverlayTests.cs`.

### File List

- `Infrastructure/Git/GitService.cs`
- `Features/Shared/PushPromptOverlay.cs`
- `Features/Shared/MainLoop.cs`
- `Tests/GitServiceTests.cs`
- `Tests/PushPromptOverlayTests.cs`
