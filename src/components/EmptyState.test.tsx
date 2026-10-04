/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { axeViolations } from '../test/axe'

afterEach(cleanup)

describe('EmptyState', () => {
  it('viser tittel og forklaring', () => {
    render(<EmptyState title="Ingen medlemmer" description="Legg til det første." />)
    expect(screen.getByRole('heading', { name: 'Ingen medlemmer' })).toBeTruthy()
    expect(screen.getByText('Legg til det første.')).toBeTruthy()
  })

  it('viser to knapper for to handlinger', () => {
    const a = vi.fn()
    const b = vi.fn()
    render(
      <EmptyState
        title="Tomt"
        actions={[{ label: 'Legg til', onClick: a }, { label: 'Importer', onClick: b }]}
      />
    )
    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Legg til' }))
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).not.toHaveBeenCalled()
  })

  it('rendrer handling med href som lenke', () => {
    render(<EmptyState title="Tomt" actions={[{ label: 'Hjelp', href: '/hjelp' }]} />)
    const link = screen.getByRole('link', { name: 'Hjelp' })
    expect(link.getAttribute('href')).toBe('/hjelp')
  })

  it('viser bare de to første handlingene', () => {
    render(
      <EmptyState
        title="Tomt"
        actions={[
          { label: 'A', onClick: () => {} },
          { label: 'B', onClick: () => {} },
          { label: 'C', onClick: () => {} },
        ]}
      />
    )
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.queryByText('C')).toBeNull()
  })

  it('skjuler ikonet for skjermlesere', () => {
    const { container } = render(<EmptyState title="Tomt" icon={<svg data-testid="i" />} />)
    expect(container.querySelector('[aria-hidden="true"] [data-testid="i"]')).toBeTruthy()
  })

  it('bruker valgt overskriftsnivå', () => {
    render(<EmptyState title="Tomt" headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy()
  })

  describe('axe', () => {
    it('har ingen tilgjengelighetsbrudd', async () => {
      render(
        <main>
        <EmptyState
          icon={<svg />}
          title="Ingen medlemmer"
          description="Legg til det første."
          actions={[{ label: 'Legg til', onClick: () => {} }, { label: 'Hjelp', href: '/hjelp' }]}
        />
        </main>
      )
      expect(await axeViolations()).toEqual([])
    })
  })
})
