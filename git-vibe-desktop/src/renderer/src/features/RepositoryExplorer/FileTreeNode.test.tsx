import { act, render, screen, type RenderResult } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RepositoryNode } from '../../../../shared/types/RepositoryExplorerModels'
import { useGitStore } from '../../store/useGitStore'
import { FileTreeNode } from './FileTreeNode'

const repoId = '/test/repo'

function renderNode(name: string, kind: RepositoryNode['kind'] = 'file'): RenderResult {
  const node: RepositoryNode = {
    name,
    kind,
    relativePath: name,
    mayHaveChildren: kind === 'directory'
  }
  return render(<FileTreeNode repoId={repoId} node={node} depth={0} />)
}

describe('FileTreeNode actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useGitStore.setState({ repositories: {}, activeRepoId: null })
      useGitStore.getState().addRepository(repoId)
    })
  })

  it.each(['Application.sln', 'Application.SLN', 'Application.slnx', 'Application.SLNX'])(
    'shows only the Rider action for solution file %s',
    (name) => {
      renderNode(name)

      expect(screen.getByRole('button', { name: `Open ${name} with Rider` })).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: `Open ${name} with application` })
      ).not.toBeInTheDocument()
    }
  )

  it('shows no external-application actions for an ordinary file', () => {
    renderNode('README.md')

    expect(screen.queryByRole('button', { name: /with Rider/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /with application/ })).not.toBeInTheDocument()
  })

  it('shows folder actions, but no Rider action, for a directory', () => {
    renderNode('src', 'directory')

    expect(screen.getByRole('button', { name: 'Open src with application' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /with Rider/ })).not.toBeInTheDocument()
  })
})
