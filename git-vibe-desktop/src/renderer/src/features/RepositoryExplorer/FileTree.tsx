import { useGitStore } from '../../store/useGitStore'
import { FileTreeNode } from './FileTreeNode'

export function FileTree({ repoId }: { repoId: string }): React.JSX.Element {
  const repo = useGitStore((state) => state.repositories[repoId])
  if (repo.explorerLoading[''])
    return <p className="p-3 text-xs text-muted-foreground">Loading repository…</p>
  if (repo.explorerErrors[''])
    return (
      <button
        className="m-3 text-xs text-destructive"
        onClick={() => useGitStore.getState().loadExplorerDirectory(repoId, '')}
      >
        Retry: {repo.explorerErrors['']}
      </button>
    )
  return (
    <div role="tree" aria-label="Repository files" className="p-1">
      {(repo.explorerChildren[''] || []).map((node) => (
        <FileTreeNode key={node.relativePath} repoId={repoId} node={node} depth={0} />
      ))}
    </div>
  )
}
