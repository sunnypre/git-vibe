import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver
class ResizeObserver {
  private callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element) {
    // Immediate callback with mock entry to satisfy layout calculations
    this.callback([{ target, contentRect: target.getBoundingClientRect() } as any], this)
  }
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver

// Mock Electron window.api or other globals if needed
Object.defineProperty(window, 'electron', {
  value: {
    ipcRenderer: {
      send: vi.fn(),
      on: vi.fn(),
      invoke: vi.fn().mockResolvedValue({})
    }
  }
})

Object.defineProperty(window, 'api', {
  value: {
    git: {
      getCurrentBranch: vi.fn().mockResolvedValue({ success: true, data: 'main' }),
      getStatus: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getDiff: vi.fn().mockResolvedValue({ success: true, data: { filePath: '', lines: [] } }),
      add: vi.fn().mockResolvedValue({ success: true }),
      reset: vi.fn().mockResolvedValue({ success: true }),
      revertChanges: vi.fn().mockResolvedValue({ success: true }),
      selectDirectory: vi.fn().mockResolvedValue('/mock/selected/path'),
      getBranches: vi.fn().mockResolvedValue({ success: true, data: ['main', 'dev'] }),
      createBranch: vi.fn().mockResolvedValue({ success: true }),
      push: vi.fn().mockResolvedValue({ success: true }),
      pull: vi.fn().mockResolvedValue({ success: true }),
      getStoredRepositories: vi.fn().mockResolvedValue({ success: true, data: [] }),
      storeRepositories: vi.fn().mockResolvedValue({ success: true }),
      onRefresh: vi.fn((_cb) => () => {})
    },
    terminal: {
      create: vi.fn().mockResolvedValue(undefined),
      write: vi.fn(),
      resize: vi.fn(),
      close: vi.fn(),
      onData: vi.fn((_cb) => () => {})
    }
  }
})

// Mock xterm to avoid canvas dependency in JSDOM environment
vi.mock('xterm', () => {
  return {
    Terminal: class {
      open = vi.fn()
      loadAddon = vi.fn()
      onData = vi.fn(() => ({ dispose: vi.fn() }))
      dispose = vi.fn()
      write = vi.fn()
    }
  }
})

vi.mock('xterm-addon-fit', () => {
  return {
    FitAddon: class {
      fit = vi.fn()
    }
  }
})
