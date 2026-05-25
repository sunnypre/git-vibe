import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS } from '../shared/types/IpcEvents'
import { GitFile, IpcResponse } from '../shared/types/GitModels'

// Custom APIs for renderer
const api = {
  git: {
    getStatus: async (repoPath: string): Promise<IpcResponse<GitFile[]>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.STATUS, repoPath)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    add: async (repoPath: string, files: string[]): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!files?.length) return { success: false, error: 'No files provided' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.ADD, repoPath, files)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    reset: async (repoPath: string, files: string[]): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!files?.length) return { success: false, error: 'No files provided' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.RESET, repoPath, files)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    commit: async (repoPath: string, message: string): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!message?.trim()) return { success: false, error: 'Commit message required' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.COMMIT, repoPath, message)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    getCurrentBranch: async (repoPath: string): Promise<IpcResponse<string>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.BRANCH, repoPath)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // Only expose essential electronAPI features if needed,
    // for now exposing the toolkit's default but wrapping in a try-block
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('API injection failed:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
