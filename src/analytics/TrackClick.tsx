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

import { cloneElement, isValidElement } from 'react'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { useAnalytics } from './useAnalytics'

/** Props for TrackClick */
export interface TrackClickProps {
  /** Navn på eventet som spores ved klikk */
  event: string
  /** Valgfrie event-data */
  data?: Record<string, unknown>
  children: ReactNode
}

type ClickableElement = ReactElement<{ onClick?: (e: MouseEvent) => void }>

/**
 * Injiserer trackEvent i barnelementets onClick-handler.
 * Er barnelementet ikke et React-element, rendres det uten sporing.
 */
export function TrackClick({ event, data, children }: TrackClickProps) {
  const { trackEvent } = useAnalytics()

  if (!isValidElement(children)) return <>{children}</>

  const child = children as ClickableElement
  const originalOnClick = child.props.onClick

  return cloneElement(child, {
    onClick: (e: MouseEvent) => {
      trackEvent(event, data)
      originalOnClick?.(e)
    },
  })
}
