import { createContext, useContext } from 'react'

/** Toast-type for visuell stil og semantikk */
export type ToastType = 'success' | 'error' | 'info'

/** Verdi eksponert via useToast-hook */
export interface ToastContextValue {
  showToast: (message: string, type: ToastType, durationMs?: number) => number
  removeToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

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
