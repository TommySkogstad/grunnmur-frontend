/**
 * Tom tilstand: valgfritt ikon, tittel, forklaring og inntil to handlinger.
 *
 * Handlinger er ekte `<button>` (med `onClick`) eller `<a>` (med `href`).
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="Ingen medlemmer ennå"
 *   description="Legg til det første medlemmet for å komme i gang."
 *   actions={[{ label: 'Legg til medlem', onClick: openForm }]}
 * />
 * ```
 */
import type { ReactNode } from 'react';
/** En handling i EmptyState. Med `href` rendres en lenke, ellers en knapp. */
export interface EmptyStateAction {
    /** Tekst */
    label: string;
    /** Kalles ved klikk */
    onClick?: () => void;
    /** Rendrer lenke i stedet for knapp */
    href?: string;
}
/** Props for EmptyState-komponenten */
export interface EmptyStateProps {
    /** Valgfritt ikon, skjules for skjermlesere */
    icon?: ReactNode;
    /** Tittel */
    title: ReactNode;
    /** Forklaring */
    description?: ReactNode;
    /** Inntil to handlinger; flere enn to ignoreres. Den første er primær. */
    actions?: EmptyStateAction[];
    /** Nivå på tittelen (default: 2) */
    headingLevel?: 2 | 3 | 4;
    /** Ekstra klasser på beholderen */
    className?: string;
}
/** Viser at en liste eller side er tom, med forklaring og neste steg. */
export declare function EmptyState({ icon, title, description, actions, headingLevel, className, }: EmptyStateProps): import("react").JSX.Element;
