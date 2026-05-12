# Story 1.3: The Surgical Staging Dashboard (MVP Layout)

Status: review

## Story

As a user,
I want a focused, centered dashboard layout with a hotkey legend,
so that I can easily see my repository status and know which keys to press.

## Acceptance Criteria

1. **Centered Layout**: The UI uses a centered `Layout` with a `Double` border [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3].
2. **Multi-pane Structure**: A Navigation Sidebar and Action Pane are visible within the layout [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3].
3. **Status Bar**: A persistent Status Bar displays the current active branch and a hotkey legend (Space, C, B, R, Esc) [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3].
4. **Git Integration**: The view displays live data retrieved from `GitService` (branch name and file status) [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping].
5. **Encoding**: The application ensures `Console.OutputEncoding` is set to UTF-8 for icon rendering [Source: GEMINI.md#Technical Constraints].

## Tasks / Subtasks

- [x] **UI Component: StatusBarView** (AC: 3, 4)
  - [x] Create `Features/Shared/StatusBarView.cs`.
  - [x] Implement rendering for branch name and hotkey legend.
- [x] **UI Component: StagingView** (AC: 2, 4)
  - [x] Create `Features/Staging/StagingView.cs`.
  - [x] Implement rendering for the file list using `Table` or `Rows`.
- [x] **Feature: Main Dashboard Layout** (AC: 1, 2)
  - [x] Update `Features/Shared/MainLoop.cs` to implement the `Spectre.Console.Layout`.
  - [x] Integrate `StagingView` and `StatusBarView` into the layout.
- [x] **Validation: Visual Verification**
  - [x] Run the application and verify the layout is centered with a double border.
  - [x] Verify icons and colors are rendered correctly.

## Dev Notes

- Use `Spectre.Console.Layout` for the multi-pane arrangement.
- `StagingView` should be a stateless component returning `IRenderable` [Source: _bmad-output/planning-artifacts/architecture.md#Stateless Views].
- `StatusBarView` should be a stateless component returning `IRenderable`.
- `MainLoop` will act as the coordinator, fetching state from `GitService` and passing it to views.
- Colors: Green (Staged), Yellow (Modified), Cyan (Added), Red (Deleted) [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System].
- Icons: Use UTF-8 icons (e.g., `✔`, `✱`, `+`, `✘`) with clear semantic meaning [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System].

### Project Structure Notes

- Views reside in `Features/Staging/` or `Features/Shared/`.
- Naming: Use the `View` suffix for classes returning Spectre `IRenderable` objects [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns].

### References

- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **UX Specification**: `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Epics**: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- Fixed table column width in StagingView to prevent header wrapping.
- Escaped markup brackets in StagingView.

### Completion Notes List
- Implemented `StatusBarView` with branch name and hotkey legend.
- Implemented `StagingView` with categorized file status and color-coded icons.
- Updated `MainLoop` to use `Spectre.Console.Layout` with a multi-pane structure (Sidebar, Action, Footer).
- Verified UTF-8 icon rendering and double borders.

### File List
- `Features/Shared/StatusBarView.cs`
- `Features/Staging/StagingView.cs`
- `Features/Shared/MainLoop.cs` (Updated)
- `Styles/VibeTheme.cs`
- `Tests/StatusBarViewTests.cs`
- `Tests/StagingViewTests.cs`

- [x] [Review][Patch] Markup Injection Vulnerability: Use Markup.Escape() for file paths and branch names.
- [x] [Review][Patch] UI Flickering: Use LiveDisplay or state-change detection to avoid frequent AnsiConsole.Clear().
- [x] [Review][Patch] Aggressive Git Polling: Increase delay or implement event-driven refresh.
- [x] [Review][Patch] Missing Centering Logic: Wrap Root layout in Align.Center and set double borders properly.
- [x] [Review][Defer] Inactive Hotkey Legend: Space, C, B, R keys are not yet functional. — deferred, pre-existing
- [x] [Review][Patch] Redundant Visual Indicators: Both [[x]] and VibeTheme icon are shown for staged files.
- [x] [Review][Patch] Invariant Globalization Impact: Review InvariantGlobalization impact on non-ASCII file paths.
- [x] [Review][Patch] Console Input Collision: Use a more stable input pattern than Console.ReadKey during render loop.

Status: done
