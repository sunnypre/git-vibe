import { FolderTree, X } from 'lucide-react'
import { useGitStore } from '../../store/useGitStore'
import { FileTree } from './FileTree'
import { OpenWithDialog } from './OpenWithDialog'

export function RepositoryExplorer({ repoId }: { repoId: string }): React.JSX.Element {
  const repo = useGitStore((state) => state.repositories[repoId])
  const toggle = useGitStore((state) => state.toggleExplorer)
  return (
    <>
      <aside
        aria-label="Repository explorer"
        className={`shrink-0 overflow-hidden border-r bg-card/60 transition-[width] duration-200 ${repo.isExplorerOpen ? 'w-72' : 'w-0 border-r-0'}`}
      >
        <div className="w-72 h-full flex flex-col">
          <header className="h-9 px-3 border-b flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            <h2 className="text-xs uppercase tracking-wider font-bold flex-1">Explorer</h2>
            <button
              aria-label="Close repository explorer"
              onClick={() => toggle(repoId)}
              className="p-1 rounded focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-auto">
            <FileTree repoId={repoId} />
          </div>
        </div>
      </aside>
      <OpenWithDialog repoId={repoId} />
    </>
  )
}
