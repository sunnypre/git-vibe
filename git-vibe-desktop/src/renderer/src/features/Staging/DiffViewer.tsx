import React from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useActiveRepo } from '../../store/useGitStore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DiffViewer: React.FC = () => {
  const activeRepo = useActiveRepo()

  if (!activeRepo) return null

  const { selectedFilePath, diffContent, isDiffLoading, error } = activeRepo

  if (!selectedFilePath) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground italic text-sm">
        Select a file to view changes
      </div>
    )
  }

  if (isDiffLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-pulse">Loading diff...</div>
          <div className="text-[10px] uppercase tracking-widest opacity-50">{selectedFilePath}</div>
        </div>
      </div>
    )
  }

  if (error && !diffContent) {
    return (
      <div className="h-full w-full flex items-center justify-center text-destructive text-sm p-4 text-center">
        Error: {error}
      </div>
    )
  }

  if (!diffContent || diffContent.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground italic text-sm">
        No changes detected in this file
      </div>
    )
  }

  return (
    <ScrollArea.Root className="h-full w-full overflow-hidden bg-background">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="min-w-fit py-4 font-mono text-[13px] leading-relaxed select-text">
          {diffContent.map((line, index) => {
            const isAddition = line.type === 'addition'
            const isDeletion = line.type === 'deletion'
            const isHeader = line.type === 'header'

            return (
              <div
                key={index}
                className={cn(
                  'flex group transition-colors min-w-full',
                  isAddition && 'bg-[#1e4620]/40 hover:bg-[#1e4620]/60',
                  isDeletion && 'bg-[#4b1818]/40 hover:bg-[#4b1818]/60',
                  isHeader && 'bg-muted/20 text-muted-foreground font-bold py-1 my-1 border-y border-muted/30'
                )}
              >
                {/* Line Numbers */}
                {!isHeader && (
                  <div className="flex shrink-0 text-right text-muted-foreground/30 select-none border-r border-muted/10 mr-4 bg-background/50 group-hover:bg-transparent transition-colors">
                    <div className="w-10 px-2">{line.oldLineNumber || ''}</div>
                    <div className="w-10 px-2">{line.lineNumber || ''}</div>
                  </div>
                )}
                {isHeader && <div className="w-20 shrink-0 border-r border-transparent mr-4" />}

                {/* Content */}
                <pre className="whitespace-pre flex-1">
                  <span
                    className={cn(
                      'inline-block w-4 shrink-0 select-none opacity-50 font-bold',
                      isAddition && 'text-green-400',
                      isDeletion && 'text-red-400'
                    )}
                  >
                    {isAddition ? '+' : isDeletion ? '-' : ' '}
                  </span>
                  <span
                    className={cn(
                      isAddition && 'text-green-100',
                      isDeletion && 'text-red-100',
                      isHeader && 'text-blue-300'
                    )}
                  >
                    {isHeader ? line.content : line.content.substring(1)}
                  </span>
                </pre>
              </div>
            )
          })}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-0.5 bg-muted/5 transition-colors duration-[160ms] ease-out hover:bg-muted/10 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="vertical"
      >
        <ScrollArea.Thumb className="flex-1 bg-muted-foreground/20 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-0.5 bg-muted/5 transition-colors duration-[160ms] ease-out hover:bg-muted/10 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="horizontal"
      >
        <ScrollArea.Thumb className="flex-1 bg-muted-foreground/20 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className="bg-muted/10" />
    </ScrollArea.Root>
  )
}
