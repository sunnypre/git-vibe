import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS } from '../shared/types/IpcEvents'
import { GitFile, GitDiff, IpcResponse } from '../shared/types/GitModels'
import type {
  LaunchRequest,
  RepositoryNode,
  RepositoryNodeKind,
  SupportedApplication
} from '../shared/types/RepositoryExplorerModels'
import type { ApplicationSettings } from '../shared/types/ApplicationSettings'

// Custom APIs for renderer
const api = {
  settings: {
    get: (): Promise<IpcResponse<ApplicationSettings>> =>
      ipcRenderer.invoke(IPC_EVENTS.SETTINGS.GET),
    save: (settings: ApplicationSettings): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC_EVENTS.SETTINGS.SAVE, settings),
    selectExecutable: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_EVENTS.SETTINGS.SELECT_EXECUTABLE)
  },
  explorer: {
    readDirectory: (
      repositoryRoot: string,
      relativePath = ''
    ): Promise<IpcResponse<RepositoryNode[]>> => {
      if (!repositoryRoot?.trim())
        return Promise.resolve({ success: false, error: 'Repository path required' })
      return ipcRenderer.invoke(IPC_EVENTS.FILESYSTEM.READ_DIRECTORY, repositoryRoot, relativePath)
    },
    getApplications: (
      repositoryRoot: string,
      relativePath: string,
      kind: RepositoryNodeKind
    ): Promise<IpcResponse<SupportedApplication[]>> => {
      if (!repositoryRoot?.trim() || !kind)
        return Promise.resolve({ success: false, error: 'Target required' })
      return ipcRenderer.invoke(
        IPC_EVENTS.LAUNCHER.GET_APPLICATIONS,
        repositoryRoot,
        relativePath,
        kind
      )
    },
    openPath: (request: LaunchRequest): Promise<IpcResponse> => {
      if (!request?.repositoryRoot?.trim() || !request.applicationId)
        return Promise.resolve({ success: false, error: 'Invalid launch request' })
      return ipcRenderer.invoke(IPC_EVENTS.LAUNCHER.OPEN_PATH, request)
    }
  },
  git: {
    getStatus: async (repoPath: string): Promise<IpcResponse<GitFile[]>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.STATUS, repoPath)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    getDiff: async (
      repoPath: string,
      filePath: string,
      options: { staged?: boolean; untracked?: boolean }
    ): Promise<IpcResponse<GitDiff>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!filePath?.trim()) return { success: false, error: 'Invalid file path' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.DIFF, repoPath, filePath, options)
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
    revertChanges: async (repoPath: string, files: string[]): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!files?.length) return { success: false, error: 'No files provided' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.REVERT_CHANGES, repoPath, files)
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
    },
    checkout: async (repoPath: string, target: string): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!target?.trim()) return { success: false, error: 'Target branch/file required' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.CHECKOUT, repoPath, target)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    selectDirectory: async (): Promise<string | null> => {
      try {
        return await ipcRenderer.invoke('dialog:selectDirectory')
      } catch (error: unknown) {
        console.error('Failed to select directory:', error)
        return null
      }
    },
    getBranches: async (repoPath: string): Promise<IpcResponse<string[]>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      try {
        return await ipcRenderer.invoke('git:branches', repoPath)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    createBranch: async (repoPath: string, name: string): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!name?.trim()) return { success: false, error: 'Branch name required' }
      try {
        return await ipcRenderer.invoke('git:createBranch', repoPath, name)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    push: async (repoPath: string, branch: string): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!branch?.trim()) return { success: false, error: 'Branch name required' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.PUSH, repoPath, branch)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    pull: async (repoPath: string): Promise<IpcResponse> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.PULL, repoPath)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    getUnpushedCommitCount: async (
      repoPath: string,
      branch: string
    ): Promise<IpcResponse<number>> => {
      if (!repoPath?.trim()) return { success: false, error: 'Invalid repository path' }
      if (!branch?.trim()) return { success: false, error: 'Branch name required' }
      try {
        return await ipcRenderer.invoke(IPC_EVENTS.GIT.UNPUSHED_COUNT, repoPath, branch)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    getStoredRepositories: async (): Promise<IpcResponse<string[]>> => {
      try {
        return await ipcRenderer.invoke('git:getStoredRepositories')
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    storeRepositories: async (paths: string[]): Promise<IpcResponse> => {
      try {
        return await ipcRenderer.invoke('git:storeRepositories', paths)
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message }
      }
    },
    onRefresh: (callback: (repoPath: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, repoPath: string) => callback(repoPath)
      ipcRenderer.on(IPC_EVENTS.GIT.REFRESH, handler)
      return () => {
        ipcRenderer.removeListener(IPC_EVENTS.GIT.REFRESH, handler)
      }
    }
  },
  terminal: {
    create: async (repoId: string, repoPath: string): Promise<void> => {
      await ipcRenderer.invoke('terminal:create', repoId, repoPath)
    },
    write: (repoId: string, data: string): void => {
      ipcRenderer.send('terminal:write', repoId, data)
    },
    resize: (repoId: string, cols: number, rows: number): void => {
      ipcRenderer.send('terminal:resize', repoId, cols, rows)
    },
    close: (repoId: string): void => {
      ipcRenderer.send('terminal:close', repoId)
    },
    onData: (callback: (payload: { repoId: string; data: string }) => void): (() => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        payload: { repoId: string; data: string }
      ) => {
        callback(payload)
      }
      ipcRenderer.on('terminal:data', handler)
      return () => {
        ipcRenderer.removeListener('terminal:data', handler)
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
