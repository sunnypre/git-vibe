---
title: 'Story 5.6: Compact Layout & Robust Scrolling Refinement'
type: 'refactor'
created: '2026-05-18'
status: 'done'
baseline_commit: '61dfe938106e4ada1786c042c88cdbe7b551dfaf'
context: []
---

## Intent

**Problem:** The UI is currently "boxy" and nested, wasting terminal space on multiple layers of double borders. This leaves less room for content. Furthermore, the scrolling logic in `MainLoop` is "blind" to headers like "STAGED" and "UNSTAGED", causing items to be cut off or headers to scroll off-screen unexpectedly.

**Approach:** Simplify the layout by removing redundant outer panels and alignment, maximizing usable area. Refactor `StagingView` and `BranchingView` to handle internal scrolling logic that accounts for all rendered rows (headers, files, empty lines), ensuring the selected item is always visible and the layout feels professional and compact.

## Boundaries & Constraints

**Always:**
- Keep the UI responsive to terminal resizing.
- Ensure the selected item is always visible within the `pageSize`.
- Maintain semantic color-coding (Green for staged, etc.).

**Ask First:**
- If removing the "Action" panel border entirely (leaving only the Sidebar border) is preferred for even more space.

**Never:**
- Remove the Status Bar or active branch indicator.
- Introduce horizontal scrolling for file paths (truncate or wrap instead).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Large File List | 50+ changed files | Selected file is always visible; headers "STAGED"/"UNSTAGED" appear when their section is reached. | N/A |
| Tiny Window | 40x5 terminal | "Terminal Too Small" guard remains active. | N/A |
| Empty Repo | No changes | "No changes detected" message is centered in the action pane. | N/A |

## Code Map

- `Features/Shared/MainLoop.cs` -- Root layout orchestration and input handling.
- `Features/Staging/StagingView.cs` -- File list rendering and scroll calculation.
- `Features/Branching/BranchingView.cs` -- Branch list rendering and scroll calculation.
- `Features/Shared/StatusBarView.cs` -- Legend rendering.

## Tasks & Acceptance

**Execution:**
- [x] `Features/Shared/MainLoop.cs` -- Remove outer `Panel` and `Align`. Adjust `pageSize` to account for fewer borders.
- [x] `Features/Staging/StagingView.cs` -- Refactor `Render` to calculate `scrollOffset` internally if not provided, or ensure `MainLoop` passes a header-aware offset.
- [x] `Features/Branching/BranchingView.cs` -- Refactor `Render` to calculate `scrollOffset` internally if not provided.
- [x] `Tests/StagingViewTests.cs` -- Update/Add tests for header-aware scrolling.
- [x] `Tests/BranchingViewTests.cs` -- Update/Add tests for header-aware scrolling.

**Acceptance Criteria:**
- Given a terminal window with many files, when navigating to the last file, it is fully visible at the bottom of the Action pane.
- Given the compact layout, the Sidebar and Action panes use more available horizontal and vertical space than the previous "nested panel" version.
- Given a view switch (Tab), the selection and scroll state are handled gracefully for the new view.

## Design Notes

**Compact Layout Proposal:**
Instead of `Panel(rootLayout).Border(Double)`, use `rootLayout` directly.
The `Sidebar` can be a `Panel` with `BoxBorder.None` or a simple `Rule` divider.
The `Action` pane keeps `BoxBorder.Double` (or `Square`) but fills the remaining height.

**Header-Aware Scrolling:**
The `View` classes will now expose a `GetTotalRows()` method or similar, OR the `MainLoop` will stop trying to calculate `scrollOffset` and instead pass the `selectedIndex` and `pageSize`, letting the `View` render the appropriate "window".
