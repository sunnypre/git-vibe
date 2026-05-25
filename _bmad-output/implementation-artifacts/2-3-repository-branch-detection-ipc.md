# Story 2.3: Repository Branch Detection (IPC)

Status: done

## Story

As a user,
I want to see the active branch name on each repository tab,
So that I know exactly which context I am working in.

## Acceptance Criteria

1.  **IPC Bridge for Branching:**
    - Implement `IPC_EVENTS.GIT.BRANCH` constant.
    - Expose `window.api.git.getCurrentBranch(path)` via the preload bridge.
2.  **Native Git Execution (Main Process):**
    - Create `GitExecutor` service in the Main process to run `git branch --show-current`.
    - Register an IPC handler to invoke the `GitExecutor` and return the branch name.
3.  **State Integration:**
    - Update `useGitStore.ts` to include a `refreshBranch(id)` action.
    - Automatically trigger `refreshBranch` when a repository is added or set as active.
    - Handle loading and error states for branch detection.
4.  **UI Feedback:**
    - Display the detected branch name in the repository tabs (already structured in Story 2.2).
    - Handle "Detached HEAD" states by showing the short commit hash (e.g., `(Detached at a1b2c3d)`).

## Developer Context

### Architecture Compliance
- **Main/Renderer Boundary:** Strictly enforced via IPC. `GitExecutor` lives in Main; `useGitStore` lives in Renderer.
- **Git Integration:** Direct `child_process` wrapper used, avoiding heavy libraries like `simple-git`.
- **Typed IPC:** `IpcResponse` pattern followed for all cross-process communication.

### Implementation Notes
- **GitExecutor:** Implemented as a singleton in `src/main/services/GitExecutor.ts`.
- **IPC Handlers:** Centralized registration in `src/main/ipcHandlers.ts`.
- **Detached HEAD:** Handled by falling back to `git rev-parse --short HEAD` if `--show-current` returns nothing.

### Files Modified/Created
- `git-vibe-desktop/src/shared/types/IpcEvents.ts` (Modified)
- `git-vibe-desktop/src/preload/index.ts` (Modified)
- `git-vibe-desktop/src/preload/index.d.ts` (Modified)
- `git-vibe-desktop/src/main/services/GitExecutor.ts` (New)
- `git-vibe-desktop/src/main/ipcHandlers.ts` (New)
- `git-vibe-desktop/src/main/index.ts` (Modified)
- `git-vibe-desktop/src/renderer/src/store/useGitStore.ts` (Modified)
- `git-vibe-desktop/src/renderer/src/store/useGitStore.test.ts` (Modified)

## Technical Requirements
- Sub-100ms branch detection for small-to-medium repos.
- Accurate handling of detached HEAD states.
- Error resilience if Git is missing or path is invalid.

## Previous Story Intelligence (Story 2.2)
- Tab UI was already showing `(repo.currentBranch)`, so wiring the logic was sufficient for visual updates.

## Project Context Reference
- See `_bmad-output/planning-artifacts/architecture.md` for the "Serial Command Queue" and "Git Service Boundary" definitions.

## Completion Status
- [x] Define `IPC_EVENTS.GIT.BRANCH`.
- [x] Implement `GitExecutor.ts` with `getCurrentBranch`.
- [x] Register IPC handlers in `ipcHandlers.ts`.
- [x] Wire handlers into `main/index.ts`.
- [x] Expose `getCurrentBranch` in `preload/index.ts`.
- [x] Implement `refreshBranch` action in `useGitStore.ts`.
- [x] Update `addRepository` and `setActiveRepository` to trigger refresh.
- [x] Verify with unit tests in `useGitStore.test.ts`.

## Dev Agent Record

### Implementation Plan
- Created the foundational `GitExecutor` service in the main process to handle all native Git interactions.
- Established a centralized `registerIpcHandlers` pattern in the main process to maintain clean boundaries.
- Updated the Zustand store to be "branch-aware," ensuring that every time a user switches tabs or adds a repo, the branch status is refreshed from the source of truth.
- Mocked the Electron IPC in Vitest to ensure the store logic remains robust even without a running Electron environment.

### Debug Log
- Note: `git branch --show-current` requires Git 2.22+. Added fallback logic to handle older Git or detached HEAD states using `rev-parse`.
- Verified that normalizing paths to lowercase in the store keys correctly matches repo instances across different OS path formats.

### Completion Notes
- The application now has a functional backend bridge to Git.
- Branch names update automatically in the UI.
- All 10 store/UI tests are passing.
