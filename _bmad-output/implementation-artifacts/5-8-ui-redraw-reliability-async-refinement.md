---
title: 'Story 5.8: UI Redraw Reliability & Async Refinement'
type: 'bugfix'
created: '2026-05-18'
status: 'ready-for-dev'
baseline_commit: '3a41261a8120b666a7b219018449c25f46487e87'
context: ['_bmad-output/implementation-artifacts/5-4-async-performance-ux-guardrails.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The UI occasionally fails to redraw after a background Git operation completes, leading to a "frozen" appearance where the staged status of a file doesn't update until a key is pressed. Additionally, some Git operations (like Diff) are still blocking the main thread.

**Approach:** 
1. Refactor the `MainLoop` redraw logic to use a signaling mechanism (e.g., `SemaphoreSlim` or `ManualResetEventSlim`) to trigger immediate renders upon state changes or task completion.
2. Refactor `GetDiffAsync` to run in the background.
3. Remove duplicated key handlers and consolidate input logic.
4. Ensure the spinner animation and state updates are reliably rendered by calling `ctx.Refresh()` or ensuring `UpdateTarget` is effective.

## Boundaries & Constraints

**Always:** 
- Maintain thread-safety when updating shared state.
- Ensure the UI remains responsive even during high-frequency redraw requests.

**Never:** 
- Do not block the main thread for any `gitService` call.
- Do not introduce CPU-spinning loops; use efficient waiting (e.g., `Task.WhenAny` with a delay and a signal).

</frozen-after-approval>

## Code Map

- `Features/Shared/MainLoop.cs` -- Centralize redraw signaling and fix blocking calls.
- `Features/Shared/StatusBarView.cs` -- (Review) Ensure it renders correctly based on the new signaling.

## Tasks & Acceptance

**Execution:**
- [x] `Features/Shared/MainLoop.cs` -- Implement `RedrawSignal` (SemaphoreSlim) to trigger loop iterations.
- [x] `Features/Shared/MainLoop.cs` -- Move `GetDiffAsync` to background task.
- [x] `Features/Shared/MainLoop.cs` -- Clean up duplicated `Spacebar` handlers and consolidated input.
- [x] `Features/Shared/MainLoop.cs` -- Refactor the main loop to wait on the signal or a timeout (for spinner animation).

**Acceptance Criteria:**
- Given a background operation, when it completes, then the UI updates immediately without requiring a key press.
- When viewing a diff, the UI remains responsive and shows the spinner while the diff is loading.
- No duplicated key handling logic exists in `MainLoop.cs`.

## Verification

**Commands:**
- `dotnet build` -- expected: Success.
- `dotnet test` -- expected: Success.

**Manual checks:**
- Stage a file and verify it turns green immediately upon spinner disappearance.
- Open a diff and verify the UI doesn't hang.
