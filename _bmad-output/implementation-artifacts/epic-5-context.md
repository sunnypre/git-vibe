# Epic 5 Context: Robustness & UI Polish

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Harden the core Git integration and refine the TUI experience to ensure high reliability, secure command execution, and a professional, adaptive interface that remains responsive under all conditions.

## Stories

- Story 5.1: Critical Core Hardening & Security
- Story 5.2: Input & Buffer Reliability
- Story 5.3: UI Polish & Hotkey Integrity
- Story 5.4: Async Performance & UX Guardrails
- Story 5.5: Adaptive Layout & Scrollable Components
- Story 5.6: Compact Layout & Header-Aware Scrolling
- Story 5.7: Unified Staging View & Master Select (New)

## Requirements & Constraints

- **Robust Parsing:** System must handle complex file paths (spaces, quotes, renames) and various Git XY porcelain codes correctly.
- **Command Security:** All raw Git commands must be sanitized to prevent injection; arguments must be properly escaped.
- **Input Reliability:** Prevent input lag and "ghost" keys during async operations by managing or flushing the input buffer.
- **State Consistency:** The TUI state must never diverge from the actual Git repository state; manual and automatic refreshes must be reliable.
- **Adaptive Layout:** The interface must adapt dynamically to terminal size changes and provide vertical scrolling for large lists in the Action Pane and Sidebar.

## Technical Decisions

- **Snapshot-Based State:** Continue using manual and action-driven refresh patterns to maintain consistency.
- **View-Level Scrolling:** Scrolling logic is encapsulated within the View components (e.g., `StagingView`, `BranchingView`) to correctly handle fixed headers and footers.
- **Compact UI:** Minimize nested panels and redundant borders to maximize content area on small screens.
- **Async Safety:** Ensure UI responsiveness during long-running Git operations with appropriate "Waiting" states.
- **Result Pattern:** Maintain strict usage of `GitResult` for error handling and user feedback.

## UX & Interaction Patterns

- **The Surgical Toggle:** Maintain sub-50ms latency for toggling file staging via the space-bar.
- **Contextual Hotkey Legend:** The status bar legend must dynamically reflect available features based on the current view and state.
- **Semantic Colors:** Uniform use of color for file statuses: Green (Staged), Yellow (Modified), Cyan (Added), Red (Deleted).
- **Master Select:** Provide a "Select All" mechanism to stage or unstage everything at once.

## Cross-Story Dependencies

- **MainLoop Coordination:** Most Epic 5 stories converge on `MainLoop.cs`, requiring careful management of transient UI state and async flow.
- **GitService Extensions:** Hardening and new features like master select require updates to the shared `GitService`.
