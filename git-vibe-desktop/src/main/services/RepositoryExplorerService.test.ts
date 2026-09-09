import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { RepositoryExplorerService } from './RepositoryExplorerService'

describe('RepositoryExplorerService', () => {
  const roots: string[] = []
  afterEach(async () =>
    Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  )

  it('reads one level, hides .git, and sorts directories before files', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'explorer-'))
    roots.push(root)
    await Promise.all([
      mkdir(path.join(root, 'z-dir')),
      mkdir(path.join(root, 'a-dir')),
      mkdir(path.join(root, '.git')),
      writeFile(path.join(root, 'b.txt'), ''),
      writeFile(path.join(root, 'A.txt'), '')
    ])
    const nodes = await new RepositoryExplorerService().readDirectory(root)
    expect(nodes.map((node) => node.name)).toEqual(['a-dir', 'z-dir', 'A.txt', 'b.txt'])
    expect(nodes.some((node) => node.name === '.git')).toBe(false)
  })

  it('rejects traversal and symlink escapes', async () => {
    const parent = await mkdtemp(path.join(tmpdir(), 'explorer-'))
    roots.push(parent)
    const root = path.join(parent, 'repo')
    const outside = path.join(parent, 'outside')
    await mkdir(root)
    await mkdir(outside)
    await symlink(outside, path.join(root, 'escape'), 'dir')
    const service = new RepositoryExplorerService()
    await expect(service.readDirectory(root, '../outside')).rejects.toThrow(
      'outside the repository'
    )
    await expect(service.readDirectory(root, 'escape')).rejects.toThrow('outside the repository')
    expect((await service.readDirectory(root)).some((node) => node.name === 'escape')).toBe(false)
  })

  it('returns a clear error for inaccessible or missing directories', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'explorer-'))
    roots.push(root)
    await expect(new RepositoryExplorerService().readDirectory(root, 'missing')).rejects.toThrow()
  })
})
