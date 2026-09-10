import { access } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
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
          prefix: ['-b', 'com.microsoft.VSCode']
        },
        {
          id: 'rider',
          name: 'JetBrains Rider',
          command: '/usr/bin/open',
          prefix: ['-b', 'com.jetbrains.rider']
        }
      ]
    if (this.platform === 'win32') {
      const local = this.env.LOCALAPPDATA || ''
      const pf = this.env.ProgramFiles || 'C:\\Program Files'
      const pf86 = this.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
      const vscode = this.firstExisting([
        this.findOnPath('code.cmd'),
        path.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
        path.join(pf, 'Microsoft VS Code', 'Code.exe'),
        path.join(pf86, 'Microsoft VS Code', 'Code.exe')
      ])
      const riderCandidates = [
        this.findOnPath('rider64.exe'),
        path.join(pf, 'JetBrains', 'JetBrains Rider', 'bin', 'rider64.exe'),
        path.join(pf86, 'JetBrains', 'JetBrains Rider', 'bin', 'rider64.exe')
      ]
      const toolboxRoot = path.join(homedir(), 'AppData', 'Local', 'JetBrains', 'Installations')
      if (existsSync(toolboxRoot)) {
        for (const installation of readdirSync(toolboxRoot)) {
          riderCandidates.push(path.join(toolboxRoot, installation, 'bin', 'rider64.exe'))
        }
      }
      return [
        {
          id: 'vscode',
          name: 'Visual Studio Code',
          command: vscode
        },
        {
          id: 'rider',
          name: 'JetBrains Rider',
          command: this.firstExisting(riderCandidates)
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

  private firstExisting(candidates: string[]): string {
    return candidates.find((candidate) => candidate && this.existsSync(candidate)) || candidates[0]
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
    if (!app) throw new Error('Unknown application')
    if (!available.some((candidate) => candidate.id === app.id)) {
      throw new Error(
        app.id === 'rider'
          ? 'Rider is unavailable. Check the configured Rider executable path.'
          : `${app.name} is unavailable or incompatible`
      )
    }
    await new Promise<void>((resolve, reject) => {
      const child = spawn(app.command, [...(app.prefix || []), target], {
        stdio: 'ignore',
        shell: false
      })
      child.once('error', reject)
      child.once('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`${app.name} could not open the selected path (exit code ${code})`))
      })
    })
  }
}
