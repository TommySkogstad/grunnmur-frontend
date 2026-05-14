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

import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'

// Lokal augmentering av ImportMeta — unngår avhengighet av vite/client i biblioteket.
// Konsumentenes bundler (Vite) erstatter import.meta.env.DEV ved build.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean
      readonly [key: string]: unknown
    }
  }
}

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
export function AnalyticsProvider({ websiteId, scriptSrc, children }: AnalyticsProviderProps) {
  const isEnabled = !import.meta.env.DEV && !isOptedOut()

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
