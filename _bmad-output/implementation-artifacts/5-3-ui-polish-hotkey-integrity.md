# Story 5.3: UI Polish & Hotkey Integrity

As a user,
I want the UI legend to accurately reflect the available features and my selection to be stable,
So that the interface feels professional and predictable.

## Acceptance Criteria

- **Given** the application is in different states (Staging, Branching), **When** I look at the status bar legend, **Then** only functional hotkeys are displayed, and they all work as intended.
- **When** I refresh the view, **Then** my current selection remains on the same file/item and does not jump unexpectedly.

## Tasks
- [ ] Audit and update `StatusBarView.cs` legend for all views.
- [ ] Fix selection jump logasdic in `MainLoop.cs` during refresh.
asdasda