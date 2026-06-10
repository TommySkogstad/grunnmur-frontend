/**
 * AnalyticsProvider — laster Umami analytics-skriptet og eksponerer
 * tracking-tilstand via React Context.
 *
 * Skipper innlasting i dev-modus (import.meta.env.DEV) eller dersom
 * brukeren har satt admin opt-out via localStorage.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider
 *   websiteId="abc123"
 *   scriptSrc="https://analytics.example.com/script.js"
 *   isDev={import.meta.env.DEV}
 * >
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
import type { ReactNode } from 'react';
/** Props for AnalyticsProvider */
export interface AnalyticsProviderProps {
    /** Umami website ID (data-website-id) */
    websiteId: string;
    /** URL til Umami script */
    scriptSrc: string;
    /**
     * Om appen kjøres i dev-modus. Sett til `import.meta.env.DEV` i konsumentappen.
     * Når `true` lastes ikke analytics-skriptet. Default `false`.
     */
    isDev?: boolean;
    children: ReactNode;
}
/**
 * Laster Umami analytics-skriptet og tilgjengeliggjør tracking via kontekst.
 */
export declare function AnalyticsProvider({ websiteId, scriptSrc, isDev, children }: AnalyticsProviderProps): import("react").JSX.Element;
