import * as ScrollArea from '@radix-ui/react-scroll-area'
import { FileRow } from './FileRow'
import { useActiveRepo } from '../../store/useGitStore'
import { RefreshCcw } from 'lucide-react'

export const FileList = (): React.JSX.Element | null => {
  const activeRepo = useActiveRepo()
  const files = activeRepo?.files || []
  const isLoading = activeRepo?.isLoading || false

  if (!activeRepo) return null

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <ScrollArea.Root className="flex-1 w-full overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="flex flex-col">
            {files.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs italic">
                {isLoading ? 'Scanning for changes...' : 'No changes detected'}
              </div>
            ) : (
              files.map((file) => (
                <FileRow key={file.path} file={file} />
              ))
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-muted/10 transition-colors duration-[160ms] ease-out hover:bg-muted/20 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-1.5"
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
    </div>
  )
}
