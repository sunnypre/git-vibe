# Story 5.2: Input & Buffer Reliability

As a user,
I want my keyboard input to be responsive and clean,
So that I don't experience input lag or see unprintable characters in my commands.

## Acceptance Criteria

- **Given** an async operation is in progress, **When** I press keys during the await, **Then** the input buffer is properly managed or flushed so that "ghost" keys don't appear later.
- **When** typing in input fields, **Then** unprintable control characters are filtered out.

## Tasks
- [ ] Manage `Console.KeyAvailable` buffer during async operations in `MainLoop.cs`.
- [ ] Filter unprintable control characters in input handling.
