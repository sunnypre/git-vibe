---
trigger: manual
---

### Tech Stack & Core Dependencies
* **Runtime/Platform:** Electron (Main / Preload / Renderer)
* **Compilation/Build Pipeline:** `electron-vite` (Official CLI tooling)
* **Frontend Framework:** React 18 / TypeScript 5+
* **State Matrix:** Zustand v5 (Optimistic Transaction Model)
* **UI Engine:** shadcn/ui (Radix UI primitives + Tailwind CSS v4)
* **Terminal Native Core:** `xterm.js` + `node-pty`
* **Git Integration Layer:** Native `child_process` execution wrapper (Direct Git CLI execution. **No simple-git dependency allowed**).

## [Ux Design style guide](ux-design.md)