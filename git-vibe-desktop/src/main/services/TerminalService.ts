import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'

export class TerminalService {
  private static instance: TerminalService
  private processes: Map<string, pty.IPty> = new Map()
  private buffers: Map<string, string> = new Map()

  private constructor() {}

  public static getInstance(): TerminalService {
    if (!TerminalService.instance) {
      TerminalService.instance = new TerminalService()
    }
    return TerminalService.instance
  }

  /**
   * Spawns a new pseudo-terminal process for a repository if it doesn't already exist.
   * If it exists, sends the current scrollback buffer to populate the UI.
   */
  public create(repoId: string, repoPath: string, window: BrowserWindow): void {
    if (this.processes.has(repoId)) {
      // Terminal session already running, send the accumulated scrollback buffer
      const bufferData = this.buffers.get(repoId)
      if (bufferData && !window.isDestroyed()) {
        window.webContents.send('terminal:data', { repoId, data: bufferData })
      }
      return
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash')
    
    try {
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: repoPath,
        env: process.env as Record<string, string>
      })

      this.buffers.set(repoId, '')

      ptyProcess.onData((data) => {
        let buf = this.buffers.get(repoId) || ''
        buf += data
        // Cap buffer to last 100,000 characters to prevent high memory usage
        if (buf.length > 100000) {
          buf = buf.substring(buf.length - 100000)
        }
        this.buffers.set(repoId, buf)

        if (!window.isDestroyed()) {
          window.webContents.send('terminal:data', { repoId, data })
        }
      })

      ptyProcess.onExit(() => {
        this.processes.delete(repoId)
        this.buffers.delete(repoId)
      })

      this.processes.set(repoId, ptyProcess)
    } catch (error) {
      console.error(`Failed to spawn terminal for repo ${repoPath}:`, error)
    }
  }

  /**
   * Writes input data to the terminal.
   */
  public write(repoId: string, data: string): void {
    const ptyProcess = this.processes.get(repoId)
    if (ptyProcess) {
      ptyProcess.write(data)
    }
  }

  /**
   * Resizes the terminal grid.
   */
  public resize(repoId: string, cols: number, rows: number): void {
    const ptyProcess = this.processes.get(repoId)
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows)
      } catch (error) {
        console.error(`Failed to resize terminal ${repoId}:`, error)
      }
    }
  }

  /**
   * Closes a terminal process.
   */
  public close(repoId: string): void {
    const ptyProcess = this.processes.get(repoId)
    if (ptyProcess) {
      try {
        ptyProcess.kill()
      } catch (error) {
        // ignore
      }
      this.processes.delete(repoId)
      this.buffers.delete(repoId)
    }
  }

  /**
   * Cleans up all running terminal processes.
   */
  public closeAll(): void {
    for (const [repoId, ptyProcess] of this.processes.entries()) {
      try {
        ptyProcess.kill()
      } catch (error) {
        // ignore
      }
      this.processes.delete(repoId)
      this.buffers.delete(repoId)
    }
  }
}
