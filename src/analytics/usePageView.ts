/**
 * usePageView — sporer SPA-sidevisninger ved navigasjon med React Router.
 *
 * Krever at komponenten er innenfor en react-router-dom Router.
 *
 * @example
 * ```tsx
 * function App() {
 *   usePageView()
 *   return <Routes>...</Routes>
 * }
 * ```
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnalyticsContext } from './AnalyticsProvider'

/**
 * Kaller window.umami.track ved pathname-endringer.
 * Er no-op dersom tracking er deaktivert.
 */
export function usePageView(): void {
  const { isEnabled } = useAnalyticsContext()
  const location = useLocation()

  useEffect(() => {
    if (!isEnabled) return
    window.umami?.track({ url: location.pathname })
  }, [isEnabled, location.pathname])
}
