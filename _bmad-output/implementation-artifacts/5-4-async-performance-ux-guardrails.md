asdasd---
title: 'Story 5.4: Async Performance & UX Guardrails - Background Operations'
type: 'refactor'
created: '2026-05-18'
status: 'done'
baseline_commit: 'd083bf7d7babf07aabece94bd972d357fc5b30d0'
context: ['_bmad-output/implementation-artifacts/epic-5-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Git operations (commit, push, stage, etc.) currently block the TUI's main thread, causing the application to "freeze" during execution and providing no feedback to the user that a background task is running.

**Approach:** Refactor the `MainLoop` to execute all `IGitService` operations as non-blocking background tasks. Introduce a visual "Loading" indicator (spinner or buffer) in the right corner of the status bar to signal background activity without interrupting UI responsiveness.

## Boundaries & Constraints

**Always:** 
- Maintain UI responsiveness (keyboard input handling) while Git commands are running.
- Use a dedicated "Loading" state flag in `MainLoop` to prevent overlapping conflicting operations (e.g., don't allow two commits at once).
- Ensure the TUI continues to redraw the interface while a background task is active.
- **NEW:** Ensure thread-safety when updating shared state (files, branches) from background tasks. Use local copies or synchronization to prevent UI-thread crashes.
- **NEW:** Prevent infinite refresh loops by ensuring status-refresh tasks do not trigger subsequent refreshes.

**Ask First:** 
- If complex operation queuing is required (currently, we'll just block conflicting actions with an error message).

**Never:** 
- Do not use `Console.Write` or `AnsiConsole.Write` directly during background tasks; all updates must flow through the `Spectre.Console.Live` display cycle.
- Do not introduce threading race conditions that could lead to corrupted UI state.
- Do not allow `spinnerIndex` to overflow; ensure it is clamped or handled via modulo safely.
- Do not use `async void` for callbacks; use `Func<Task>` or similar.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Background Commit | User hits Enter on Commit | Spinner appears in status bar; UI remains interactive (scroll/exit); Refresh happens post-completion. | Standard error overlay if commit fails. |
| Overlapping Operation | User tries to Push while Commit is running | Application ignores request and shows "Operation in progress" warning. | N/A |
| Rapid Toggle | User spam-toggles files | Each toggle is processed; Spinner flickers or stays on; UI stays responsive. | N/A |

</frozen-after-approval>

## Code Map

- `Features/Shared/MainLoop.cs` -- Orchestrates state and input; needs refactoring to spawn background tasks and track "loading" state.
- `Features/Shared/StatusBarView.cs` -- UI component for the footer; needs a placeholder/animation for the background loader.
- `Infrastructure/Git/GitService.cs` -- Existing async service; already returns Tasks, but `MainLoop` currently `awaits` them synchronously in the event loop.

## Tasks & Acceptance

**Execution:**
- [x] `Features/Shared/StatusBarView.cs` -- Add a "Loading" indicator (spinner) to the right column of the status bar.
- [x] `Features/Shared/MainLoop.cs` -- Refactor input handlers to fire-and-forget (safely) Git operations using a thread-safe `RunBackgroundGitTask` helper.
- [x] `Features/Shared/MainLoop.cs` -- Implement "Loading" state management with atomicity (e.g. `Interlocked`) to prevent concurrent conflicting Git operations.
- [x] `Features/Shared/MainLoop.cs` -- Ensure state updates (files, branches) are performed safely to avoid `Collection modified` exceptions in the UI thread.
- [x] `Tests/StatusBarViewTests.cs` -- Add tests for the loading indicator visibility.

**Acceptance Criteria:**
- Given a long-running Git operation (e.g., commit), when it is executing, then a spinner is visible in the status bar and the UI remains responsive to other keys (like arrow keys for navigation).
- When a Git operation completes, the loading indicator disappears and the UI state (files, branches) refreshes automatically **without entering an infinite loop**.
- No "freezing" or input lag occurs during any `IGitService` call.
- The application does not crash due to thread-safety violations or index overflows.

## Spec Change Log

- **Iteration 1**: Initial implementation.
- **Iteration 2**: Fixed infinite refresh loop, thread-safety violations on collections, `spinnerIndex` overflow, and `async void` crash risks identified in review. Added constraints for atomic task guards and safe state updates.

## Design Notes

The `MainLoop` uses `AnsiConsole.Live`. To keep it non-blocking:
1. When a Git action is triggered, use an atomic check-and-set on `isBackgroundLoading`.
2. `RunBackgroundGitTask` should handle the `isRefreshing` flag carefully—refresh tasks themselves should not set `isRefreshing = true` upon completion.
3. Update shared collections (like `files`, `branches`) by preparing new instances in the background and swapping the references at the end of the task, using `needsRedraw = true` to trigger the UI update.
4. Use `spinnerIndex = (spinnerIndex + 1) % SpinnerFrames.Length` to avoid overflow.
5. Use a simple lock or synchronization primitive for shared variables like `errorMessage` and `needsRedraw`.

## Verification

**Commands:**
- `dotnet test` -- expected: All tests pass, including new StatusBarView checks.
- `dotnet build` -- expected: Success.

**Manual checks (if no CLI):**
- Trigger a commit or push and verify the spinner appears.
- While the spinner is visible, verify you can still move the selection cursor in the staging view.
- Verify the spinner eventually stops (no infinite refresh).

## Suggested Review Order

**Background Task Orchestration**

- The core helper for non-blocking Git operations with safety guards.
  [`MainLoop.cs:548`](../../Features/Shared/MainLoop.cs#L548)

- Thread-safe state refresh and reference swapping.
  [`MainLoop.cs:614`](../../Features/Shared/MainLoop.cs#L614)

**Thread Safety & State**

- Synchronization lock and atomic loading flags.
  [`MainLoop.cs:25`](../../Features/Shared/MainLoop.cs#L25)

- Thread-safe snapshotting for the rendering loop.
  [`MainLoop.cs:134`](../../Features/Shared/MainLoop.cs#L134)

**UI & Animation**

- Spinner rendering in the status bar.
  [`StatusBarView.cs:6`](../../Features/Shared/StatusBarView.cs#L6)

- Spinner frame increment in the main loop.
  [`MainLoop.cs:142`](../../Features/Shared/MainLoop.cs#L142)

**Verification**

- Unit tests for the spinner rendering.
  [`StatusBarViewTests.cs:55`](../../Tests/StatusBarViewTests.cs#L55)
