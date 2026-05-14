/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { useAnalytics } from './useAnalytics'
import { AnalyticsProvider } from './AnalyticsProvider'

function TestComponent({ onTrack }: { onTrack: (name: string) => void }) {
  const { trackEvent } = useAnalytics()
  return (
    <button onClick={() => {
      trackEvent('test-event', { key: 'val' })
      onTrack('test-event')
    }}>
      spor
    </button>
  )
}

describe('useAnalytics', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    // Rydd opp window.umami-mock
    delete (window as Window & { umami?: unknown }).umami
  })

  it('trackEvent er no-op når window.umami er undefined', async () => {
    vi.stubEnv('DEV', false)
    const onTrack = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TestComponent onTrack={onTrack} />
      </AnalyticsProvider>
    )

    // window.umami er ikke satt — kallet skal ikke kaste feil
    await act(async () => {
      getByText('spor').click()
    })

    expect(onTrack).toHaveBeenCalledOnce()
    // Ingen feil kastet = no-op fungerer korrekt
  })

  it('trackEvent kaller window.umami.track når umami er tilgjengelig', async () => {
    vi.stubEnv('DEV', false)
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

    const onTrack = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TestComponent onTrack={onTrack} />
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('spor').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('test-event', { key: 'val' })
  })

  it('trackEvent er no-op utenfor AnalyticsProvider (context-default isEnabled=false)', async () => {
    vi.stubEnv('DEV', false)
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

    const onTrack = vi.fn()

    // Ingen AnalyticsProvider — context-default er isEnabled=false
    const { getByText } = render(<TestComponent onTrack={onTrack} />)

    await act(async () => {
      getByText('spor').click()
    })

    // window.umami.track skal IKKE kalles siden isEnabled=false
    expect(mockTrack).not.toHaveBeenCalled()
    expect(onTrack).toHaveBeenCalledOnce()
  })

  it('trackEvent er no-op i dev-modus (DEV=true)', async () => {
    vi.stubEnv('DEV', true)
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

    const onTrack = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TestComponent onTrack={onTrack} />
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('spor').click()
    })

    expect(mockTrack).not.toHaveBeenCalled()
  })
})
