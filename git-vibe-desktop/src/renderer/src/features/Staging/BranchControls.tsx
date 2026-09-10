import React, { useState, useRef, useEffect } from 'react'
import { useGitStore, useActiveRepo } from '../../store/useGitStore'
import { GitBranch, Plus, CloudUpload, CloudDownload, Check, X, Search, ChevronDown, GitFork } from 'lucide-react'

export const BranchControls = (): React.JSX.Element | null => {
  const { activeRepoId, createBranch, pushChanges, pullChanges, updateRepositoryState, refreshRepository, toggleWorktree } = useGitStore()
  const activeRepo = useActiveRepo()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [branchSearch, setBranchSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!activeRepo || !activeRepoId) return null

  const branches = activeRepo.branches || []
  const currentBranch = activeRepo.currentBranch || 'loading...'

  const handleBranchSelect = async (targetBranch: string) => {
    setIsDropdownOpen(false)
    setBranchSearch('')
    if (!targetBranch || targetBranch === currentBranch) return

    updateRepositoryState(activeRepoId, { isRefreshing: true })
    try {
      const response = await window.api.git.checkout(activeRepo.path, targetBranch)
      if (response.success) {
        useGitStore.getState().showToast(`Switched to branch "${targetBranch}"`, 'success')
        updateRepositoryState(activeRepoId, { currentBranch: targetBranch, isRefreshing: false })
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
          <button onClick={() => toggleWorktree(activeRepoId)} className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md border border-border" title="Manage worktrees" aria-label="Manage worktrees">
            <GitFork className="w-3.5 h-3.5" />
          </button>
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="relative flex-1 min-w-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-input-background border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground outline-none focus:border-[#007acc] transition-colors cursor-pointer truncate"
              title="Select active branch"
            >
              <span className="truncate pr-2">{currentBranch}</span>
              <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-md flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-border flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                  {branches
                    .filter(b => b.toLowerCase().includes(branchSearch.toLowerCase()))
                    .map(branch => (
                      <button
                        key={branch}
                        onClick={() => handleBranchSelect(branch)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground font-mono truncate ${branch === currentBranch ? 'bg-accent/50 text-accent-foreground font-bold' : 'text-muted-foreground'}`}
                      >
                        {branch}
                      </button>
                    ))}
                  {branches.filter(b => b.toLowerCase().includes(branchSearch.toLowerCase())).length === 0 && (
                    <div className="px-2 py-3 text-xs text-center text-muted-foreground">
                      No branches found
                    </div>
                  )}
                </div>
              </div>
            )}
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
            className="relative p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none rounded-md border border-border transition-colors outline-none focus-visible:border-[#007acc]"
            title={
              activeRepo.unpushedCommitCount > 0
                ? `Push ${activeRepo.unpushedCommitCount} unpushed commit${activeRepo.unpushedCommitCount === 1 ? '' : 's'} upstream`
                : 'Push branch and changes upstream'
            }
          >
            <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
            {activeRepo.unpushedCommitCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                {activeRepo.unpushedCommitCount > 99 ? '99+' : activeRepo.unpushedCommitCount}
              </span>
            )}
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
