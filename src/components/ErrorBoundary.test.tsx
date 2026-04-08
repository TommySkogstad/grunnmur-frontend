/// <reference types="vitest/config" />
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Komponent som kaster feil for testing
function ThrowingComponent({ error }: { error?: Error }) {
  if (error) throw error
  return <div>Alt fungerer</div>
}

describe('ErrorBoundary', () => {
  // Undertryck console.error fra React under ErrorBoundary-testing
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('rendrer children når ingen feil oppstår', () => {
    render(
      <ErrorBoundary fallback={<p>Feil</p>}>
        <p>Innhold</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('Innhold')).toBeDefined()
  })

  it('viser fallback ReactNode når en feil kastes', () => {
    render(
      <ErrorBoundary fallback={<p>Noe gikk galt</p>}>
        <ThrowingComponent error={new Error('Testfeil')} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Noe gikk galt')).toBeDefined()
  })

  it('viser fallback render-funksjon med error og reset', () => {
    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>Feil: {error.message}</p>
            <button onClick={reset}>Prøv igjen</button>
          </div>
        )}
      >
        <ThrowingComponent error={new Error('Render-feil')} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Feil: Render-feil')).toBeDefined()
    expect(screen.getByText('Prøv igjen')).toBeDefined()
  })

  it('kaller onError callback med error og errorInfo', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary fallback={<p>Feil</p>} onError={onError}>
        <ThrowingComponent error={new Error('Callback-feil')} />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe('Callback-feil')
    // errorInfo skal ha componentStack
    expect(onError.mock.calls[0][1]).toHaveProperty('componentStack')
  })

  it('bruker standard fallback-melding uten fallback-prop', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error('Uventet feil')} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Noe gikk galt')).toBeDefined()
    expect(screen.getByText('Last inn siden på nytt')).toBeDefined()
  })

  it('setter className på wrapper-elementet', () => {
    const { container } = render(
      <ErrorBoundary className="min-error-klasse" fallback={<p>Feil</p>}>
        <ThrowingComponent error={new Error('Klasse-test')} />
      </ErrorBoundary>
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toBe('min-error-klasse')
  })
})
