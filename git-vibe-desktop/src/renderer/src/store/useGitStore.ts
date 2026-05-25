import { create } from 'zustand'
import { GitRepository, GitFile } from '../../../shared/types/GitModels'

export interface RepositorySlice extends GitRepository {
  files: GitFile[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastSyncedAt: number | null
}

export interface GitState {
  repositories: Record<string, RepositorySlice>
  activeRepoId: string | null
}

export interface GitActions {
  addRepository: (path: string) => void
  setActiveRepository: (id: string | null) => void
  removeRepository: (id: string) => void
  updateRepositoryState: (id: string, updates: Partial<RepositorySlice>) => void
  refreshBranch: (id: string) => Promise<void>
  refreshStatus: (id: string) => Promise<void>
  stageFile: (id: string, path: string) => Promise<void>
  unstageFile: (id: string, path: string) => Promise<void>
}

const normalizePath = (p: string): string => {
  if (!p) return ''
  let normalized = p.replace(/\\/g, '/')
  // Remove trailing slashes except for Windows drive roots (e.g., C:/)
  if (normalized.length > 3 && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '')
  }
  if (normalized === '') normalized = '/'
  // Note: We no longer lowercase to prevent collisions on case-sensitive filesystems
  return normalized
}

export const useGitStore = create<GitState & GitActions>((set, get) => ({
  repositories: {},
  activeRepoId: null,

  addRepository: (rawPath) => {
    if (!rawPath || !rawPath.trim()) return

    const path = normalizePath(rawPath)
    set((state) => {
      if (state.repositories[path]) {
        return { activeRepoId: path }
      }

      const name = rawPath.split(/[\\/]/).filter(Boolean).pop() || 'Root'
      const newRepo: RepositorySlice = {
        path: rawPath, // Store the original path for display/commands
        name,
        currentBranch: 'loading...',
        files: [],
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastSyncedAt: Date.now()
      }

      return {
        repositories: { ...state.repositories, [path]: newRepo },
        activeRepoId: path
      }
    })
    
    // Trigger branch and status refresh
    get().refreshBranch(path)
    get().refreshStatus(path)
  },

  setActiveRepository: (id) => {
    if (id === get().activeRepoId) return
    set({ activeRepoId: id })
    if (id) {
      get().refreshBranch(id)
      get().refreshStatus(id)
    }
  },

  removeRepository: (id) =>
    set((state) => {
      const repoIds = Object.keys(state.repositories)
      const currentIndex = repoIds.indexOf(id)
      
      const nextRepositories = { ...state.repositories }
      delete nextRepositories[id]

      let nextActiveId = state.activeRepoId
      if (state.activeRepoId === id) {
        // Find adjacent tab: prefer the one to the right, otherwise the one to the left
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
    }),

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
      const response = await window.api.git.getCurrentBranch(repo.path)
      if (response.success) {
        get().updateRepositoryState(pathId, { 
          currentBranch: response.data || 'unknown',
          isRefreshing: false,
          lastSyncedAt: Date.now()
        })
      } else {
        get().updateRepositoryState(pathId, { 
          currentBranch: 'error',
          error: response.error || 'Failed to get branch',
          isRefreshing: false
        })
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, { 
        currentBranch: 'error',
        error: err.message,
        isRefreshing: false
      })
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
      const response = await window.api.git.getStatus(repo.path)
      if (response.success) {
        get().updateRepositoryState(pathId, { 
          files: response.data || [],
          isLoading: false,
          lastSyncedAt: Date.now()
        })
      } else {
        get().updateRepositoryState(pathId, { 
          error: response.error || 'Failed to get status',
          isLoading: false
        })
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, { 
        error: err.message,
        isLoading: false
      })
    }
  },

  stageFile: async (id, filePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    // Optimistic update
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
      const response = await window.api.git.add(repo.path, [filePath])
      if (!response.success) {
        get().updateRepositoryState(pathId, { error: response.error || 'Failed to stage file' })
        await get().refreshStatus(pathId) // Rollback by refreshing
      } else {
        await get().refreshStatus(pathId) // Sync state
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, { error: err.message })
      await get().refreshStatus(pathId)
    }
  },

  unstageFile: async (id, filePath) => {
    const pathId = normalizePath(id)
    const repo = get().repositories[pathId]
    if (!repo) return

    // Optimistic update
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
      const response = await window.api.git.reset(repo.path, [filePath])
      if (!response.success) {
        get().updateRepositoryState(pathId, { error: response.error || 'Failed to unstage file' })
        await get().refreshStatus(pathId)
      } else {
        await get().refreshStatus(pathId)
      }
    } catch (err: any) {
      get().updateRepositoryState(pathId, { error: err.message })
      await get().refreshStatus(pathId)
    }
  }
}))

// Derived selector for active repository
export const useActiveRepo = () => {
  const { repositories, activeRepoId } = useGitStore()
  return activeRepoId ? repositories[activeRepoId] || null : null
}
