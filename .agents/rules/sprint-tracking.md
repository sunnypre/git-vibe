---
trigger: manual
---

# Rule: Agile Sprint Alignment

## Context
This project uses a lightweight Markdown-based agile system (`todo.md` for the current sprint, `product_backlog.md` for future features).

## Core Directives for the Agent
1. **Scope Lockdown:** Before writing, modifying, or refactoring any code, you MUST open and read `todo.md` to identify the specific user story or task currently marked as `[Active]`. 
2. **Single Task Focus (One at a Time):** You must work sequentially. Select the single next unchecked sub-task `[ ]` from the active story. Complete **only** that specific task. Do not try to bundle multiple checklist items into a single turn or write ahead.
3. **Immediate Progress Updates:** As soon as you finish that single task and verify your code works, you must immediately modify `todo.md` to mark that specific item as completed `[x]`. 
4. **No Scope Creep:** Do not build ahead or implement features from the broader backlog unless explicitly instructed by the user. Focus entirely on finishing the current checklist.
5. **Acceptance Verification:** Ensure that the code you produce meets all acceptance criteria outlined for that active story before declaring it complete.