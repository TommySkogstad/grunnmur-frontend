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
/**
 * Kaller window.umami.track ved pathname-endringer.
 * Er no-op dersom tracking er deaktivert.
 */
export declare function usePageView(): void;
