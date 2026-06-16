import { useEffect } from 'react'
import { useGitStore } from '../store/useGitStore'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

export const Toast = (): React.JSX.Element | null => {
  const { toast, clearToast } = useGitStore()

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      clearToast()
    }, 4500) // Auto dismiss after 4.5s

    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  const getColors = () => {
    switch (toast.type) {
      case 'error':
        return {
          border: 'border-[#f48771]/30',
          bg: 'bg-[#1e1e1e]/90',
          text: 'text-[#f48771]',
          icon: <AlertCircle className="w-4 h-4 text-[#f48771] shrink-0" />
        }
      case 'success':
        return {
          border: 'border-[#89d185]/30',
          bg: 'bg-[#1e1e1e]/90',
          text: 'text-[#89d185]',
          icon: <CheckCircle className="w-4 h-4 text-[#89d185] shrink-0" />
        }
      default:
        return {
          border: 'border-[#007acc]/30',
          bg: 'bg-[#1e1e1e]/90',
          text: 'text-[#007acc]',
          icon: <Info className="w-4 h-4 text-[#007acc] shrink-0" />
        }
    }
  }

  const { border, bg, icon } = getColors()

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full pointer-events-auto overflow-hidden animate-in slide-in-from-top-4 duration-300">
      <div className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-2xl ${bg} ${border}`}>
        {icon}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            System Notification
          </span>
          <span className="text-xs font-mono break-words text-foreground">
            {toast.message}
          </span>
        </div>
        <button
          onClick={clearToast}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/30 p-1 rounded transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Visual progress timer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted/10 overflow-hidden">
        <div 
          className={`h-full opacity-60 ${toast.type === 'error' ? 'bg-[#f48771]' : toast.type === 'success' ? 'bg-[#89d185]' : 'bg-[#007acc]'} animate-[toastProgress_4.5s_linear_forwards]`}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  )
}
