---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
releaseMode: phased
classification:
  projectType: desktop_app
  domain: developer_tool
  complexity: low-medium
  projectContext: brownfield_pivot
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief.md
  - _bmad-output/planning-artifacts/product-brief.distillate.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-desktop-pivot.md
documentCounts:
  briefCount: 2
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
workflowType: 'prd'
lastEdited: 'tisdag 19 maj 2026'
editHistory:
  - date: 'tisdag 19 maj 2026'
    changes: 'Pivot from C# TUI to Electron + React Desktop GUI. Added multi-repo tabs, draggable panels, and integrated terminal. Removed TUI legacy requirements. Specified native Node.js child_process for Git interaction.'
---

# Product Requirements Document - git-vibe

**Author:** sunny
**Date:** tisdag 19 maj 2026

## Executive Summary

GitVibe is a lightweight, cross-platform desktop "Git Command Center" designed for developers who require a surgical, visual approach to staging and branch management without the bloat of traditional IDE integrations or heavy GUI applications. It provides a high-fidelity interactive experience that bridges the gap between raw CLI power and visual confidence. GitVibe is built as a **Hybrid Desktop App**, allowing for seamless multi-repository management and a flexible, draggable workspace.

### What Makes This Special

GitVibe differentiation lies in its **High-Velocity Surgical Interface**. Unlike other Git GUIs, it prioritizes a "keyboard-first, visual-always" philosophy. It features a unique tabbed repository system, resizable panels for custom workflows, and an integrated terminal. By wrapping the native Git CLI directly via Node.js (without high-level third-party abstractions like simple-git), it ensures maximum reliability and a 1:1 relationship with the developer's local environment.

## Project Classification

*   **Project Type:** Desktop Application (Electron)
*   **Domain:** Developer Tools
*   **Complexity:** Medium (UI/UX Intensive, Process Management)
*   **Project Context:** Brownfield Pivot (Electron + React + TypeScript + Zustand)

## Success Criteria

### User Success
*   **Multi-Repo Mastery:** Users can switch between and manage multiple active repositories instantly via a tabbed interface.
*   **Surgical Confidence:** Users report 100% certainty in staging mixed status changes through explicit visual checkboxes and side-by-side diffs.
*   **Workflow Flow:** Developers maintain their productivity without leaving the app, utilizing the integrated terminal for edge-case CLI tasks.

### Business Success
*   **Primary Tool Adoption:** The tool becomes the primary Git interface for the author, replacing VS Code's Git UI and manual terminal staging for 100% of daily tasks.
*   **Cross-Platform Performance:** Sub-500ms startup and sub-50ms UI latency on both Windows and macOS.

### Technical Success
*   **Native Integrity:** 100% accuracy in Git execution by wrapping native `git` commands via `child_process`.
*   **State Reliability:** Zustand state remains perfectly in sync with the file system after any manual or automated mutation.
*   **Clean Dependency Tree:** Minimization of third-party libraries, using only trusted frameworks (Electron, React, Radix, Zustand, xterm.js).

### Measurable Outcomes
*   **Multi-Repo Switching:** Switch between repository contexts in under 100ms.
*   **Staging Cycle:** Complete a "Stage -> Commit -> Push" cycle in under 10 seconds.

## Product Scope & Roadmap

### MVP - Minimum Viable Product (Phase 1)
*   **Tabbed Dashboard:** Manage multiple open repositories in a single window.
*   **Draggable Layout:** Resizable panels for File List, Diff Explorer, and Terminal using `react-resizable-panels`.
*   **Surgical Staging:** Multi-select file list with explicit checkboxes and semantic status colors.
*   **Diff Explorer:** High-contrast diff viewer for selected files.
*   **Integrated Terminal:** Full-featured terminal powered by `xterm.js` for raw CLI access.
*   **Commit Flow:** Dedicated commit panel with multi-line support and push-after-commit prompts.
*   **Native Backend:** Node.js backend executing native Git commands via `child_process`.

### Growth Features (Phase 2)
*   **Branch Management:** Visual branch explorer with interactive merge/rebase triggers.
*   **Stash Visualizer:** Visual management of the Git stash.
*   **Search & Filter:** Real-time fuzzy search across large file lists.

### Vision (Phase 3)
*   **Conflict Resolution:** Interactive 3-way merge UI.
*   **Custom Themes:** Support for user-defined CSS themes and hotkey mappings.

## User Journeys

### Journey 1: The Multi-Tasker (Primary Success Path)
**Persona:** Alex, working on three related microservices.
**Narrative:** Alex opens GitVibe with three tabs active. He makes a change in `service-a`, stages it surgically in the left panel, and commits. He immediately tabs over to `service-b`, checks the diff of a modified file to verify a logic change, and uses the integrated terminal at the bottom to run a quick `git stash`. He switches back and forth with zero latency.

### Journey 2: The Surgical Diff Review
**Persona:** Alex, reviewing a complex refactor.
**Narrative:** Alex selects a file with 50+ changes. He drags the Diff Explorer panel to take up 70% of the screen. He scrolls through the side-by-side diff, toggles the staging checkbox, and sees the "Total Staged" counter update instantly. He feels 100% confident before hitting the commit hotkey.

## Project-Type Requirements (Desktop App)

### Technical Architecture
*   **Process Model:** Electron Main (Node.js) for Git/File System access; Electron Renderer (React) for the UI.
*   **Communication:** Strict IPC (Inter-Process Communication) with typed bridges.
*   **Git Integration:** Direct execution of `git` commands via `child_process.exec` or `spawn`.
*   **Terminal Implementation:** `xterm.js` integration for the bottom-docked terminal pane.

### Implementation Specifics
*   **Styling:** Tailwind CSS (v4) with Radix UI primitives for accessible components.
*   **State Management:** Zustand for global frontend state (active repo, file list, selection).
*   **Draggable UI:** `react-resizable-panels` for the primary layout orchestration.

## Functional Requirements

### Repository & Tabs
*   **FR1:** System can manage multiple Git repository instances simultaneously via tabs.
*   **FR2:** Users can add a new repository by selecting a local folder.
*   **FR3:** Users can close repository tabs independently.
*   **FR4:** System detects and displays the active branch for each tab.

### Staging & Diff
*   **FR5:** Users can view a list of all Staged, Unstaged, and Untracked files.
*   **FR6:** Users can toggle individual staging state via explicit checkboxes or keyboard (Space).
*   **FR7:** Users can view a high-contrast diff of the selected file in a dedicated panel.
*   **FR8:** System provides semantic color-coding (Added, Modified, Deleted).

### Workspace & Terminal
*   **FR9:** Users can drag and resize the File List, Diff Viewer, and Terminal panels.
*   **FR10:** Users can interact with a functional terminal docked at the bottom of the interface.
*   **FR11:** Terminal state is unique to the active repository tab.

### Commits & Operations
*   **FR12:** Users can initiate a commit with a multi-line message.
*   **FR13:** System prompts for a remote push after a successful commit.
*   **FR14:** System refreshes the UI state automatically after any Git operation.

## Non-Functional Requirements

### Performance
*   **NFR1:** Repository tab switching shall occur in under 100ms.
*   **NFR2:** File staging toggle UI update shall occur in under 50ms.
*   **NFR3:** Memory usage shall be optimized to stay under 500MB for 3 open repositories.

### Reliability
*   **NFR4:** The UI state shall never diverge from the results of the underlying `git` commands.
*   **NFR5:** Git command failures shall be captured and displayed via a clear error modal.

### Cross-Platform
*   **NFR6:** The application shall run and behave consistently on Windows (10/11) and macOS (Intel/Apple Silicon).
*   **NFR7:** System shall bundle its own styling and icons, requiring no external font installation.
