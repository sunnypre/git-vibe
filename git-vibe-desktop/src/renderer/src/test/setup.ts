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
