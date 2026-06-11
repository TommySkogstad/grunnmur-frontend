import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * TrackClick — deklarativ render prop som sporer klikk via analytics.
 *
 * Gir konsumenten en ferdig onClick-handler som sporer eventet. Konsumenten
 * plasserer selv handleren og kan kjede sin egen onClick-logikk.
 *
 * @example
 * ```tsx
 * <TrackClick event="cta.opprett-mote" data={{ side: 'hjem' }}>
 *   {(onClick) => <Button onClick={onClick}>Opprett møte</Button>}
 * </TrackClick>
 *
 * // Med egen klikk-logikk i tillegg:
 * <TrackClick event="cta.lagre">
 *   {(track) => (
 *     <Button onClick={(e) => { track(e); lagre() }}>Lagre</Button>
 *   )}
 * </TrackClick>
 * ```
 */
import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';
/**
 * Eksponerer en spore-handler til render prop-barnet.
 * Sporing er no-op i DEV-modus / ved opt-out (styres av useAnalytics).
 */
export function TrackClick({ event, data, children }) {
    const { trackEvent } = useAnalytics();
    const handleClick = useCallback((_e) => {
        trackEvent(event, data);
    }, [trackEvent, event, data]);
    return _jsx(_Fragment, { children: children(handleClick) });
}
