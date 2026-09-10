import { useState } from 'react'
import { GitFork, X, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useGitStore } from '../../store/useGitStore'

export function WorktreeDrawer({ repoId }: { repoId: string }): React.JSX.Element {
  const repo = useGitStore((state) => state.repositories[repoId])
  const { toggleWorktree, switchWorktree, createWorktree, removeWorktree, refreshWorktrees } = useGitStore()
  const [creating, setCreating] = useState(false)
  const [path, setPath] = useState('')
  const [branch, setBranch] = useState('')
  if (!repo) return <></>
  return <aside className={`absolute left-0 top-0 bottom-0 z-40 w-80 bg-card border-r shadow-xl transition-transform duration-200 ${repo.isWorktreeOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="h-full flex flex-col">
      <header className="h-10 px-3 border-b flex items-center gap-2"><GitFork className="w-4 h-4" /><h2 className="text-xs uppercase tracking-wider font-bold flex-1">Worktrees</h2><button onClick={() => toggleWorktree(repoId)} title="Close"><X className="w-4 h-4" /></button></header>
      <div className="p-2 border-b flex justify-between"><button onClick={() => setCreating(!creating)} className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"><Plus className="w-3 h-3" /> New worktree</button><button onClick={() => refreshWorktrees(repoId)} title="Refresh"><RefreshCw className={`w-3.5 h-3.5 ${repo.isWorktreeLoading ? 'animate-spin' : ''}`} /></button></div>
      {creating && <form className="p-3 border-b space-y-2" onSubmit={async (event) => { event.preventDefault(); await createWorktree(repoId, path, branch); setPath(''); setBranch(''); setCreating(false) }}><input required value={path} onChange={(e) => setPath(e.target.value)} placeholder="Folder name or absolute path" title="A relative name is created beside the repository" className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs" /><p className="text-[10px] text-muted-foreground">Relative names are created beside the repository.</p><select required value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full bg-input-background border border-border rounded px-2 py-1 text-xs"><option value="">Select branch...</option>{repo.branches.map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="w-full bg-primary text-primary-foreground rounded py-1 text-xs">Create</button></form>}
      <div className="flex-1 overflow-auto p-2 space-y-1">{repo.worktrees.map((worktree) => <div key={worktree.path} className={`group rounded border p-2 ${worktree.path === repo.activeWorktreePath ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'}`}><button className="w-full text-left" onClick={() => switchWorktree(repoId, worktree.path)}><div className="text-xs font-medium truncate">{worktree.branch || `Detached at ${worktree.commit.slice(0, 8)}`}</div><div className="text-[10px] text-muted-foreground truncate mt-1">{worktree.path}</div></button>{!worktree.isMain && <button onClick={() => removeWorktree(repoId, worktree.path)} className="float-right -mt-5 p-1 text-muted-foreground hover:text-red-500" title="Remove worktree"><Trash2 className="w-3 h-3" /></button>}</div>)}</div>
    </div>
  </aside>
}
