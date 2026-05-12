# Product Brief: GitVibe

**Status:** Draft
**Owner:** Sunny
**Version:** 1.0.0

## 1. Executive Summary
GitVibe is a lightweight, hotkey-driven Terminal User Interface (TUI) for Git, built specifically for developers who love the Git CLI but find the "staging" and "branching" workflows tedious. It provides a visual, interactive layer over standard Git commands, allowing for surgical precision in preparing commits and managing branches without leaving the terminal.

## 2. Target Audience
*   CLI-first developers who find `git add -p` or manual staging of many files slow.
*   Developers working in environments where a full GUI (like GitKraken or Sourcetree) is unavailable or too heavy.
*   Power users who want a "dashboard" view of their local repo state.

## 3. Core Features (POC)

### A. The Landing Menu
*   **Files View**: High-level status of the repository.
*   **Branches View**: List of local and remote branches.

### B. "The Vibe" (Surgical Staging)
*   **Interactive Multi-Select**: Toggle files for staging/unstaging with `Space`.
*   **Semantic Color Coding**:
    *   [green]Added/Untracked[/]
    *   [yellow]Modified[/]
    *   [red]Deleted[/]
*   **Inline Diff View**: View changes for a specific file side-by-side or inline within the TUI.
*   **Smart Shortcuts**:
    *   `C`: Trigger Commit flow (input message + optional Push).
    *   `Esc`: Return to main menu (preserving staged state).

### C. Seamless Branching
*   **Switching**: Navigate and `Enter` to checkout.
*   **Creation**: `B` to create a new branch with a name prompt.
*   **Upstream Intelligence**: Automatically ask to push to remote if a tracking branch exists or is needed.

## 4. Technical Direction
*   **Stack**: .NET 10.0 + Spectre.Console.
*   **Integration**: Direct wrapper of Git CLI (via `ProcessStartInfo`).
*   **UI Architecture**:
    *   `Layout` widget for multi-pane dashboard (Navigation sidebar + Main content).
    *   `Table` widget for aligned side-by-side diffs.
    *   Manual input loop for high-level hotkey management (`C`, `B`, `Esc`).

## 5. Success Criteria for POC
*   Successfully stage a mix of tracked and untracked files.
*   Commit and push a change entirely through the TUI.
*   Create and switch branches without typing a single full `git` command.
