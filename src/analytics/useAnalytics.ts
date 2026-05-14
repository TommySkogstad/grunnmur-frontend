/**
 * useAnalytics — hook for manuell event-sporing via Umami.
 *
 * @example
 * ```tsx
 * const { trackEvent } = useAnalytics()
 * trackEvent('cta.klikk', { side: 'hjem' })
 * ```
 */

import { useCallback } from 'react'
import { useAnalyticsContext } from './AnalyticsProvider'

declare global {
  interface Window {
    umami?: {
      track(eventName: string, eventData?: Record<string, unknown>): void
      track(viewProperties: { url?: string; title?: string }): void
    }
  }
}

/**
 * Returnerer trackEvent-funksjon for manuell event-sporing.
 *
 * Er no-op dersom tracking er deaktivert (DEV-modus, opt-out, eller utenfor AnalyticsProvider).
 */
export function useAnalytics() {
  const { isEnabled } = useAnalyticsContext()

  const trackEvent = useCallback(
    (name: string, data?: Record<string, unknown>) => {
      if (!isEnabled) return
      window.umami?.track(name, data)
    },
    [isEnabled]
  )

  return { trackEvent }
}
