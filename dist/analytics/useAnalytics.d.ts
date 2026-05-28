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
declare global {
    interface Window {
        umami?: {
            track(eventName: string, eventData?: Record<string, unknown>): void;
            track(viewProperties: {
                url?: string;
                title?: string;
            }): void;
            identify(uniqueId: string, sessionData?: Record<string, unknown>): void;
            identify(sessionData: Record<string, unknown>): void;
        };
    }
}
/**
 * Hash en bruker-ID til et pseudonym (16 hex-tegn) via SHA-256.
 *
 * Salt er per-app (default = window.location.hostname) slik at samme bruker
 * får ulike pseudonymer på tvers av apper — forhindrer cross-app-tracking.
 *
 * @internal
 */
export declare function hashUserId(userId: string, salt?: string): Promise<string>;
/**
 * Returnerer trackEvent, identify og reset for analytics.
 *
 * Alle funksjoner er no-op dersom tracking er deaktivert (DEV-modus,
 * opt-out, eller utenfor AnalyticsProvider).
 */
export declare function useAnalytics(): {
    trackEvent: (name: string, data?: Record<string, unknown>) => void;
    identify: (userId: string | number | null, attrs?: Record<string, unknown>) => Promise<void>;
    reset: () => void;
};
