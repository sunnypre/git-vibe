import { execFile } from 'child_process'
import { promisify } from 'util'
import { GitFile, GitFileStatus } from '../../shared/types/GitModels'

const execFileAsync = promisify(execFile)

export class GitExecutor {
  private static instance: GitExecutor
  private queue: Promise<any> = Promise.resolve()

  private constructor() {}

  public static getInstance(): GitExecutor {
    if (!GitExecutor.instance) {
      GitExecutor.instance = new GitExecutor()
    }
    return GitExecutor.instance
  }

  /**
   * Parses the output of git status --porcelain
   */
  public static parsePorcelainStatus(output: string): GitFile[] {
    const lines = output.split('\n')
    const files: GitFile[] = []

    for (const line of lines) {
      if (!line || line.length < 4) continue

      const x = line[0]
      const y = line[1]
      const pathPart = line.substring(3)
      
      let path = pathPart
      let oldPath: string | undefined

      if (x === 'R' || x === 'C') {
        // Handle renames/copies: "PATH1 -> PATH2"
        // Find the " -> " separator that is not inside quotes
        let arrowIndex = -1
        let inQuote = false
        for (let i = 0; i < pathPart.length; i++) {
          if (pathPart[i] === '"' && (i === 0 || pathPart[i - 1] !== '\\')) {
            inQuote = !inQuote
          }
          if (!inQuote && pathPart.substring(i, i + 4) === ' -> ') {
            arrowIndex = i
            break
          }
        }

        if (arrowIndex !== -1) {
          oldPath = this.unescapePath(pathPart.substring(0, arrowIndex))
          path = this.unescapePath(pathPart.substring(arrowIndex + 4))
        }
      } else {
        path = this.unescapePath(pathPart)
      }

      files.push({
        path,
        oldPath,
        stagedStatus: this.mapCodeToStatus(x),
        unstagedStatus: this.mapCodeToStatus(y),
        isStaged: x !== ' ' && x !== '?' && x !== '!',
      })
    }

    return files
  }

  private static unescapePath(path: string): string {
    let result = path.trim()
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.substring(1, result.length - 1)
      // Unescape common git escapes
      const unescaped = result
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
      
      // Handle octal escapes (bytes) for UTF-8 support
      const bytes: number[] = []
      for (let i = 0; i < unescaped.length; i++) {
        if (unescaped[i] === '\\' && /^[0-7]{3}/.test(unescaped.substring(i + 1))) {
          bytes.push(parseInt(unescaped.substring(i + 1, i + 4), 8))
          i += 3
        } else {
          bytes.push(unescaped.charCodeAt(i))
        }
      }
      return Buffer.from(bytes).toString('utf8')
    }
    return result
  }

  private static mapCodeToStatus(code: string): GitFileStatus {
    switch (code) {
      case 'M': return 'modified'
      case 'A': return 'added'
      case 'D': return 'deleted'
      case 'R': return 'renamed'
      case 'C': return 'renamed'
      case '?': return 'untracked'
      case 'U': return 'modified' // Unmerged/Conflict
      case ' ': return 'none'
      default: return 'none'
    }
  }

  /**
   * Queues a command to ensure sequential execution.
   */
  private async queueCommand<T>(fn: () => Promise<T>): Promise<T> {
    const promise = this.queue.then(fn)
    this.queue = promise.catch(() => {}) // Ensure queue continues even if command fails
    return promise
  }

  /**
   * Executes a git command in the specified directory.
   */
  public async execute(repoPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {        
    try {
      // Using execFile instead of exec to prevent shell injection and handle spaces in args
      const { stdout, stderr } = await execFileAsync('git', args, {
        cwd: repoPath,
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer for large monorepos
        timeout: 30000 // 30s timeout
      })
      return { stdout, stderr }
    } catch (error: any) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Git command timed out after 30s: git ${args.join(' ')}`)
      }

      // If we have an exit code, it's a real git error
      if (error.code !== undefined && error.code !== 0) {
        throw new Error(error.stderr || error.message || `Git command failed with exit code ${error.code}`)
      }

      return { 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message 
      }
    }
  }

  /**
   * Specifically handles getting the current branch name.
   */
  public async getCurrentBranch(repoPath: string): Promise<string> {
    const { stdout } = await this.execute(repoPath, ['branch', '--show-current'])
    const branch = stdout.trim()

    if (!branch) {
      // Check if it's a detached HEAD
      const { stdout: revParseStdout } = await this.execute(repoPath, ['rev-parse', '--short', 'HEAD'])        
      const shortSha = revParseStdout.trim()

      if (shortSha) {
        return `(Detached at ${shortSha})`
      }

      // Check if it's an empty repository by seeing if any commits exist
      try {
        const { stdout: revListStdout } = await this.execute(repoPath, ['rev-list', '-n', '1', '--all'])
        if (!revListStdout.trim()) {
          // If no commits, try to get the default branch name
          const { stdout: symRefStdout } = await this.execute(repoPath, ['symbolic-ref', '--short', 'HEAD'])
          return `${symRefStdout.trim() || 'main'} (initial commit)`
        }
      } catch {
        return 'unknown'
      }

      return 'unknown'
    }

    return branch
  }

  /**
   * Gets the git status of the repository.
   */
  public async getStatus(repoPath: string): Promise<GitFile[]> {
    return this.queueCommand(async () => {
      const { stdout } = await this.execute(repoPath, ['status', '--porcelain'])
      return GitExecutor.parsePorcelainStatus(stdout)
    })
  }

  /**
   * Stages one or more files.
   */
  public async add(repoPath: string, paths: string[]): Promise<void> {
    await this.queueCommand(async () => {
      await this.execute(repoPath, ['add', '--', ...paths])
    })
  }

  /**
   * Unstages one or more files.
   */
  public async reset(repoPath: string, paths: string[]): Promise<void> {
    await this.queueCommand(async () => {
      // For surgical reset, we use 'git reset HEAD <path>'
      await this.execute(repoPath, ['reset', 'HEAD', '--', ...paths])
    })
  }

}
