import React from 'react'
import { useGitStore, useActiveRepo } from '../../store/useGitStore'
import { Check } from 'lucide-react'

export const CommitBox = (): React.JSX.Element | null => {
  const { activeRepoId, setCommitMessage, commitChanges } = useGitStore()
  const activeRepo = useActiveRepo()

  if (!activeRepo || !activeRepoId) return null

  const commitMessage = activeRepo.commitMessage || ''
  const stagedCount = activeRepo.files.filter((f) => f.isStaged).length
  const totalCount = activeRepo.files.length
  
  const canCommit = stagedCount > 0 && commitMessage.trim().length > 0

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCommit) return
    await commitChanges(activeRepoId, commitMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter submits
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      if (canCommit) {
        commitChanges(activeRepoId, commitMessage)
      }
    }
  }

  return (
    <div className="p-3 border-t bg-card/20 flex flex-col gap-2 shrink-0">
      <form onSubmit={handleCommit} className="flex flex-col gap-2">
        <textarea
          placeholder={`Draft commit message... (Ctrl+Enter to commit)`}
          value={commitMessage}
          onChange={(e) => setCommitMessage(activeRepoId, e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-16 bg-input-background border border-border rounded-md p-2 text-xs font-mono text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-[#007acc] transition-colors"
        />
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {stagedCount} of {totalCount} files staged
          </span>
          <span>
            {commitMessage.length} chars
          </span>
        </div>

        <button
          type="submit"
          disabled={!canCommit}
          className="w-full py-1.5 px-3 bg-[#007acc] disabled:bg-muted/40 text-white disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-[#007acc]/90 active:bg-[#007acc]/80 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Commit ({stagedCount} staged)</span>
        </button>
      </form>
    </div>
  )
}
