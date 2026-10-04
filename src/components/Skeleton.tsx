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
  variant?: 'line' | 'table-row' | 'card'
  /** Antall linjer, rader eller kort (default: 1) */
  count?: number
  /** Antall celler per rad, kun for `table-row` (default: 4) */
  columns?: number
  /** Tilgjengelig navn på beholderen (default: «Laster») */
  label?: string
  /** Ekstra klasser på beholderen */
  className?: string
}

const block = 'animate-pulse motion-reduce:animate-none rounded bg-gray-200'

/** Plassholdere for innhold som lastes. */
export function Skeleton({
  variant = 'line',
  count = 1,
  columns = 4,
  label = 'Laster',
  className = '',
}: SkeletonProps) {
  const items = Array.from({ length: Math.max(0, count) }, (_, i) => i)
  return (
    <div role="status" aria-busy="true" aria-label={label} className={`space-y-3 ${className}`.trim()}>
      {items.map(i => {
        if (variant === 'table-row') {
          return (
            <div key={i} data-skeleton="table-row" aria-hidden="true" className="flex gap-4">
              {Array.from({ length: Math.max(1, columns) }, (_, c) => (
                <div key={c} data-skeleton="cell" className={`${block} h-4 flex-1`} />
              ))}
            </div>
          )
        }
        if (variant === 'card') {
          return (
            <div
              key={i}
              data-skeleton="card"
              aria-hidden="true"
              className="space-y-3 rounded-lg border border-gray-200 p-4"
            >
              <div data-skeleton="block" className={`${block} h-5 w-1/3`} />
              <div data-skeleton="block" className={`${block} h-4 w-full`} />
              <div data-skeleton="block" className={`${block} h-4 w-5/6`} />
            </div>
          )
        }
        return <div key={i} data-skeleton="line" aria-hidden="true" className={`${block} h-4 w-full`} />
      })}
    </div>
  )
}
