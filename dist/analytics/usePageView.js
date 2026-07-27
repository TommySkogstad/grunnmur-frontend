/**
 * usePageView — sporer SPA-sidevisninger ved navigasjon med React Router.
 *
 * Krever at komponenten er innenfor en react-router Router.
 *
 * **Semantikk:** Kaller `window.umami.track({ url })` — Umamis native
 * pageview-API. Dette registreres som en ekte sidevisning i Umami-
 * dashbordet. Dette er IKKE det samme som `useAnalytics().trackEvent('pageview', {...})`,
 * som kaller `window.umami.track(eventName, data)` og registreres som en
 * *custom event* kalt «pageview» — ikke en ekte sidevisning. Bruk denne
 * hooken for sidevisninger, ikke `trackEvent`.
 *
 * @example
 * ```tsx
 * function App() {
 *   usePageView()
 *   return <Routes>...</Routes>
 * }
 * ```
 *
 * @example Anonymiser dynamiske ID-er/tokens i stien før sending
 * ```tsx
 * import { usePageView, anonymizePathname } from '@tommyskogstad/frontend-core'
 *
 * function App() {
 *   usePageView({ transformUrl: anonymizePathname })
 *   return <Routes>...</Routes>
 * }
 * ```
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useAnalyticsContext } from './analyticsContext';
/**
 * Kaller window.umami.track({ url }) ved pathname-endringer.
 * Er no-op dersom tracking er deaktivert.
 */
export function usePageView(options) {
    const { isEnabled } = useAnalyticsContext();
    const location = useLocation();
    // transformUrl fanges via ref slik at en ustabil inline-funksjon fra
    // kalleren ikke trigger et nytt track()-kall på hver render — kun faktiske
    // pathname-endringer skal utløse effekten. Ref-oppdateringen skjer i en
    // egen effekt (ikke direkte i render-kroppen) — refs skal ikke skrives
    // under render.
    const transformUrlRef = useRef(options?.transformUrl);
    useEffect(() => {
        transformUrlRef.current = options?.transformUrl;
    });
    useEffect(() => {
        if (!isEnabled)
            return;
        const transform = transformUrlRef.current;
        window.umami?.track({ url: transform ? transform(location.pathname) : location.pathname });
    }, [isEnabled, location.pathname]);
}
