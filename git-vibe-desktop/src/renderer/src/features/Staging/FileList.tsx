import * as ScrollArea from '@radix-ui/react-scroll-area'
import { FileRow } from './FileRow'
import { useEffect, useState } from 'react'
import { GitFile } from '../../../../shared/types/GitModels'
import { useActiveRepo, useGitStore } from '../../store/useGitStore'
import { RefreshCcw, Trash2 } from 'lucide-react'

export const FileList = (): React.JSX.Element | null => {
  const { activeRepoId, selectFile, revertFiles } = useGitStore()
  const activeRepo = useActiveRepo()
  const files = activeRepo?.files || []
  const isLoading = activeRepo?.isLoading || false
  const searchQuery = activeRepo?.searchQuery || ''
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    paths: string[]
  } | null>(null)

  useEffect(() => {
    if (!contextMenu) return

    const closeMenu = (): void => setContextMenu(null)
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('click', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  if (!activeRepo) return null

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openContextMenu = (file: GitFile, x: number, y: number): void => {
    if (!activeRepoId) return

    const selectedPaths = activeRepo.selectedFilePaths
    const paths = selectedPaths.includes(file.path) ? selectedPaths : [file.path]

    if (!selectedPaths.includes(file.path)) {
      selectFile(activeRepoId, file.path)
    }

    setContextMenu({ x, y, paths })
  }

  const handleRevert = async (): Promise<void> => {
    if (!activeRepoId || !contextMenu) return

    const paths = contextMenu.paths
    setContextMenu(null)
    await revertFiles(activeRepoId, paths)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <ScrollArea.Root className="flex-1 w-full overflow-hidden relative">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="flex flex-col">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs italic">
                {isLoading ? 'Scanning for changes...' : 'No changes detected'}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <FileRow key={file.path} file={file} onOpenContextMenu={openContextMenu} />
              ))
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="absolute right-0 top-0 bottom-0 flex select-none touch-none p-0.5 bg-muted/10 transition-colors duration-[160ms] ease-out hover:bg-muted/20 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-1.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-muted-foreground/30 rounded-[10px] relative" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-muted" />
      </ScrollArea.Root>
      
      {isLoading && (
        <div className="absolute top-2 right-2">
          <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin opacity-70" />
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-xs shadow-md animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
            onClick={handleRevert}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{contextMenu.paths.length === 1 ? 'Revert 1 file' : `Revert ${contextMenu.paths.length} files`}</span>
          </button>
        </div>
      )}
    </div>
  )
}
