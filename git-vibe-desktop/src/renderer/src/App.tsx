import { Panel, PanelGroup } from 'react-resizable-panels'
import * as Tabs from '@radix-ui/react-tabs'
import { GitBranch, Plus, X, FileDiff, Terminal as TerminalIcon } from 'lucide-react'
import { ResizeHandle } from './components/ResizeHandle'
import { useGitStore, useActiveRepo } from './store/useGitStore'
import { FileList } from './features/Staging/FileList'

function App(): React.JSX.Element {
  const { repositories, activeRepoId, addRepository, setActiveRepository, removeRepository } = useGitStore()
  const activeRepo = useActiveRepo()
  const repoList = Object.values(repositories)

  const handleCloseRepo = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeRepository(id)
  }

  // ID 4: Placeholder for functional repository addition
  const handleAddRepository = () => {
    // In a real implementation, this would trigger an Electron IPC call to show an OpenDialog
    // window.api.git.selectDirectory().then(path => if (path) addRepository(path))
    const mockPath = window.navigator.platform.includes('Win') 
      ? `C:/repos/new-repo-${Date.now()}` 
      : `/Users/sunny/repos/new-repo-${Date.now()}`
    addRepository(mockPath)
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
            {repoList.map((repo) => {
              // ID 2: We use a normalized path for the store key, but 'repo.path' is the original path
              const repoKey = repo.path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
              return (
                <div key={repoKey} className="group relative h-full flex items-center">
                  <Tabs.Trigger
                    value={repoKey}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-background/50 transition-all whitespace-nowrap h-full outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repo.name}</span>
                    <span className="text-[10px] opacity-50">({repo.currentBranch})</span>
                  </Tabs.Trigger>

                  {/* ID 1: Close button is now a sibling, not a child, to avoid nesting buttons */}
                  <button
                    onClick={(e) => handleCloseRepo(repoKey, e)}
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
            onClick={handleAddRepository}
            className="px-3 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l outline-none focus-visible:bg-muted/50"
            title="Add local repository"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {activeRepo ? (
          <Tabs.Content value={activeRepoId || ''} className="flex-1 min-h-0 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset">
            <PanelGroup autoSaveId="git-vibe-layout-main" direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <PanelGroup autoSaveId="git-vibe-layout-upper" direction="horizontal">
                  <Panel defaultSize={30} minSize={20}>
                    <div className="h-full w-full flex flex-col bg-card/30">
                      <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2">
                        <FileDiff className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Changes ({activeRepo.files.length})
                        </h2>
                      </div>
                      <div className="flex-1 min-h-0">
                        <FileList />
                      </div>
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
                      <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground italic text-sm">
                        Select a file to view changes
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>

              <ResizeHandle direction="vertical" />

              <Panel defaultSize={30} minSize={15}>
                {/* ID 6: Fixed hardcoded color bg-black/10 -> bg-muted/10 */}
                <div className="h-full w-full flex flex-col bg-muted/10">
                  <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Terminal</h2>
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground font-mono italic text-sm">
                    Terminal connected to {activeRepo.path}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
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
          {activeRepo && <span className="truncate max-w-[300px]">{activeRepo.path}</span>}
        </div>
        {activeRepo && (
          <div className="flex items-center gap-3">
            <span className="text-primary">{activeRepo.currentBranch}</span>
            <span>UTF-8</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
