/**
 * AnalyticsIdentitySync — mountbar wrapper rundt useAnalyticsIdentity() for
 * apper som foretrekker et komponent-mønster fremfor å kalle hooken direkte.
 * Rendrer ingenting.
 *
 * Mount én gang inne i både AnalyticsProvider og AuthProvider (og
 * TenantProvider hvis appen er multi-tenant og traits inkluderer tenant).
 *
 * @example
 * ```tsx
 * const { user } = useAuth()
 * <AnalyticsIdentitySync user={user} traits={{ rolle: user?.role }} />
 * ```
 */

import type { AnalyticsIdentityUser } from './useAnalyticsIdentity'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'

export interface AnalyticsIdentitySyncProps {
  user: AnalyticsIdentityUser | null | undefined
  /** Ekstra attributter sendt til identify() ved innlogging (f.eks. { rolle, tenant }) */
  traits?: Record<string, unknown>
}

export function AnalyticsIdentitySync({ user, traits }: AnalyticsIdentitySyncProps) {
  useAnalyticsIdentity(user, traits)
  return null
}
