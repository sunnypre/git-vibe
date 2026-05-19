import { PanelResizeHandle } from 'react-resizable-panels'

interface ResizeHandleProps {
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export function ResizeHandle({ direction = 'horizontal', className = '' }: ResizeHandleProps) {
  return (
    <PanelResizeHandle
      className={`
        relative flex items-center justify-center bg-border hover:bg-primary/20 transition-colors
        data-[dragging]:bg-primary/40
        ${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'}
        ${className}
      `}
    >
      <div
        className={`
          bg-muted-foreground/30 rounded-full transition-colors
          group-data-[dragging]:bg-primary-foreground
          ${direction === 'horizontal' ? 'w-0.5 h-8' : 'h-0.5 w-8'}
        `}
      />
    </PanelResizeHandle>
  )
}
