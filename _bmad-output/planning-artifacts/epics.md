---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
workflowType: 'epics-and-stories'
lastStep: 4
status: 'complete'
completedAt: 'onsdag 6 maj 2026'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# git-vibe - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for git-vibe, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System can detect a valid Git repository upon launch.
FR2: Users can view a persistent indicator of the current active branch.
FR3: Users can view real-time Staged, Unstaged, and Untracked status of all files.
FR4: System can automatically refresh state after any Git operation.
FR5: Users can navigate the file list using keyboard inputs.
FR6: Users can toggle individual file staging via Space-bar.
FR7: Users can bulk stage/unstage by status group.
FR8: Users can view a side-by-side or inline diff for any selected file.
FR9: System can display semantic color-coding based on file status (Green/Yellow/Red).
FR10: Users can view a comprehensive list of local and remote branches.
FR11: Users can switch to a selected branch via `Enter`.
FR12: Users can create a new branch via `B` hotkey.
FR13: System can detect and prompt for upstream tracking on new branches.
FR14: Users can view "pushed/unpushed" status indicators for all branches.
FR15: Users can initiate a commit flow via `C` hotkey.
FR16: Users can provide multi-line commit messages.
FR17: System can prompt for a remote push after successful commit.
FR18: Users can execute "raw" Git commands via an integrated command bar.
FR19: System can display standard output and error from raw command execution.
FR20: Users can switch between primary views (Files/Branches) via hotkeys.
FR21: Users can cancel current actions or return to menu via `Escape`.
FR22: Users can view context-sensitive keyboard shortcut guidance.

### NonFunctional Requirements

NFR1: System shall initialize and display the landing menu in under 200ms.
NFR2: UI interaction latency shall be sub-50ms for navigation and toggling.
NFR3: Git status parsing shall complete in under 300ms for repos with 500+ files.
NFR4: TUI state shall never diverge from the actual Git repository state.
NFR5: Git command failures shall be captured and displayed without application crash.
NFR6: Destructive operations shall require explicit user confirmation.
NFR7: System shall explicitly set UTF-8 encoding for icon rendering.
NFR8: Visual styling shall conform to ANSI standards with graceful fallback for limited palettes.
NFR9: System shall delegate all authentication and credential management to the local Git CLI.

### Additional Requirements

- **Starter Template**: Modern .NET 10 CLI Pattern (C# 14, .NET 10.0, Native AOT, `Microsoft.Extensions.Hosting`, `Spectre.Console.Cli`).
- Infrastructure: Vanilla `ProcessStartInfo` with a custom `GitProcess` wrapper in `Infrastructure/Git/`.
- State Management: Snapshot-Based (Manual/Action-Driven Refresh).
- Refresh Pattern: Listen for 'R' key for manual refresh; auto-refresh after mutation commands.
- Naming: `PascalCase` for classes/methods, `_camelCase` for private fields, `View` suffix for renderables.
- Feature-Based Structure: `/Features/Staging/`, `/Features/Branching/`, `/Infrastructure/Git/`, `/Core/State/`.
- Result Pattern: All Git operations return `GitResult` or `Result<T>`.
- Error Handling: Captured non-zero exit codes presented via `ErrorOverlay`.

### UX Design Requirements

UX-DR1: Implement "The Surgical Toggle" interaction (Space toggles state, instant visual feedback).
UX-DR2: High-contrast indicators for staged/unstaged (Explicit checkboxes [ ] / [x]).
UX-DR3: Semantic color system: Green (Staged), Yellow (Modified), Cyan (Added), Red (Deleted).
UX-DR4: Centered "Surgical Overlay" panel-based layout with `BoxBorder.Double`.
UX-DR5: Hybrid Command Overlay (`Shift+G`) with pre-filled `git ` prefix.
UX-DR6: Persistent StatusBar with context-sensitive hotkey legend.
UX-DR7: Multi-pane Layout using `Spectre.Console.Layout` (Navigation Sidebar + Action Pane).
UX-DR8: "Refreshing..." status indicator in footer during snapshot fetch.
UX-DR9: Inline Diff panel with side-by-side or inline view options.
UX-DR10: Interactive list navigation with bold pointer (>) and background highlight for focus.
UX-DR11: Real-time search/filtering in large repos via `/` key.

### FR Coverage Map

FR1: Epic 1 - Git repository detection upon launch.
FR2: Epic 1 - Persistent active branch indicator.
FR3: Epic 1 - Real-time Staged/Unstaged/Untracked file status.
FR4: Epic 1 - Automatic state refresh after operations.
FR5: Epic 1 - Keyboard navigation for file list.
FR6: Epic 1 - Space-bar staging toggle.
FR7: Epic 1 - Bulk staging/unstaging by group.
FR8: Epic 3 - Inline/side-by-side diff viewing.
FR9: Epic 1 - Semantic color-coding for file status.
FR10: Epic 3 - Local and remote branch list view.
FR11: Epic 3 - Switch branches via Enter.
FR12: Epic 3 - Create new branch via 'B' hotkey.
FR13: Epic 3 - Upstream tracking detection and prompts.
FR14: Epic 3 - Pushed/unpushed branch indicators.
FR15: Epic 2 - Initiate commit flow via 'C' hotkey.
FR16: Epic 2 - Multi-line commit message input.
FR17: Epic 2 - Remote push prompt after commit.
FR18: Epic 2 - Raw Git command execution bar.
FR19: Epic 2 - Stdout/Stderr display for raw commands.
FR20: Epic 1 - Files/Branches view switching.
FR21: Epic 1 - Action cancellation/return via Escape.
FR22: Epic 1 - Context-sensitive hotkey legend.

## Epic List

### Epic 1: The Foundation & Surgical Staging (MVP)
Establish the high-performance .NET 10 project and implement the core "Surgical Toggle" staging loop.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR9, FR20, FR21, FR22.

### Epic 2: Commit Flow & Hybrid Power
Implement the ability to commit changes and execute raw Git commands without leaving the TUI.
**FRs covered:** FR15, FR16, FR17, FR18, FR19.

### Epic 3: Seamless Branching & Diff Exploration
Implement full branch management and inline diff viewing for surgical review.
**FRs covered:** FR8, FR10, FR11, FR12, FR13, FR14.

### Epic 4: Scale & Search (Large Repos)
Optimize the experience for large repositories with real-time filtering.
**FRs covered:** FR11 (Refined), UX-DR11.

## Epic 1: The Foundation & Surgical Staging (MVP)

Establish the high-performance .NET 10 project and implement the core "Surgical Toggle" staging loop.

### Story 1.1: Project Scaffolding & Native AOT Setup

As a developer,
I want a modern .NET 10 project structure with Native AOT and DI,
So that I can build a high-performance, maintainable CLI tool with instant startup.

**Acceptance Criteria:**

**Given** a new .NET 10 console application
**When** I configure the .csproj with `PublishAot=true` and add `Spectre.Console` and `Microsoft.Extensions.Hosting`
**Then** the project compiles successfully and produces a self-contained executable
**And** the application initializes the Generic Host and sets `Console.OutputEncoding` to UTF-8.

### Story 1.2: Git Infrastructure & Status Parsing

As a user,
I want the tool to accurately detect and parse my repository's status,
So that I can see exactly which files are staged, modified, or untracked.

**Acceptance Criteria:**

**Given** a valid Git repository
**When** I launch GitVibe
**Then** the system executes `git status --porcelain` using a custom process wrapper
**And** the output is parsed into a list of `GitFile` records
**And** the active branch name is correctly identified.

### Story 1.3: The Surgical Staging Dashboard (MVP Layout)

As a user,
I want a focused, centered dashboard layout with a hotkey legend,
So that I can easily see my repository status and know which keys to press.

**Acceptance Criteria:**

**Given** the application is running
**When** the main view is rendered
**Then** the UI uses a centered Layout with a `Double` border
**And** a Navigation Sidebar and Action Pane are visible
**And** a persistent Status Bar displays the current branch and a hotkey legend (Space, C, B, R, Esc).

### Story 1.4: Interactive Staging Toggle (The "Surgical Toggle")

As a user,
I want to toggle file staging using the space-bar with instant visual feedback,
So that I can surgically prepare my commit without typing file paths.

**Acceptance Criteria:**

**Given** the Staging View is active with a list of changed files
**When** I navigate with arrow keys and press Space on a file
**Then** the system executes `git add` if it was unstaged, or `git reset` if it was staged
**And** the UI immediately refreshes the file's status icon ([ ] vs [x]) and semantic color
**And** the cursor (>) remains on the current line.

### Story 1.5: Manual Refresh & State Consistency

As a user,
I want to manually refresh the repository state using the 'R' key,
So that I can ensure the TUI is perfectly in sync with any external changes.

**Acceptance Criteria:**

**Given** the application is active
**When** I press the 'R' key
**Then** the system fetches a fresh `git status` snapshot
**And** a "Refreshing..." indicator is briefly visible in the footer
**And** the UI re-renders with the latest repository state.

## Epic 2: Commit Flow & Hybrid Power

Implement the ability to commit changes and execute raw Git commands without leaving the TUI.

### Story 2.1: The Commit Flow (Hotkey 'C')

As a user,
I want to initiate a commit flow using the 'C' hotkey,
So that I can finalize my staged changes with a meaningful message.

**Acceptance Criteria:**

**Given** I have staged files in the staging view
**When** I press the 'C' key
**Then** a centered Commit Message Input panel appears with a double border
**And** I can type a multi-line message
**And** pressing Enter (or a specific commit shortcut) executes `git commit -m "[message]"`
**And** pressing Escape cancels the flow and returns to the staging view.

### Story 2.2: Post-Commit Remote Push Prompt

As a user,
I want to be prompted to push my changes after a successful commit,
So that I can easily keep my remote repository in sync.

**Acceptance Criteria:**

**Given** a successful commit has just been executed
**When** the system detects a remote tracking branch
**Then** a prompt appears asking "Push changes to remote? (y/n)"
**And** selecting 'y' executes `git push`
**And** the UI refreshes the state after the operation completes.

### Story 2.3: Hybrid Command Overlay (Hotkey 'Shift+G')

As a user,
I want a "Shift+G" escape hatch to run raw Git commands,
So that I have the full power of the CLI within the TUI.

**Acceptance Criteria:**

**Given** the TUI is active
**When** I press "Shift+G"
**Then** an overlay input box opens with a pre-filled `git ` prefix
**And** I can type and execute any Git subcommand
**And** the TUI state is fully refreshed after the command executes.

### Story 2.4: Integrated Output & Error Display

As a user,
I want to see the output and errors of my raw commands,
So that I can diagnose issues without leaving the tool.

**Acceptance Criteria:**

**Given** I execute a raw command via the overlay
**When** the command completes
**Then** the stdout is displayed in a temporary output panel
**And** if the command fails (non-zero exit code), an ErrorOverlay displays the stderr
**And** the user must press a key to dismiss the error/output and return to the TUI.

## Epic 3: Seamless Branching & Diff Exploration

Implement full branch management and inline diff viewing for surgical review.

### Story 3.1: Branch Management View (Navigation)

As a user,
I want a dedicated view to see all local and remote branches,
So that I can understand my repository's context and history.

**Acceptance Criteria:**

**Given** I am in the Files view
**When** I press the tab/hotkey to switch views
**Then** the UI switches to the Branching View
**And** a list of local and remote branches is displayed in a table
**And** icons indicate the active branch and pushed/unpushed state.

### Story 3.2: Switching & Creating Branches

As a user,
I want to switch and create branches using simple hotkeys,
So that I can context-switch or start new work instantly.

**Acceptance Criteria:**

**Given** I am in the Branching View
**When** I select a branch and press Enter
**Then** the system executes `git checkout [branch]` and refreshes the UI
**When** I press the 'B' key
**Then** a prompt appears for a new branch name
**And** the system executes `git checkout -b [name]` and detects/prompts for upstream tracking.

### Story 3.3: Inline Diff Explorer

As a user,
I want to peek at file diffs directly within the TUI,
So that I can verify my changes before staging them.

**Acceptance Criteria:**

**Given** I have a file selected in the Staging View
**When** I press the 'Enter' or 'D' key
**Then** an Inline Diff panel opens showing the changes for that file
**And** I can toggle between side-by-side and inline view modes
**And** pressing Escape closes the panel and returns to the file list.

## Epic 4: Scale & Search (Large Repos)

Optimize the experience for large repositories with real-time filtering.

### Story 4.1: Real-time File Filtering (Hotkey '/')

As a user,
I want to filter the file list in real-time using the '/' key,
So that I can quickly find and stage specific files in a large repository.

**Acceptance Criteria:**

**Given** the Staging View is active with many changed files
**When** I press the '/' key
**Then** a minimal search input field opens
**And** as I type, the file list filters in real-time to show only matching paths
**And** I can still navigate and toggle the filtered results
**And** pressing Escape clears the filter and returns to the full list.

## Epic 5: Robustness & UI Polish

Harden the core Git integration and polish the user experience to eliminate bugs and technical debt.

### Story 5.1: Critical Core Hardening & Security

As a developer,
I want robust command parsing and input validation,
So that the application is secure against command injection and handles complex file paths correctly.

**Acceptance Criteria:**

**Given** a Git command with spaces or quotes in arguments
**When** `GitService.RunRawAsync` is called
**Then** it correctly escapes and preserves arguments.
**When** multi-line or malformed input is pasted into the command bar
**Then** it is sanitized to prevent command injection.
**And** the "git " prefix truncation logic is made safe and non-hardcoded.
**And** `GitService.UnstageAsync` handles HEAD-less states safely without blind fallbacks.

### Story 5.2: Input & Buffer Reliability

As a user,
I want my keyboard input to be responsive and clean,
So that I don't experience input lag or see unprintable characters in my commands.

**Acceptance Criteria:**

**Given** an async operation is in progress
**When** I press keys during the await
**Then** the input buffer is properly managed or flushed so that "ghost" keys don't appear later.
**When** typing in input fields
**Then** unprintable control characters are filtered out.

### Story 5.3: UI Polish & Hotkey Integrity

As a user,
I want the UI legend to accurately reflect the available features and my selection to be stable,
So that the interface feels professional and predictable.

**Acceptance Criteria:**

**Given** the application is in different states (Staging, Branching)
**When** I look at the status bar legend
**Then** only functional hotkeys are displayed, and they all work as intended.
**When** I refresh the view
**Then** my current selection remains on the same file/item and does not jump unexpectedly.

### Story 5.4: Async Performance & UX Guardrails

As a user,
I want the UI remain responsive during Git operations and for errors to be handled gracefully,
So that I never feel the application has crashed or is ignoring my errors.

**Acceptance Criteria:**

**Given** a long-running Git operation
**When** it is executing in the background
**Then** the UI shows a "Waiting/Loading" state and does not freeze the main thread.
**When** multiple errors occur in rapid succession
**Then** they are queued or correctly displayed without being silently overwritten by polling race conditions.
**And** the command output overlay only triggers for actual warnings or errors, not standard informational output.

### Story 5.5: Adaptive Layout & Scrollable Components

As a user,
I want the TUI to adapt to my terminal size and provide scrolling for large lists,
So that I can use the tool effectively even on smaller screens or in constrained windows.

**Acceptance Criteria:**

**Given** a small terminal window or a large number of files/branches
**When** the content exceeds the available screen height
**Then** the Action Pane and Navigation Sidebar provide vertical scrolling.
**When** the terminal width is constrained
**Then** the layout adjusts proportions dynamically (e.g., narrowing the sidebar) to keep the Action Pane functional.
**And** the status bar legend gracefully handles overflow or wraps to avoid being cut off.
