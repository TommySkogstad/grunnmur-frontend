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

  it('showToast returnerer en numerisk ID', () => {
    let toastId: number | undefined
    function IdCapture() {
      const { showToast } = useToast()
      return (
        <button onClick={() => { toastId = showToast('Test', 'info') }}>Vis</button>
      )
    }
    renderWithProvider(<IdCapture />)
    act(() => { fireEvent.click(screen.getByText('Vis')) })
    expect(typeof toastId).toBe('number')
    expect(toastId).toBeGreaterThan(0)
  })

  it('removeToast fjerner riktig toast umiddelbart', () => {
    let capturedId: number | undefined
    function RemoveTest() {
      const { showToast, removeToast } = useToast()
      return (
        <div>
          <button onClick={() => { capturedId = showToast('Fjern meg', 'info') }}>Vis</button>
          <button onClick={() => { if (capturedId !== undefined) removeToast(capturedId) }}>Fjern</button>
        </div>
      )
    }
    renderWithProvider(<RemoveTest />)
    act(() => { fireEvent.click(screen.getByText('Vis')) })
    expect(screen.getByText('Fjern meg')).toBeTruthy()
    act(() => { fireEvent.click(screen.getByText('Fjern')) })
    expect(screen.queryByText('Fjern meg')).toBeNull()
  })

  it('removeToast kansellerer auto-dismiss setTimeout', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    let capturedId: number | undefined
    function CancelTest() {
      const { showToast, removeToast } = useToast()
      return (
        <div>
          <button onClick={() => { capturedId = showToast('Avbryt meg', 'info') }}>Vis</button>
          <button onClick={() => { if (capturedId !== undefined) removeToast(capturedId) }}>Avbryt</button>
        </div>
      )
    }
    renderWithProvider(<CancelTest />)
    act(() => { fireEvent.click(screen.getByText('Vis')) })
    act(() => { fireEvent.click(screen.getByText('Avbryt')) })

    expect(clearTimeoutSpy).toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(8000) })
    expect(screen.queryByText('Avbryt meg')).toBeNull()

    clearTimeoutSpy.mockRestore()
  })

  it('removeToast fjerner kun riktig toast, andre forblir', () => {
    const ids: number[] = []
    function MultiRemove() {
      const { showToast, removeToast } = useToast()
      return (
        <div>
          <button onClick={() => { ids.push(showToast('Toast A', 'info')) }}>Vis A</button>
          <button onClick={() => { ids.push(showToast('Toast B', 'success')) }}>Vis B</button>
          <button onClick={() => { if (ids[0] !== undefined) removeToast(ids[0]) }}>Fjern A</button>
        </div>
      )
    }
    renderWithProvider(<MultiRemove />)
    act(() => {
      fireEvent.click(screen.getByText('Vis A'))
      fireEvent.click(screen.getByText('Vis B'))
    })
    act(() => { fireEvent.click(screen.getByText('Fjern A')) })
    expect(screen.queryByText('Toast A')).toBeNull()
    expect(screen.getByText('Toast B')).toBeTruthy()
  })

  it('custom durationMs gir korrekt auto-dismiss-timing', () => {
    function CustomDuration() {
      const { showToast } = useToast()
      return (
        <button onClick={() => showToast('Lang toast', 'info', 8000)}>Vis lang</button>
      )
    }
    renderWithProvider(<CustomDuration />)
    act(() => { fireEvent.click(screen.getByText('Vis lang')) })
    expect(screen.getByText('Lang toast')).toBeTruthy()

    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('Lang toast')).not.toBeNull()

    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('Lang toast')).toBeNull()
  })

  it('alle timers kanselleres ved unmount av ToastProvider', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    function UnmountTest() {
      const { showToast } = useToast()
      return <button onClick={() => showToast('Unmount toast', 'info', 5000)}>Vis</button>
    }
    const { unmount } = renderWithProvider(<UnmountTest />)
    act(() => { fireEvent.click(screen.getByText('Vis')) })

    clearTimeoutSpy.mockClear()
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
