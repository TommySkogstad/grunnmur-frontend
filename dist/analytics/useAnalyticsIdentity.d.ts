/**
 * useAnalyticsIdentity — holder Umami-sesjon synkronisert med innlogget bruker:
 * - Innlogget → identify(user.id, traits)
 * - Utlogget (user er null/undefined) → reset()
 *
 * Bruker-ID hashes lokalt i grunnmur (SHA-256 + per-app salt, se `useAnalytics`)
 * — Umami ser aldri faktisk ID eller PII. `traits` er fritt formet (typisk
 * `{ rolle }` eller `{ rolle, tenant }`) og sendes videre uendret til `identify()`.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user } = useAuth()
 *   useAnalyticsIdentity(user, user ? { rolle: user.role } : undefined)
 *   return <Routes>...</Routes>
 * }
 * ```
 */
/** Minimumskrav til brukerobjektet — kun id trengs, resten av feltene sendes via traits */
export interface AnalyticsIdentityUser {
    id: string | number;
}
export declare function useAnalyticsIdentity(user: AnalyticsIdentityUser | null | undefined, traits?: Record<string, unknown>): void;
