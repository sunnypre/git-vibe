# Story 3.3: Inline Diff Explorer

Status: done

## Story

As a user,
I want to peek at file diffs directly within the TUI,
So that I can verify my changes before staging them.

## Acceptance Criteria

1. **Given** I have a file selected in the Staging View
2. **When** I press the `Enter` or `D` key
3. **Then** an Inline Diff panel opens showing the changes for that file
4. **And** the panel displays the diff with semantic colors (Green for additions, Red for deletions).
5. **And** the user can scroll through the diff if it's long.
6. **And** pressing `Escape` closes the panel and returns to the file list.

## Developer Context

This story implements a critical review feature. The diff explorer should feel like a focused, temporary overlay that provides clarity before staging.

### Technical Requirements
- **Service:** Update `IGitService` and `GitService` to include `GetDiffAsync(string path)`.
  - Use `git diff --color=never [path]` for unstaged changes.
  - Use `git diff --cached --color=never [path]` for staged changes.
- **UI:** Create `Features/Staging/DiffView.cs` (or `DiffOverlay.cs`).
  - Use `Spectre.Console.Panel` or `Table` to render the diff lines.
  - Use `Spectre.Console.Canvas` or simply `Markup` to color the lines starting with `+` (green) and `-` (red).
- **Navigation:**
  - In `MainLoop.cs`, when in `Staging` view:
    - `Enter` or `D` -> Fetch diff and activate `isDiffOverlayActive`.
  - Handle scrolling if possible (or just use a `Rows` within a fixed-height panel for the MVP).

### Architecture Compliance
- Diff logic belongs in `Features/Staging/`.
- Ensure the diff explorer is dismissed via `Escape`.
- Do not trigger a refresh when closing the diff explorer, as it's a read-only view.

## Tasks / Subtasks

- [x] Service: Implement `GetDiffAsync` in `GitService.cs`
- [x] UI: Create `Features/Staging/DiffView.cs`
  - [x] Implement line-by-line coloring for diff output.
  - [x] Wrap in a Panel with a header showing the filename.
- [x] Integration: Update `MainLoop.cs` to show Diff Explorer
  - [x] Add `isDiffOverlayActive` and `currentDiffContent` state.
  - [x] Trigger on `Enter`/`D` in staging view.
- [x] Verification & Testing
  - [x] Manual verification with various file changes (additions, deletions, modifications).

## Dev Agent Record

### Implementation Plan
1.  **Service Update:** Added `GetDiffAsync` to `IGitService` and `GitService`. It uses `git diff` for unstaged changes and `git diff --cached` for staged changes, ensuring `--color=never` for clean parsing.
2.  **UI Component:** Created `DiffView.cs` using `Spectre.Console`. Implemented semantic coloring: green for `+` lines, red for `-` lines, cyan for hunk headers (`@@`), and grey for git metadata.
3.  **Main Loop Integration:** Added state for `isDiffOverlayActive`, `currentDiffContent`, and `diffScrollOffset`. Updated input handling to trigger the diff view on `Enter` or `D` in Staging View. Implemented basic vertical scrolling using `UpArrow`/`DownArrow`.

### Completion Notes
- **Scrolling:** Basic line-based scrolling is implemented by skipping lines based on `diffScrollOffset`.
- **Colors:** Verified that additions are green and deletions are red as per AC.
- **Escape Key:** Esc successfully dismisses the overlay and returns to the file list.

## File List
- `Infrastructure/Git/GitService.cs`
- `Features/Staging/DiffView.cs`
- `Features/Shared/MainLoop.cs`
- `Tests/GitServiceTests.cs`

## Change Log
- Add `GetDiffAsync` to Git Service.
- Implement `DiffView` component with semantic coloring.
- Integrate Inline Diff Explorer into `MainLoop`.
- Add unit tests for `GetDiffAsync`.
