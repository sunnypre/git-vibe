# GitVibe Testing & Setup Guide

Welcome to the **GitVibe** testing phase! This guide will help you set up, build, and explore the features implemented so far.

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:
- **.NET 10 SDK**
- **Git CLI** (installed and in your PATH)
- **Windows Terminal** (recommended for best emoji/color support)

## 🚀 Getting Started

1.  **Clone the Repository** (if you haven't already):
    ```bash
    git clone https://github.com/your-repo/git-vibe.git
    cd git-vibe
    ```

2.  **Build the Project**:
    ```bash
    dotnet build
    ```

3.  **Run GitVibe**:
    ```bash
    dotnet run
    ```
    *Note: Run this inside a Git repository to see the full functionality.*

---

## 🎮 Navigation & Controls

| Key | Action | Context |
| :--- | :--- | :--- |
| `Tab` | **Switch View** | Toggle between Staging and Branching |
| `↑ / ↓` | **Navigate** | Move selection up and down |
| `Space` | **Toggle Stage** | Staging View |
| `C` | **Commit** | Staging View (Requires staged files) |
| `Enter` | **Checkout** | Branching View (Select a branch first) |
| `B` | **New Branch** | Branching View |
| `Shift + G` | **Hybrid Command** | Anywhere (Run raw git commands) |
| `R` | **Refresh** | Anywhere |
| `Esc` | **Exit / Cancel** | Anywhere |

---

## 🧪 Feature Walkthrough

### 1. The Surgical Staging Dashboard
- Press `Space` on an unstaged file to stage it.
- Press `Space` on a staged file to unstage it.
- Observe the **Vibe**: 
  - `M` (Modified) is [yellow]Yellow[/]
  - `A` (Added) is [green]Green[/]
  - `D` (Deleted) is [red]Red[/]

### 2. The Commit Flow
- Stage at least one file.
- Press `C` to open the **Commit Overlay**.
- Type your message and press `Enter`.
- If your branch has an upstream, you'll be prompted to **Push** immediately.

### 3. Branch Management (New! ✨)
- Press `Tab` to go to the **Branches** view.
- Use `↑ / ↓` to highlight a branch and press `Enter` to checkout.
- Press `B` to create a new branch:
  - Enter a name (no spaces!).
  - Press `Enter` to create.
  - You will be prompted to set **Upstream Tracking** for the new branch.

### 4. Hybrid Command Overlay
- Press `Shift + G`.
- Type any raw git command (e.g., `git log --oneline`).
- See the output directly in a specialized overlay.

---

## 🐛 Reporting Issues
If you find a bug or something doesn't feel "vibe-y" enough:
1. Take a screenshot of the TUI.
2. Note the steps to reproduce.
3. Open an issue in the repo!

**Happy Vibe-ing!** ✌️
