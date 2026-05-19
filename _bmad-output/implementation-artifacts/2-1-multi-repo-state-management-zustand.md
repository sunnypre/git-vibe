# Story 2.1: Multi-Repo State Management (Zustand)

Status: done

## Story

As a developer,
I want a global state that supports multiple repositories,
so that I can switch contexts without losing my workspace state.

## Acceptance Criteria

1.  Initialize the Zustand store in `src/renderer/src/store/useGitStore.ts`.
2.  Implement "Repository Slices" to support multiple independent repository states (tabs).
3.  Support adding a repository path to the store, creating a new slice, and setting it as active.
4.  Support switching between repository slices, updating a global `activeRepoId` and providing the correct active slice to the UI.
5.  Ensure the state persists repository metadata: `path`, `name`, and `currentBranch`.
6.  [Architecture Requirement] Implementation must support "Optimistic Transactions" where UI state can be updated before IPC confirmation (prepared for future stories).

## Tasks / Subtasks

- [x] Setup Zustand environment (AC: 1)
  - [x] Run `npm install zustand` in `git-vibe-desktop`
  - [x] Create `src/renderer/src/store/` directory
- [x] Implement the Git Store logic (AC: 2, 3, 4, 5)
  - [x] Define `GitState` and `GitActions` interfaces in `useGitStore.ts`
  - [x] Implement `repositories` map (ID -> Slice) and `activeRepoId` in state
  - [x] Implement `addRepository(path: string)` action
  - [x] Implement `setActiveRepository(id: string)` action
  - [x] Implement `removeRepository(id: string)` action
- [x] Architecture Alignment (AC: 6)
  - [x] Ensure the store structure is ready for "Optimistic Updates" (state snapshots/rollbacks)
- [x] Integration & Validation
  - [x] Connect `App.tsx` to the store and display the list of open repository names (for testing)

### Review Findings

- [x] [Review][Patch] Path Normalization: `useGitStore` treats `C:/repo` and `C:/repo/` as different repos. [git-vibe-desktop/src/renderer/src/store/useGitStore.ts]
- [x] [Review][Patch] Missing Active Selector: UI components forced to manually resolve `state.repositories[state.activeRepoId]`. [git-vibe-desktop/src/renderer/src/store/useGitStore.ts]
- [x] [Review][Patch] Metadata Initialization: `currentBranch` is hardcoded to `'unknown'`. [git-vibe-desktop/src/renderer/src/store/useGitStore.ts]
- [x] [Review][Patch] Root Path Parsing: `path.split().pop()` returns empty string for root. [git-vibe-desktop/src/renderer/src/store/useGitStore.ts]
- [x] [Review][Patch] Test UI Collision: `App.tsx` "Add Repo" logic uses length as key. [git-vibe-desktop/src/renderer/src/App.tsx]
- [x] [Review][Defer] IPC Type Hacks: Pre-existing pattern from Story 1.1 using `unknown` casts. [git-vibe-desktop/src/preload/index.ts] — deferred, pre-existing

## Dev Notes

- **Zustand v5:** Used Zustand v5. The store uses a Record-based "Repository Slice" pattern to manage multiple repositories independently.
- **Repository Identity:** The absolute path is used as the unique ID for each repository slice.
- **Optimistic Ready:** `RepositorySlice` includes `isRefreshing` and `lastSyncedAt` to support optimistic UI updates and rollbacks. `updateRepositoryState` allows for surgical updates to a specific repo's state.

### Project Structure Notes

- New store file: `git-vibe-desktop/src/renderer/src/store/useGitStore.ts`
- Tests: `git-vibe-desktop/src/renderer/src/store/useGitStore.test.ts`
- Shared types: Updated `git-vibe-desktop/src/shared/types/GitModels.ts` to improve type safety.

### Previous Story Intelligence (Story 1.1)

- **Scaffolding:** The project was scaffolded in `git-vibe-desktop/`. All commands were run in this directory.
- **Styling:** Tailwind CSS v4 and the high-fidelity dark theme are already integrated.
- **IPC:** A typed IPC bridge for `git` operations is partially implemented in `src/preload/index.ts`.
- **MISSING:** `shadcn-ui` components and `zustand` were not installed in Story 1.1 despite the plan. This story DID install `zustand`.

### References

- [Architecture Decision Document](_bmad-output/planning-artifacts/architecture.md)
- [Epics & Stories](_bmad-output/planning-artifacts/epics.md)
- [PRD](_bmad-output/planning-artifacts/prd.md)

## Dev Agent Record

### Agent Model Used

Gemini CLI (bmad-dev-story)

### Debug Log References

- Encountered dependency conflict with `electron-vite` and `vite` during `zustand` installation; resolved with `--legacy-peer-deps`.
- Fixed type error in `App.tsx`: `PanelGroup` uses `direction` instead of `orientation`.
- Addressed lint errors in `src/preload/index.ts` and `src/shared/types/GitModels.ts` by replacing `any` with `unknown`.

### Completion Notes List

- ✅ Initialized Zustand store with multi-repo support.
- ✅ Implemented `addRepository`, `removeRepository`, and `setActiveRepository` actions.
- ✅ Added `updateRepositoryState` to support future optimistic updates.
- ✅ Verified store logic with Vitest (4 tests passing).
- ✅ Integrated store with `App.tsx` tab bar for visual validation.

### File List

- `git-vibe-desktop/src/renderer/src/store/useGitStore.ts` (New)
- `git-vibe-desktop/src/renderer/src/store/useGitStore.test.ts` (New)
- `git-vibe-desktop/src/renderer/src/App.tsx` (Modified)
- `git-vibe-desktop/src/shared/types/GitModels.ts` (Modified)
- `git-vibe-desktop/src/preload/index.ts` (Modified)
- `git-vibe-desktop/package.json` (Modified - dependency added)
- `git-vibe-desktop/package-lock.json` (Modified)
