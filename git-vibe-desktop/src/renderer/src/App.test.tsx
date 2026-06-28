import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { expect, test, beforeEach } from 'vitest'
import { useGitStore } from './store/useGitStore'

beforeEach(() => {
  act(() => {
    useGitStore.setState({ repositories: {}, activeRepoId: null })
  })
})

test('renders the empty state and then the layout when a repo is added', () => {
  render(<App />)

  // Verify empty state
  expect(screen.getByText(/No repository active/i)).toBeInTheDocument()

  // Add a repository
  act(() => {
    useGitStore.getState().addRepository('/test/repo')
  })

  // Verify 3-pane layout headings
  expect(screen.getByText(/Changes \(/i)).toBeInTheDocument()
  expect(screen.getByText(/Diff Explorer/i)).toBeInTheDocument()
  expect(screen.getAllByText(/Terminal/i).length).toBeGreaterThan(0)
})

test('renders multiple tabs and allows switching', async () => {
  render(<App />)

  act(() => {
    useGitStore.getState().addRepository('/test/repo-1')
    useGitStore.getState().addRepository('/test/repo-2')
  })

  // Both tabs should be present
  expect(screen.getByText('repo-1')).toBeInTheDocument()
  expect(screen.getByText('repo-2')).toBeInTheDocument()

  // repo-2 should be active (since it was added last)
  expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('repo-2')

  // Switch to repo-1
  act(() => {
    useGitStore.getState().setActiveRepository('/test/repo-1')
  })

  expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('repo-1')
})

test('allows closing a tab', () => {
  render(<App />)

  act(() => {
    useGitStore.getState().addRepository('/test/repo-1')
    useGitStore.getState().addRepository('/test/repo-2')
  })

  expect(screen.getByText('repo-1')).toBeInTheDocument()
  
  // Find close button for repo-1
  // ID 1: It's now a sibling button with aria-label
  const closeBtn = screen.getByLabelText(/Close repo-1/i)
  
  act(() => {
    fireEvent.click(closeBtn)
  })

  expect(screen.queryByText('repo-1')).not.toBeInTheDocument()
  expect(screen.getByText('repo-2')).toBeInTheDocument()
})

test('automatically switches focus when active tab is closed', () => {
  render(<App />)

  act(() => {
    useGitStore.getState().addRepository('/test/repo-1')
    useGitStore.getState().addRepository('/test/repo-2')
  })

  // repo-2 is active
  expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('repo-2')

  // Close repo-2
  const closeBtn2 = screen.getByLabelText(/Close repo-2/i)

  act(() => {
    fireEvent.click(closeBtn2)
  })

  expect(screen.queryByText('repo-2')).not.toBeInTheDocument()
  // Should have switched to repo-1
  expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('repo-1')
})

test('renders master checkbox in changes header and stages/unstages all files', async () => {
  render(<App />)

  act(() => {
    useGitStore.getState().addRepository('/test/repo-1')
  })

  const path = '/test/repo-1'
  const initialFiles = [
    { path: 'fileA.txt', stagedStatus: 'none' as any, unstagedStatus: 'modified' as any, isStaged: false },
    { path: 'fileB.txt', stagedStatus: 'none' as any, unstagedStatus: 'added' as any, isStaged: false }
  ]
  
  act(() => {
    useGitStore.getState().updateRepositoryState(path, { files: initialFiles })
  })

  // Master checkbox should not be checked since no files are staged
  const checkbox = screen.getByTitle('Stage all changes') as HTMLInputElement
  expect(checkbox).toBeInTheDocument()
  expect(checkbox.checked).toBe(false)
  expect(checkbox.indeterminate).toBe(false)

  // Stage one file to test indeterminate state
  act(() => {
    useGitStore.getState().updateRepositoryState(path, {
      files: [
        { path: 'fileA.txt', stagedStatus: 'modified' as any, unstagedStatus: 'none' as any, isStaged: true },
        { path: 'fileB.txt', stagedStatus: 'none' as any, unstagedStatus: 'added' as any, isStaged: false }
      ]
    })
  })

  // Should render as indeterminate (which sets input.indeterminate = true)
  expect(checkbox.checked).toBe(false)
  expect(checkbox.indeterminate).toBe(true)

  // Toggle master checkbox to stage all
  act(() => {
    fireEvent.click(checkbox)
  })

  expect(useGitStore.getState().repositories[path].files.every((f) => f.isStaged)).toBe(true)
})

test('toggles search panel visibility and search filtering via Ctrl+F and UI controls', () => {
  render(<App />)

  const path = '/test/repo-1'
  act(() => {
    useGitStore.getState().addRepository(path)
    useGitStore.getState().updateRepositoryState(path, {
      files: [
        { path: 'src/main.ts', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false },
        { path: 'package.json', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false }
      ]
    })
  })

  // Search input should not be visible initially
  expect(screen.queryByPlaceholderText('Search files...')).not.toBeInTheDocument()

  // Press Ctrl+F
  act(() => {
    fireEvent.keyDown(window, { ctrlKey: true, key: 'f' })
  })

  // Search input should be visible now
  const searchInput = screen.getByPlaceholderText('Search files...') as HTMLInputElement
  expect(searchInput).toBeInTheDocument()

  // Type in search box to filter files
  act(() => {
    fireEvent.change(searchInput, { target: { value: 'package' } })
  })

  // Should filter out src/main.ts, leaving package.json
  expect(screen.queryByText('src/main.ts')).not.toBeInTheDocument()
  expect(screen.getByText('package.json')).toBeInTheDocument()

  // Press Escape to close search and clear query
  act(() => {
    fireEvent.keyDown(searchInput, { key: 'Escape' })
  })

  // Search input should be closed
  expect(screen.queryByPlaceholderText('Search files...')).not.toBeInTheDocument()
  expect(useGitStore.getState().repositories[path].searchQuery).toBe('')

  // Verify full files list is visible again
  expect(screen.getByText('src/main.ts')).toBeInTheDocument()
  expect(screen.getByText('package.json')).toBeInTheDocument()
})

test('allows ctrl-click multi-select and reverting the selected files from context menu', async () => {
  render(<App />)

  const path = '/test/repo-1'
  act(() => {
    useGitStore.getState().addRepository(path)
    useGitStore.getState().updateRepositoryState(path, {
      files: [
        { path: 'src/main.ts', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false },
        { path: 'package.json', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false }
      ]
    })
  })

  act(() => {
    fireEvent.click(screen.getByText('src/main.ts'))
    fireEvent.click(screen.getByText('package.json'), { ctrlKey: true })
  })

  expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual([
    'src/main.ts',
    'package.json'
  ])

  act(() => {
    fireEvent.contextMenu(screen.getByText('src/main.ts'))
  })

  expect(screen.getByText('Revert 2 files')).toBeInTheDocument()

  act(() => {
    fireEvent.click(screen.getByText('Revert 2 files'))
  })

  await waitFor(() => {
    expect(window.api.git.revertChanges).toHaveBeenCalledWith(path, ['src/main.ts', 'package.json'])
  })
})

test('right-clicking an unselected file reverts only that file', async () => {
  render(<App />)

  const path = '/test/repo-1'
  act(() => {
    useGitStore.getState().addRepository(path)
    useGitStore.getState().updateRepositoryState(path, {
      files: [
        { path: 'src/main.ts', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false },
        { path: 'package.json', stagedStatus: 'none', unstagedStatus: 'modified', isStaged: false }
      ]
    })
  })

  act(() => {
    fireEvent.click(screen.getByText('src/main.ts'))
    fireEvent.contextMenu(screen.getByText('package.json'))
  })

  expect(useGitStore.getState().repositories[path].selectedFilePaths).toEqual(['package.json'])
  expect(screen.getByText('Revert 1 file')).toBeInTheDocument()

  act(() => {
    fireEvent.click(screen.getByText('Revert 1 file'))
  })

  await waitFor(() => {
    expect(window.api.git.revertChanges).toHaveBeenCalledWith(path, ['package.json'])
  })
})

test('shows unpushed commit count badge on push button', () => {
  render(<App />)

  const path = '/test/repo-1'
  act(() => {
    useGitStore.getState().addRepository(path)
    useGitStore.getState().updateRepositoryState(path, {
      currentBranch: 'main',
      unpushedCommitCount: 5
    })
  })

  expect(screen.getByTitle('Push 5 unpushed commits upstream')).toBeInTheDocument()
  expect(screen.getByText('5')).toBeInTheDocument()
})
