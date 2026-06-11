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
import type { MouseEvent, ReactNode } from 'react';
/** Props for TrackClick */
export interface TrackClickProps {
    /** Navn på eventet som spores ved klikk */
    event: string;
    /** Valgfrie event-data */
    data?: Record<string, unknown>;
    /**
     * Render prop. Mottar en onClick-handler som sporer eventet.
     * Konsumenten er ansvarlig for å plassere handleren og eventuelt kjede
     * sin egen onClick-logikk: `{(track) => <btn onClick={e => { track(e); min() }}>`.
     */
    children: (onClick: (e: MouseEvent) => void) => ReactNode;
}
/**
 * Eksponerer en spore-handler til render prop-barnet.
 * Sporing er no-op i DEV-modus / ved opt-out (styres av useAnalytics).
 */
export declare function TrackClick({ event, data, children }: TrackClickProps): import("react").JSX.Element;
