# Story 1.2: Git Infrastructure & Status Parsing

Status: done

## Story

As a user,
I want the tool to accurately detect and parse my repository's status,
so that I can see exactly which files are staged, modified, or untracked.

## Acceptance Criteria

1. **Git Repository Detection**: The system successfully detects if the current directory is a valid Git repository upon launch [Source: _bmad-output/planning-artifacts/prd.md#FR1].
2. **Process Wrapper**: A custom `GitProcess` wrapper is implemented using `ProcessStartInfo` to handle low-level command execution with standard output/error redirection [Source: _bmad-output/planning-artifacts/architecture.md#Decision Priority Analysis].
3. **Status Parsing**: The system executes `git status --porcelain` and parses the output into a list of `GitFile` records, correctly handling X and Y status codes [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2].
4. **Branch Identification**: The current active branch name is correctly identified and retrieved [Source: _bmad-output/planning-artifacts/prd.md#FR2].
5. **Result Pattern**: All Git operations return a `GitResult` record containing `ExitCode`, `Output` (stdout), and `Error` (stderr) [Source: _bmad-output/planning-artifacts/architecture.md#Decision Priority Analysis].

## Tasks / Subtasks

- [x] **Core Models: GitResult** (AC: 5)
  - [x] Create `Core/Models/GitResult.cs` as a record.
- [x] **Infrastructure: GitProcess Wrapper** (AC: 2)
  - [x] Create `Infrastructure/Git/GitProcess.cs`.
  - [x] Implement `RunAsync(string arguments)` using `System.Diagnostics.Process`.
  - [x] Ensure standard output and error are redirected and captured.
- [x] **Infrastructure: GitService Implementation** (AC: 1, 3, 4)
  - [x] Create `Infrastructure/Git/GitService.cs`.
  - [x] Implement `GetStatusAsync()`: call `git status --porcelain` and use `GitFile.FromPorcelain`.
  - [x] Implement `GetActiveBranchAsync()`: call `git branch --show-current`.
  - [x] Implement `IsGitRepositoryAsync()`: call `git rev-parse --is-inside-work-tree`.
- [x] **Validation: Unit Testing**
  - [x] Create `Tests/GitParserTests.cs`.
  - [x] Verify parsing of various porcelain outputs (M, A, D, R, ??).
  - [x] Verify branch name retrieval.

### Review Findings

- [x] [Review][Patch] Command Injection Risk in GitProcess: Use `ArgumentList` instead of raw string arguments to prevent injection from malicious file paths. [Infrastructure/Git/GitProcess.cs]
- [x] [Review][Patch] Fragile Rename Parsing: Splitting on ` -> ` can fail if filenames contain that sequence. Use Git's `-z` or more robust parsing. [Core/Models/GitFile.cs]
- [x] [Review][Patch] Missing C-Style Escape Support: Git escapes non-ASCII characters (e.g., octal escapes); the current parser does not decode these. [Core/Models/GitFile.cs]
- [x] [Review][Patch] Missing Process Timeouts: `GitProcess` lacks a timeout, which could cause the tool to hang on long-running or stalled Git commands. [Infrastructure/Git/GitProcess.cs]
- [x] [Review][Patch] Missing CRLF Handling: Trailing carriage returns on Windows may cause file paths to be parsed incorrectly. [Infrastructure/Git/GitService.cs]
- [x] [Review][Defer] Memory Efficiency: Large command outputs are buffered entirely into strings. Consider streaming for extremely large repos. [Infrastructure/Git/GitProcess.cs] — deferred, pre-existing/architectural note

## Dev Notes

- **Porcelain v1**: Use the standard porcelain output (v1) which provides two-character status codes.
- **Error Handling**: Non-zero exit codes from Git must be captured in `GitResult`.
- **Dependency Injection**: Register `GitService` in `Program.cs`.
- **Naming**: Follow `PascalCase` for methods and `_camelCase` for private fields [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns].

### Project Structure Notes

- Infrastructure logic must reside in `Infrastructure/Git/`.
- Models must reside in `Core/Models/`.

### References

- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **Epics**: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
