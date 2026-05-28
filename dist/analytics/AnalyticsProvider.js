import { jsx as _jsx } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { AnalyticsContext } from './analyticsContext';
function isOptedOut() {
    try {
        return localStorage.getItem('umami.disabled') === '1';
    }
    catch {
        return false;
    }
}
/**
 * Laster Umami analytics-skriptet og tilgjengeliggjør tracking via kontekst.
 */
export function AnalyticsProvider({ websiteId, scriptSrc, isDev = false, children }) {
    const [optedOut] = useState(() => isOptedOut());
    const isEnabled = !isDev && !optedOut;
    useEffect(() => {
        if (!isEnabled)
            return;
        if (!scriptSrc.startsWith('https://')) {
            console.warn('[Analytics] scriptSrc bør bruke https://', scriptSrc);
        }
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.setAttribute('data-website-id', websiteId);
        script.src = scriptSrc;
        document.head.appendChild(script);
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [isEnabled, websiteId, scriptSrc]);
    return (_jsx(AnalyticsContext.Provider, { value: { isEnabled }, children: children }));
}
