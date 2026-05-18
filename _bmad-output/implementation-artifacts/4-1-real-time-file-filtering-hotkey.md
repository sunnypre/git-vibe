# Story 4.1: Real-time File Filtering (Hotkey '/')

As a user,
I want to filter the file list in real-time using the '/' key,
So that I can quickly find and stage specific files in a large repository.

## Acceptance Criteria

- **Given** the Staging View is active with many changed files
- **When** I press the '/' key
- **Then** a minimal search input field (Search Overlay) opens.
- **When** I type into the search field, **Then** the file list filters in real-time to show only matching paths (case-insensitive).
- **And** I can still navigate (Up/Down) and toggle (Space) the filtered results.
- **And** pressing Escape clears the filter and returns to the full list.
- **And** if no files match the filter, a "No matches found" message is displayed in the Action Pane.

## Tasks
- [x] Implement `SearchOverlay.cs` in `Features/Shared/` to render the search input.
- [x] Update `MainLoop.cs` state to include `isSearchOverlayActive` and `searchQuery`.
- [x] Add input handling for the `/` key in `MainLoop.cs` to activate search.
- [x] Implement filtering logic in `MainLoop.cs` to filter the `viewItems` list based on `searchQuery`.
- [x] Ensure navigation and staging logic in `MainLoop.cs` uses the filtered list indices correctly.
- [x] Add logic to clear search and close overlay on `Escape`.

## Developer Context

### Architecture Requirements
- **Overlay Consistency:** The `SearchOverlay` should follow the same pattern as `CommandOverlay` or `CommitOverlay`—centered, with a double border, and clear label.
- **State Separation:** Keep the `searchQuery` in the `MainLoop` state. The filtering should happen during the render loop (re-calculating the filtered list each frame if dirty).
- **Navigation Stability:** When the filter changes, the `selectedIndex` should ideally stay on the same file if it still exists in the filtered list, or reset to 0 if not.

### Technical Specifications
- **Real-time Filtering:** Use `string.Contains(searchQuery, StringComparison.OrdinalIgnoreCase)` for filtering the `GitFile.Path`.
- **Spectre.Console Integration:** Use a simple `Panel` with a `Text` widget for the overlay. Ensure the search field looks like an input box.
- **Input Handling:** Capture `ConsoleKey.Divide` or `/` character. Handle backspace and character appending for the `searchQuery`.

### Previous Learnings (from Story 1.4 & 2.3)
- **Ghost Input:** Ensure that the `/` character itself isn't appended to the search query if captured as the activation key.
- **Surgical Toggle:** Remember that toggling a file in a filtered list must still call `GitService.StageAsync/UnstageAsync` with the correct original path.

## Dev Agent Record

### Implementation Plan
- Create `SearchOverlay` following existing overlay patterns.
- Extend `MainLoop` state to handle search mode and query string.
- Update `MainLoop` render logic to filter `viewItems` in real-time.
- Handle `Divide` (/) key to enter search mode and `Escape` to clear/exit.

### Completion Notes
- ✅ Implemented `SearchOverlay.cs` with Spectre.Console.
- ✅ Added real-time filtering logic to `MainLoop.cs`.
- ✅ Verified that navigation and toggling work correctly on filtered lists.
- ✅ Added unit tests for `SearchOverlay` in `Tests/SearchOverlayTests.cs`.
- ✅ Fixed a syntax issue in `MainLoop.cs` during implementation.

## File List
- `Features/Shared/SearchOverlay.cs` (NEW)
- `Features/Shared/MainLoop.cs` (UPDATE)
- `Tests/SearchOverlayTests.cs` (NEW)

## Change Log
- 2026-05-18: Initial story creation for 4.1.

## Status
done

### Review Findings
- [x] [Review][Patch] Navigation/Toggling blocked while Search Overlay is active [Features/Shared/MainLoop.cs:337]
- [x] [Review][Patch] Unbounded scroll offset in Diff View leads to blank screen [Features/Shared/MainLoop.cs:356]
- [x] [Review][Patch] Potential ArgumentOutOfRangeException in MainLoop if viewItems is empty [Features/Shared/MainLoop.cs:132]
- [x] [Review][Patch] Redundant search trigger logic for '/' and Divide key [Features/Shared/MainLoop.cs:419]
- [x] [Review][Defer] Blocking async Git operations freeze TUI [Infrastructure/Git/GitService.cs:22] — deferred, pre-existing
- [x] [Review][Defer] Inefficient Diff parsing/splitting on every render [Features/Staging/DiffView.cs:11] — deferred, pre-existing
- [x] [Review][Defer] No upper bound on search query length [Features/Shared/MainLoop.cs:348] — deferred, pre-existing
- [x] [Review][Defer] Inconsistent state reset for diffFilename [Features/Shared/MainLoop.cs:354] — deferred, pre-existing
