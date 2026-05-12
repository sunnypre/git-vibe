# Story 1.1: Project Scaffolding & Native AOT Setup

Status: ready-for-dev

## Story

As a developer,
I want a modern .NET 10 project structure with Native AOT and DI,
so that I can build a high-performance, maintainable CLI tool with instant startup.

## Acceptance Criteria

1. **Native AOT Configuration**: The `.csproj` is configured for Native AOT (`PublishAot=true`) and optimized for binary size and performance.
2. **Dependency Injection**: `Microsoft.Extensions.Hosting` is integrated to provide a Generic Host for service management.
3. **Core Dependencies**: `Spectre.Console` is confirmed as a dependency for TUI rendering.
4. **Encoding & Initialization**: The application sets `Console.OutputEncoding = Encoding.UTF8` and successfully initializes the host.
5. **Self-Contained Build**: The project compiles and can be published as a self-contained, native executable.
6. **Architecture Alignment**: The initial directory structure follows the Feature-based pattern defined in the architecture.

## Tasks / Subtasks

- [ ] **Infrastructure: Project File Update** (AC: 1, 3, 5)
  - [ ] Add `PublishAot`, `InvariantGlobalization`, `StripSymbols`, `IsAotCompatible` to `GitVibe.csproj`.
  - [ ] Add `Microsoft.Extensions.Hosting` (v10.0.0) package reference.
- [ ] **Core: Host Initialization** (AC: 2, 4)
  - [ ] Refactor `Program.cs` to use Top-Level Statements and `Host.CreateApplicationBuilder(args)`.
  - [ ] Configure `Console.OutputEncoding` in the entry point.
  - [ ] Implement a basic `Worker` or `MainLoop` service to verify host execution.
- [ ] **Architecture: Directory Scaffolding** (AC: 6)
  - [ ] Create `/Core/Models/`, `/Core/State/`, `/Infrastructure/Git/`, `/Features/Staging/`, `/Features/Shared/`, `/Styles/`.
  - [ ] Move existing `GitFile.cs` to `Core/Models/GitFile.cs` and update namespace to `GitVibe.Core.Models`.
- [ ] **Validation: AOT Compilation** (AC: 5)
  - [ ] Run `dotnet publish -c Release -r win-x64` to verify Native AOT compatibility.

## Dev Notes

- **Native AOT Performance**: Sub-200ms startup is a success criterion from the PRD [Source: _bmad-output/planning-artifacts/prd.md#Performance].
- **C# 14 Features**: Utilize the `field` keyword for property backing if needed, and extension properties for cleaner domain logic [Source: Web Research].
- **Generic Host**: Use `IHostedService` for the TUI main loop to ensure proper lifecycle management.
- **UTF-8 Requirement**: Essential for rendering Spectre.Console icons correctly in Windows Terminal [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified].

### Project Structure Notes

- **Feature-Based Structure**: Strictly follow the structure defined in the Architecture Decision Document [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure].
- **File Relocations**: `GitFile.cs` must be moved to `Core/Models/`.

### References

- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **UX Design**: `_bmad-output/planning-artifacts/ux-design-specification.md`
- **Epics**: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
