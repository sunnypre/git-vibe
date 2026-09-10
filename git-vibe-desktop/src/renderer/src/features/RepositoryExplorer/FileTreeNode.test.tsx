import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RepositoryNode } from '../../../../shared/types/RepositoryExplorerModels'
import { useGitStore } from '../../store/useGitStore'
import { FileTreeNode } from './FileTreeNode'

const directory: RepositoryNode = {
  name: 'packages',
  relativePath: 'packages',
  kind: 'directory',
  mayHaveChildren: true
}

const file: RepositoryNode = {
  name: 'README.md',
  relativePath: 'README.md',
  kind: 'file',
  mayHaveChildren: false
}

const openPath = vi.fn()
const openInFileManager = vi.fn()
const toggleDirectory = vi.fn()

describe('FileTreeNode directory actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    openPath.mockResolvedValue({ success: true })
    openInFileManager.mockResolvedValue({ success: true })
    window.api.explorer.openPath = openPath
    window.api.explorer.openInFileManager = openInFileManager

    useGitStore.setState({ repositories: {}, activeRepoId: null, toast: null })
    useGitStore.getState().addRepository('/repo')
    useGitStore.getState().updateRepositoryState('/repo', {
      explorerChildren: {},
      expandedDirectories: [],
      explorerLoading: {},
      explorerErrors: {}
    })
    useGitStore.setState({ toggleExplorerDirectory: toggleDirectory })
  })

  it('shows the VS Code and native file-manager controls only for folders', () => {
    const { rerender } = render(<FileTreeNode repoId="/repo" node={directory} depth={0} />)

    expect(screen.getByRole('button', { name: 'Open packages with VS Code' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open packages in file manager' })
    ).toBeInTheDocument()

    rerender(<FileTreeNode repoId="/repo" node={file} depth={0} />)
    expect(screen.queryByRole('button', { name: /VS Code/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /file manager/ })).not.toBeInTheDocument()
  })

  it('launches a folder in VS Code without toggling it', async () => {
    render(<FileTreeNode repoId="/repo" node={directory} depth={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open packages with VS Code' }))

    await waitFor(() =>
      expect(openPath).toHaveBeenCalledWith({
        repositoryRoot: '/repo',
        relativePath: 'packages',
        kind: 'directory',
        applicationId: 'vscode'
      })
    )
    expect(toggleDirectory).not.toHaveBeenCalled()
    expect(useGitStore.getState().toast).toMatchObject({
      message: 'Opened packages with VS Code',
      type: 'success'
    })
  })

  it('launches a folder in the native file manager without toggling it', async () => {
    render(<FileTreeNode repoId="/repo" node={directory} depth={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open packages in file manager' }))

    await waitFor(() => expect(openInFileManager).toHaveBeenCalledWith('/repo', 'packages'))
    expect(toggleDirectory).not.toHaveBeenCalled()
    expect(useGitStore.getState().toast).toMatchObject({
      message: 'Opened packages in file manager',
      type: 'success'
    })
  })

  it.each([
    ['VS Code', openPath, 'Open packages with VS Code'],
    ['file manager', openInFileManager, 'Open packages in file manager']
  ])('surfaces %s launch failures', async (_, launch, accessibleName) => {
    launch.mockResolvedValueOnce({ success: false, error: 'Launch denied' })
    render(<FileTreeNode repoId="/repo" node={directory} depth={0} />)
    fireEvent.click(screen.getByRole('button', { name: accessibleName }))

    await waitFor(() =>
      expect(useGitStore.getState().toast).toMatchObject({
        message: 'Launch denied',
        type: 'error'
      })
    )
    expect(toggleDirectory).not.toHaveBeenCalled()
  })
})
