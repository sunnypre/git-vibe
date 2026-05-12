# Story 3.2: Switching & Creating Branches

Status: done

## Story

As a user,
I want to switch and create branches using simple hotkeys,
So that I can context-switch or start new work instantly.

## Acceptance Criteria

1. **Given** I am in the Branching View
2. **When** I select a branch and press `Enter`
3. **Then** the system executes `git checkout [branch]` and refreshes the UI
4. **When** I press the `B` key
5. **Then** a centered input prompt appears for a new branch name
6. **And** typing a name and pressing `Enter` executes `git checkout -b [name]`
7. **And** if successful, the system detects if it should set upstream tracking and prompts the user.
8. **And** pressing `Escape` cancels the creation prompt.

## Developer Context

This story builds upon the navigation implemented in Story 3.1. It adds mutation capabilities to the Branching View.

### Technical Requirements
- **Service:** Update `IGitService` and `GitService`:
  - `CheckoutBranchAsync(string branchName)`
  - `CreateBranchAsync(string branchName)`
- **UI Overlay:** 
  - Reuse the pattern from `CommitOverlay` or `CommandOverlay` to create a `BranchCreationOverlay`.
  - The overlay should take a name input.
- **Workflow:**
  - In `MainLoop.cs`, when in `Branching` view:
    - `Enter` -> `gitService.CheckoutBranchAsync`.
    - `B` -> Activate `isBranchCreationOverlayActive`.
  - After `CreateBranchAsync`, if there's an upstream (e.g., `origin`), prompt the user to set tracking (Optional/Stretch for MVP, but good for "Surgical Confidence").

### Architecture Compliance
- Use the "Result Pattern" for all checkout/creation commands.
- Use `ErrorOverlay` if checkout/creation fails (e.g., branch already exists, or uncommitted changes prevent checkout).
- Trigger a full state refresh after any successful branch operation.

## Tasks / Subtasks

- [x] Service: Implement `CheckoutBranchAsync` and `CreateBranchAsync` in `GitService.cs`
- [x] UI: Create `Features/Branching/BranchCreationOverlay.cs`
- [x] Integration: Update `MainLoop.cs` with Branch Actions
  - [x] Handle `Enter` in Branching view for checkout.
  - [x] Handle `B` in Branching view to open creation overlay.
  - [x] Implement checkout/creation execution logic with error handling.
- [x] Verification & Testing
  - [x] Create/Update tests to verify branch switching logic.
  - [x] Manual verification of branch creation and switching.

## Dev Notes
- **Checkout Failures:** `git checkout` often fails if there are local changes that would be overwritten. Ensure the error message from Git is shown clearly in the `ErrorOverlay`.
- **Branch Naming:** Add basic validation to the branch creation input (e.g., no spaces).

## Dev Agent Record

### Implementation Plan
1. Service: Added `CheckoutBranchAsync` and `CreateBranchAsync` to `IGitService` and `GitService`.
2. UI: Created `BranchCreationOverlay` for branch name input.
3. UI: Updated `BranchingView` to support a `selectedIndex` and rendering a selection pointer.
4. Integration: Updated `MainLoop.cs` to handle:
   - `Enter` in Branching view for checkout.
   - `B` in Branching view for creating a new branch.
   - Arrow keys for navigating the branch list.
   - Branch creation overlay state and input.

### Completion Notes
- All unit tests for `GitService` passed.
- `BranchingView` tests verified the selection indicator.
- Error handling implemented: branch creation/checkout failures are displayed in an `ErrorOverlay`.
### Senior Developer Review (AI)

**Review Date:** 2026-05-12
**Review Outcome:** Approved (Patches Applied)
**Action Items:**
- [x] [Review][Patch] Missing AC 7 Implementation (Upstream Tracking Prompt) — Resolved: Created new `UpstreamTrackingOverlay` and integrated into creation flow.
- [x] [Review][Patch] Potential TUI Hang on Git Operations [MainLoop.cs:176] — Resolved: Refactored input handling to await git ops outside direct render path.
- [x] [Review][Patch] CancellationTokenSource Resource Leak [MainLoop.cs:15] — Resolved: Implemented `IDisposable` and disposed `_loopCts`.
- [x] [Review][Patch] Incomplete Branch Name Validation [MainLoop.cs:384] — Resolved: Added comprehensive list of illegal git ref characters.
- [x] [Review][Patch] Redundant Rendering Logic [BranchCreationOverlay.cs:8] — Resolved: Implemented panel caching in `BranchCreationOverlay`.
- [x] [Review][Defer] Insecure Raw Command Splitting [GitService.cs:115] — Deferred as pre-existing in `RunRawAsync`.
- [x] [Review][Defer] Naive Surrogate Pair Truncation [MainLoop.cs:258] — Deferred as pre-existing UI pattern.

Status: done

