# GitVibe

GitVibe is a lightweight vibecoded desktop Git command center for developers who want visual interface with possibility to execute raw git commands directly. So yes, just another Git tool, as if there were not enough already...

Anyways... i built because why not and use it in my day to day work. Feel free to open a issue if you enjoy it but find irritating bugs. There probably are a gazillion.

The app is an Electron desktop application with a sandboxed React renderer and a Node.js main process that runs pure Git commands through a typed preload bridge. UI includes a integrated terminal using xterm. 

## Installation

Download the latest release from GitHub:

https://github.com/sunnypre/git-vibe/releases

Choose the installer or archive for your operating system, then run it like any other desktop app. GitVibe expects Git to be installed and available on your `PATH`.

## Development Setup

Requirements:

- Git installed and available on your `PATH`
- Node.js 20 or newer
- pnpm installed globally:

```bash
npm install -g pnpm
```

Clone the repository, or fork it on GitHub and clone your fork:

```bash
git clone https://github.com/sunnypre/git-vibe.git
cd git-vibe/git-vibe-desktop
pnpm install
```

Start the desktop app in development mode:

```bash
pnpm run dev
```

Run checks:

```bash
pnpm run typecheck
pnpm run test
pnpm run lint
```

Build locally:

```bash
pnpm run build
```

Platform-specific package scripts are also available:

```bash
pnpm run build:win
pnpm run build:mac
pnpm run build:linux
```

## Notes

GitVibe works on local Git repositories. Add a repository from the app, then use the file list to stage, inspect diffs, commit, switch branches, pull, and push changes upstream.
