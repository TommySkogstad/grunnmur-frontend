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
import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';
export function useAnalyticsIdentity(user, traits) {
    const { identify, reset } = useAnalytics();
    const traitsKey = JSON.stringify(traits ?? {});
    useEffect(() => {
        if (user) {
            void identify(user.id, traits).catch((err) => {
                console.warn('[useAnalyticsIdentity] identify feilet:', err);
            });
        }
        else {
            reset();
        }
        // traitsKey (stabil JSON-serialisering) brukes i stedet for traits direkte,
        // siden traits ofte er et nytt objektlitteral hos kalleren på hver render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, traitsKey, identify, reset]);
}
