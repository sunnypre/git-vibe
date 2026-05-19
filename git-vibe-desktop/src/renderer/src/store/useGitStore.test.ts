import { describe, it, expect, beforeEach } from 'vitest'
import { useGitStore } from './useGitStore'

describe('useGitStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useGitStore.setState({ repositories: {}, activeRepoId: null })
  })

  it('should start with an empty state', () => {
    const state = useGitStore.getState()
    expect(state.repositories).toEqual({})
    expect(state.activeRepoId).toBeNull()
  })

  it('should add a repository and set it as active', () => {
    const { addRepository } = useGitStore.getState()
    const path = '/path/to/repo'

    addRepository(path)

    const state = useGitStore.getState()
    expect(state.repositories[path]).toBeDefined()
    expect(state.repositories[path].path).toBe(path)
    expect(state.activeRepoId).toBe(path)
  })

  it('should switch between active repositories', () => {
    const { addRepository, setActiveRepository } = useGitStore.getState()
    const path1 = '/repo/1'
    const path2 = '/repo/2'

    addRepository(path1)
    addRepository(path2)

    expect(useGitStore.getState().activeRepoId).toBe(path2)

    setActiveRepository(path1)
    expect(useGitStore.getState().activeRepoId).toBe(path1)
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
})
