/**
 * useAnalytics — hook for manuell event-sporing og session-identifisering via Umami.
 *
 * @example
 * ```tsx
 * const { trackEvent, identify, reset } = useAnalytics()
 *
 * // Event-sporing:
 * trackEvent('cta.klikk', { side: 'hjem' })
 *
 * // Session-identifisering ved login:
 * await identify(user.id, { rolle: user.role, tenant: 'leienbiolog' })
 *
 * // Rydd ved logout:
 * reset()
 * ```
 */
import { useCallback } from 'react';
import { useAnalyticsContext } from './analyticsContext';
/**
 * Hash en bruker-ID til et pseudonym (16 hex-tegn) via SHA-256.
 *
 * Salt er per-app (default = window.location.hostname) slik at samme bruker
 * får ulike pseudonymer på tvers av apper — forhindrer cross-app-tracking.
 *
 * @internal
 */
export async function hashUserId(userId, salt) {
    const effectiveSalt = salt ?? (typeof window !== 'undefined' ? window.location.hostname : '');
    const data = new TextEncoder().encode(`${userId}:${effectiveSalt}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16);
}
/**
 * Returnerer trackEvent, identify og reset for analytics.
 *
 * Alle funksjoner er no-op dersom tracking er deaktivert (DEV-modus,
 * opt-out, eller utenfor AnalyticsProvider).
 */
export function useAnalytics() {
    const { isEnabled } = useAnalyticsContext();
    const trackEvent = useCallback((name, data) => {
        if (!isEnabled)
            return;
        window.umami?.track(name, data);
    }, [isEnabled]);
    /**
     * Kobler nåværende Umami-sesjon til en stabil pseudonym-ID + valgfrie
     * session-attributter (typisk rolle og tenant).
     *
     * Bruker-ID hashes lokalt før den sendes til Umami — Umami ser aldri
     * den faktiske ID-en eller noen PII.
     */
    const identify = useCallback(async (userId, attrs) => {
        if (!isEnabled || !window.umami)
            return;
        if (userId === null) {
            window.umami.identify(attrs ?? {});
            return;
        }
        const id = await hashUserId(String(userId));
        window.umami.identify(id, attrs ?? {});
    }, [isEnabled]);
    /**
     * Tøm session-identifisering — kall ved logout for å forhindre at
     * neste bruker på samme nettleser arver forrige bruker sin Umami-sesjon.
     * (Særlig viktig på delte PC-er, f.eks. styremøter.)
     */
    const reset = useCallback(() => {
        if (!isEnabled || !window.umami)
            return;
        window.umami.identify({});
    }, [isEnabled]);
    return { trackEvent, identify, reset };
}
