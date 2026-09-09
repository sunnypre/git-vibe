import { afterEach, describe, expect, it } from 'vitest'
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ExternalApplicationService } from './ExternalApplicationService'

describe('ExternalApplicationService', () => {
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it('offers VS Code and Rider for directories on macOS', async () => {
    const apps = await new ExternalApplicationService('darwin', {}).getApplications(
      'directory',
      ''
    )

    expect(apps.map((app) => app.id)).toEqual(['vscode', 'rider'])
  })

  it('offers only Rider for solution files on macOS', async () => {
    const apps = await new ExternalApplicationService('darwin', {}).getApplications(
      'file',
      'src/App.sln'
    )

    expect(apps).toEqual([{ id: 'rider', name: 'JetBrains Rider' }])
  })

  it('does not offer applications for unsupported files', async () => {
    const apps = await new ExternalApplicationService('darwin', {}).getApplications(
      'file',
      'README.md'
    )

    expect(apps).toEqual([])
  })

  it('detects Windows applications available on PATH', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'launcher-'))
    roots.push(root)
    const code = path.join(root, 'code.cmd')
    const rider = path.join(root, 'rider64.exe')
    await writeFile(code, '')
    await writeFile(rider, '')
    await chmod(code, 0o755)
    await chmod(rider, 0o755)

    const apps = await new ExternalApplicationService('win32', { PATH: root }).getApplications(
      'directory',
      ''
    )

    expect(apps.map((app) => app.id)).toEqual(['vscode', 'rider'])
  })
})
