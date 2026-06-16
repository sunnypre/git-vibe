import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalPanelProps {
  repoId: string
  repoPath: string
}

export const TerminalPanel = ({ repoId, repoPath }: TerminalPanelProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Instantiate xterm Terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#181819', // Matches pane bg variables
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.15)',
        black: '#1e1e1e',
        red: '#f48771', // Matches --git-deleted
        green: '#89d185', // Matches --git-added
        yellow: '#cca700',
        blue: '#007acc', // Matches --accent-active
        magenta: '#b267e6',
        cyan: '#4ec9b0', // Matches --git-modified
        white: '#cccccc'
      },
      fontSize: 12,
      fontFamily: 'Consolas, "Fira Code", monospace'
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    // Tell backend to spin up the PTY process for this repository
    window.api.terminal.create(repoId, repoPath).then(() => {
      if (containerRef.current) {
        term.open(containerRef.current)
        try {
          fitAddon.fit()
          window.api.terminal.resize(repoId, term.cols, term.rows)
        } catch (err) {
          console.warn('Initial fit deferred:', err)
        }
      }
    })

    // Listen to user keyboard input
    const onDataDisposable = term.onData((data) => {
      window.api.terminal.write(repoId, data)
    })

    // Listen to shell data stream from main process
    const cleanupData = window.api.terminal.onData((payload) => {
      if (payload.repoId === repoId) {
        term.write(payload.data)
      }
    })

    // Monitor resize events to fit terminal panel and notify pty process
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit()
        window.api.terminal.resize(repoId, term.cols, term.rows)
      } catch (err) {
        // Fail silently if element is temporarily hidden/detached
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Clean up connections on unmount/repo change
    return () => {
      onDataDisposable.dispose()
      cleanupData()
      resizeObserver.disconnect()
      term.dispose()
    }
  }, [repoId, repoPath])

  return (
    <div className="w-full h-full bg-[#181819] p-2 relative overflow-hidden select-text">
      <div ref={containerRef} className="w-full h-full overflow-hidden" />
    </div>
  )
}
