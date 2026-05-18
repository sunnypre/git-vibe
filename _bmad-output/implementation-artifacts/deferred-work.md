# Deferred Work

All items have been moved to **Epic 5: Robustness & UI Polish**.

See `_bmad-output/planning-artifacts/epics.md` and the following story files:
- `5-1-critical-core-hardening-security.md`
- `5-2-input-buffer-reliability.md`
- `5-3-ui-polish-hotkey-integrity.md`
- `5-4-async-performance-ux-guardrails.md`

## Deferred from: code review of story-5.5 (2026-05-18)
- Brittle Parsing of Branch Names (pre-existing) [Core/Models/GitBranch.cs]
- Architectural Drift: `MainLoop` as God Object (pre-existing) [Features/Shared/MainLoop.cs]
- Encoding Corruption in `VibeTheme.cs` (pre-existing) [Styles/VibeTheme.cs]
- Missing Multi-line Commit Support (pre-existing/Story 2.1) [Features/Shared/MainLoop.cs]
- Inconsistent `Unstage` Behavior (pre-existing/Story 1.5) [Infrastructure/Git/GitService.cs]
- Incomplete Command Splitting Regex (pre-existing) [Infrastructure/Git/GitService.cs]
- Brittle Initialization in `StartAsync` (pre-existing) [Features/Shared/MainLoop.cs]
