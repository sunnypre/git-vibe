import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import type { ApplicationSettings } from '../../shared/types/ApplicationSettings'

export class StorageService {
  private static getFilePath(): string {
    return join(app.getPath('userData'), 'repositories.json')
  }

  private static getSettingsFilePath(): string {
    return join(app.getPath('userData'), 'settings.json')
  }

  public static getSettings(): ApplicationSettings {
    try {
      const filePath = this.getSettingsFilePath()
      if (!fs.existsSync(filePath)) return {}
      const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      const value = parsed as Record<string, unknown>
      return {
        ...(typeof value.vscodeExecutablePath === 'string' && value.vscodeExecutablePath.trim()
          ? { vscodeExecutablePath: value.vscodeExecutablePath.trim() }
          : {}),
        ...(typeof value.riderExecutablePath === 'string' && value.riderExecutablePath.trim()
          ? { riderExecutablePath: value.riderExecutablePath.trim() }
          : {})
      }
    } catch (error) {
      console.error('Failed to load application settings:', error)
      return {}
    }
  }

  public static saveSettings(settings: ApplicationSettings): void {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings))
      throw new Error('Invalid application settings')
    const normalized: ApplicationSettings = {}
    for (const [key, value] of Object.entries(settings)) {
      if (!['vscodeExecutablePath', 'riderExecutablePath'].includes(key)) continue
      if (value !== undefined && typeof value !== 'string')
        throw new Error('Executable paths must be strings')
      if (typeof value === 'string' && value.trim()) normalized[key] = value.trim()
    }
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.writeFileSync(this.getSettingsFilePath(), JSON.stringify(normalized, null, 2), 'utf8')
  }

  /**
   * Loads the saved repository paths.
   */
  public static getRepositories(): string[] {
    try {
      const filePath = this.getFilePath()
      if (!fs.existsSync(filePath)) {
        return []
      }
      const data = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === 'string' && !!p.trim())
      }
      return []
    } catch (error) {
      console.error('Failed to load repositories from storage:', error)
      return []
    }
  }

  /**
   * Saves the repository paths.
   */
  public static saveRepositories(paths: string[]): void {
    try {
      const filePath = this.getFilePath()
      fs.writeFileSync(filePath, JSON.stringify(paths, null, 2), 'utf8')
    } catch (error) {
      console.error('Failed to save repositories to storage:', error)
    }
  }
}
