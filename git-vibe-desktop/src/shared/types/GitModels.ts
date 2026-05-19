export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'none'

export interface GitFile {
  path: string
  stagedStatus: GitFileStatus
  unstagedStatus: GitFileStatus
  isStaged: boolean
  oldPath?: string
}

export interface GitRepository {
  path: string
  name: string
  currentBranch: string
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
