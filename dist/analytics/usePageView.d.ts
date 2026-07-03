/**
 * usePageView — sporer SPA-sidevisninger ved navigasjon med React Router.
 *
 * Krever at komponenten er innenfor en react-router-dom Router.
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
/** Valgfri konfigurasjon for usePageView */
export interface UsePageViewOptions {
    /**
     * Transformer pathname før den sendes til Umami — typisk for å anonymisere
     * dynamiske segmenter (bruker-ID-er, tokens). Se `anonymizePathname` for en
     * ferdig superset-implementasjon. Default: ingen transform (rå pathname).
     */
    transformUrl?: (pathname: string) => string;
}
/**
 * Kaller window.umami.track({ url }) ved pathname-endringer.
 * Er no-op dersom tracking er deaktivert.
 */
export declare function usePageView(options?: UsePageViewOptions): void;
