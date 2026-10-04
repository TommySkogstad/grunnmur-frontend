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

import type { ReactNode } from 'react'

/** En handling i EmptyState. Med `href` rendres en lenke, ellers en knapp. */
export interface EmptyStateAction {
  /** Tekst */
  label: string
  /** Kalles ved klikk */
  onClick?: () => void
  /** Rendrer lenke i stedet for knapp */
  href?: string
}

/** Props for EmptyState-komponenten */
export interface EmptyStateProps {
  /** Valgfritt ikon, skjules for skjermlesere */
  icon?: ReactNode
  /** Tittel */
  title: ReactNode
  /** Forklaring */
  description?: ReactNode
  /** Inntil to handlinger; flere enn to ignoreres. Den første er primær. */
  actions?: EmptyStateAction[]
  /** Nivå på tittelen (default: 2) */
  headingLevel?: 2 | 3 | 4
  /** Ekstra klasser på beholderen */
  className?: string
}

const primaryClasses =
  'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700'
const secondaryClasses =
  'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'

/** Viser at en liste eller side er tom, med forklaring og neste steg. */
export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  headingLevel = 2,
  className = '',
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`.trim()}>
      {icon && (
        <div aria-hidden="true" className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <Heading className="text-lg font-semibold text-gray-900">{title}</Heading>
      {description && <p className="mt-2 max-w-md text-sm text-gray-600">{description}</p>}
      {actions.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions.slice(0, 2).map((action, i) => {
            const classes = i === 0 ? primaryClasses : secondaryClasses
            return action.href !== undefined ? (
              <a key={action.label} href={action.href} onClick={action.onClick} className={classes}>
                {action.label}
              </a>
            ) : (
              <button key={action.label} type="button" onClick={action.onClick} className={classes}>
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
