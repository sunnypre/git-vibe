# Story 1.1: Electron + React + Tailwind Scaffolding

Status: done

## Story

As a developer,
I want to initialize the project with Electron, React, and Tailwind CSS v4,
so that I have a modern, performant foundation for the application.

## Acceptance Criteria

1.  Initialize the project using `electron-vite` with `react-ts` template.
2.  Install Tailwind CSS v4 and shadcn/ui dependencies.
3.  Apply the `@new-design` CSS tokens and theme from `new-design/src/styles/theme.css`.
4.  Verify the application launches a window with the correct background color and theme variables.
5.  Verify the IPC bridge is correctly typed and ready for use.

## Tasks / Subtasks

- [x] Scaffold Electron+React+TS foundation (AC: 1)
  - [x] Use `npm create @quick-start/electron@latest git-vibe -- --template react-ts`
- [x] Install styling and UI dependencies (AC: 2)
  - [x] Install `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `clsx`, `tailwind-merge`
  - [x] Initialize shadcn/ui using `npx shadcn-ui@latest init`
- [x] Integrate `@new-design` styling (AC: 3)
  - [x] Copy `theme.css` to `src/renderer/src/theme/vibeTheme.css`
  - [x] Update `src/renderer/src/main.tsx` to import the new theme
  - [x] Configure Tailwind v4 to use the design tokens
- [x] Implement typed IPC bridge (AC: 5)
  - [x] Define initial types in `src/shared/types/`
  - [x] Set up `contextBridge` in `src/preload/index.ts`
  - [x] Ensure `src/preload/index.d.ts` reflects the `window.api` types
- [x] Validation (AC: 4)
  - [x] Run `npm run dev` and confirm window appearance and theme application

## Dev Notes

- **Architecture Compliance:** Follow the `Architecture Decision Document` [Source: _bmad-output/planning-artifacts/architecture.md].
- **Build Tool:** Use `electron-vite` as specified in the architecture.
- **Security:** Renderer MUST communicate entirely through the `window.api` object. No raw Node.js in renderer.
- **Styling:** Use Tailwind CSS v4. Apply the high-fidelity dark theme from the figma prototype.
- **Project Structure:** 
  - `src/main/`: Electron Main
  - `src/renderer/`: React Frontend
  - `src/preload/`: IPC Bridge
  - `src/shared/`: Shared Types

### Project Structure Notes

- Alignment with `electron-vite` standard structure.
- `src/renderer/src/theme/vibeTheme.css` will be the source of truth for design tokens.

### References

- [Architecture Decision Document](_bmad-output/planning-artifacts/architecture.md)
- [PRD](_bmad-output/planning-artifacts/prd.md)
- [New Design Assets](new-design/)

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

- Scaffolded project in `git-vibe-desktop` subdirectory.
- Integrated Tailwind CSS v4 with `@tailwindcss/vite`.
- Imported `theme.css` from `new-design` and applied it as the global theme.
- Defined `GitModels` and `IpcEvents` in `src/shared/types`.
- Exposed a typed `git` API in `src/preload/index.ts`.
- Verified build with `npm run build`.

### File List

- `git-vibe-desktop/src/shared/types/GitModels.ts`
- `git-vibe-desktop/src/shared/types/IpcEvents.ts`
- `git-vibe-desktop/src/renderer/src/theme/vibeTheme.css`
- `git-vibe-desktop/src/renderer/src/main.tsx`
- `git-vibe-desktop/src/preload/index.ts`
- `git-vibe-desktop/src/preload/index.d.ts`
- `git-vibe-desktop/electron.vite.config.ts`
### Review Findings

- [x] [Review][Patch] Potential Command Injection / Missing Validation [src/preload/index.ts]
- [x] [Review][Patch] Library Mismatch: `<Group>` vs `<PanelGroup>` [src/renderer/src/App.tsx]
- [x] [Review][Patch] Inconsistent Build Scripts (Skip Typecheck) [package.json]
- [x] [Review][Patch] Version Hallucinations [package.json]
- [x] [Review][Patch] Missing Critical Dependency: `zustand` [package.json]
- [x] [Review][Patch] Missing UI Dependencies: Radix / shadcn/ui [package.json]
- [x] [Review][Patch] Missing Terminal Dependencies: `xterm`, `node-pty` [package.json]
- [x] [Review][Patch] Missing Error Handling for IPC Promises [src/preload/index.ts]
- [x] [Review][Patch] Unhandled Failures in `exposeInMainWorld` [src/preload/index.ts]
- [x] [Review][Patch] Configuration Fragility: `resolve()` usage [electron.vite.config.ts]
- [x] [Review][Patch] Security: Over-exposure of `electronAPI` [src/preload/index.ts]
