/**
 * AnalyticsProvider — laster Umami analytics-skriptet og eksponerer
 * tracking-tilstand via React Context.
 *
 * Skipper innlasting i dev-modus (import.meta.env.DEV) eller dersom
 * brukeren har satt admin opt-out via localStorage.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider websiteId="abc123" scriptSrc="https://analytics.example.com/script.js">
 *   <App />
 * </AnalyticsProvider>
 * ```
 */

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/** @internal — brukt av useAnalytics og usePageView */
export interface AnalyticsContextValue {
  isEnabled: boolean
}

/** @internal */
export const AnalyticsContext = createContext<AnalyticsContextValue>({ isEnabled: false })

/** @internal */
export function useAnalyticsContext(): AnalyticsContextValue {
  return useContext(AnalyticsContext)
}

/** Props for AnalyticsProvider */
export interface AnalyticsProviderProps {
  /** Umami website ID (data-website-id) */
  websiteId: string
  /** URL til Umami script */
  scriptSrc: string
  /**
   * Om appen kjøres i dev-modus. Sett til `import.meta.env.DEV` i konsumentappen.
   * Når `true` lastes ikke analytics-skriptet. Default `false`.
   */
  isDev?: boolean
  children: ReactNode
}

function isOptedOut(): boolean {
  try {
    return localStorage.getItem('umami.disabled') === '1'
  } catch {
    return false
  }
}

/**
 * Laster Umami analytics-skriptet og tilgjengeliggjør tracking via kontekst.
 */
export function AnalyticsProvider({ websiteId, scriptSrc, isDev = false, children }: AnalyticsProviderProps) {
  const [optedOut] = useState(() => isOptedOut())
  const isEnabled = !isDev && !optedOut

  useEffect(() => {
    if (!isEnabled) return

    if (!scriptSrc.startsWith('https://')) {
      console.warn('[Analytics] scriptSrc bør bruke https://', scriptSrc)
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.setAttribute('data-website-id', websiteId)
    script.src = scriptSrc
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [isEnabled, websiteId, scriptSrc])

  return (
    <AnalyticsContext.Provider value={{ isEnabled }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
