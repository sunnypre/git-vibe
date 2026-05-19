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
}

const normalizePath = (p: string): string => {
  const normalized = p.replace(/\\/g, '/').replace(/\/+$/, '')
  // On Windows, paths are case-insensitive. We normalize to lowercase for the ID
  // but we could also preserve the original path in the object if needed.
  return normalized.toLowerCase()
}

export const useGitStore = create<GitState & GitActions>((set, get) => ({
  repositories: {},
  activeRepoId: null,

  addRepository: (rawPath) => {
    const path = normalizePath(rawPath)
    set((state) => {
      if (state.repositories[path]) {
        return { activeRepoId: path }
      }

      const name = rawPath.split(/[\\/]/).filter(Boolean).pop() || 'Root'
      const newRepo: RepositorySlice = {
        path: rawPath, // Store the original path for display/commands
        name,
        currentBranch: 'unknown',
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
  },

  setActiveRepository: (id) =>
    set({ activeRepoId: id }),

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
    })
}))

// Derived selector for active repository
export const useActiveRepo = () => {
  const { repositories, activeRepoId } = useGitStore()
  return activeRepoId ? repositories[activeRepoId] || null : null
}
