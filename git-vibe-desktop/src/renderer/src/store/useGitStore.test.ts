import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGitStore } from './useGitStore'

// Mock window.api
const mockGetCurrentBranch = vi.fn()
const mockGetStatus = vi.fn()
vi.stubGlobal('window', {
  api: {
    git: {
      getCurrentBranch: mockGetCurrentBranch,
      getStatus: mockGetStatus
    }
  }
})

describe('useGitStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGitStore.setState({ repositories: {}, activeRepoId: null })
    vi.clearAllMocks()
    mockGetCurrentBranch.mockResolvedValue({ success: true, data: 'main' })
    mockGetStatus.mockResolvedValue({ success: true, data: [] })
  })

  it('should start with an empty state', () => {
    const state = useGitStore.getState()
    expect(state.repositories).toEqual({})
    expect(state.activeRepoId).toBeNull()
  })

  it('should add a repository and set it as active', async () => {
    const { addRepository } = useGitStore.getState()
    const path = '/path/to/repo'

    addRepository(path)

    const state = useGitStore.getState()
    expect(state.repositories[path]).toBeDefined()
    expect(state.repositories[path].path).toBe(path)
    expect(state.activeRepoId).toBe(path)
    
    // addRepository triggers an async refreshBranch
    expect(mockGetCurrentBranch).toHaveBeenCalledWith(path)
  })

  it('should switch between active repositories and refresh branch', async () => {
    const { addRepository, setActiveRepository } = useGitStore.getState()
    const path1 = '/repo/1'
    const path2 = '/repo/2'

    addRepository(path1)
    addRepository(path2)
    
    // Wait for the async refreshes triggered by addRepository to clear the isRefreshing flag
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(mockGetCurrentBranch).toHaveBeenCalledTimes(2)

    setActiveRepository(path1)
    expect(useGitStore.getState().activeRepoId).toBe(path1)
    
    // Wait for the async refresh triggered by setActiveRepository
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockGetCurrentBranch).toHaveBeenCalledTimes(3)
  })

  it('should remove a repository', () => {
    const { addRepository, removeRepository } = useGitStore.getState()
    const path = '/repo/to/remove'

    addRepository(path)
    expect(useGitStore.getState().repositories[path]).toBeDefined()

    removeRepository(path)
    expect(useGitStore.getState().repositories[path]).toBeUndefined()
    expect(useGitStore.getState().activeRepoId).toBeNull()
  })

  it('should update branch when refreshBranch is called', async () => {
    const { addRepository, refreshBranch } = useGitStore.getState()
    const path = '/repo/test'
    
    mockGetCurrentBranch.mockResolvedValueOnce({ success: true, data: 'feature-branch' })
    
    addRepository(path)
    
    // Wait for the async refresh triggered by addRepository
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(useGitStore.getState().repositories[path].currentBranch).toBe('feature-branch')
    
    mockGetCurrentBranch.mockResolvedValueOnce({ success: true, data: 'main' })
    await refreshBranch(path)
    
    expect(useGitStore.getState().repositories[path].currentBranch).toBe('main')
  })

  it('should handle branch detection errors', async () => {
    const { addRepository } = useGitStore.getState()
    const path = '/repo/error'
    
    mockGetCurrentBranch.mockResolvedValueOnce({ success: false, error: 'Git not found' })
    
    addRepository(path)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(useGitStore.getState().repositories[path].currentBranch).toBe('error')
    expect(useGitStore.getState().repositories[path].error).toBe('Git not found')
  })

  it('should update files when refreshStatus is called', async () => {
    const { addRepository, refreshStatus } = useGitStore.getState()
    const path = '/repo/status-test'
    const mockFiles = [{ path: 'file1.txt', stagedStatus: 'modified', unstagedStatus: 'none', isStaged: true }]
    
    mockGetStatus.mockResolvedValueOnce({ success: true, data: mockFiles })
    
    addRepository(path)
    
    // Wait for the async refresh triggered by addRepository
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(useGitStore.getState().repositories[path].files).toEqual(mockFiles)
    
    const updatedFiles = [...mockFiles, { path: 'file2.txt', stagedStatus: 'none', unstagedStatus: 'added', isStaged: false }]
    mockGetStatus.mockResolvedValueOnce({ success: true, data: updatedFiles })
    await refreshStatus(path)
    
    expect(useGitStore.getState().repositories[path].files).toEqual(updatedFiles)
  })
})
