import { execFile } from 'child_process'
import { promisify } from 'util'
import { GitFile, GitFileStatus, GitDiff, GitDiffLine } from '../../shared/types/GitModels'

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

  /**
   * Discards staged and unstaged changes for the provided paths.
   */
  public async revertChanges(repoPath: string, paths: string[]): Promise<void> {
    await this.queueCommand(async () => {
      const uniquePaths = Array.from(new Set(paths)).filter(Boolean)
      if (uniquePaths.length === 0) return

      const { stdout } = await this.execute(repoPath, ['status', '--porcelain'])
      const changedFiles = GitExecutor.parsePorcelainStatus(stdout)
      const selectedPathSet = new Set(uniquePaths)
      const selectedFiles = changedFiles.filter((file) =>
        selectedPathSet.has(file.path) || (file.oldPath ? selectedPathSet.has(file.oldPath) : false)
      )

      if (selectedFiles.length === 0) return

      const indexPaths = new Set<string>()
      const restorePaths = new Set<string>()
      const cleanPaths = new Set<string>()

      for (const file of selectedFiles) {
        if (file.isStaged) {
          indexPaths.add(file.path)
        }

        if (file.stagedStatus === 'added' || file.unstagedStatus === 'untracked') {
          cleanPaths.add(file.path)
          continue
        }

        if (file.oldPath) {
          restorePaths.add(file.oldPath)
          cleanPaths.add(file.path)
          continue
        }

        restorePaths.add(file.path)
      }

      if (indexPaths.size > 0) {
        await this.execute(repoPath, ['reset', 'HEAD', '--', ...indexPaths])
      }

      if (restorePaths.size > 0) {
        await this.execute(repoPath, ['restore', '--source=HEAD', '--staged', '--worktree', '--', ...restorePaths])
      }

      if (cleanPaths.size > 0) {
        await this.execute(repoPath, ['clean', '-fd', '--', ...cleanPaths])
      }
    })
  }

  /**
   * Checks out a branch or file.
   */
  public async checkout(repoPath: string, target: string): Promise<void> {
    await this.queueCommand(async () => {
      await this.execute(repoPath, ['checkout', target])
    })
  }

  /**
   * Gets a list of local branches.
   */
  public async getBranches(repoPath: string): Promise<string[]> {
    return this.queueCommand(async () => {
      const { stdout } = await this.execute(repoPath, ['branch', '--format=%(refname:short)'])
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    })
  }

  /**
   * Creates a new branch and checks it out.
   */
  public async createBranch(repoPath: string, branchName: string): Promise<void> {
    await this.queueCommand(async () => {
      await this.execute(repoPath, ['checkout', '-b', branchName])
    })
  }

  /**
   * Commits the staged changes.
   */
  public async commit(repoPath: string, message: string): Promise<void> {
    await this.queueCommand(async () => {
      await this.execute(repoPath, ['commit', '-m', message])
    })
  }

  /**
   * Pushes the active branch to its remote. If no upstream is configured, pushes and tracks origin.
   */
  public async push(repoPath: string, branchName: string): Promise<void> {
    await this.queueCommand(async () => {
      let hasUpstream = false
      try {
        await this.execute(repoPath, ['rev-parse', '--abbrev-ref', `${branchName}@{u}`])
        hasUpstream = true
      } catch {
        // No upstream tracking branch found
      }

      if (hasUpstream) {
        await this.execute(repoPath, ['push'])
      } else {
        await this.execute(repoPath, ['push', '-u', 'origin', branchName])
      }
    })
  }

  /**
   * Pulls changes from the remote.
   */
  public async pull(repoPath: string): Promise<void> {
    await this.queueCommand(async () => {
      await this.execute(repoPath, ['pull'])
    })
  }

  /**
   * Gets the diff for a specific file.
   */
  public async getDiff(
    repoPath: string,
    filePath: string,
    options: { staged?: boolean; untracked?: boolean }
  ): Promise<GitDiff> {
    return this.queueCommand(async () => {
      let args: string[] = []

      if (options.untracked) {
        // For untracked files, we simulate a diff against an empty file
        args = ['diff', '--no-index', '--', '/dev/null', filePath]
      } else if (options.staged) {
        args = ['diff', '--cached', '--', filePath]
      } else {
        args = ['diff', '--', filePath]
      }

      try {
        const { stdout } = await this.execute(repoPath, args)
        return {
          filePath,
          lines: GitExecutor.parseDiff(stdout)
        }
      } catch (error: any) {
        // git diff --no-index exits with 1 if there are differences, which is expected
        if (options.untracked && error.message.includes('exit code 1')) {
          return {
            filePath,
            lines: GitExecutor.parseDiff(error.stdout || '')
          }
        }
        // If it's a new file and not yet staged, and we didn't use --no-index, it might fail
        // but typically getDiff is called with the right flags.
        throw error
      }
    })
  }

  /**
   * Parses standard unified diff output into GitDiffLine objects.
   */
  private static parseDiff(stdout: string): GitDiffLine[] {
    const lines = stdout.split('\n')
    const diffLines: GitDiffLine[] = []

    let headerPassed = false
    let oldLineNum = 0
    let newLineNum = 0

    for (const line of lines) {
      if (line.startsWith('@@')) {
        headerPassed = true
        // Parse chunk header: @@ -1,4 +1,5 @@
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
        if (match) {
          oldLineNum = parseInt(match[1], 10)
          newLineNum = parseInt(match[2], 10)
        }
        diffLines.push({ content: line, type: 'header' })
        continue
      }

      if (!headerPassed) {
        if (
          line.startsWith('---') ||
          line.startsWith('+++') ||
          line.startsWith('diff --git') ||
          line.startsWith('index')
        ) {
          continue
        }
        // If we haven't seen @@ yet, it's still header info
        continue
      }

      // Check for EOF newline warning which we should skip or handle
      if (line.startsWith('\\ No newline at end of file')) continue

      if (line.startsWith('+')) {
        diffLines.push({
          content: line,
          type: 'addition',
          lineNumber: newLineNum++
        })
      } else if (line.startsWith('-')) {
        diffLines.push({
          content: line,
          type: 'deletion',
          oldLineNumber: oldLineNum++
        })
      } else if (line.startsWith(' ') || line === '') {
        diffLines.push({
          content: line,
          type: 'context',
          lineNumber: newLineNum++,
          oldLineNumber: oldLineNum++
        })
      } else {
        // Unexpected line, treat as context or ignore?
        // Some diffs have extra lines.
      }
    }

    return diffLines
  }
}
