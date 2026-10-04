/**
 * Grå plassholdere mens innhold lastes: linje, tabellrad og kort.
 *
 * Beholderen har `role="status"` og `aria-busy="true"`; selve plassholderne
 * skjules for skjermlesere. Pulsen slås av ved `prefers-reduced-motion`
 * (Tailwind `motion-reduce:animate-none`).
 *
 * @example
 * ```tsx
 * {isLoading ? <Skeleton variant="table-row" count={5} columns={4} /> : <Tabell />}
 * ```
 */
/** Props for Skeleton-komponenten */
export interface SkeletonProps {
    /** Form på plassholderen (default: `line`) */
    variant?: 'line' | 'table-row' | 'card';
    /** Antall linjer, rader eller kort (default: 1) */
    count?: number;
    /** Antall celler per rad, kun for `table-row` (default: 4) */
    columns?: number;
    /** Tilgjengelig navn på beholderen (default: «Laster») */
    label?: string;
    /** Ekstra klasser på beholderen */
    className?: string;
}
/** Plassholdere for innhold som lastes. */
export declare function Skeleton({ variant, count, columns, label, className, }: SkeletonProps): import("react").JSX.Element;
