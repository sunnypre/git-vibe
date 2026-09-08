import { useEffect, useRef, useState } from 'react'
import type {
  ApplicationId,
  SupportedApplication
} from '../../../../shared/types/RepositoryExplorerModels'
import { useGitStore } from '../../store/useGitStore'

export function OpenWithDialog({ repoId }: { repoId: string }): React.JSX.Element | null {
  const repo = useGitStore((state) => state.repositories[repoId])
  const close = useGitStore((state) => state.setOpenWithTarget)
  const showToast = useGitStore((state) => state.showToast)
  const [applications, setApplications] = useState<SupportedApplication[]>([])
  const [selected, setSelected] = useState<ApplicationId | ''>('')
  const confirmRef = useRef<HTMLButtonElement>(null)
  const target = repo.openWithTarget
  useEffect(() => {
    if (!target) return
    setSelected('')
    window.api.explorer
      .getApplications(repo.path, target.relativePath, target.kind)
      .then((response) => {
        if (response.success) setApplications(response.data || [])
        else showToast(response.error || 'Application discovery failed', 'error')
      })
    requestAnimationFrame(() => confirmRef.current?.focus())
  }, [target, repo.path, showToast])
  if (!target) return null
  const launch = async () => {
    if (!selected) return
    const response = await window.api.explorer.openPath({
      repositoryRoot: repo.path,
      relativePath: target.relativePath,
      kind: target.kind,
      applicationId: selected
    })
    showToast(
      response.success ? `Opened ${target.name}` : response.error || 'Launch failed',
      response.success ? 'success' : 'error'
    )
    if (response.success) close(repoId, null)
  }
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      role="presentation"
      onKeyDown={(event) => event.key === 'Escape' && close(repoId, null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-with-title"
        className="w-[420px] max-w-[90vw] bg-card border rounded-lg shadow-xl p-5"
      >
        <h2 id="open-with-title" className="text-base font-semibold">
          Open With
        </h2>
        <p className="text-xs text-muted-foreground mt-1 break-all">
          {target.relativePath || repo.name}
        </p>
        <div className="my-4 space-y-2">
          {applications.length ? (
            applications.map((app) => (
              <label
                key={app.id}
                className="flex gap-2 items-center p-2 border rounded cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  name="application"
                  value={app.id}
                  checked={selected === app.id}
                  onChange={() => setSelected(app.id)}
                />
                {app.name}
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No compatible installed applications found.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1.5 border rounded text-sm"
            onClick={() => close(repoId, null)}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            disabled={!selected}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            onClick={launch}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  )
}
