import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

let userData = ''
vi.mock('electron', () => ({ app: { getPath: () => userData } }))

import { StorageService } from './StorageService'

describe('StorageService application settings', () => {
  beforeEach(async () => {
    userData = await mkdtemp(path.join(tmpdir(), 'git-vibe-settings-'))
  })

  afterEach(async () => {
    await rm(userData, { recursive: true, force: true })
  })

  it('persists settings separately from repositories', async () => {
    await writeFile(path.join(userData, 'repositories.json'), JSON.stringify(['/repo']))
    StorageService.saveSettings({ vscodeExecutablePath: ' /custom/code ' })

    expect(StorageService.getSettings()).toEqual({ vscodeExecutablePath: '/custom/code' })
    expect(JSON.parse(await readFile(path.join(userData, 'repositories.json'), 'utf8'))).toEqual([
      '/repo'
    ])
  })

  it('safely returns defaults for malformed settings data', async () => {
    await writeFile(path.join(userData, 'settings.json'), '{not json')
    expect(StorageService.getSettings()).toEqual({})
  })

  it('filters invalid fields from loaded settings', async () => {
    await writeFile(
      path.join(userData, 'settings.json'),
      JSON.stringify({ vscodeExecutablePath: 42, riderExecutablePath: '/rider', extra: true })
    )
    expect(StorageService.getSettings()).toEqual({ riderExecutablePath: '/rider' })
  })
})
