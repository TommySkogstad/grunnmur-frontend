/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'
import { axeViolations } from '../test/axe'

afterEach(cleanup)

describe('ConfirmDialog', () => {
  it('viser tittel, innhold og standard knappetekster', () => {
    render(
      <ConfirmDialog open title="Slette?" onConfirm={() => {}} onCancel={() => {}}>
        <ul><li>Fjerner 3 rader</li></ul>
      </ConfirmDialog>
    )
    expect(screen.getByRole('dialog', { name: 'Slette?' })).toBeTruthy()
    expect(screen.getByText('Fjerner 3 rader')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bekreft' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Avbryt' })).toBeTruthy()
  })

  it('bruker egne knappetekster', () => {
    render(
      <ConfirmDialog open title="T" confirmLabel="Slett" cancelLabel="Behold" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByRole('button', { name: 'Slett' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Behold' })).toBeTruthy()
  })

  it('kaller onConfirm og onCancel', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="T" onConfirm={onConfirm} onCancel={onCancel} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bekreft' })) })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Escape og klikk utenfor avbryter', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="T" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('farlig variant fokuserer avbryt først og markerer bekreft-knappen', () => {
    render(<ConfirmDialog open variant="danger" title="T" confirmLabel="Slett" onConfirm={() => {}} onCancel={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Avbryt' }))
    expect(screen.getByRole('button', { name: 'Slett' }).getAttribute('data-variant')).toBe('danger')
  })

  it('viser ventetilstand mens async onConfirm kjører og hindrer dobbeltklikk', async () => {
    let resolve!: () => void
    const onConfirm = vi.fn(() => new Promise<void>(r => { resolve = r }))
    render(<ConfirmDialog open title="T" onConfirm={onConfirm} onCancel={() => {}} />)
    const confirm = screen.getByRole('button', { name: 'Bekreft' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBe('true')
    expect((confirm as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Avbryt' }) as HTMLButtonElement).disabled).toBe(true)
    await act(async () => { resolve() })
    expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBe('false')
    expect((confirm as HTMLButtonElement).disabled).toBe(false)
  })

  it('Escape og klikk utenfor avbryter ikke mens handlingen kjører', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="T" onConfirm={() => new Promise<void>(() => {})} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bekreft' }))
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('busy-prop styrer ventetilstanden utenfra', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog open busy title="T" onConfirm={onConfirm} onCancel={() => {}} />)
    const confirm = screen.getByRole('button', { name: 'Bekreft' }) as HTMLButtonElement
    expect(confirm.disabled).toBe(true)
    fireEvent.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('nullstiller ventetilstanden når onConfirm kaster', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('feil')))
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    render(<ConfirmDialog open title="T" onConfirm={onConfirm} onCancel={() => {}} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bekreft' })) })
    process.off('unhandledRejection', unhandled)
    expect((screen.getByRole('button', { name: 'Bekreft' }) as HTMLButtonElement).disabled).toBe(false)
  })

  describe('axe', () => {
    it('har ingen tilgjengelighetsbrudd i standardvarianten', async () => {
      render(
        <ConfirmDialog open title="Slette?" onConfirm={() => {}} onCancel={() => {}}>
          <ul><li>Fjerner 3 rader</li></ul>
        </ConfirmDialog>
      )
      expect(await axeViolations()).toEqual([])
    })

    it('har ingen brudd i danger-varianten', async () => {
      render(
        <ConfirmDialog open title="Slette?" variant="danger" confirmLabel="Slett" onConfirm={() => {}} onCancel={() => {}}>
          Dette kan ikke angres.
        </ConfirmDialog>
      )
      expect(await axeViolations()).toEqual([])
    })

    it('har ingen brudd mens handlingen kjører', async () => {
      render(
        <ConfirmDialog open title="Slette?" onConfirm={() => new Promise<void>(() => {})} onCancel={() => {}} />
      )
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bekreft' })) })
      expect(await axeViolations()).toEqual([])
    })
  })
})
