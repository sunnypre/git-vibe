import { ipcMain } from 'electron'
import { IPC_EVENTS } from '../shared/types/IpcEvents'
import { GitExecutor } from './services/GitExecutor'
import { IpcResponse } from '../shared/types/GitModels'

export function registerIpcHandlers(): void {
  const gitExecutor = GitExecutor.getInstance()

  // Branch detection
  ipcMain.handle(IPC_EVENTS.GIT.BRANCH, async (_, repoPath: string): Promise<IpcResponse<string>> => {
    try {
      const branch = await gitExecutor.getCurrentBranch(repoPath)
      return { success: true, data: branch }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Status
  ipcMain.handle(IPC_EVENTS.GIT.STATUS, async (_, repoPath: string): Promise<IpcResponse<GitFile[]>> => {
    try {
      const files = await gitExecutor.getStatus(repoPath)
      return { success: true, data: files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Add
  ipcMain.handle(IPC_EVENTS.GIT.ADD, async (_, repoPath: string, paths: string[]): Promise<IpcResponse> => {
    try {
      await gitExecutor.add(repoPath, paths)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Reset
  ipcMain.handle(IPC_EVENTS.GIT.RESET, async (_, repoPath: string, paths: string[]): Promise<IpcResponse> => {
    try {
      await gitExecutor.reset(repoPath, paths)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Add more handlers as needed for other events in IPC_EVENTS.GIT
}
