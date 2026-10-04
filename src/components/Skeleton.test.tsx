/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Skeleton } from './Skeleton'
import { axeViolations } from '../test/axe'

afterEach(cleanup)

describe('Skeleton', () => {
  it('setter aria-busy på beholderen', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true')
  })

  it('har tilgjengelig navn, som kan overstyres', () => {
    const { rerender } = render(<Skeleton />)
    expect(screen.getByRole('status', { name: 'Laster' })).toBeTruthy()
    rerender(<Skeleton label="Laster medlemmer" />)
    expect(screen.getByRole('status', { name: 'Laster medlemmer' })).toBeTruthy()
  })

  it('rendrer count linjer', () => {
    render(<Skeleton variant="line" count={4} />)
    expect(screen.getByRole('status').querySelectorAll('[data-skeleton="line"]')).toHaveLength(4)
  })

  it('rendrer tabellrader med gitt antall kolonner', () => {
    render(<Skeleton variant="table-row" count={2} columns={3} />)
    const rows = screen.getByRole('status').querySelectorAll('[data-skeleton="table-row"]')
    expect(rows).toHaveLength(2)
    expect(rows[0].querySelectorAll('[data-skeleton="cell"]')).toHaveLength(3)
  })

  it('rendrer kort', () => {
    render(<Skeleton variant="card" count={2} />)
    expect(screen.getByRole('status').querySelectorAll('[data-skeleton="card"]')).toHaveLength(2)
  })

  it('animerer ikke ved redusert bevegelse', () => {
    render(<Skeleton variant="card" />)
    const el = screen.getByRole('status').querySelector('[data-skeleton="card"] [data-skeleton="block"]')!
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('motion-reduce:animate-none')
  })

  it('skjuler plassholderne for skjermlesere', () => {
    render(<Skeleton />)
    expect(screen.getByRole('status').querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  describe('axe', () => {
    it.each(['line', 'table-row', 'card'] as const)('har ingen brudd for %s', async variant => {
      render(<Skeleton variant={variant} count={2} />)
      expect(await axeViolations()).toEqual([])
    })
  })
})
