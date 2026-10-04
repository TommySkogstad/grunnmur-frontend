import { useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ConfirmContext } from './confirmContext'
import type { ConfirmFn, ConfirmOptions } from './confirmContext'

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

/**
 * Tilbyr useConfirm til hele komponenttreet og rendrer dialogen.
 * Wrap rundt app-roten, innenfor eller utenfor ToastProvider.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const pendingRef = useRef<PendingConfirm | null>(null)

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(value)
  }, [])

  const confirm = useCallback<ConfirmFn>(
    options =>
      new Promise<boolean>(resolve => {
        // En ny bekreftelse avbryter en som allerede er åpen
        pendingRef.current?.resolve(false)
        const next = { options: typeof options === 'string' ? { message: options } : options, resolve }
        pendingRef.current = next
        setPending(next)
      }),
    []
  )

  useEffect(
    () => () => {
      pendingRef.current?.resolve(false)
      pendingRef.current = null
    },
    []
  )

  const options = pending?.options

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title={options?.title ?? 'Bekreft'}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        variant={options?.variant}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      >
        {options?.message}
      </ConfirmDialog>
    </ConfirmContext.Provider>
  )
}
