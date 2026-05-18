# Story 5.4: Async Performance & UX Guardrails

As a user,
I want the UI to remain responsive during Git operations and for errors to be handled gracefully,
So that I never feel the application has crashed or is ignoring my errors.

## Acceptance Criteria

- **Given** a long-running Git operation, **When** it is executing in the background, **Then** the UI shows a "Waiting/Loading" state and does not freeze the main thread.
- **When** multiple errors occur in rapid succession, **Then** they are queued or correctly displayed without being silently overwritten by polling race conditions.
- **And** the command output overlay only triggers for actual warnings or errors, not standard informational output.

## Tasks
- [ ] Implement background task handling with "Loading" indicator.
- [ ] Fix `errorDisplayUntil` polling race conditions.
- [ ] Refine `CommandOutputOverlay` triggering logic.
