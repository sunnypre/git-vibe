import { useEffect, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import * as Tabs from '@radix-ui/react-tabs'
import {
  GitBranch,
  Plus,
  X,
  FileDiff,
  Terminal as TerminalIcon,
  Search,
  Trash2,
  RefreshCw,
  PanelLeft,
  Settings
} from 'lucide-react'
import { ResizeHandle } from './components/ResizeHandle'
import { useGitStore, useActiveRepo } from './store/useGitStore'
import { FileList } from './features/Staging/FileList'
import { DiffViewer } from './features/Staging/DiffViewer'
import { BranchControls } from './features/Staging/BranchControls'
import { CommitBox } from './features/Staging/CommitBox'
import { TerminalPanel } from './features/Terminal/TerminalPanel'
import { Toast } from './components/Toast'
import { RepositoryExplorer } from './features/RepositoryExplorer/RepositoryExplorer'
import { SettingsDialog } from './components/SettingsDialog'
import { WorktreeDrawer } from './features/Staging/WorktreeDrawer'

function App(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    repositories,
    activeRepoId,
    addRepository,
    setActiveRepository,
    removeRepository,
    refreshBranch,
    refreshStatus,
    stageAllFiles,
    unstageAllFiles,
    setSearchQuery,
    setSearchOpen,
    clearRepositories,
    refreshRepository
  } = useGitStore()
  const activeRepo = useActiveRepo()

  useEffect(() => {
    const handleFocus = () => {
      if (activeRepoId) {
        refreshBranch(activeRepoId)
        refreshStatus(activeRepoId)
      }
    }

    window.addEventListener('focus', handleFocus)

    const cleanupRefresh = window.api.git.onRefresh((repoPath) => {
      // Refresh the specific repo that was mutated
      refreshBranch(repoPath)
      refreshStatus(repoPath)
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
      cleanupRefresh()
    }
  }, [activeRepoId, refreshBranch, refreshStatus])

  useEffect(() => {
    window.api.git
      .getStoredRepositories()
      .then(async (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const validRepos: string[] = []
          for (const path of response.data) {
            const branchResponse = await window.api.git.getCurrentBranch(path)
            if (branchResponse.success) {
              validRepos.push(path)
            } else {
              console.error(`Skipping invalid stored repository: ${path}`)
            }
          }
          validRepos.forEach((path) => {
            addRepository(path)
          })
        }
      })
      .catch((err) => {
        console.error('Failed to load stored repositories:', err)
      })
  }, [addRepository])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        if (activeRepoId) {
          e.preventDefault()
          const repo = repositories[activeRepoId]
          if (repo) {
            const nextOpen = !repo.isSearchOpen
            setSearchOpen(activeRepoId, nextOpen)
            if (!nextOpen) {
              setSearchQuery(activeRepoId, '')
            }
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        if (activeRepoId) {
          e.preventDefault()
          refreshRepository(activeRepoId)
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e' && activeRepoId) {
        e.preventDefault()
        useGitStore.getState().toggleExplorer(activeRepoId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeRepoId, repositories, setSearchOpen, setSearchQuery, refreshRepository])

  const handleCloseRepo = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeRepository(id)
  }

  // Functional repository selection dialog
  const handleAddRepository = async () => {
    try {
      const path = await window.api.git.selectDirectory()
      if (path) {
        const branchResponse = await window.api.git.getCurrentBranch(path)
        if (!branchResponse.success) {
          useGitStore.getState().showToast('Not a valid Git repository.', 'error')
          return
        }
        addRepository(path)
      }
    } catch (error: any) {
      console.error('Failed to select directory:', error)
      useGitStore.getState().showToast('Failed to select directory', 'error')
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col dark">
      <Tabs.Root
        value={activeRepoId || ''}
        onValueChange={setActiveRepository}
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Tab Bar */}
        <div className="h-10 border-b flex items-center bg-muted/30 shrink-0">
          <Tabs.List className="flex items-center gap-0.5 px-2 flex-1 overflow-x-auto no-scrollbar h-full">
            {Object.entries(repositories).map(([repoId, repo]) => {
              return (
                <div key={repoId} className="group relative h-full flex items-center">
                  <Tabs.Trigger
                    value={repoId}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-background/50 transition-all whitespace-nowrap h-full outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repo.name}</span>
                    <span className="text-[10px] opacity-50">({repo.currentBranch})</span>
                  </Tabs.Trigger>

                  <button
                    onClick={(e) => handleCloseRepo(repoId, e)}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity text-muted-foreground hover:text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label={`Close ${repo.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </Tabs.List>

          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l outline-none focus-visible:bg-muted/50"
            title="Application settings"
            aria-label="Application settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => activeRepoId && useGitStore.getState().toggleExplorer(activeRepoId)}
            className={`px-3 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l outline-none focus-visible:ring-1 focus-visible:ring-ring ${activeRepo?.isExplorerOpen ? 'bg-muted text-foreground' : ''}`}
            title="Toggle repository explorer (Ctrl/Cmd+Shift+E)"
            aria-label="Toggle repository explorer"
            disabled={!activeRepoId}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => activeRepoId && refreshRepository(activeRepoId)}
            className={`px-3 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l outline-none focus-visible:bg-muted/50 ${!activeRepoId ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh active repository (Ctrl+R)"
            disabled={!activeRepoId}
          >
            <RefreshCw
              className={`w-4 h-4 ${activeRepo?.isRefreshing || activeRepo?.isLoading ? 'animate-spin' : ''}`}
            />
          </button>

          <button
            onClick={handleAddRepository}
            className="px-3 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l outline-none focus-visible:bg-muted/50"
            title="Add local repository"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => clearRepositories()}
            className="px-3 h-full flex items-center text-muted-foreground hover:text-red-500 hover:bg-muted/50 transition-colors border-l outline-none focus-visible:bg-muted/50"
            title="Clear all repositories"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {activeRepo ? (
          <Tabs.Content
            value={activeRepoId || ''}
            className="flex-1 min-h-0 flex-row outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset data-[state=active]:flex"
          >
            <div className="relative flex h-full min-w-0 flex-1"><RepositoryExplorer repoId={activeRepoId!} /><WorktreeDrawer repoId={activeRepoId!} />
            <div className="flex-1 min-w-0 h-full">
              <PanelGroup autoSaveId="git-vibe-layout-main" direction="vertical">
                <Panel defaultSize={70} minSize={30}>
                  <PanelGroup autoSaveId="git-vibe-layout-upper" direction="horizontal">
                    <Panel defaultSize={30} minSize={20}>
                      <div className="h-full w-full flex flex-col bg-card/30">
                        {/* Branch management dropdown & buttons */}
                        <BranchControls />

                        <div className="px-4 py-2 border-b bg-muted/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              ref={(el) => {
                                if (el) {
                                  const someStaged = activeRepo.files.some((f) => f.isStaged)
                                  const someUnstaged = activeRepo.files.some((f) => !f.isStaged)
                                  el.indeterminate = someStaged && someUnstaged
                                }
                              }}
                              checked={
                                activeRepo.files.length > 0 &&
                                activeRepo.files.every((f) => f.isStaged)
                              }
                              onChange={async () => {
                                if (activeRepoId) {
                                  const allStaged =
                                    activeRepo.files.length > 0 &&
                                    activeRepo.files.every((f) => f.isStaged)
                                  if (allStaged) {
                                    await unstageAllFiles(activeRepoId)
                                  } else {
                                    await stageAllFiles(activeRepoId)
                                  }
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-muted-foreground/50 bg-transparent accent-[#007acc] cursor-pointer"
                              disabled={activeRepo.files.length === 0}
                              title={
                                activeRepo.files.length > 0 &&
                                activeRepo.files.every((f) => f.isStaged)
                                  ? 'Unstage all changes'
                                  : 'Stage all changes'
                              }
                            />
                            <FileDiff className="w-4 h-4 text-muted-foreground" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Changes ({activeRepo.files.length})
                            </h2>
                          </div>
                          <button
                            onClick={() => {
                              if (activeRepoId) {
                                const nextOpen = !activeRepo.isSearchOpen
                                setSearchOpen(activeRepoId, nextOpen)
                                if (!nextOpen) {
                                  setSearchQuery(activeRepoId, '')
                                }
                              }
                            }}
                            className={`p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                              activeRepo.isSearchOpen ? 'bg-muted text-foreground' : ''
                            }`}
                            title="Toggle search (Ctrl+F)"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Search Bar */}
                        {activeRepo.isSearchOpen && (
                          <div className="px-4 py-1.5 border-b bg-muted/5 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                            <Search className="w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search files..."
                              value={activeRepo.searchQuery}
                              onChange={(e) => {
                                if (activeRepoId) {
                                  setSearchQuery(activeRepoId, e.target.value)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape' && activeRepoId) {
                                  setSearchOpen(activeRepoId, false)
                                  setSearchQuery(activeRepoId, '')
                                }
                              }}
                              autoFocus
                              className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60 h-6"
                            />
                            <button
                              onClick={() => {
                                if (activeRepoId) {
                                  setSearchOpen(activeRepoId, false)
                                  setSearchQuery(activeRepoId, '')
                                }
                              }}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Close search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Staged/Unstaged list */}
                        <div className="flex-1 min-h-0 flex flex-col">
                          <FileList />
                        </div>

                        {/* Commit draft and action box */}
                        <CommitBox />
                      </div>
                    </Panel>

                    <ResizeHandle direction="horizontal" />

                    <Panel defaultSize={70} minSize={30}>
                      <div className="h-full w-full flex flex-col">
                        <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2">
                          <FileDiff className="w-4 h-4 text-muted-foreground" />
                          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Diff Explorer
                          </h2>
                        </div>
                        <div className="flex-1 min-h-0 flex flex-col">
                          <DiffViewer />
                        </div>
                      </div>
                    </Panel>
                  </PanelGroup>
                </Panel>

                <ResizeHandle direction="vertical" />

                <Panel defaultSize={30} minSize={15}>
                  <div className="h-full w-full flex flex-col bg-muted/10">
                    <div className="px-4 py-1.5 border-b bg-muted/10 flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-muted-foreground" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Terminal
                      </h2>
                    </div>
                    {/* xterm.js integrated terminal pane */}
                    <div className="flex-1 min-h-0">
                      <TerminalPanel repoId={activeRepoId!} repoPath={activeRepo.activeWorktreePath} />
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </div></div>
          </Tabs.Content>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <GitBranch className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground/80">No repository active</p>
              <p className="text-sm">Add a repository to begin surgical staging</p>
            </div>
            <button
              onClick={handleAddRepository}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Add Repository
            </button>
          </div>
        )}
      </Tabs.Root>

      {/* Status Bar */}
      <div className="h-6 border-t flex items-center justify-between px-4 bg-muted/30 text-[10px] uppercase tracking-widest font-bold text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {activeRepo && <span className="truncate max-w-[300px]">{activeRepo.activeWorktreePath}</span>}
        </div>
        {activeRepo && (
          <div className="flex items-center gap-3">
            <span className="text-primary">{activeRepo.currentBranch}</span>
            <span>UTF-8</span>
          </div>
        )}
      </div>

      {/* Centralized application alert notification */}
      <Toast />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
