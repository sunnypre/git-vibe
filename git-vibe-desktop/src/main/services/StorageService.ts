import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

export class StorageService {
  private static getFilePath(): string {
    return join(app.getPath('userData'), 'repositories.json')
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
