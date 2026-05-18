---
title: 'Story 5.7: Unified Staging View & Master Select'
type: 'bugfix'
created: '2026-05-18'
status: 'in-progress'
baseline_commit: '61dfe938106e4ada1786c042c88cdbe7b551dfaf'
context: ['_bmad-output/implementation-artifacts/epic-5-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The staging view displays files in two separate sections (STAGED/UNSTAGED), causing partial changes to appear twice and the selection cursor to jump unpredictably when toggling. Additionally, the checkbox indicator is hard to read when a row is selected because the selection background color is applied to the checkbox column.

**Approach:** Unify the staging list into a single collection where each file appears once. Use a checkbox `[x]` to indicate staged state and `[ ]` for unstaged/untracked. Implement a "Master Select" hotkey ('A') that toggles between staging all changes and unstaging everything. Refine the selection highlighting to exclude the checkbox column for better readability.

## Boundaries & Constraints

**Always:**
- Keep the "Surgical Toggle" (Space) response time sub-50ms.
- Maintain semantic color-coding (Green for staged, etc.).
- Ensure renames and files with spaces are handled correctly.
- **NEW:** Ensure the unified list has a stable sort (by path) to prevent visual jumping when file status changes.

**Ask First:**
- N/A

**Never:**
- Do not remove the search/filtering capability.
- Do not regress on scrolling performance.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toggle Unstaged | Unstaged file [ ] | `git add` -> [x] | Display ErrorOverlay on failure |
| Toggle Staged | Staged file [x] | `git reset HEAD --` -> [ ] | Display ErrorOverlay on failure |
| Master Select (Some Unstaged) | Press 'A', mixed state | `git add -A` -> All [x] | Display ErrorOverlay on failure |
| Master Select (All Staged) | Press 'A', all [x] | `git reset` -> All [ ] | Display ErrorOverlay on failure |
| Selection UX | Row selected | Checkbox column has no background highlight | N/A |

</frozen-after-approval>

## Code Map

- `Core/Models/GitFile.cs` -- Contains status parsing and helper properties like `IsStaged`.
- `Features/Staging/StagingView.cs` -- Renders the staging list. Needs to ensure `GetSelectedRowIndex` is correctly aligned with unified view.
- `Features/Shared/MainLoop.cs` -- Handles input and coordinates with `GitService`. Needs 'A' key implementation and stable sorting.
- `Infrastructure/Git/GitService.cs` -- Executes git commands. `UnstageAllAsync` is used for 'A' key (unstaging).
- `Tests/StagingViewTests.cs` -- Needs update to match the unified view logic.

## Tasks & Acceptance

**Execution:**
- [x] `Features/Shared/MainLoop.cs` -- Add `.OrderBy(i => i.File.Path)` to the `viewItems` construction to ensure stable ordering. Implement `ConsoleKey.A` logic: if any file is unstaged or untracked, run `git add -A`; otherwise run `git reset`.
- [x] `Tests/StagingViewTests.cs` -- Refactor tests to remove references to "STAGED"/"UNSTAGED" headers and update `GetSelectedRowIndex` expectations to be 1:1 with `selectedIndex`.
- [x] `Features/Staging/StagingView.cs` -- (Cleanup) Verify `GetSelectedRowIndex` and `GetTotalRows` are accurately reflecting the single-list nature of the view.

**Acceptance Criteria:**
- Given a repository with both staged and unstaged files, when I view the staging dashboard, then all files appear in a single list without duplication.
- Given a row is selected, when I toggle it with Space, then the cursor remains on the same file without jumping.
- Given some files are unstaged, when I press 'A', then all changes are staged.
- Given all files are staged, when I press 'A', then all changes are unstaged.

## Verification

**Commands:**
- `dotnet test` -- expected: All tests pass, including updated StagingView tests.

**Manual checks:**
- Verify that toggling a file doesn't cause the cursor to jump or the list to reorder unexpectedly.
- Verify 'A' stages all files, including untracked ones.
