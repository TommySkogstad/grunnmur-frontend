/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

function TestComponent() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('Suksessmelding', 'success')}>Vis success</button>
      <button onClick={() => showToast('Feilmelding', 'error')}>Vis error</button>
      <button onClick={() => showToast('Infomelding', 'info')}>Vis info</button>
    </div>
  )
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('useToast kaster error utenfor ToastProvider', () => {
    function BadComponent() {
      useToast()
      return <div>Should not render</div>
    }

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within a ToastProvider')
    spy.mockRestore()
  })

  it('showToast viser melding', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    expect(screen.getByText('Suksessmelding')).toBeTruthy()
  })

  it('toast forsvinner etter timeout (4000ms)', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    expect(screen.getByText('Suksessmelding')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Suksessmelding')).toBeNull()
  })

  it('toast forsvinner ikke for tidlig', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    expect(screen.getByText('Suksessmelding')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3999)
    })

    expect(screen.queryByText('Suksessmelding')).not.toBeNull()
  })

  it('viser success toast med role="alert"', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Suksessmelding')).toBeTruthy()
  })

  it('viser error toast', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis error'))
    })

    expect(screen.getByText('Feilmelding')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('viser info toast', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis info'))
    })

    expect(screen.getByText('Infomelding')).toBeTruthy()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('aria-live="polite" er satt for skjermlesere', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    const container = screen.getByText('Suksessmelding').closest('[aria-live]')
    expect(container?.getAttribute('aria-live')).toBe('polite')
  })

  it('kan vise flere toasts samtidig', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
      fireEvent.click(screen.getByText('Vis error'))
    })

    expect(screen.getByText('Suksessmelding')).toBeTruthy()
    expect(screen.getByText('Feilmelding')).toBeTruthy()
  })

  it('lukk-knapp fjerner toast manuelt', () => {
    renderWithProvider(<TestComponent />)

    act(() => {
      fireEvent.click(screen.getByText('Vis success'))
    })

    expect(screen.getByText('Suksessmelding')).toBeTruthy()

    act(() => {
      fireEvent.click(screen.getByLabelText('Lukk'))
    })

    expect(screen.queryByText('Suksessmelding')).toBeNull()
  })

  it('toast-container rendres ikke når ingen toasts er aktive', () => {
    const { container } = renderWithProvider(<TestComponent />)
    expect(container.querySelector('[aria-live]')).toBeNull()
  })
})
