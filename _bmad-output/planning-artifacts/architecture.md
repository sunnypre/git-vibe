---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
project_name: 'git-vibe'
user_name: 'sunny'
date: 'onsdag 6 maj 2026'
lastStep: 8
status: 'complete'
completedAt: 'onsdag 6 maj 2026'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - GEMINI.md
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system requires a robust parser for `git status --porcelain` and a reactive UI layer built with `Spectre.Console`. Key features include multi-select staging, inline diff peeking, and a branch management suite. Architecturally, this requires a clear separation between the `GitService` (process management) and the `UI` (component rendering).

**Non-Functional Requirements:**
Performance is the primary driver (sub-50ms UI latency). Reliability is critical, ensuring the TUI state never diverges from the disk state. Terminal compatibility (UTF-8) is a baseline requirement for the visual "vibe."

**Scale & Complexity:**
- Primary domain: Developer Tool / CLI (TUI)
- Complexity level: Low-Medium
- Estimated architectural components: 4 (GitService, UI Coordinator, StateManager, CommandOverlay)

### Technical Constraints & Dependencies
- **Target:** .NET 10.0 Console App.
- **Dependency:** `Spectre.Console`.
- **Constraint:** Direct Git CLI wrapper (No LibGit2Sharp).
- **Environment:** Windows Terminal / PowerShell (UTF-8).

### Cross-Cutting Concerns Identified
- **State Sync:** Ensuring the UI refreshes accurately after every command (especially raw commands).
- **Process Orchestration:** Handling Git `stderr` and non-zero exit codes gracefully within the TUI.
- **Input Handling:** Managing a global hotkey loop that supports both navigational keys and functional overlays.

## Starter Template Evaluation

### Primary Technology Domain

CLI Tool (TUI) based on .NET 10.0 and `Spectre.Console`.

### Starter Options Considered

1.  **Standard .NET Console (Current):** Simple, but lacks built-in Dependency Injection and performance optimizations like Native AOT.
2.  **RapidConsole Template:** A community template that pre-configures DI and Spectre. However, it can add unnecessary "magic" for a surgical tool like GitVibe.
3.  **Modern .NET 10 CLI Pattern (Selected):** A "Zero-Ceremony" approach using Top-Level Statements, `Microsoft.Extensions.Hosting` for DI, and Native AOT for sub-100ms startup times.

### Selected Starter: Modern .NET 10 CLI Pattern

**Rationale for Selection:**
GitVibe is a performance-intensive tool. By adopting the 2026 standard for .NET 10 CLI apps, we gain Native AOT (instant startup), Dependency Injection (testability), and C# 14 features (cleaner code) without adding heavy third-party boilerplate.

**Architectural Decisions Provided by Starter:**

- **Language & Runtime:** C# 14 on .NET 10.0. Enables Native AOT for self-contained, high-performance binaries.
- **Dependency Injection:** Using `Microsoft.Extensions.Hosting` to manage services (`GitService`) and UI coordinators.
- **UI Framework:** `Spectre.Console` (v0.55+) for rich terminal rendering and UTF-8 compliance.
- **Code Organization:** A Feature-based structure (e.g., `Git/`, `UI/`, `State/`) to keep the "Git logic" separated from "Spectre rendering."
- **Performance:** Opting into `PublishAot` and `InvariantGlobalization` to minimize binary size and memory footprint.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Command Parsing:** `Spectre.Console.Cli` (v0.55.2)
- **Process Management:** Vanilla `ProcessStartInfo` with a custom `GitProcess` wrapper.
- **State Management:** Snapshot-Based (Manual/Action-Driven Refresh).

**Important Decisions (Shape Architecture):**
- **Dependency Injection:** `Microsoft.Extensions.Hosting` (v10.0.0).
- **Encoding:** Forced UTF-8 via `Console.OutputEncoding`.

**Deferred Decisions (Post-MVP):**
- **Configuration Persistence:** Using a local `.gitvibe` json/toml (deferred until Phase 2).

### Data Architecture
- **Git State Model:** Using a `List<GitFile>` snapshot retrieved via `git status --porcelain`.
- **In-Memory Selection:** A simple `HashSet<string>` tracking paths selected in the TUI before applying changes.

### Communication Patterns
- **CLI Wrapper:** Synchronous-looking `async` calls to the Git CLI. The `GitService` will handle the redirection of `stdout` and `stderr`.
- **Error Handling:** Standardized `GitResult` object containing `ExitCode`, `Output`, and `Error`. Non-zero exit codes will trigger a centered Error Overlay.

### UI Architecture (Frontend)
- **Pattern:** Component-Driven (Spectre Panels/Tables).
- **Navigation:** Arrow keys for movement, `Space` for toggling, `C` for commit, `Shift+G` for raw command.
- **Refresh Strategy:** The UI will re-parse and re-render the entire dashboard after every internal Git command or manual `R` press.

### Infrastructure & Deployment
- **Target:** Windows Terminal / PowerShell.
- **Binary:** Native AOT (.exe) for instant startup.

## Implementation Patterns & Consistency Rules

### Naming Patterns
- **Classes/Methods:** `PascalCase` (e.g., `GitService`, `GetStatusAsync`).
- **Private Fields:** `_camelCase` (e.g., `_gitService`).
- **View Suffix:** Use the `View` suffix for classes returning Spectre `IRenderable` objects (e.g., `FileListView`).
- **Records:** Prefer `record` for immutable data models (e.g., `GitFile`).

### Structure Patterns
- **Feature-Based:**
    - `/Features/Staging/`: UI and logic for staging.
    - `/Features/Branching/`: UI and logic for branching.
    - `/Infrastructure/Git/`: The `GitProcess` wrapper and `GitService`.
    - `/Core/State/`: Shared state objects and selection tracking.
- **Tests:** Co-located or in a matching `/tests` directory using `.Tests.cs` suffix.

### Process Patterns: The Refresh Strategy
- **Snapshot Trigger:** The UI state is ONLY updated via a full snapshot fetch.
- **Manual Refresh:** The application MUST listen for the `R` key to trigger a manual `GitService` refresh.
- **Auto-Refresh:** The system MUST trigger a snapshot refresh immediately following any successful mutation command (`add`, `reset`, `commit`, `checkout`).
- **Visual Feedback:** During a refresh, the UI should briefly show a "Refreshing..." status in the footer.

### Error Handling Patterns
- **Result Object:** All Git operations must return a `GitResult` or `Result<T>`.
- **No Silent Failures:** If a Git command returns a non-zero exit code, it MUST be captured and presented via the `ErrorOverlay`.

### Component Patterns
- **Stateless Views:** Views should be pure functions or classes that take a data model and return a Spectre `IRenderable`. They should not call `GitService` directly.
- **Service Injection:** Logic services must be injected via the `IServiceProvider` (Dependency Injection).

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
GitVibe/
├── GitVibe.csproj           # .NET 10, Native AOT, Spectre.Console
├── Program.cs               # Generic Host Setup & TUI Entry Point
├── GlobalUsings.cs          # Centralized common namespaces
├── /Core
│   ├── /State
│   │   ├── RepositoryState.cs  # Snapshot of files and branches
│   │   └── SelectionState.cs   # HashSet of toggled file paths
│   └── /Models
│       ├── GitFile.cs       # record for file status
│       ├── GitBranch.cs     # record for branch status
│       └── GitResult.cs     # Result Pattern for commands
├── /Infrastructure
│   └── /Git
│       ├── GitProcess.cs    # Low-level ProcessStartInfo wrapper
│       └── GitService.cs    # High-level domain service (Status, Add, Reset)
├── /Features
│   ├── /Staging
│   │   ├── StagingCommand.cs # Spectre.Console.Cli Command
│   │   ├── StagingView.cs    # Returns the main MultiSelect TUI
│   │   └── DiffView.cs       # Returns the Inline Diff Panel
│   ├── /Branching
│   │   ├── BranchingCommand.cs
│   │   └── BranchingView.cs
│   └── /Shared
│       ├── CommandOverlay.cs # Shift+G logic
│       ├── ErrorOverlay.cs   # Error display logic
│       └── StatusBarView.cs  # Legend and Branch indicator
├── /Styles
│   └── VibeTheme.cs         # Centralized colors and icons (UTF-8)
└── /Tests
    ├── GitParserTests.cs
    └── ViewTests.cs         # Using Spectre.Console.Testing
```

### Architectural Boundaries

**Git Boundary:**
All Git interactions are encapsulated within `Infrastructure/Git/`. No other part of the application is permitted to use `System.Diagnostics.Process` directly.

**State Boundary:**
The `Core/State/` layer acts as the single source of truth. UI Features are "snapshot-aware" but do not mutate the state directly; they request changes through services.

**UI Boundary:**
Features are isolated in the `/Features` directory. Communication between features is handled by the `Command` coordinator (Spectre.Console.Cli). Shared components like overlays are extracted to `/Features/Shared`.

### Requirements to Structure Mapping

**Repository & Status (FR1-FR4):**
- Implementation: `Infrastructure/Git/GitService.cs`
- View: `Features/Staging/StagingView.cs`

**Staging & Diff (FR5-FR9):**
- Staging Logic: `Features/Staging/StagingCommand.cs`
- Diff View: `Features/Staging/DiffView.cs`

**Branching (FR10-FR14):**
- Branch Logic: `Features/Branching/BranchingCommand.cs`
- View: `Features/Branching/BranchingView.cs`

**Commits & Commands (FR15-FR19):**
- Logic: `Infrastructure/Git/GitService.cs`
- Overlays: `Features/Shared/CommandOverlay.cs`
- Errors: `Features/Shared/ErrorOverlay.cs`

**UX & Navigation (FR20-FR22):**
- Layout: `Features/Shared/StatusBarView.cs`
- Theme: `Styles/VibeTheme.cs`

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Using `Spectre.Console.Cli` alongside `Microsoft.Extensions.Hosting` is the 2026 standard for high-performance .NET 10 CLIs. The Native AOT constraint is supported by avoiding dynamic reflection-heavy libraries.

**Pattern Consistency:**
The "Result Pattern" for Git commands directly supports the "Error Overlay" UI requirement, ensuring consistent user feedback.

**Structure Alignment:**
The Feature-based structure (`/Features/Staging`) isolates the complex UI logic from the `Infrastructure/Git` layer.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
Every FR (FR1-FR22) has a designated home in the project structure.

**Non-Functional Requirements Coverage:**
Performance (NFR1-3) is addressed via Native AOT and Snapshot-based state. Reliability (NFR4-6) is handled by the "Result Pattern" and explicit refresh strategy.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical versions (.NET 10, Spectre v0.55.2) are locked.

**Structure Completeness:**
A full project tree with specific file locations is defined.

**Pattern Completeness:**
The "Refresh Pattern" (Manual 'R' key + Auto-refresh) specifically addresses potential agent confusion regarding state sync.

### Gap Analysis Results

**Minor Gap:** The specific format for the "Inline Diff" (FR8) is deferred to the implementation phase, but the `DiffView.cs` location is reserved.

**Minor Gap:** Configuration persistence (Phase 2) is documented as deferred.

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
- Performance-first architecture (Native AOT + Snapshot State).
- Rigid boundaries between Git process management and UI rendering.
- Explicit patterns for error handling and state refreshing.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
Upgrading the `.csproj` to the 2026 .NET 10 standard and initializing the directory structure.
