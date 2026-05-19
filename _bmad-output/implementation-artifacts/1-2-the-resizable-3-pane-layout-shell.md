# Story 1.2: The Resizable 3-Pane Layout Shell

Status: done

## Story

As a user,
I want a resizable 3-pane layout for my workspace,
so that I can customize the view for file lists, diffs, and the terminal.

## Acceptance Criteria

1. [x] Given a functional React renderer
2. [x] When I implement the PanelGroup for the side-by-side Files/Diff views and the bottom-docked Terminal
3. [x] Then the user can drag the resize handles to change the relative size of each pane
4. [x] And the layout handles window resizing gracefully.

## Tasks / Subtasks

- [x] Install and configure `react-resizable-panels` (AC: 1, 2)
- [x] Implement the horizontal split for Files List and Diff Viewer (AC: 2)
- [x] Implement the vertical split for the main content and the Terminal (AC: 2)
- [x] Add stylized resize handles following the @new-design aesthetics (AC: 3)
- [x] Ensure the layout responds correctly to window resize events (AC: 4)

## Dev Notes

- Use `react-resizable-panels` as specified in the Architecture Decision Document.
- Integrate with `shadcn/ui` theme variables for the handles.
- The layout should be hosted in `src/renderer/src/App.tsx`.
- Terminal pane should be at the bottom.
- Files List (Left) and Diff Viewer (Right) should be in the top section.

### Project Structure Notes

- Modify `src/renderer/src/App.tsx`.
- Create a reusable `ResizeHandle` component in `src/renderer/src/components/ResizeHandle.tsx`.
- Added Vitest and React Testing Library for verification.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-Priority-Analysis]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash

### Debug Log References

### Completion Notes List

- Installed `react-resizable-panels` (v4.11.1).
- Implemented 3-pane layout in `App.tsx`.
- Created `ResizeHandle` component for stylized handles.
- Configured Vitest and added `App.test.tsx`.
- Verified layout rendering with unit tests.

### File List

- src/renderer/src/App.tsx
- src/renderer/src/components/ResizeHandle.tsx
- src/renderer/src/App.test.tsx
- src/renderer/src/test/setup.ts
- vitest.config.ts
- src/renderer/index.html
- package.json

### Review Findings

- [x] [Review][Patch] Invalid `Separator` import in `ResizeHandle.tsx` [git-vibe-desktop/src/renderer/src/components/ResizeHandle.tsx:1]
- [x] [Review][Patch] Hallucinated dependency versions in `package.json` [git-vibe-desktop/package.json]
- [x] [Review][Patch] No-op `ResizeObserver` mock in `setup.ts` [git-vibe-desktop/src/renderer/src/test/setup.ts:4-11]
- [x] [Review][Patch] Missing `__dirname` in `vitest.config.ts` [git-vibe-desktop/vitest.config.ts]
- [x] [Review][Patch] Security risk: CSP allows `unsafe-inline` [git-vibe-desktop/src/renderer/index.html:9]
- [x] [Review][Patch] Panels lack `autoSaveId` [git-vibe-desktop/src/renderer/src/App.tsx:11,13]
- [x] [Review][Patch] Panels can collapse on small windows [git-vibe-desktop/src/renderer/src/App.tsx:14,29,44]
- [x] [Review][Patch] Brittle IPC mock in `setup.ts` [git-vibe-desktop/src/renderer/src/test/setup.ts:18]
- [x] [Review][Patch] Resize handle lacks active dragging state [git-vibe-desktop/src/renderer/src/components/ResizeHandle.tsx:11-13]

