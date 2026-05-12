# Distillate: GitVibe Product Brief

## Metadata
*   **Project**: GitVibe
*   **Module**: Product Brief
*   **Date**: 2026-05-03

## Product Intent
Surgical Git TUI companion for CLI lovers. Focus on friction reduction for staging and branching.

## Functional Specs (POC)
*   **View 1: Staging**
    *   Multi-select (Space) for staging/unstaging.
    *   Colors: Added/??=Green, Modified=Yellow, Deleted=Red.
    *   Hotkeys: `C` (Commit + Push Prompt), `Esc` (Back, keep state).
    *   Feature: Side-by-side/Inline Diff view for selected file.
*   **View 2: Branching**
    *   Switch (Enter).
    *   Create (`B`).
    *   Intelligence: Push upstream check on new branch.
*   **Navigation**
    *   Landing menu with "Files" and "Branches" options.

## Technical Requirements
*   **Framework**: .NET 10.0, Spectre.Console.
*   **UI Primitives**: 
    *   `Layout` for the dashboard shell.
    *   `Table` for line-aligned diffs.
    *   `Live` displays for dynamic updates.
*   **Logic**: Wrapper for Git CLI (porcelain output). UTF-8 encoding for icons.

## Constraints
*   Lightweight: No LibGit2Sharp.
*   Environment: PowerShell/Windows Terminal.
