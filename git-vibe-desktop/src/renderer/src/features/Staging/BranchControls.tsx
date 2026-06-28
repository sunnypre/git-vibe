import React, { useState } from 'react'
import { useGitStore, useActiveRepo } from '../../store/useGitStore'
import { GitBranch, Plus, CloudUpload, CloudDownload, Check, X } from 'lucide-react'

export const BranchControls = (): React.JSX.Element | null => {
  const { activeRepoId, createBranch, pushChanges, pullChanges, updateRepositoryState, refreshRepository } = useGitStore()
  const activeRepo = useActiveRepo()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  if (!activeRepo || !activeRepoId) return null

  const branches = activeRepo.branches || []
  const currentBranch = activeRepo.currentBranch || 'loading...'

  const handleBranchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetBranch = e.target.value
    if (!targetBranch || targetBranch === currentBranch) return

    updateRepositoryState(activeRepoId, { isRefreshing: true })
    try {
      const response = await window.api.git.checkout(activeRepo.path, targetBranch)
      if (response.success) {
        useGitStore.getState().showToast(`Switched to branch "${targetBranch}"`, 'success')
        await refreshRepository(activeRepoId)
      } else {
        useGitStore.getState().showToast(response.error || `Failed to switch to "${targetBranch}"`, 'error')
        updateRepositoryState(activeRepoId, { isRefreshing: false })
      }
    } catch (err: any) {
      useGitStore.getState().showToast(err.message, 'error')
      updateRepositoryState(activeRepoId, { isRefreshing: false })
    }
  }

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newBranchName.trim()
    if (!name) return

    setIsCreating(false)
    setNewBranchName('')
    await createBranch(activeRepoId, name)
  }

  const handlePush = async () => {
    setIsPushing(true)
    await pushChanges(activeRepoId)
    setIsPushing(false)
  }

  const handlePull = async () => {
    setIsPulling(true)
    await pullChanges(activeRepoId)
    setIsPulling(false)
  }

  return (
    <div className="flex flex-col gap-2 p-3 border-b bg-card/10 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 relative">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="relative flex-1 min-w-0">
            <select
              value={currentBranch}
              onChange={handleBranchChange}
              className="w-full bg-input-background border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-[#007acc] transition-colors cursor-pointer appearance-none pr-6 truncate"
              title="Select active branch"
            >
              <option value={currentBranch} disabled>
                {currentBranch}
              </option>
              {branches
                .filter((b) => b !== currentBranch)
                .map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted-foreground">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md border border-border transition-colors outline-none focus-visible:border-[#007acc]"
            title="Create new branch"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handlePull}
            disabled={isPulling}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none rounded-md border border-border transition-colors outline-none focus-visible:border-[#007acc]"
            title="Pull changes from upstream"
          >
            <CloudDownload className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
          </button>

          <button
            onClick={handlePush}
            disabled={isPushing}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none rounded-md border border-border transition-colors outline-none focus-visible:border-[#007acc]"
            title="Push branch and changes upstream"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateBranch} className="flex items-center gap-1.5 animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            placeholder="New branch name..."
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="flex-1 bg-input-background border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-[#007acc] transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 hover:bg-[#89d185]/20 text-[#89d185] rounded-md transition-colors"
            title="Confirm"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false)
              setNewBranchName('')
            }}
            className="p-1 hover:bg-[#f48771]/20 text-[#f48771] rounded-md transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  )
}
