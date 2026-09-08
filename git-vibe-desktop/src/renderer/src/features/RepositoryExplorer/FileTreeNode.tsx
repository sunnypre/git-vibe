import { ChevronRight, File, Folder, FolderOpen, ExternalLink } from 'lucide-react'
import type { RepositoryNode } from '../../../../shared/types/RepositoryExplorerModels'
import { useGitStore } from '../../store/useGitStore'

export function FileTreeNode({
  repoId,
  node,
  depth
}: {
  repoId: string
  node: RepositoryNode
  depth: number
}): React.JSX.Element {
  const repo = useGitStore((state) => state.repositories[repoId])
  const toggle = useGitStore((state) => state.toggleExplorerDirectory)
  const setTarget = useGitStore((state) => state.setOpenWithTarget)
  const expanded = repo.expandedDirectories.includes(node.relativePath)
  const children = repo.explorerChildren[node.relativePath]
  const canOpen = node.kind === 'directory' || /\.slnx?$/i.test(node.name)

  return (
    <div role="treeitem" aria-expanded={node.kind === 'directory' ? expanded : undefined}>
      <div
        className="group flex items-center gap-1 h-7 hover:bg-muted/60 rounded-sm"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-left outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          onClick={() => node.kind === 'directory' && toggle(repoId, node.relativePath)}
          onKeyDown={(event) => {
            if (
              node.kind === 'directory' &&
              ((event.key === 'ArrowRight' && !expanded) || (event.key === 'ArrowLeft' && expanded))
            )
              toggle(repoId, node.relativePath)
          }}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`}
        >
          {node.kind === 'directory' ? (
            <ChevronRight
              className={`w-3 h-3 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-3" />
          )}
          {node.kind === 'directory' ? (
            expanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )
          ) : (
            <File className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {canOpen && (
          <button
            className="p-1 mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 rounded focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`Open ${node.name} with application`}
            title="Open With…"
            onClick={() => setTarget(repoId, node)}
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && (
        <div role="group">
          {repo.explorerLoading[node.relativePath] && (
            <div
              className="text-xs text-muted-foreground py-1"
              style={{ paddingLeft: (depth + 2) * 14 }}
            >
              Loading…
            </div>
          )}
          {repo.explorerErrors[node.relativePath] && (
            <button
              className="text-xs text-destructive py-1"
              style={{ marginLeft: (depth + 2) * 14 }}
              onClick={() =>
                useGitStore.getState().loadExplorerDirectory(repoId, node.relativePath)
              }
            >
              Retry: {repo.explorerErrors[node.relativePath]}
            </button>
          )}
          {children?.length === 0 && (
            <div
              className="text-xs italic text-muted-foreground py-1"
              style={{ paddingLeft: (depth + 2) * 14 }}
            >
              Empty
            </div>
          )}
          {children?.map((child) => (
            <FileTreeNode key={child.relativePath} repoId={repoId} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
