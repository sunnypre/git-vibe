---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - "@new-design/**"
---

# git-vibe - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for git-vibe, decomposing the requirements from the PRD, the @new-design concept, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System can manage multiple Git repository instances simultaneously via tabs.
FR2: Users can add a new repository by selecting a local folder.
FR3: Users can close repository tabs independently.
FR4: System detects and displays the active branch for each tab.
FR5: Users can view a list of all Staged, Unstaged, and Untracked files.
FR6: Users can toggle individual staging state via explicit checkboxes or keyboard (Space).
FR7: Users can view a high-contrast diff of the selected file in a dedicated panel.
FR8: System provides semantic color-coding (Added, Modified, Deleted).
FR9: Users can drag and resize the File List, Diff Viewer, and Terminal panels.
FR10: Users can interact with a functional terminal docked at the bottom of the interface.
FR11: Terminal state is unique to the active repository tab.
FR12: Users can initiate a commit with a multi-line message.
FR13: System prompts for a remote push after a successful commit.
FR14: System refreshes the UI state automatically after any Git operation.

### NonFunctional Requirements

NFR1: Repository tab switching shall occur in under 100ms.
NFR2: File staging toggle UI update shall occur in under 50ms.
NFR3: Memory usage shall be optimized to stay under 500MB for 3 open repositories.
NFR4: The UI state shall never diverge from the results of the underlying git commands.
NFR5: Git command failures shall be captured and displayed via a clear error modal.
NFR6: The application shall run and behave consistently on Windows (10/11) and macOS (Intel/Apple Silicon).
NFR7: System shall bundle its own styling and icons, requiring no external font installation.

### Additional Requirements

- Hybrid Desktop App architecture (Electron Main/Renderer).
- Typed IPC bridge for communication.
- Native Git CLI wrapper using child_process.
- Serial Command Queue in Main process for Git mutations.
- Zustand v5 for state management with optimistic updates.
- xterm.js + node-pty for terminal emulation.

### UX Design Requirements

UX-DR1: Draggable 3-pane layout (Files, Diff, Terminal) using react-resizable-panels.
UX-DR2: Radix-based Tab system for multi-repo context switching.
UX-DR3: Integrated xterm.js terminal implementation at the bottom.
UX-DR4: High-fidelity Dark Theme using the CSS tokens defined in theme.css.

### FR Coverage Map

FR1: Epic 2 - Manage multiple repos via tabs
FR2: Epic 2 - Add repo via local folder selection
FR3: Epic 2 - Close repository tabs
FR4: Epic 2 - Display active branch per tab
FR5: Epic 3 - View file status lists (Staged/Unstaged/Untracked)
FR6: Epic 3 - Toggle staging state (Checkbox/Space)
FR7: Epic 3 - High-contrast diff panel
FR8: Epic 3 - Semantic color-coding for file statuses
FR9: Epic 1 - Resizable 3-pane layout orchestrator
FR10: Epic 4 - Integrated terminal pane
FR11: Epic 4 - Per-tab terminal state persistence
FR12: Epic 4 - Multi-line commit messaging
FR13: Epic 4 - Post-commit push prompts
FR14: Epic 3 - Auto-refresh UI state after operations

## Epic List

### Epic 1: The GitVibe Shell (Foundation & Layout)
Users have a functional desktop application window with the high-fidelity dark theme and the primary resizable 3-pane layout shell (Files, Diff, Terminal).
**FRs covered:** FR9, UX-DR1, UX-DR4.

### Epic 2: Multi-Repo Mastery (Tabbed Dashboard)
Users can open multiple local repositories as tabs, switch between them instantly, and see the active branch for each context.
**FRs covered:** FR1, FR2, FR3, FR4, UX-DR2.
### Story 2.1: Multi-Repo State Management (Zustand)

As a developer,
I want a global state that supports multiple repositories,
So that I can switch contexts without losing my workspace state.

**Acceptance Criteria:**

**Given** the Zustand store is initialized
**When** I add a repository path to the store
**Then** the store creates a new repository slice and sets it as active
**And** switching between slices updates the global "activeRepo" state.

### Story 2.2: The Tabbed Navigation Interface

As a user,
I want to navigate between my repositories using tabs,
So that I can quickly switch contexts while working on multiple projects.

**Acceptance Criteria:**

**Given** multiple repositories in the Zustand store
**When** I click a repository tab
**Then** the UI updates to reflect that repository's context
**And** clicking the "X" on a tab removes it from the store.

### Story 2.3: Repository Branch Detection (IPC)

As a user,
I want to see the active branch name on each repository tab,
So that I know exactly which context I am working in.

**Acceptance Criteria:**

**Given** a repository is added or switched
**When** the Main process executes git branch --show-current
**Then** the active branch name is returned and displayed in the tab UI
**And** the UI handles "detached HEAD" states gracefully.

## Epic 3: Surgical Staging Workspace (Files & Diffs)

Users can visually audit their changes across repositories, toggle individual file staging via checkboxes/hotkeys, and review high-contrast side-by-side diffs.

### Story 3.1: Git Status Parser & File List UI

As a user,
I want to see my changed files categorized by their Git status,
So that I can quickly identify what needs to be staged.

**Acceptance Criteria:**

**Given** an active repository tab
**When** the system parses the porcelain output
**Then** the UI displays a list of files with correct status indicators (M, A, D, ??)
**And** Modified files are Yellow, Added are Green, and Deleted are Red.

### Story 3.2: Surgical Staging Toggle (Add/Reset)

As a user,
I want to toggle the staging state of individual files,
So that I can surgically prepare my next commit.

**Acceptance Criteria:**

**Given** a list of unstaged or staged files
**When** I click a checkbox or press Space on a selected file
**Then** the system executes the corresponding git add or git reset command
**And** the UI updates optimistically within 50ms.

### Story 3.3: High-Contrast Diff Viewer

As a user,
I want to view a clear diff of my changes for the selected file,
So that I can verify my work before staging.

**Acceptance Criteria:**

**Given** a file is selected in the file list
**When** the system fetches the diff content
**Then** the right pane displays the diff with clear line-level highlighting for additions and deletions
**And** the diff reflects the correct comparison (staged vs. HEAD or unstaged vs. index).

### Story 3.4: Auto-Refresh & State Integrity

As a user,
I want my workspace to stay in sync with my file system,
So that I am always working with accurate Git information.

**Acceptance Criteria:**

**Given** external changes are made to the repository
**When** the GitVibe window regains focus or a Git command finishes
**Then** the file list and branch status are automatically refreshed
**And** the UI never diverges from the underlying Git state.

## Epic 4: Command Center (Commits & Terminal)

Users can complete their workflow by drafting multi-line commits, pushing to remotes, and using an integrated terminal for raw CLI tasks.

### Story 4.1: Integrated Terminal (xterm.js + node-pty)

As a developer,
I want an integrated terminal that tracks my active repository,
So that I can run advanced Git commands without leaving the app.

**Acceptance Criteria:**

**Given** the terminal pane is visible
**When** I type commands and press Enter
**Then** the command is executed in a native shell scoped to the active repository's path
**And** the output is rendered in the xterm terminal window.

### Story 4.2: Inline Commit Interface

As a user,
I want a commit input box permanently docked below my file list,
So that I can easily write commit messages immediately after staging files.

**Acceptance Criteria:**

**Given** the File List panel is active
**When** I look at the bottom of that panel
**Then** I see a dedicated text area for the commit message and a "Commit" button
**And** it is pinned to the bottom, remaining visible even when the file list is scrolled
**And** clicking "Commit" executes the commit and clears the input.

### Story 4.3: Post-Commit Push Prompt & Sync

As a user,
I want to be prompted to push after I commit,
So that I don't forget to sync my changes with the remote repository.

**Acceptance Criteria:**

**Given** a successful local commit
**When** the system detects an upstream branch exists
**Then** a prompt/notification appears asking if I want to push
**And** clicking "Push" executes `git push` and updates the UI status.

### Story 4.4: Global Error Handling & Modals

As a user,
I want to see clear error messages if a Git operation fails,
So that I know how to recover from the failure.

**Acceptance Criteria:**

**Given** a Git command (add/commit/push) fails
**When** the Main process catches the stderr or exit code
**Then** an error modal appears in the Renderer with the specific Git error message
**And** the UI state remains stable (no divergent data).


## Epic 1: The GitVibe Shell (Foundation & Layout)

Users have a functional desktop application window with the high-fidelity dark theme and the primary resizable 3-pane layout shell (Files, Diff, Terminal).

### Story 1.1: Electron + React + Tailwind Scaffolding

As a developer,
I want to initialize the project with Electron, React, and Tailwind CSS v4,
So that I have a modern, performant foundation for the application.

**Acceptance Criteria:**

**Given** a clean project directory
**When** I run the scaffolding command and apply the @new-design CSS tokens
**Then** the application launches a window with the correct background color and theme variables
**And** the IPC bridge is correctly typed and ready for use.

### Story 1.2: The Resizable 3-Pane Layout Shell

As a user,
I want a resizable 3-pane layout for my workspace,
So that I can customize the view for file lists, diffs, and the terminal.

**Acceptance Criteria:**

**Given** a functional React renderer
**When** I implement the PanelGroup for the side-by-side Files/Diff views and the bottom-docked Terminal
**Then** the user can drag the resize handles to change the relative size of each pane
**And** the layout handles window resizing gracefully.

