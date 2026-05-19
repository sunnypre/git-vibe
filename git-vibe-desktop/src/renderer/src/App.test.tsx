import { render, screen, act, fireEvent } from '@testing-library/react'
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
  expect(screen.getByText(/Terminal connected to \/test\/repo-2/i)).toBeInTheDocument()

  // Switch to repo-1
  act(() => {
    useGitStore.getState().setActiveRepository('/test/repo-1')
  })

  expect(screen.getByText(/Terminal connected to \/test\/repo-1/i)).toBeInTheDocument()
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
  expect(screen.getByText(/Terminal connected to \/test\/repo-2/i)).toBeInTheDocument()

  // Close repo-2
  const closeBtn2 = screen.getByLabelText(/Close repo-2/i)

  act(() => {
    fireEvent.click(closeBtn2)
  })

  expect(screen.queryByText('repo-2')).not.toBeInTheDocument()
  // Should have switched to repo-1
  expect(screen.getByText(/Terminal connected to \/test\/repo-1/i)).toBeInTheDocument()
})
