# GitVibe ✌️

A surgical C# TUI for Git, built with .NET 10 and Spectre.Console.

## 🚀 Quick Install

GitVibe is built using **Native AOT**, meaning it compiles to a single, standalone executable with zero dependencies and instant startup.

### 1. Build the Release
Run this from the project root:
```powershell
dotnet publish -c Release
```

### 2. Locate the Executable
The standalone file is generated at:
`bin\Release\net10.0\win-x64\publish\GitVibe.exe`

### 3. Make it Global (Windows)
To run `GitVibe` from any repository:
1. Copy `GitVibe.exe` to a folder in your PATH (e.g., `C:\tools\`).
2. (Optional) Rename it to `gv.exe` for faster typing.
3. Open a new terminal and just type `gv` or `GitVibe`.

---

## 🎮 Keybindings
sdsds
| Key | Action |
| :--- | :--- |
| `Tab` | Switch between **Staging** and **Branching** views |
| `Space` | Toggle Stage/Unstage for selected file |
| `C` | Open **Commit Overlay** (when files are staged) |
| `Enter` | **Checkout** selected branch |
| `B` | Create **New Branch** |
| `Shift + G` | Open **Hybrid Command** (Run raw git commands) |
| `R` | Manual Refresh |
| `Esc` | Exit / Cancel |

---

## 🛠 Development & Testing

For detailed feature walkthroughs and testing scenarios, see the [TESTING_GUIDE.md](./TESTING_GUIDE.md).

### Requirements
- .NET 10 SDK
- Git CLI

---

## 📝 License
MIT
