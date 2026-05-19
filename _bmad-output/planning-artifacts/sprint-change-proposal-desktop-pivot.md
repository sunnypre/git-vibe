# Sprint Change Proposal: Pivot to Desktop GUI (Electron + React)

## 1. Issue Summary
**Trigger:** Strategic pivot from a Terminal User Interface (TUI) to a modern Desktop Graphical User Interface (GUI).
**Context:** During implementation of the C# TUI, the vision evolved to require a more rich, accessible, and multi-repository experience that is best served by a web-based desktop framework.
**Evidence:** New design assets provided in `new-design/` featuring a React-based UI with tabs, draggable panels, and advanced layouts.

## 2. Impact Analysis

### Artifact Impact
- **PRD:** **Major Update Required.** Project type changes from CLI Tool to Desktop Application. MVP scope expands to include multi-repository tabs and draggable workspace sections.
- **Architecture:** **Total Rewrite Required.** 
    - **Old:** .NET 10 Console App, Spectre.Console.
    - **New:** Electron (Main Process) + React (Renderer Process) + TypeScript.
    - **State:** Zustand for frontend state management.
    - **Backend:** Node.js `simple-git` or similar for Git operations. Use Typescript for node.
- **Epics & Stories:** **Total Rewrite Required.** All TUI-specific stories are obsolete. New stories are needed for Electron scaffolding, React component implementation, and IPC (Inter-Process Communication) wiring.
- **UX Design:** **Major Update Required.** Transitioning from Spectre.Console "Surgical Overlay" to the new "Tabbed Desktop Dashboard" defined in `NEWDESIGN.png`.

### Technical Impact
- **Language:** Pivot from C# to TypeScript/JavaScript.
- **Runtime:** Pivot from .NET 10 to Node.js/Electron.
- **Build System:** Pivot from MSBuild/NuGet to Vite/pnpm.

## 3. Recommended Approach: Major Replan (Option 3+)
We will treat this as a "Clean Slate" implementation for the UI and Infrastructure while preserving the high-level functional requirements (Staging, Branching, Committing).

**Rationale:**
- **Cross-Platform:** Electron provides the easiest path to a consistent Mac/Windows experience.
- **Velocity:** Using a pure TypeScript stack (React + Node) eliminates the complexity of hybrid C#/Node interop.
- **State Management:** Zustand allows for a clean, decoupled state that can easily scale with the new multi-repo requirements.

## 4. Detailed Change Proposals

### PRD Updates
- Change Project Type to "Desktop Application".
- Add "Multi-Repository Tabs" to MVP.
- Add "Draggable Workspace Panels" to MVP.

### Architecture Updates
- **Stack:** Electron + React 18 + TypeScript 5 + Vite.
- **UI Components:** Radix UI / Shadcn UI (as indicated by `package.json` dependencies).
- **State:** Zustand.
- **Git Wrapper:** `simple-git` (Node.js).

### Story Updates
- **Epic 1 (Scaffolding):** Electron + React + Vite setup.
- **Epic 2 (Core UI):** Implementation of the Tabbed Dashboard and draggable panels.
- **Epic 3 (Git Integration):** Wiring the React UI to the Node.js backend via Electron IPC.
- **Epic 4 (Surgical Staging):** Implementing the staging toggle logic in the new GUI.

## 5. Implementation Handoff
- **Scope:** Major Replan.
- **Recipients:** Product Manager (for PRD), Solution Architect (for new Tech Stack), Developer Agent (for implementation).
- **Next Step:** Update the PRD and Architecture documents to reflect the new Desktop vision.

---
**Approval Required:** Do you approve this Sprint Change Proposal to pivot the project to Electron + React?
