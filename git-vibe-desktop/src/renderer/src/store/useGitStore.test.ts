import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGitStore } from './useGitStore'

// Mock window.api
const mockGetCurrentBranch = vi.fn()
const mockGetStatus = vi.fn()
const mockGetBranches = vi.fn()
const mockCreateBranch = vi.fn()
const mockCommit = vi.fn()
const mockPush = vi.fn()
const mockGetStoredRepositories = vi.fn()
const mockStoreRepositories = vi.fn()
const mockTerminalClose = vi.fn()
const mockAdd = vi.fn()
const mockReset = vi.fn()
const mockRevertChanges = vi.fn()

vi.stubGlobal('window', {
  api: {
    git: {
      getCurrentBranch: mockGetCurrentBranch,
      getStatus: mockGetStatus,
      getBranches: mockGetBranches,
      createBranch: mockCreateBranch,
      commit: mockCommit,
      push: mockPush,
      getStoredRepositories: mockGetStoredRepositories,
      storeRepositories: mockStoreRepositories,
      add: mockAdd,
      reset: mockReset,
      revertChanges: mockRevertChanges
    },
    terminal: {
      close: mockTerminalClose
    }
  }
})

describe('useGitStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGitStore.setState({ repositories: {}, activeRepoId: null, toast: null })
    vi.clearAllMocks()
    mockGetCurrentBranch.mockResolvedValue({ success: true, data: 'main' })
    mockGetStatus.mockResolvedValue({ success: true, data: [] })
    mockGetBranches.mockResolvedValue({ success: true, data: ['main', 'dev'] })
    mockCreateBranch.mockResolvedValue({ success: true })
    mockCommit.mockResolvedValue({ success: true })
    mockPush.mockResolvedValue({ success: true })
    mockGetStoredRepositories.mockResolvedValue({ success: true, data: [] })
    mockStoreRepositories.mockResolvedValue({ success: true })
    mockAdd.mockResolvedValue({ success: true })
    mockReset.mockResolvedValue({ success: true })
    mockRevertChanges.mockResolvedValue({ success: true })
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

  it('should remove a repository and close terminal process', () => {
    const { addRepository, removeRepository } = useGitStore.getState()
    const path = '/repo/to/remove'

    addRepository(path)
    expect(useGitStore.getState().repositories[path]).toBeDefined()

    removeRepository(path)
    expect(useGitStore.getState().repositories[path]).toBeUndefined()
    expect(useGitStore.getState().activeRepoId).toBeNull()
    expect(mockTerminalClose).toHaveBeenCalledWith(path)
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

  it('should handle branch detection errors and trigger toast', async () => {
    const { addRepository } = useGitStore.getState()
    const path = '/repo/error'
    
    mockGetCurrentBranch.mockResolvedValueOnce({ success: false, error: 'Git not found' })
    
    addRepository(path)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(useGitStore.getState().repositories[path].currentBranch).toBe('error')
    expect(useGitStore.getState().repositories[path].error).toBe('Git not found')
    expect(useGitStore.getState().toast?.type).toBe('error')
    expect(useGitStore.getState().toast?.message).toBe('Git not found')
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

  it('should set and retrieve commit message draft', () => {
    const { addRepository, setCommitMessage } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    setCommitMessage(path, 'feat: add awesome features')
    expect(useGitStore.getState().repositories[path].commitMessage).toBe('feat: add awesome features')
  })

  it('should refresh branch list when refreshBranches is called', async () => {
    const { addRepository } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(useGitStore.getState().repositories[path].branches).toEqual(['main', 'dev'])
  })

  it('should call api.git.commit and clear commit message on success', async () => {
    const { addRepository, setCommitMessage, commitChanges } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)
    setCommitMessage(path, 'feat: commit message')

    await commitChanges(path, 'feat: commit message')

    expect(mockCommit).toHaveBeenCalledWith(path, 'feat: commit message')
    expect(useGitStore.getState().repositories[path].commitMessage).toBe('')
    expect(useGitStore.getState().toast?.message).toContain('committed successfully')
  })

  it('should trigger error toast on commit failure', async () => {
    const { addRepository, commitChanges } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)
    
    mockCommit.mockResolvedValueOnce({ success: false, error: 'Commit validation failed' })

    await commitChanges(path, 'feat: failed commit')

    expect(useGitStore.getState().toast?.type).toBe('error')
    expect(useGitStore.getState().toast?.message).toBe('Commit validation failed')
  })

  it('should call api.git.push on pushChanges and show toast success', async () => {
    const { addRepository, pushChanges } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)
    
    await new Promise(resolve => setTimeout(resolve, 0))

    await pushChanges(path)

    expect(mockPush).toHaveBeenCalledWith(path, 'main')
    expect(useGitStore.getState().toast?.type).toBe('success')
  })

  it('should stage all files optimistically and call window.api.git.add', async () => {
    const { addRepository, stageAllFiles } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    const initialFiles = [
      { path: 'a.js', stagedStatus: 'none' as any, unstagedStatus: 'modified' as any, isStaged: false },
      { path: 'b.js', stagedStatus: 'none' as any, unstagedStatus: 'added' as any, isStaged: false }
    ]
    useGitStore.getState().updateRepositoryState(path, { files: initialFiles })

    await stageAllFiles(path)

    expect(useGitStore.getState().repositories[path].files.every(f => f.isStaged)).toBe(true)
    expect(mockAdd).toHaveBeenCalledWith(path, ['.'])
  })

  it('should unstage all files optimistically and call window.api.git.reset', async () => {
    const { addRepository, unstageAllFiles } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    const initialFiles = [
      { path: 'a.js', stagedStatus: 'modified' as any, unstagedStatus: 'none' as any, isStaged: true },
      { path: 'b.js', stagedStatus: 'added' as any, unstagedStatus: 'none' as any, isStaged: true }
    ]
    useGitStore.getState().updateRepositoryState(path, { files: initialFiles })

    await unstageAllFiles(path)

    expect(useGitStore.getState().repositories[path].files.every(f => !f.isStaged)).toBe(true)
    expect(mockReset).toHaveBeenCalledWith(path, ['.'])
  })

  it('should update search query and search open state', () => {
    const { addRepository, setSearchQuery, setSearchOpen } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    setSearchOpen(path, true)
    expect(useGitStore.getState().repositories[path].isSearchOpen).toBe(true)

    setSearchQuery(path, 'hello')
    expect(useGitStore.getState().repositories[path].searchQuery).toBe('hello')
  })

  it('should support single and ctrl-style multi file selection', () => {
    const { addRepository, selectFile } = useGitStore.getState()
    const path = '/path/to/repo'
    addRepository(path)

    selectFile(path, 'a.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('a.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['a.ts'])

    selectFile(path, 'b.ts', true)
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('b.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['a.ts', 'b.ts'])

    selectFile(path, 'a.ts', true)
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('b.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['b.ts'])

    selectFile(path, 'a.ts', true)
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('a.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['b.ts', 'a.ts'])

    selectFile(path, 'b.ts', true)
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('a.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['a.ts'])

    selectFile(path, 'c.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBe('c.ts')
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['c.ts'])
  })

  it('should revert selected files through the preload API and refresh status', async () => {
    const { addRepository, revertFiles, updateRepositoryState } = useGitStore.getState()
    const path = '/path/to/repo'
    const initialFiles = [
      { path: 'a.ts', stagedStatus: 'none' as any, unstagedStatus: 'modified' as any, isStaged: false },
      { path: 'b.ts', stagedStatus: 'modified' as any, unstagedStatus: 'none' as any, isStaged: true }
    ]

    addRepository(path)
    updateRepositoryState(path, {
      files: initialFiles,
      selectedFilePath: 'a.ts',
      selectedFilePaths: ['a.ts', 'b.ts']
    })
    mockGetStatus.mockResolvedValueOnce({ success: true, data: [] })

    await revertFiles(path, ['a.ts', 'b.ts'])

    expect(mockRevertChanges).toHaveBeenCalledWith(path, ['a.ts', 'b.ts'])
    expect(useGitStore.getState().repositories[path].selectedFilePath).toBeNull()
    expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual([])
    expect(useGitStore.getState().toast?.type).toBe('success')
  })
})
