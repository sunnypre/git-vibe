import { GitFile } from '../../../../shared/types/GitModels'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useGitStore, useActiveRepo } from '../../store/useGitStore'

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

interface FileRowProps {
  file: GitFile
}

export const FileRow = ({ file }: FileRowProps): React.JSX.Element => {
  const { activeRepoId, stageFile, unstageFile, selectFile } = useGitStore()
  const activeRepo = useActiveRepo()
  const isSelected = activeRepo?.selectedFilePath === file.path

  const stagedCode = file.stagedStatus !== 'none' ? file.stagedStatus : null
  const unstagedCode = file.unstagedStatus !== 'none' ? file.unstagedStatus : null
  
  // For the icon, prefer staged status if both exist, but usually we just want to show "what it is"
  const primaryStatus = stagedCode || unstagedCode || 'none'

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'modified': return 'text-[#4ec9b0]' // Modified
      case 'added':
      case 'untracked': return 'text-[#89d185]' // Added
      case 'deleted': return 'text-[#f48771]' // Deleted
      default: return 'text-muted-foreground'
    }
  }

  const getStatusInitial = (status: string): string => {
    switch (status) {
      case 'modified': return 'M'
      case 'added': return 'A'
      case 'untracked': return '??'
      case 'deleted': return 'D'
      case 'renamed': return 'R'
      default: return '?'
    }
  }

  const handleToggle = async (e?: React.MouseEvent | React.KeyboardEvent | React.ChangeEvent) => {
    if (e) {
      e.stopPropagation()
    }

    if (!activeRepoId) return

    try {
      if (file.isStaged) {
        await unstageFile(activeRepoId, file.path)
      } else {
        await stageFile(activeRepoId, file.path)
      }
    } catch (error) {
      console.error('Failed to toggle staging:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      handleToggle(e)
    }
    if (e.code === 'Enter' || e.code === 'ArrowRight') {
      if (activeRepoId) selectFile(activeRepoId, file.path)
    }
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-xs transition-colors border-b border-muted/5 outline-none",
        isSelected ? "bg-muted/80 border-l-2 border-l-primary" : "focus-within:bg-muted/30"
      )}
      onClick={() => {
        if (activeRepoId) selectFile(activeRepoId, file.path)
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex items-center justify-center w-4 h-4">
         <input 
          type="checkbox" 
          checked={file.isStaged} 
          onChange={(e) => handleToggle(e)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-muted-foreground/50 bg-transparent accent-[#007acc] cursor-pointer" 
        />
      </div>

      <div className={cn("w-5 font-mono font-bold text-[10px] flex items-center justify-center", getStatusColor(primaryStatus))}>
        {getStatusInitial(primaryStatus)}
      </div>
      <div className="flex-1 truncate flex items-center gap-2 min-w-0">
        <span className={cn("truncate group-hover:text-foreground transition-colors", isSelected ? "text-foreground font-medium" : "text-foreground/80")} title={file.path}>
          {file.path}
        </span>
        {file.oldPath && (
          <span className="text-[10px] text-muted-foreground truncate italic shrink opacity-60">
            ← {file.oldPath}
          </span>
        )}
      </div>
    </div>
  )
}
