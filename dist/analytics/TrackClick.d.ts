/**
 * TrackClick — deklarativ wrapper som sporer klikk på barnelementet.
 *
 * @example
 * ```tsx
 * <TrackClick event="cta.opprett-mote">
 *   <Button>Opprett møte</Button>
 * </TrackClick>
 * ```
 */
import type { ReactNode } from 'react';
/** Props for TrackClick */
export interface TrackClickProps {
    /** Navn på eventet som spores ved klikk */
    event: string;
    /** Valgfrie event-data */
    data?: Record<string, unknown>;
    children: ReactNode;
}
/**
 * Injiserer trackEvent i barnelementets onClick-handler.
 * Er barnelementet ikke et React-element, rendres det uten sporing.
 */
export declare function TrackClick({ event, data, children }: TrackClickProps): import("react").JSX.Element;
