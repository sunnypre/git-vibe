import { access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type {
  LaunchRequest,
  RepositoryNodeKind,
  SupportedApplication
} from '../../shared/types/RepositoryExplorerModels'
import { RepositoryExplorerService } from './RepositoryExplorerService'

type Candidate = SupportedApplication & { command: string; prefix?: string[] }

export class ExternalApplicationService {
  constructor(
    private readonly platform = process.platform,
    private readonly env = process.env
  ) {}

  private catalog(): Candidate[] {
    if (this.platform === 'darwin')
      return [
        {
          id: 'vscode',
          name: 'Visual Studio Code',
          command: '/usr/bin/open',
          prefix: ['-a', 'Visual Studio Code']
        },
        { id: 'rider', name: 'JetBrains Rider', command: '/usr/bin/open', prefix: ['-a', 'Rider'] }
      ]
    if (this.platform === 'win32') {
      const local = this.env.LOCALAPPDATA || ''
      const pf = this.env.ProgramFiles || 'C:\\Program Files'
      return [
        {
          id: 'vscode',
          name: 'Visual Studio Code',
          command: path.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe')
        },
        {
          id: 'rider',
          name: 'JetBrains Rider',
          command: path.join(local, 'Programs', 'JetBrains', 'Rider', 'bin', 'rider64.exe')
        },
        {
          id: 'visual-studio',
          name: 'Visual Studio',
          command: path.join(
            pf,
            'Microsoft Visual Studio',
            '2022',
            'Community',
            'Common7',
            'IDE',
            'devenv.exe'
          )
        }
      ]
    }
    return [
      { id: 'vscode', name: 'Visual Studio Code', command: this.findOnPath('code') },
      { id: 'rider', name: 'JetBrains Rider', command: this.findOnPath('rider') }
    ]
  }

  private findOnPath(name: string): string {
    const directory = (this.env.PATH || '')
      .split(path.delimiter)
      .find((part) => part && this.existsSync(path.join(part, name)))
    return directory ? path.join(directory, name) : name
  }

  private existsSync(file: string): boolean {
    return existsSync(file)
  }

  private compatible(kind: RepositoryNodeKind, relativePath: string, app: Candidate): boolean {
    if (kind === 'directory') return app.id !== 'visual-studio'
    return /\.slnx?$/i.test(relativePath) && (app.id === 'rider' || app.id === 'visual-studio')
  }

  async getApplications(
    kind: RepositoryNodeKind,
    relativePath: string
  ): Promise<SupportedApplication[]> {
    const candidates = this.catalog().filter((app) => this.compatible(kind, relativePath, app))
    const installed = await Promise.all(
      candidates.map(async (app) => {
        if (this.platform === 'darwin') return app
        try {
          await access(app.command)
          return app
        } catch {
          return null
        }
      })
    )
    return installed
      .filter((app): app is Candidate => app !== null)
      .map(({ id, name }) => ({ id, name }))
  }

  async openPath(request: LaunchRequest): Promise<void> {
    const explorer = new RepositoryExplorerService()
    const { target } = await explorer.resolveWithinRoot(
      request.repositoryRoot,
      request.relativePath
    )
    const app = this.catalog().find((candidate) => candidate.id === request.applicationId)
    const available = await this.getApplications(request.kind, request.relativePath)
    if (!app || !available.some((candidate) => candidate.id === app.id))
      throw new Error('Application is unavailable or incompatible')
    await new Promise<void>((resolve, reject) => {
      const child = spawn(app.command, [...(app.prefix || []), target], {
        detached: true,
        stdio: 'ignore',
        shell: false
      })
      child.once('error', reject)
      child.once('spawn', () => {
        child.unref()
        resolve()
      })
    })
  }
}
