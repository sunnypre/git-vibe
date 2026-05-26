# Story: 3-3-high-contrast-diff-viewer

## Header
**Story ID:** 3.3
**Story Key:** 3-3-high-contrast-diff-viewer
**Title:** High-Contrast Diff Viewer
**Epic:** 3 - Surgical Staging Workspace (Files & Diffs)
**Status:** ready-for-dev
**Priority:** High

## Requirements
**User Story:**
As a user,
I want to view a clear diff of my changes for the selected file,
So that I can verify my work before staging.

**Acceptance Criteria:**
- **Given** a file is selected in the file list
- **When** the system fetches the diff content
- **Then** the right pane displays the diff with clear line-level highlighting for additions and deletions
- **And** the diff reflects the correct comparison:
  - If unstaged changes: `git diff -- <file>`
  - If staged changes: `git diff --cached -- <file>`
  - If untracked: `git diff --no-index /dev/null <file>` (simulated as all additions)
- **And** the UI uses the semantic colors:
  - Addition Background: `#1e4620`
  - Deletion Background: `#4b1818`
- **And** the viewer uses a Monospace font for precise alignment.
- **And** the update happens in under 50ms upon file selection.
## Tasks / Subtasks
- [x] Shared: Update `IpcEvents.ts` and `GitModels.ts`
  - [x] Add `DIFF: 'git:diff'` to `IPC_EVENTS.GIT`
  - [x] Add `GitDiffLine` and `GitDiff` interfaces to `GitModels.ts`
- [x] Main: Update `GitExecutor.ts`
  - [x] Implement `getDiff(repoPath, filePath, options)`
  - [x] **Technical Strategy:**
    - If untracked: `git diff --no-index /dev/null <file>`
    - If staged: `git diff --cached -- <file>`
    - If unstaged: `git diff -- <file>`
  - [x] Ensure command is queued via `this.queueCommand(() => ...)` to reuse serial execution
- [x] Main: Register IPC Handler
  - [x] Handle `IPC_EVENTS.GIT.DIFF` in `ipcHandlers.ts`
- [x] Preload: Expose `git.getDiff`
  - [x] Update `src/preload/index.ts` to include `getDiff`
- [x] Renderer Store: Update `useGitStore.ts`
  - [x] Add `selectedFilePath` and `diffContent` (array of `GitDiffLine`) to `RepositorySlice`
  - [x] Add `selectFile(id, path)` action that updates selection and triggers `getDiff`
  - [x] Implement `getDiff(id, path)` action with loading states
- [x] UI: Create `DiffViewer.tsx`
  - [x] Implement line-by-line rendering of diff content
  - [x] Apply semantic colors and monospace typography
  - [x] Use `ScrollArea` for smooth scrolling
- [x] UI: Update `FileList.tsx` and `FileRow.tsx`
  - [x] Bind row click to `selectFile` action
  - [x] Ensure visual "selected" state in `FileRow` (using established theme blue border)
- [x] Validation: Testing & Verification
  - [x] Unit tests for diff parsing in `GitExecutor`
  - [x] Verify diff updates correctly for Staged, Unstaged, and Untracked files

## Developer Context
...
## File List
- `git-vibe-desktop/src/shared/types/IpcEvents.ts` (Modified)
- `git-vibe-desktop/src/shared/types/GitModels.ts` (Modified)
- `git-vibe-desktop/src/main/services/GitExecutor.ts` (Modified)
- `git-vibe-desktop/src/main/services/GitExecutor.test.ts` (Modified)
- `git-vibe-desktop/src/main/ipcHandlers.ts` (Modified)
- `git-vibe-desktop/src/preload/index.ts` (Modified)
- `git-vibe-desktop/src/preload/index.d.ts` (Modified)
- `git-vibe-desktop/src/renderer/src/store/useGitStore.ts` (Modified)
- `git-vibe-desktop/src/renderer/src/features/Staging/DiffViewer.tsx` (Created)
- `git-vibe-desktop/src/renderer/src/features/Staging/FileRow.tsx` (Modified)
- `git-vibe-desktop/src/renderer/src/App.tsx` (Modified)

## Change Log
- 2026-05-25: Created story for High-Contrast Diff Viewer implementation.
- 2026-05-25: Completed implementation and validation.

## Status
review

- `GitExecutor` has `queueCommand` and robust execution logic using `execFileAsync`.
- `useGitStore` manages multiple repositories but lacks selection/diff state.
- `FileRow` is functional but selection doesn't trigger anything yet.

**Technical Guardrails:**
- **Reuse Pattern:** DO NOT reinvent the command execution logic. Use `GitExecutor.getInstance().execute` and wrap it in `queueCommand`.
- **Performance:** Diff fetching must not block the UI. Use `isLoading` state in the store to show a placeholder.
- **Accuracy:** Diff comparison must be correct based on whether the file is staged or unstaged.
- **Security:** Use `execFile` arguments (already handled by `GitExecutor.execute`) to prevent path injection.

**Anti-Patterns to Avoid:**
- **Raw IPC:** Never use `ipcRenderer.invoke` directly in components; use the `api` exposed via preload.
- **Manual State:** Don't use local `useState` for diff content; it must live in the Zustand store to survive tab switching.
- **Index Mutation:** Avoid commands that modify the index (like `git add -N`) just to show a diff.

## Success Criteria (How to know you are done)
1. Clicking any file in the list updates the Diff Viewer in <50ms.
2. Staged files show their diff against HEAD.
3. Unstaged files show their diff against the index.
4. Untracked files show their entire content as additions.
5. All diff lines are monospaced and correctly color-coded.
6. Switching repository tabs preserves the selected file and its diff view.

## Architecture Compliance
- **Strict IPC:** All diff data must flow through the typed IPC bridge.
- **Serial Queue:** `getDiff` must be queued to avoid lock issues if other git commands are running.
- **Optimistic UI:** While the diff itself can't be optimistic, the *selection* state should be.

## Library & Framework Requirements
- **Zustand v5:** For state persistence.
- **Lucide React:** For any diff-related icons.
- **Tailwind CSS v4:** For high-contrast styling.
- **Radix UI:** Use `ScrollArea` for the diff content.

## File Structure Requirements
- **Main:** `src/main/services/GitExecutor.ts`, `src/main/ipcHandlers.ts`.
- **Preload:** `src/preload/index.ts`.
- **Renderer Store:** `src/renderer/src/store/useGitStore.ts`.
- **Renderer UI:** `src/renderer/src/features/Staging/DiffViewer.tsx`.

## Project Context Reference
- See `_bmad-output/planning-artifacts/architecture.md` for IPC and Git patterns.
- See `_bmad-output/planning-artifacts/ux-design-specification.md` for diff colors and monospace requirements.

## Change Log
- 2026-05-25: Created story for High-Contrast Diff Viewer implementation.
