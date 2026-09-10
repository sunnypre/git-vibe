import { create } from 'zustand'
import { GitRepository, GitFile, GitDiffLine, GitWorktree } from '../../../shared/types/GitModels'
import type { RepositoryNode } from '../../../shared/types/RepositoryExplorerModels'

export interface RepositorySlice extends GitRepository {
  files: GitFile[]
  selectedFilePath: string | null
  selectedFilePaths: string[]
  diffContent: GitDiffLine[] | null
  isDiffLoading: boolean
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastSyncedAt: number | null
  branches: string[]
  unpushedCommitCount: number
  commitMessage: string
  searchQuery: string
  isSearchOpen: boolean
  isExplorerOpen: boolean
  explorerChildren: Record<string, RepositoryNode[]>
  expandedDirectories: string[]
  explorerLoading: Record<string, boolean>
  explorerErrors: Record<string, string>
  openWithTarget: RepositoryNode | null
  worktrees: GitWorktree[]
  activeWorktreePath: string
  isWorktreeOpen: boolean
  isWorktreeLoading: boolean
}

export interface GitState {
  repositories: Record<string, RepositorySlice>
  activeRepoId: string | null
  toast: { message: string; type: 'success' | 'error' | 'info'; id: string } | null
}

export interface GitActions {
  addRepository: (path: string) => void
  setActiveRepository: (id: string | null) => void
  removeRepository: (id: string) => void
  updateRepositoryState: (id: string, updates: Partial<RepositorySlice>) => void
  refreshBranch: (id: string) => Promise<void>
  refreshStatus: (id: string) => Promise<void>
  refreshRepository: (id: string) => Promise<void>
  selectFile: (id: string, path: string | null, multiSelect?: boolean) => void
  fetchDiff: (id: string, path: string) => Promise<void>
  stageFile: (id: string, path: string) => Promise<void>
  unstageFile: (id: string, path: string) => Promise<void>
  revertFiles: (id: string, paths: string[]) => Promise<void>
  setCommitMessage: (id: string, message: string) => void
  refreshBranches: (id: string) => Promise<void>
  refreshUnpushedCommitCount: (id: string) => Promise<void>
  createBranch: (id: string, branchName: string) => Promise<void>
  commitChanges: (id: string, message: string) => Promise<void>
  pushChanges: (id: string) => Promise<void>
  pullChanges: (id: string) => Promise<void>
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
  stageAllFiles: (id: string) => Promise<void>
  unstageAllFiles: (id: string) => Promise<void>
  setSearchQuery: (id: string, query: string) => void
  setSearchOpen: (id: string, isOpen: boolean) => void
  clearRepositories: () => void
  toggleExplorer: (id: string) => Promise<void>
  toggleExplorerDirectory: (id: string, relativePath: string) => Promise<void>
  loadExplorerDirectory: (id: string, relativePath: string) => Promise<void>
  setOpenWithTarget: (id: string, target: RepositoryNode | null) => void
  refreshWorktrees: (id: string) => Promise<void>
  switchWorktree: (id: string, path: string) => Promise<void>
  createWorktree: (id: string, path: string, branch: string) => Promise<void>
  removeWorktree: (id: string, path: string) => Promise<void>
  toggleWorktree: (id: string) => void
}

const normalizePath = (p: string): string => {
  if (!p) return ''
  let normalized = p.replace(/\\/g, '/')
  // Remove trailing slashes except for Windows drive roots (e.g., C:/)
  if (normalized.length > 3 && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '')
  }
  if (normalized === '') normalized = '/'
  return normalized
}

export const useGitStore = create<GitState & GitActions>((set, get) => ({
  repositories: {},
  activeRepoId: null,
  toast: null,

  addRepository: (rawPath) => {
    if (!rawPath || !rawPath.trim()) return

    const path = normalizePath(rawPath)
    set((state) => {
      if (state.repositories[path]) {
        return { activeRepoId: path }
      }

      const name = rawPath.split(/[\\/]/).filter(Boolean).pop() || 'Root'
      const newRepo: RepositorySlice = {
        path: rawPath,
        name,
        currentBranch: 'loading...',
        files: [],
        selectedFilePath: null,
        selectedFilePaths: [],
        diffContent: null,
        isDiffLoading: false,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastSyncedAt: Date.now(),
        branches: [],
        unpushedCommitCount: 0,
        commitMessage: '',
        searchQuery: '',
        isSearchOpen: false,
        isExplorerOpen: false,
        explorerChildren: {},
        expandedDirectories: [],
        explorerLoading: {},
        explorerErrors: {},
        openWithTarget: null
        ,worktrees: []
        ,activeWorktreePath: path
        ,isWorktreeOpen: false
        ,isWorktreeLoading: false
      }

      return {
        repositories: { ...state.repositories, [path]: newRepo },
        activeRepoId: path
      }
    })

    // Save to storage
    const repoPaths = Object.values(get().repositories).map((r) => r.path)
    window.api.git.storeRepositories(repoPaths)

    // Trigger refreshes
    get().refreshBranch(path)
    get().refreshStatus(path)
    get().refreshBranches(path)
    get().refreshUnpushedCommitCount(path)
    get().refreshWorktrees(path)
  },

  setActiveRepository: (id) => {
    if (id === get().activeRepoId) return
    set({ activeRepoId: id })
    if (id) {
      get().refreshBranch(id)
      get().refreshStatus(id)
      get().refreshBranches(id)
      get().refreshUnpushedCommitCount(id)
      get().refreshWorktrees(id)
    }
  },

  removeRepository: (id) => {
    // Close terminal process on backend
    try {
      window.api.terminal.close(id)
    } catch (err) {
      console.error('Failed to close terminal on repo remove:', err)
    }

    set((state) => {
      const repoIds = Object.keys(state.repositories)
      const currentIndex = repoIds.indexOf(id)

      const nextRepositories = { ...state.repositories }
      delete nextRepositories[id]

      let nextActiveId = state.activeRepoId
      if (state.activeRepoId === id) {
        const remainingIds = Object.keys(nextRepositories)
        if (remainingIds.length === 0) {
          nextActiveId = null
        } else {
          const nextIndex = Math.min(currentIndex, remainingIds.length - 1)
          nextActiveId = remainingIds[nextIndex]
        }
      }

      return {
        repositories: nextRepositories,
        activeRepoId: nextActiveId
      }
    })

    // Save to storage
    const repoPaths = Object.values(get().repositories).map((r) => r.path)
    window.api.git.storeRepositories(repoPaths)
  },

  updateRepositoryState: (id, updates) =>
    set((state) => {
      const pathId = normalizePath(id)
      if (!state.repositories[pathId]) return state

      return {
        repositories: {
          ...state.repositories,
          [pathId]: { ...state.repositories[pathId], ...updates }
        }
      }
    }),

  refreshBranch: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.isRefreshing) return

    set((state) => ({
      repositories: {
        ...state.repositories,
        [pathId]: { ...state.repositories[pathId], isRefreshing: true }
      }
    }))

    try {
      const response = await window.api.git.getCurrentBranch(repo.activeWorktreePath)
      if (response.success) {
        get().updateRepositoryState(pathId, {
          currentBranch: response.data || 'unknown',
          isRefreshing: false,
          lastSyncedAt: Date.now()
        })
        get().refreshUnpushedCommitCount(pathId)
      } else {
        get().updateRepositoryState(pathId, {
          currentBranch: 'error',
          error: response.error || 'Failed to get branch',
          isRefreshing: false
        })
        get().showToast(response.error || 'Failed to get branch', 'error')
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, {
        currentBranch: 'error',
        error: err.message,
        isRefreshing: false
      })
      get().showToast(err.message, 'error')
    }
  },

  refreshStatus: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.isLoading) return

    set((state) => ({
      repositories: {
        ...state.repositories,
        [pathId]: { ...state.repositories[pathId], isLoading: true }
      }
    }))

    try {
      const response = await window.api.git.getStatus(repo.activeWorktreePath)
      if (response.success) {
        const files = response.data || []
        const availablePaths = new Set(files.map((file) => file.path))
        const selectedFilePaths = repo.selectedFilePaths.filter((path) => availablePaths.has(path))
        const selectedFilePath =
          repo.selectedFilePath && availablePaths.has(repo.selectedFilePath)
            ? repo.selectedFilePath
            : selectedFilePaths[0] || null

        get().updateRepositoryState(pathId, {
          files,
          selectedFilePath,
          selectedFilePaths,
          diffContent: selectedFilePath === repo.selectedFilePath ? repo.diffContent : null,
          isLoading: false,
          lastSyncedAt: Date.now()
        })

        if (selectedFilePath && selectedFilePath !== repo.selectedFilePath) {
          get().fetchDiff(pathId, selectedFilePath)
        }
      } else {
        get().updateRepositoryState(pathId, {
          error: response.error || 'Failed to get status',
          isLoading: false
        })
        get().showToast(response.error || 'Failed to get status', 'error')
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, {
        error: err.message,
        isLoading: false
      })
      get().showToast(err.message, 'error')
    }
  },

  refreshRepository: async (id) => {
    const pathId = normalizePath(id)
    await Promise.all([
      get().refreshBranch(pathId),
      get().refreshStatus(pathId),
      get().refreshBranches(pathId),
      get().refreshUnpushedCommitCount(pathId)
    ])
  },

  selectFile: (id, filePath, multiSelect = false) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    if (!filePath) {
      get().updateRepositoryState(pathId, {
        selectedFilePath: null,
        selectedFilePaths: [],
        diffContent: null
      })
      return
    }

    let selectedFilePaths: string[]
    let selectedFilePath: string | null = filePath

    if (multiSelect) {
      const isAlreadySelected = repo.selectedFilePaths.includes(filePath)
      if (isAlreadySelected) {
        selectedFilePaths = repo.selectedFilePaths.filter((path) => path !== filePath)
        selectedFilePath =
          repo.selectedFilePath === filePath ? selectedFilePaths[0] || null : repo.selectedFilePath
      } else {
        selectedFilePaths = [...repo.selectedFilePaths, filePath]
        selectedFilePath = filePath
      }

      if (selectedFilePaths.length === 0) {
        selectedFilePath = null
      }
    } else {
      selectedFilePaths = [filePath]
    }

    get().updateRepositoryState(pathId, {
      selectedFilePath,
      selectedFilePaths,
      diffContent: null
    })

    if (selectedFilePath) {
      get().fetchDiff(pathId, selectedFilePath)
    }
  },

  fetchDiff: async (id, filePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.isDiffLoading) return

    get().updateRepositoryState(pathId, { isDiffLoading: true })

    const file = repo.files.find((f) => f.path === filePath)
    if (!file) {
      get().updateRepositoryState(pathId, { isDiffLoading: false })
      return
    }

    const options = {
      staged: file.isStaged,
      untracked: file.unstagedStatus === 'untracked'
    }

    try {
      const response = await window.api.git.getDiff(repo.activeWorktreePath, filePath, options)
      if (response.success && response.data) {
        get().updateRepositoryState(pathId, {
          diffContent: response.data.lines,
          isDiffLoading: false
        })
      } else {
        get().updateRepositoryState(pathId, {
          error: response.error || 'Failed to fetch diff',
          isDiffLoading: false
        })
        get().showToast(response.error || 'Failed to fetch diff', 'error')
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, {
        error: err.message,
        isDiffLoading: false
      })
      get().showToast(err.message, 'error')
    }
  },

  stageFile: async (id, filePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    set((state) => {
      const nextFiles = state.repositories[pathId].files.map((f) =>
        f.path === filePath ? { ...f, isStaged: true } : f
      )
      return {
        repositories: {
          ...state.repositories,
          [pathId]: { ...state.repositories[pathId], files: nextFiles }
        }
      }
    })

    try {
      const response = await window.api.git.add(repo.activeWorktreePath, [filePath])
      if (!response.success) {
        get().showToast(response.error || 'Failed to stage file', 'error')
        await get().refreshStatus(pathId)
      } else {
        await get().refreshStatus(pathId)
        // Refresh diff if the staged file was currently selected
        if (repo.selectedFilePath === filePath) {
          get().fetchDiff(pathId, filePath)
        }
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
      await get().refreshStatus(pathId)
    }
  },

  unstageFile: async (id, filePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    set((state) => {
      const nextFiles = state.repositories[pathId].files.map((f) =>
        f.path === filePath ? { ...f, isStaged: false } : f
      )
      return {
        repositories: {
          ...state.repositories,
          [pathId]: { ...state.repositories[pathId], files: nextFiles }
        }
      }
    })

    try {
      const response = await window.api.git.reset(repo.activeWorktreePath, [filePath])
      if (!response.success) {
        get().showToast(response.error || 'Failed to unstage file', 'error')
        await get().refreshStatus(pathId)
      } else {
        await get().refreshStatus(pathId)
        // Refresh diff if the unstaged file was currently selected
        if (repo.selectedFilePath === filePath) {
          get().fetchDiff(pathId, filePath)
        }
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
      await get().refreshStatus(pathId)
    }
  },

  revertFiles: async (id, paths) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    const uniquePaths = Array.from(new Set(paths)).filter(Boolean)
    if (!repo || uniquePaths.length === 0) return

    try {
      const response = await window.api.git.revertChanges(repo.activeWorktreePath, uniquePaths)
      if (response.success) {
        get().showToast(
          uniquePaths.length === 1 ? 'Reverted 1 file' : `Reverted ${uniquePaths.length} files`,
          'success'
        )
      } else {
        get().showToast(response.error || 'Failed to revert files', 'error')
      }
      await get().refreshStatus(pathId)
    } catch (err: any) {
      get().showToast(err.message, 'error')
      await get().refreshStatus(pathId)
    }
  },

  setCommitMessage: (id, message) => {
    get().updateRepositoryState(id, { commitMessage: message })
  },

  refreshBranches: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    try {
      const response = await window.api.git.getBranches(repo.activeWorktreePath)
      if (response.success && response.data) {
        get().updateRepositoryState(pathId, {
          branches: response.data,
          lastSyncedAt: Date.now()
        })
      } else {
        get().showToast(response.error || 'Failed to get branches', 'error')
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
    }
  },

  refreshUnpushedCommitCount: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (
      !repo ||
      !repo.currentBranch ||
      repo.currentBranch === 'loading...' ||
      repo.currentBranch === 'error'
    )
      return

    try {
      const response = await window.api.git.getUnpushedCommitCount(repo.activeWorktreePath, repo.currentBranch)
      if (response.success) {
        get().updateRepositoryState(pathId, {
          unpushedCommitCount: response.data || 0,
          lastSyncedAt: Date.now()
        })
      } else {
        get().updateRepositoryState(pathId, { unpushedCommitCount: 0 })
      }
    } catch {
      get().updateRepositoryState(pathId, { unpushedCommitCount: 0 })
    }
  },

  createBranch: async (id, branchName) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    try {
      const response = await window.api.git.createBranch(repo.activeWorktreePath, branchName)
      if (response.success) {
        get().showToast(`Branch "${branchName}" created and checked out!`, 'success')
        await get().refreshRepository(pathId)
      } else {
        get().showToast(response.error || 'Failed to create branch', 'error')
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
    }
  },

  commitChanges: async (id, message) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    try {
      const response = await window.api.git.commit(repo.activeWorktreePath, message)
      if (response.success) {
        get().showToast('Changes committed successfully!', 'success')
        get().updateRepositoryState(pathId, { commitMessage: '' }) // Clear draft
        await get().refreshStatus(pathId)
        await get().refreshUnpushedCommitCount(pathId)
      } else {
        get().showToast(response.error || 'Failed to commit changes', 'error')
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
    }
  },

  pushChanges: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    try {
      const response = await window.api.git.push(repo.activeWorktreePath, repo.currentBranch)
      if (response.success) {
        get().showToast(`Pushed "${repo.currentBranch}" upstream!`, 'success')
        await get().refreshRepository(pathId)
        await get().refreshUnpushedCommitCount(pathId)
      } else {
        get().showToast(response.error || 'Failed to push changes', 'error')
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
    }
  },

  pullChanges: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    try {
      const response = await window.api.git.pull(repo.activeWorktreePath)
      if (response.success) {
        get().showToast(`Pulled changes successfully!`, 'success')
        await get().refreshRepository(pathId)
        await get().refreshUnpushedCommitCount(pathId)
      } else {
        get().showToast(response.error || 'Failed to pull changes', 'error')
      }
    } catch (err: any) {
      get().showToast(err.message, 'error')
    }
  },

  refreshWorktrees: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return
    get().updateRepositoryState(pathId, { isWorktreeLoading: true })
    try {
      const response = await window.api.git.getWorktrees(repo.path)
      if (response.success) {
        const worktrees = response.data || []
        const active = worktrees.find((worktree) => normalizePath(worktree.path) === normalizePath(repo.activeWorktreePath))
        get().updateRepositoryState(pathId, { worktrees, activeWorktreePath: active?.path || repo.activeWorktreePath, isWorktreeLoading: false })
      } else throw new Error(response.error || 'Failed to load worktrees')
    } catch (error: any) {
      get().updateRepositoryState(pathId, { isWorktreeLoading: false })
      get().showToast(error.message, 'error')
    }
  },

  switchWorktree: async (id, path) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || !path) return
    get().updateRepositoryState(pathId, { activeWorktreePath: path, isWorktreeOpen: false, explorerChildren: {}, expandedDirectories: [] })
    await get().refreshRepository(pathId)
    get().showToast(`Switched to worktree "${path.split(/[\\/]/).pop()}"`, 'success')
  },

  createWorktree: async (id, path, branch) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || !path.trim() || !branch.trim()) return
    const response = await window.api.git.addWorktree(repo.path, path.trim(), branch.trim())
    if (response.success) {
      get().showToast(`Worktree created for "${branch}"`, 'success')
      await get().refreshWorktrees(pathId)
    } else get().showToast(response.error || 'Failed to create worktree', 'error')
  },

  removeWorktree: async (id, path) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    const worktree = repo?.worktrees.find((item) => normalizePath(item.path) === normalizePath(path))
    if (!repo || !worktree || worktree.isMain) return
    const response = await window.api.git.removeWorktree(repo.path, path)
    if (response.success) {
      if (normalizePath(repo.activeWorktreePath) === normalizePath(path)) {
        const main = repo.worktrees.find((item) => item.isMain)
        if (main) await get().switchWorktree(pathId, main.path)
      }
      await get().refreshWorktrees(pathId)
      get().showToast('Worktree removed', 'success')
    } else get().showToast(response.error || 'Failed to remove worktree', 'error')
  },

  toggleWorktree: (id) => {
    const repo = get().repositories[normalizePath(id)]
    if (repo) get().updateRepositoryState(id, { isWorktreeOpen: !repo.isWorktreeOpen })
  },

  showToast: (message, type = 'info') => {
    set({
      toast: {
        message,
        type,
        id: Math.random().toString(36).substring(2, 9)
      }
    })
  },

  clearToast: () => {
    set({ toast: null })
  },

  clearRepositories: () => {
    Object.keys(get().repositories).forEach((id) => {
      try {
        window.api.terminal.close(id)
      } catch (err) {
        console.error('Failed to close terminal on repo clear:', err)
      }
    })

    set({ repositories: {}, activeRepoId: null })
    window.api.git.storeRepositories([])
  },

  stageAllFiles: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.files.length === 0) return

    set((state) => {
      const nextFiles = state.repositories[pathId].files.map((f) => ({ ...f, isStaged: true }))
      return {
        repositories: {
          ...state.repositories,
          [pathId]: { ...state.repositories[pathId], files: nextFiles }
        }
      }
    })

    try {
      const response = await window.api.git.add(repo.activeWorktreePath, ['.'])
      if (!response.success) {
        get().showToast(response.error || 'Failed to stage files', 'error')
      }
      await get().refreshStatus(pathId)
    } catch (err: any) {
      get().showToast(err.message, 'error')
      await get().refreshStatus(pathId)
    }
  },

  unstageAllFiles: async (id) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.files.length === 0) return

    set((state) => {
      const nextFiles = state.repositories[pathId].files.map((f) => ({ ...f, isStaged: false }))
      return {
        repositories: {
          ...state.repositories,
          [pathId]: { ...state.repositories[pathId], files: nextFiles }
        }
      }
    })

    try {
      const response = await window.api.git.reset(repo.activeWorktreePath, ['.'])
      if (!response.success) {
        get().showToast(response.error || 'Failed to unstage files', 'error')
      }
      await get().refreshStatus(pathId)
    } catch (err: any) {
      get().showToast(err.message, 'error')
      await get().refreshStatus(pathId)
    }
  },

  setSearchQuery: (id, query) => {
    get().updateRepositoryState(id, { searchQuery: query })
  },

  setSearchOpen: (id, isOpen) => {
    get().updateRepositoryState(id, { isSearchOpen: isOpen })
  },

  toggleExplorer: async (id) => {
    const repo = get().repositories[normalizePath(id)]
    if (!repo) return
    get().updateRepositoryState(id, { isExplorerOpen: !repo.isExplorerOpen })
    if (!repo.isExplorerOpen && !repo.explorerChildren[''])
      await get().loadExplorerDirectory(id, '')
  },

  loadExplorerDirectory: async (id, relativePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo || repo.explorerLoading[relativePath]) return
    get().updateRepositoryState(pathId, {
      explorerLoading: { ...repo.explorerLoading, [relativePath]: true },
      explorerErrors: { ...repo.explorerErrors, [relativePath]: '' }
    })
    try {
      const response = await window.api.explorer.readDirectory(repo.activeWorktreePath, relativePath)
      const current = get().repositories[pathId]
      if (!current || current.activeWorktreePath !== repo.activeWorktreePath) return
      if (response.success) {
        get().updateRepositoryState(pathId, {
          explorerChildren: { ...current.explorerChildren, [relativePath]: response.data || [] },
          explorerLoading: { ...current.explorerLoading, [relativePath]: false }
        })
      } else {
        const message = response.error || 'Unable to load directory'
        get().updateRepositoryState(pathId, {
          explorerErrors: { ...current.explorerErrors, [relativePath]: message },
          explorerLoading: { ...current.explorerLoading, [relativePath]: false }
        })
        get().showToast(message, 'error')
      }
    } catch (error: unknown) {
      const current = get().repositories[pathId]
      if (!current || current.activeWorktreePath !== repo.activeWorktreePath) return
      const message = error instanceof Error ? error.message : 'Unable to load directory'
      get().updateRepositoryState(pathId, {
        explorerErrors: { ...current.explorerErrors, [relativePath]: message },
        explorerLoading: { ...current.explorerLoading, [relativePath]: false }
      })
      get().showToast(message, 'error')
    }
  },

  toggleExplorerDirectory: async (id, relativePath) => {
    const repo = get().repositories[normalizePath(id)]
    if (!repo) return
    const expanded = repo.expandedDirectories.includes(relativePath)
    get().updateRepositoryState(id, {
      expandedDirectories: expanded
        ? repo.expandedDirectories.filter((item) => item !== relativePath)
        : [...repo.expandedDirectories, relativePath]
    })
    if (!expanded && !repo.explorerChildren[relativePath])
      await get().loadExplorerDirectory(id, relativePath)
  },

  setOpenWithTarget: (id, target) => {
    get().updateRepositoryState(id, { openWithTarget: target })
  }
}))

export const useActiveRepo = () => {
  const { repositories, activeRepoId } = useGitStore()
  return activeRepoId ? repositories[activeRepoId] || null : null
}
