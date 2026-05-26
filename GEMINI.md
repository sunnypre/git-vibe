# AntiGravity Project Base: git-vibe

## 🎯 Architectural Context & Domain

### Requirements Profile
* **Functional Focus:** Multi-repository tabbed management workspace featuring a highly interactive "Surgical Staging" layout. Requires an insulated Node.js/Git native core connected to a highly performant, reactive UI.
* **Non-Functional Hard Caps:** Tab switching must clock in at `<100ms`. UI responsiveness must stay under `<50ms`. Absolute UI-to-Disk synchronization state integrity is mandatory.
* **Domain Complexity:** Medium-High. Cross-process communication, local OS filesystem mutation, and asynchronous stream handling.

### Tech Stack & Core Dependencies
* **Runtime/Platform:** Electron (Main / Preload / Renderer)
* **Compilation/Build Pipeline:** `electron-vite` (Official CLI tooling)
* **Frontend Framework:** React 18 / TypeScript 5+
* **State Matrix:** Zustand v5 (Optimistic Transaction Model)
* **UI Engine:** shadcn/ui (Radix UI primitives + Tailwind CSS v4)
* **Terminal Native Core:** `xterm.js` + `node-pty`
* **Git Integration Layer:** Native `child_process` execution wrapper (Direct Git CLI execution. **No simple-git dependency allowed**).

---

## 🏗️ System Core Boundaries

### 1. The IPC Boundary (Preload Layer)
The Renderer Layer (`src/renderer`) is fully sandboxed. It has **zero access** to Node.js built-ins (`fs`, `child_process`, `path`). All system interactions must pass through the strictly typed explicit context bridge exposed via `window.api`.

### 2. The Git Service Boundary (Main Process)
All disk mutations and Git calculations occur sequentially inside a singleton `GitExecutor` within the Main Process. It serializes actions to eliminate `.git/index.lock` write collisions.

### 3. The State Boundary (Zustand Layer)
The frontend views never hit IPC handlers directly. Component interactions invoke actions on the Zustand store, which handles the optimistic UI execution, fires off the asynchronous IPC requests, and dispatches dynamic rollbacks on failure.

---

## 📂 Absolute Directory Map

All development must rigidly align to this exact file structure. No rogue top-level directories are permitted.

```text
git-vibe/
├── src/
│   ├── main/      # Node.js backend (Runs Git commands)
│   ├── preload/   # The Bridge (Connects frontend to backend safely)
│   └── renderer/  # React Frontend (Tailwind v4 + shadcn/ui)└── renderer/  # React Frontend (Tailwind v4 + shadcn/ui)

## Operational 