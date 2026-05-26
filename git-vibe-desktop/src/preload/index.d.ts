import { ElectronAPI } from '@electron-toolkit/preload'
import { GitFile, GitDiff, IpcResponse } from '../shared/types/GitModels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      git: {
        getStatus: (repoPath: string) => Promise<IpcResponse<GitFile[]>>
        getDiff: (
          repoPath: string,
          filePath: string,
          options: { staged?: boolean; untracked?: boolean }
        ) => Promise<IpcResponse<GitDiff>>
        add: (repoPath: string, files: string[]) => Promise<IpcResponse>
        reset: (repoPath: string, files: string[]) => Promise<IpcResponse>
        commit: (repoPath: string, message: string) => Promise<IpcResponse>
        getCurrentBranch: (repoPath: string) => Promise<IpcResponse<string>>
      }
    }
  }
}
