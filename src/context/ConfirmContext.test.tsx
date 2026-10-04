/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { ConfirmProvider } from './ConfirmContext'
import { useConfirm } from './confirmContext'

afterEach(cleanup)

function Harness({ onResult, args }: { onResult: (v: boolean) => void; args?: Parameters<ReturnType<typeof useConfirm>>[0] }) {
  const confirm = useConfirm()
  return (
    <button onClick={async () => onResult(await confirm(args ?? { title: 'Slette?', message: 'Dette kan ikke angres' }))}>
      Start
    </button>
  )
}

function setup(args?: Parameters<ReturnType<typeof useConfirm>>[0]) {
  const onResult = vi.fn()
  render(
    <ConfirmProvider>
      <Harness onResult={onResult} args={args} />
    </ConfirmProvider>
  )
  fireEvent.click(screen.getByText('Start'))
  return onResult
}

describe('useConfirm', () => {
  it('løser til true ved bekreft', async () => {
    const onResult = setup()
    expect(screen.getByRole('dialog', { name: 'Slette?' })).toBeTruthy()
    expect(screen.getByText('Dette kan ikke angres')).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bekreft' })) })
    expect(onResult).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('løser til false ved avbryt', async () => {
    const onResult = setup()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Avbryt' })) })
    expect(onResult).toHaveBeenCalledWith(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('løser til false ved Escape', async () => {
    const onResult = setup()
    await act(async () => { fireEvent.keyDown(document.activeElement!, { key: 'Escape' }) })
    expect(onResult).toHaveBeenCalledWith(false)
  })

  it('tar imot en ren streng som melding', async () => {
    const onResult = setup('Er du sikker?' as never)
    expect(screen.getByText('Er du sikker?')).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bekreft' })) })
    expect(onResult).toHaveBeenCalledWith(true)
  })

  it('bruker knappetekst og variant fra opsjonene', () => {
    setup({ title: 'T', confirmLabel: 'Slett', cancelLabel: 'Behold', variant: 'danger' })
    expect(screen.getByRole('button', { name: 'Slett' }).getAttribute('data-variant')).toBe('danger')
    expect(screen.getByRole('button', { name: 'Behold' })).toBeTruthy()
  })

  it('løser en åpen bekreftelse til false når en ny startes', async () => {
    const results: boolean[] = []
    function Two() {
      const confirm = useConfirm()
      return (
        <>
          <button onClick={async () => results.push(await confirm({ title: 'A' }))}>A</button>
          <button onClick={async () => results.push(await confirm({ title: 'B' }))}>B</button>
        </>
      )
    }
    render(<ConfirmProvider><Two /></ConfirmProvider>)
    fireEvent.click(screen.getByText('A'))
    await act(async () => { fireEvent.click(screen.getByText('B')) })
    expect(results).toEqual([false])
    expect(screen.getByRole('dialog', { name: 'B' })).toBeTruthy()
  })

  it('kaster utenfor ConfirmProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Bad() { useConfirm(); return null }
    expect(() => render(<Bad />)).toThrow('useConfirm must be used within a ConfirmProvider')
    spy.mockRestore()
  })
})
