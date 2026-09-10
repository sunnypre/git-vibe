import { ElectronAPI } from '@electron-toolkit/preload'
import { GitFile, GitDiff, IpcResponse } from '../shared/types/GitModels'
import type {
  LaunchRequest,
  RepositoryNode,
  RepositoryNodeKind,
  SupportedApplication
} from '../shared/types/RepositoryExplorerModels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      explorer: {
        readDirectory: (
          repositoryRoot: string,
          relativePath?: string
        ) => Promise<IpcResponse<RepositoryNode[]>>
        openInFileManager: (repositoryRoot: string, relativePath: string) => Promise<IpcResponse>
        getApplications: (
          repositoryRoot: string,
          relativePath: string,
          kind: RepositoryNodeKind
        ) => Promise<IpcResponse<SupportedApplication[]>>
        openPath: (request: LaunchRequest) => Promise<IpcResponse>
      }
      git: {
        getStatus: (repoPath: string) => Promise<IpcResponse<GitFile[]>>
        getDiff: (
          repoPath: string,
          filePath: string,
          options: { staged?: boolean; untracked?: boolean }
        ) => Promise<IpcResponse<GitDiff>>
        add: (repoPath: string, files: string[]) => Promise<IpcResponse>
        reset: (repoPath: string, files: string[]) => Promise<IpcResponse>
        revertChanges: (repoPath: string, files: string[]) => Promise<IpcResponse>
        commit: (repoPath: string, message: string) => Promise<IpcResponse>
        getCurrentBranch: (repoPath: string) => Promise<IpcResponse<string>>
        checkout: (repoPath: string, target: string) => Promise<IpcResponse>
        selectDirectory: () => Promise<string | null>
        getBranches: (repoPath: string) => Promise<IpcResponse<string[]>>
        createBranch: (repoPath: string, name: string) => Promise<IpcResponse>
        push: (repoPath: string, branch: string) => Promise<IpcResponse>
        pull: (repoPath: string) => Promise<IpcResponse>
        getUnpushedCommitCount: (repoPath: string, branch: string) => Promise<IpcResponse<number>>
        getStoredRepositories: () => Promise<IpcResponse<string[]>>
        storeRepositories: (paths: string[]) => Promise<IpcResponse>
        onRefresh: (callback: (repoPath: string) => void) => () => void
      }
      terminal: {
        create: (repoId: string, repoPath: string) => Promise<void>
        write: (repoId: string, data: string) => void
        resize: (repoId: string, cols: number, rows: number) => void
        close: (repoId: string) => void
        onData: (callback: (payload: { repoId: string; data: string }) => void) => () => void
      }
    }
  }
}
