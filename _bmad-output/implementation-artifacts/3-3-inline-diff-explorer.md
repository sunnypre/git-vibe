# Story 3.3: Inline Diff Explorer

Status: ready-for-dev

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

- [ ] Service: Implement `GetDiffAsync` in `GitService.cs`
- [ ] UI: Create `Features/Staging/DiffView.cs`
  - [ ] Implement line-by-line coloring for diff output.
  - [ ] Wrap in a Panel with a header showing the filename.
- [ ] Integration: Update `MainLoop.cs` to show Diff Explorer
  - [ ] Add `isDiffOverlayActive` and `currentDiffContent` state.
  - [ ] Trigger on `Enter`/`D` in staging view.
- [ ] Verification & Testing
  - [ ] Manual verification with various file changes (additions, deletions, modifications).

## Dev Notes
- **Diff Length:** For very long diffs, consider truncating or using a `Canvas` if `Spectre.Console` doesn't automatically handle scrolling in a simple Panel. For MVP, showing the first N lines is acceptable if complexity rises.
- **Combined Diff:** If a file has both staged and unstaged changes, decide whether to show both or just the one relevant to the current section (Staged vs Unstaged). Showing the one relevant to the cursor position is most intuitive.
