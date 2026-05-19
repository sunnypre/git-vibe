---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
workflowType: 'architecture'
project_name: 'git-vibe'
user_name: 'sunny'
date: 'tisdag 19 maj 2026'
lastStep: 8
status: 'complete'
completedAt: 'tisdag 19 maj 2026'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system requires a robust multi-repository management system via tabs and a highly interactive "Surgical Staging" interface. Architecturally, this necessitates a clean separation between the Electron Main process (Node.js/Git logic) and the Renderer process (React/Zustand), connected by a secure, typed IPC bridge.

**Non-Functional Requirements:**
Performance is paramount, with strict targets for tab switching (<100ms) and UI responsiveness (<50ms). Reliability is critical to ensure the GUI state never diverges from the Git disk state. Cross-platform consistency across Windows and macOS is a baseline requirement.

**Scale & Complexity:**
- Primary domain: Desktop Application (Electron)
- Complexity level: Medium
- Estimated architectural components: 6 (Electron Main, IPC Bridge, Git Service, Terminal Service, React Renderer, Zustand Store)

### Technical Constraints & Dependencies

- **Platform:** Electron (Main + Renderer).
- **Frontend:** React 18, Zustand, Radix UI, Tailwind CSS.
- **Terminal:** `xterm.js`.
- **Constraint:** Direct Git CLI wrapper via native `child_process` (No `simple-git`).

### Cross-Cutting Concerns Identified

- **IPC Communication:** Secure and performant data transfer between processes.
- **Native Process Orchestration:** Managing long-running Git processes and terminal streams.
- **State Synchronization:** Keeping multiple repository snapshots in sync with the file system.

## Starter Template Evaluation

### Primary Technology Domain

Desktop Application (Electron) based on project requirements analysis.

### Selected Starter: `electron-vite` (Official CLI) + Material UI v6

**Rationale for Selection:**
We will use the official `electron-vite` tool for the robust platform foundation (Main/Renderer separation and fast build times). Instead of the Shadcn/Radix components from the Figma sketch, we will implement the layout using **Material UI (MUI) v6**. This provides a more comprehensive, pre-styled component library that is industry-standard for enterprise-grade tools, while still giving us the flexibility to achieve the specific multi-pane layout from your design.

**Initialization Command:**

```bash
# 1. Scaffold the Electron+React+TS foundation
npm create @quick-start/electron@latest git-vibe-desktop -- --template react-ts

# 2. Install Material UI v6 and dependencies
cd git-vibe-desktop
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/roboto
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5+ for strict typing across processes.

**UI Component Library:**
- **Material UI (MUI) v6:** Primary library for buttons, tabs, inputs, and layouts.
- **Theming:** We will use MUI's `ThemeProvider` to define a "GitVibe Dark Theme" (using the colors from your design).

**Build & Infrastructure:**
- **Vite:** For near-instant UI updates during development.
- **Electron-Builder:** For creating installers for Windows and Mac.

**Code Organization:**
- `src/main/`: Native Git logic (using Node.js `child_process`).
- `src/renderer/`: React frontend with MUI components.
- `src/preload/`: Safe IPC bridge.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Platform Architecture:** Electron (Main/Renderer) with a typed IPC Bridge.
- **Git Integration:** Native `child_process` wrapper with a **Serial Command Queue** in the Main process.
- **State Management:** **Zustand v5** with an **Optimistic Transaction** pattern.

**Important Decisions (Shape Architecture):**
- **Terminal Emulation:** `xterm.js` + `node-pty` (in Main process).
- **UI Framework:** Material UI (MUI) v6 with a centralized Dark Theme.

**Deferred Decisions (Post-MVP):**
- **Packaging/Distribution:** Final installer configurations for Windows/Mac.
- **Analytics/Logging:** Remote crash reporting.

### Communication & Git Integration

- **Serial Command Queue:** All Git mutation commands (`add`, `reset`, `commit`) are executed sequentially in the Main process to prevent `.git/index.lock` collisions.
- **Optimistic Updates:** The UI (Zustand) updates immediately upon user action. A "pending" state is maintained until the Main process confirms success.
- **Rollback Mechanism:** If a Git command fails, the Main process sends a typed IPC event to the Renderer to trigger a state rollback and error notification.
- **IPC Bridge:** Strictly typed interface defined in `src/preload/`. No raw string-based IPC calls allowed in the Renderer.

### Frontend Data Architecture

- **Zustand Store:** A single store with "Repository Slices" to manage multiple active repository states (tabs).
- **State Synchronization:** Action-driven background refreshes after any Git operation + window focus-based refresh.
- **Terminal Service:** A specialized service in the Main process to manage PTY (Pseudo-Terminal) sessions for the integrated terminal.

### Reliability & Performance

- **Non-Blocking UI:** Heavy Git operations never block the React rendering thread.
- **Memory Optimization:** Repository state snapshots are kept lean, storing only necessary metadata for the surgical staging view.
- **Fallback:** Manual "Hard Refresh" (Hotkey `R`) to re-sync with disk state in case of divergence.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Code Naming Conventions:**
- **React Components:** PascalCase (e.g., `RepoTabs.tsx`).
- **Hooks & Utilities:** camelCase (e.g., `useGitStore.ts`).
- **Zustand Actions:** Descriptive verb-first camelCase (e.g., `stageFile()`, `commitChanges()`).

**IPC Naming Conventions:**
- **Format:** `context:action`.
- **Examples:** `git:status`, `git:add`, `terminal:write`, `window:minimize`.

### Structure Patterns

**File Structure Patterns:**
- **Feature-Based UI:** React components should be grouped by feature rather than type (e.g., `src/renderer/src/features/Staging/`).
- **Centralized Types:** Shared interfaces between Main and Renderer MUST live in a shared directory (e.g., `src/shared/types/`).

### Format Patterns

**API Response Formats (IPC Results):**
- All IPC handlers in the Main process MUST return a consistent result object:
  ```typescript
  { 
    success: boolean; 
    data?: any; 
    error?: string; 
  }
  ```

### Process Patterns

**Git Execution Pattern:**
- A singleton `GitExecutor` class in the Main process handles all `child_process.spawn` interactions. It must ensure appropriate UTF-8 encoding and robust stderr capturing.

**State Update Patterns:**
- Zustand actions must use the "Single Action Function" pattern (no reducers/dispatchers). Optimistic updates must be paired with an asynchronous `.catch()` to rollback state on IPC failure.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use the typed `window.api` for IPC calls; never use raw `ipcRenderer.invoke`.
- Never bypass the `GitExecutor` when interacting with the file system.
- Ensure all React components use MUI v6 components or styled native elements that follow the theme variables.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
git-vibe/
├── package.json
├── electron.vite.config.ts  # Unified build config for Main/Preload/Renderer
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── build/                   # Output for packaged executables (.exe, .dmg)
├── out/                     # Compiled JS during development
├── src/
│   ├── main/                # [NODE.JS BACKEND]
│   │   ├── index.ts         # App lifecycle & Window management
│   │   ├── ipcHandlers.ts   # Registers listeners for renderer requests
│   │   ├── services/
│   │   │   ├── GitExecutor.ts # child_process spawn logic & error handling
│   │   │   └── PtyService.ts  # node-pty integration for the terminal
│   │   └── utils/
│   │       └── lockCheck.ts
│   │
│   ├── preload/             # [IPC BRIDGE]
│   │   ├── index.ts         # contextBridge exposure
│   │   └── index.d.ts       # Global Window types for TypeScript
│   │
│   ├── shared/              # [SHARED TYPES]
│   │   ├── types/
│   │   │   ├── GitModels.ts # e.g., GitFile, GitBranch interfaces
│   │   │   └── IpcEvents.ts # Event name constants
│   │
│   └── renderer/            # [REACT FRONTEND]
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx     # React DOM render & ThemeProvider wrapper
│       │   ├── App.tsx      # Main Layout orchestrator
│       │   ├── store/       # Zustand State
│       │   │   └── useGitStore.ts # Multi-repo slice logic
│       │   ├── features/    # UI Components
│       │   │   ├── Staging/
│       │   │   │   ├── FileList.tsx
│       │   │   │   └── DiffViewer.tsx
│       │   │   ├── Branches/
│       │   │   ├── Terminal/
│       │   │   │   └── XTermWrapper.tsx
│       │   │   └── Core/
│       │   │       ├── RepoTabs.tsx
│       │   │       └── StatusBar.tsx
│       │   ├── theme/       # MUI v6 Configuration
│       │   │   └── vibeTheme.ts
│       │   └── assets/      # Icons, Fonts
```

### Architectural Boundaries

**IPC Boundary (The Bridge):**
The **Renderer** (`src/renderer`) CANNOT require Node.js modules (like `child_process` or `fs`). It MUST communicate entirely through the `window.api` object defined in `src/preload/index.ts`. 

**Git Service Boundary:**
The **Main Process** (`src/main/services/GitExecutor.ts`) acts as the single entry point for all Git commands. It serializes commands, handles UTF-8 output parsing, and formats raw stdout into strongly typed `GitModels` before passing them back over the IPC bridge.

**State Boundary:**
**Zustand** (`src/renderer/src/store/`) is the single source of truth for the UI. React components subscribe to the store, and the store dispatches IPC calls. Components do not call IPC methods directly.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The Electron-Vite starter ensures compatibility between React 18, Vite, and the Electron main process. The decision to use native `child_process` over `simple-git` is fully compatible with Electron's Node integration.

**Pattern Consistency:**
The "Optimistic Transaction" state pattern using Zustand aligns perfectly with the "Serial Command Queue" in the Main process, preventing UI blocking while ensuring data integrity.

**Structure Alignment:**
The strict separation of `src/main/`, `src/preload/`, and `src/renderer/` enforces the security and IPC boundaries defined in our architecture.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- **FR1-FR4 (Tabs):** Supported by Zustand's multi-repo slice architecture.
- **FR5-FR8 (Staging/Diff):** Supported by the React/MUI components and Optimistic UI updates.
- **FR9-FR11 (Workspace/Terminal):** Supported by `react-resizable-panels` and the `xterm.js` integration in the Main process.

**Non-Functional Requirements Coverage:**
- **NFR1-NFR2 (Performance):** Met by offloading Git execution to the Main process and utilizing Zustand for sub-50ms render cycles.
- **NFR4-NFR5 (Reliability):** Addressed by the strict IPC typing and fallback `Hard Refresh` pattern.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical tools (`electron-vite`, React 18, Zustand v5, MUI v6, xterm.js) are explicitly selected and their architectural roles are defined.

**Structure Completeness:**
A comprehensive directory tree, right down to the `GitExecutor.ts` singleton and the specific UI feature folders, has been mapped out.

### Gap Analysis Results

*No critical or important gaps remain.* 

**Minor Gap:** Terminal window resizing events (xterm.js `fit` addon) will require specific IPC debouncing logic during implementation to avoid spamming the Main process, but this is an implementation detail rather than an architectural blocker.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Key Strengths:**
- **Rock-Solid Foundation:** Relying on the official `electron-vite` CLI guarantees a correct IPC/Build setup.
- **Snappy UX:** The "Optimistic Command Queue" pattern guarantees the UI never blocks while Git operations run.
- **Clean Tooling:** Avoiding `simple-git` gives us ultimate control over process streams and error handling.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries (Never call Node.js from Renderer).
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Run the `npm create @quick-start/electron@latest` scaffolding command, install MUI, and merge the Figma React prototype into the `src/renderer/` folder.
