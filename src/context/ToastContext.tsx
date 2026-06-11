import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

/** Toast-type for visuell stil og semantikk */
export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

/** Verdi eksponert via useToast-hook */
export interface ToastContextValue {
  showToast: (message: string, type: ToastType, durationMs?: number) => number
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Tilbyr toast-varsler til hele komponenttreet.
 * Wrap rundt app-roten for å aktivere useToast-hook.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timerRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const showToast = useCallback((message: string, type: ToastType, durationMs = 4000): number => {
    const id = ++idRef.current
    const timerId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timerRef.current.delete(id)
    }, durationMs)
    timerRef.current.set(id, timerId)
    setToasts(prev => [...prev, { id, message, type }])
    return id
  }, [])

  const removeToast = useCallback((id: number) => {
    const timerId = timerRef.current.get(id)
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timerRef.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout)
      timerRef.current.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Returnerer showToast-funksjonen for å vise toast-varsler.
 * Må brukes innenfor en ToastProvider.
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map(toast => (
        <ToastItemComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItemComponent({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
  const iconBg = {
    success: 'bg-success-50',
    error: 'bg-danger-50',
    info: 'bg-primary-50',
  }[toast.type]

  const iconColor = {
    success: 'text-success-600',
    error: 'text-danger-600',
    info: 'text-primary-600',
  }[toast.type]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 animate-slide-in-right"
      role="alert"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
        {toast.type === 'success' && (
          <svg className={`h-4 w-4 ${iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {toast.type === 'error' && (
          <svg className={`h-4 w-4 ${iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        )}
        {toast.type === 'info' && (
          <svg className={`h-4 w-4 ${iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 text-gray-400 hover:text-gray-600"
        aria-label="Lukk"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
