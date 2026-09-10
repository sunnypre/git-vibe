import { useEffect, useState } from 'react'
import { FolderOpen, X } from 'lucide-react'
import type { ApplicationSettings } from '../../../shared/types/ApplicationSettings'
import { useGitStore } from '../store/useGitStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: Props): React.JSX.Element | null {
  const [settings, setSettings] = useState<ApplicationSettings>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    window.api.settings
      .get()
      .then((response): void => {
        setLoading(false)
        if (response.success) setSettings(response.data || {})
        else useGitStore.getState().showToast(response.error || 'Failed to load settings', 'error')
      })
      .catch((error: Error) => {
        setLoading(false)
        useGitStore.getState().showToast(error.message || 'Failed to load settings', 'error')
      })
  }, [open])

  if (!open) return null

  const browse = async (key: keyof ApplicationSettings): Promise<void> => {
    try {
      const selected = await window.api.settings.selectExecutable()
      if (selected) setSettings((current) => ({ ...current, [key]: selected }))
    } catch (error) {
      useGitStore
        .getState()
        .showToast(error instanceof Error ? error.message : 'Unable to select executable', 'error')
    }
  }

  const save = async (): Promise<void> => {
    const invalid = Object.values(settings).find((value) => value && !value.trim())
    if (invalid) {
      useGitStore.getState().showToast('Executable paths cannot be whitespace only.', 'error')
      return
    }
    try {
      const response = await window.api.settings.save(settings)
      if (!response.success) throw new Error(response.error || 'Failed to save settings')
      useGitStore.getState().showToast('Application settings saved.', 'success')
      onClose()
    } catch (error) {
      useGitStore
        .getState()
        .showToast(error instanceof Error ? error.message : 'Failed to save settings', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-[min(620px,calc(100vw-2rem))] rounded-lg border bg-background p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 id="settings-title" className="font-semibold">
              Application settings
            </h2>
            <p className="text-xs text-muted-foreground">Override automatic editor discovery.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {(['vscodeExecutablePath', 'riderExecutablePath'] as const).map((key) => (
          <label key={key} className="mb-4 block text-xs font-medium">
            {key === 'vscodeExecutablePath' ? 'VS Code executable' : 'Rider executable'}
            <div className="mt-1 flex gap-2">
              <input
                aria-label={
                  key === 'vscodeExecutablePath'
                    ? 'VS Code executable path'
                    : 'Rider executable path'
                }
                value={settings[key] || ''}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, [key]: event.target.value }))
                }
                placeholder="Use automatic discovery"
                className="min-w-0 flex-1 rounded border bg-muted/20 px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => browse(key)}
                className="flex items-center gap-2 rounded border px-3 hover:bg-muted"
              >
                <FolderOpen className="h-4 w-4" /> Browse
              </button>
            </div>
          </label>
        ))}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={save}
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
