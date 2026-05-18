# Story 5.1: Critical Core Hardening & Security

As a developer,
I want robust command parsing and input validation,
So that the application is secure against command injection and handles complex file paths correctly.

## Acceptance Criteria

- **Given** a Git command with spaces or quotes in arguments, **When** `GitService.RunRawAsync` is called, **Then** it correctly escapes and preserves arguments.
- **When** multi-line or malformed input is pasted into the command bar, **Then** it is sanitized to prevent command injection.
- **And** the "git " prefix truncation logic is made safe and non-hardcoded.
- **And** `GitService.UnstageAsync` handles HEAD-less states safely without blind fallbacks.

## Tasks
- [ ] Implement robust argument parsing in `GitService.RunRawAsync`.
- [ ] Sanitize input in `MainLoop.cs` to prevent command injection.
- [ ] Refactor "git " prefix truncation to be safe.
- [ ] Update `GitService.UnstageAsync` with safe fallback logic.
