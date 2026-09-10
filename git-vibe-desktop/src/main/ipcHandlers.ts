import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { IPC_EVENTS } from '../shared/types/IpcEvents'
import { GitExecutor } from './services/GitExecutor'
import { TerminalService } from './services/TerminalService'
import { StorageService } from './services/StorageService'
import { IpcResponse, GitFile, GitDiff } from '../shared/types/GitModels'
import type { GitWorktree } from '../shared/types/GitModels'
import type {
  LaunchRequest,
  RepositoryNode,
  RepositoryNodeKind,
  SupportedApplication
} from '../shared/types/RepositoryExplorerModels'
import { RepositoryExplorerService } from './services/RepositoryExplorerService'
import { ExternalApplicationService } from './services/ExternalApplicationService'
import type { ApplicationSettings } from '../shared/types/ApplicationSettings'

export function registerIpcHandlers(): void {
  const gitExecutor = GitExecutor.getInstance()
  const terminalService = TerminalService.getInstance()
  const explorerService = new RepositoryExplorerService()
  const applicationService = new ExternalApplicationService(process.platform, process.env, () =>
    StorageService.getSettings()
  )

  ipcMain.handle(IPC_EVENTS.SETTINGS.GET, async (): Promise<IpcResponse<ApplicationSettings>> => {
    try {
      return { success: true, data: StorageService.getSettings() }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to load settings'
      }
    }
  })

  ipcMain.handle(
    IPC_EVENTS.SETTINGS.SAVE,
    async (_, settings: ApplicationSettings): Promise<IpcResponse> => {
      try {
        StorageService.saveSettings(settings)
        return { success: true }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to save settings'
        }
      }
    }
  )

  ipcMain.handle(IPC_EVENTS.SETTINGS.SELECT_EXECUTABLE, async (event): Promise<string | null> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Select application executable',
      properties: ['openFile']
    })
    return canceled ? null : filePaths[0]
  })

  ipcMain.handle(
    IPC_EVENTS.FILESYSTEM.READ_DIRECTORY,
    async (_, root: string, relativePath: string): Promise<IpcResponse<RepositoryNode[]>> => {
      try {
        return { success: true, data: await explorerService.readDirectory(root, relativePath) }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to read directory'
        }
      }
    }
  )

  ipcMain.handle(
    IPC_EVENTS.FILESYSTEM.OPEN_IN_FILE_MANAGER,
    async (_, root: string, relativePath: string): Promise<IpcResponse> => {
      try {
        const { target } = await explorerService.resolveWithinRoot(root, relativePath)
        const error = await shell.openPath(target)
        return error ? { success: false, error } : { success: true }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to open in file manager'
        }
      }
    }
  )

  ipcMain.handle(
    IPC_EVENTS.LAUNCHER.GET_APPLICATIONS,
    async (
      _,
      root: string,
      relativePath: string,
      kind: RepositoryNodeKind
    ): Promise<IpcResponse<SupportedApplication[]>> => {
      try {
        if (kind !== 'directory' && kind !== 'file') throw new Error('Invalid node kind')
        await explorerService.resolveWithinRoot(root, relativePath)
        return { success: true, data: await applicationService.getApplications(kind, relativePath) }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to discover applications'
        }
      }
    }
  )

  ipcMain.handle(
    IPC_EVENTS.LAUNCHER.OPEN_PATH,
    async (_, request: LaunchRequest): Promise<IpcResponse> => {
      try {
        if (!request || !['directory', 'file'].includes(request.kind))
          throw new Error('Invalid launch request')
        await applicationService.openPath(request)
        return { success: true }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to open path'
        }
      }
    }
  )

  // Directory selection dialog
  ipcMain.handle('dialog:selectDirectory', async (event): Promise<string | null> => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    if (canceled) return null
    return filePaths[0]
  })

  // Branch detection
  ipcMain.handle(
    IPC_EVENTS.GIT.BRANCH,
    async (_, repoPath: string): Promise<IpcResponse<string>> => {
      try {
        const branch = await gitExecutor.getCurrentBranch(repoPath)
        return { success: true, data: branch }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Get branches list
  ipcMain.handle('git:branches', async (_, repoPath: string): Promise<IpcResponse<string[]>> => {
    try {
      const branches = await gitExecutor.getBranches(repoPath)
      return { success: true, data: branches }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_EVENTS.GIT.WORKTREE_LIST, async (_, repoPath: string): Promise<IpcResponse<GitWorktree[]>> => {
    try { return { success: true, data: await gitExecutor.getWorktrees(repoPath) } }
    catch (error: any) { return { success: false, error: error.message } }
  })
  ipcMain.handle(IPC_EVENTS.GIT.WORKTREE_ADD, async (event, repoPath: string, path: string, branch: string): Promise<IpcResponse> => {
    try { await gitExecutor.addWorktree(repoPath, path, branch); event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath); return { success: true } }
    catch (error: any) { return { success: false, error: error.message } }
  })
  ipcMain.handle(IPC_EVENTS.GIT.WORKTREE_REMOVE, async (event, repoPath: string, path: string): Promise<IpcResponse> => {
    try { await gitExecutor.removeWorktree(repoPath, path); event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath); return { success: true } }
    catch (error: any) { return { success: false, error: error.message } }
  })

  // Create branch
  ipcMain.handle(
    'git:createBranch',
    async (event, repoPath: string, branchName: string): Promise<IpcResponse> => {
      try {
        await gitExecutor.createBranch(repoPath, branchName)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Status
  ipcMain.handle(
    IPC_EVENTS.GIT.STATUS,
    async (_, repoPath: string): Promise<IpcResponse<GitFile[]>> => {
      try {
        const files = await gitExecutor.getStatus(repoPath)
        return { success: true, data: files }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Add
  ipcMain.handle(
    IPC_EVENTS.GIT.ADD,
    async (event, repoPath: string, paths: string[]): Promise<IpcResponse> => {
      try {
        await gitExecutor.add(repoPath, paths)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Reset
  ipcMain.handle(
    IPC_EVENTS.GIT.RESET,
    async (event, repoPath: string, paths: string[]): Promise<IpcResponse> => {
      try {
        await gitExecutor.reset(repoPath, paths)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Revert selected file changes
  ipcMain.handle(
    IPC_EVENTS.GIT.REVERT_CHANGES,
    async (event, repoPath: string, paths: string[]): Promise<IpcResponse> => {
      try {
        await gitExecutor.revertChanges(repoPath, paths)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Checkout
  ipcMain.handle(
    IPC_EVENTS.GIT.CHECKOUT,
    async (event, repoPath: string, target: string): Promise<IpcResponse> => {
      try {
        await gitExecutor.checkout(repoPath, target)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Commit
  ipcMain.handle(
    IPC_EVENTS.GIT.COMMIT,
    async (event, repoPath: string, message: string): Promise<IpcResponse> => {
      try {
        await gitExecutor.commit(repoPath, message)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Push
  ipcMain.handle(
    IPC_EVENTS.GIT.PUSH,
    async (event, repoPath: string, branchName: string): Promise<IpcResponse> => {
      try {
        await gitExecutor.push(repoPath, branchName)
        event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Pull
  ipcMain.handle(IPC_EVENTS.GIT.PULL, async (event, repoPath: string): Promise<IpcResponse> => {
    try {
      await gitExecutor.pull(repoPath)
      event.sender.send(IPC_EVENTS.GIT.REFRESH, repoPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Unpushed commit count
  ipcMain.handle(
    IPC_EVENTS.GIT.UNPUSHED_COUNT,
    async (_, repoPath: string, branchName: string): Promise<IpcResponse<number>> => {
      try {
        const count = await gitExecutor.getUnpushedCommitCount(repoPath, branchName)
        return { success: true, data: count }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Diff
  ipcMain.handle(
    IPC_EVENTS.GIT.DIFF,
    async (
      _,
      repoPath: string,
      filePath: string,
      options: { staged?: boolean; untracked?: boolean }
    ): Promise<IpcResponse<GitDiff>> => {
      try {
        const diff = await gitExecutor.getDiff(repoPath, filePath, options)
        return { success: true, data: diff }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Terminal Handlers
  ipcMain.handle(
    'terminal:create',
    async (event, repoId: string, repoPath: string): Promise<void> => {
      const window = BrowserWindow.fromWebContents(event.sender)
      if (window) {
        terminalService.create(repoId, repoPath, window)
      }
    }
  )

  ipcMain.on('terminal:write', (_, repoId: string, data: string): void => {
    terminalService.write(repoId, data)
  })

  ipcMain.on('terminal:resize', (_, repoId: string, cols: number, rows: number): void => {
    terminalService.resize(repoId, cols, rows)
  })

  ipcMain.on('terminal:close', (_, repoId: string): void => {
    terminalService.close(repoId)
  })

  // Storage Handlers
  ipcMain.handle('git:getStoredRepositories', async (): Promise<IpcResponse<string[]>> => {
    try {
      const paths = StorageService.getRepositories()
      return { success: true, data: paths }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('git:storeRepositories', async (_, paths: string[]): Promise<IpcResponse> => {
    try {
      StorageService.saveRepositories(paths)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
