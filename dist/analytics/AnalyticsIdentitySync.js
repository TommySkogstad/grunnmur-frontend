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
import { useAnalyticsIdentity } from './useAnalyticsIdentity';
export function AnalyticsIdentitySync({ user, traits }) {
    useAnalyticsIdentity(user, traits);
    return null;
}
