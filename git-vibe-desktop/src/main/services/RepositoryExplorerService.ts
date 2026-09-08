import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { RepositoryNode } from '../../shared/types/RepositoryExplorerModels'

export class RepositoryExplorerService {
  async resolveWithinRoot(
    repositoryRoot: string,
    relativePath = ''
  ): Promise<{ root: string; target: string }> {
    if (!repositoryRoot?.trim() || path.isAbsolute(relativePath))
      throw new Error('Invalid repository path')
    const root = await fs.realpath(repositoryRoot)
    const candidate = path.resolve(root, relativePath)
    const target = await fs.realpath(candidate)
    const relative = path.relative(root, target)
    if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
      throw new Error('Requested path is outside the repository')
    }
    return { root, target }
  }

  async readDirectory(repositoryRoot: string, relativePath = ''): Promise<RepositoryNode[]> {
    const { root, target } = await this.resolveWithinRoot(repositoryRoot, relativePath)
    const entries = await fs.readdir(target, { withFileTypes: true })
    const nodes: RepositoryNode[] = []
    for (const entry of entries) {
      if (entry.name === '.git') continue
      const absolute = path.join(target, entry.name)
      const stat = await fs.stat(absolute)
      if (!stat.isDirectory() && !stat.isFile()) continue
      const real = await fs.realpath(absolute)
      const boundary = path.relative(root, real)
      if (boundary === '..' || boundary.startsWith('..' + path.sep) || path.isAbsolute(boundary))
        continue
      nodes.push({
        name: entry.name,
        relativePath: path.relative(root, absolute).split(path.sep).join('/'),
        kind: stat.isDirectory() ? 'directory' : 'file',
        mayHaveChildren: stat.isDirectory()
      })
    }
    return nodes.sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === 'directory'
          ? -1
          : 1
        : a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
  }
}
