/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup, waitFor } from '@testing-library/react'
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
    // Rydd opp window.umami-mock
    delete (window as Window & { umami?: unknown }).umami
  })

  it('trackEvent er no-op når window.umami er undefined', async () => {

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

  it('trackEvent er no-op i dev-modus (isDev=true)', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

    const onTrack = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
        <TestComponent onTrack={onTrack} />
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('spor').click()
    })

    expect(mockTrack).not.toHaveBeenCalled()
  })

  describe('identify', () => {
    function IdentifyComponent({
      userId,
      attrs,
    }: {
      userId: string | number | null
      attrs?: Record<string, unknown>
    }) {
      const { identify } = useAnalytics()
      return (
        <button onClick={() => identify(userId, attrs)}>identify</button>
      )
    }

    it('kaller window.umami.identify med hashet id + attrs', async () => {
  
      const mockIdentify = vi.fn()
      ;(window as Window & { umami?: { track: () => void; identify: typeof mockIdentify } }).umami = {
        track: vi.fn(),
        identify: mockIdentify,
      }

      const { getByText } = render(
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <IdentifyComponent userId={42} attrs={{ rolle: 'ADMIN', tenant: 't1' }} />
        </AnalyticsProvider>
      )

      await act(async () => {
        getByText('identify').click()
      })

      await waitFor(() => expect(mockIdentify).toHaveBeenCalledOnce())
      const [id, attrs] = mockIdentify.mock.calls[0]
      expect(id).toMatch(/^[0-9a-f]{16}$/)
      expect(attrs).toEqual({ rolle: 'ADMIN', tenant: 't1' })
    })

    it('userId=null kaller identify({}) for å rydde session', async () => {
  
      const mockIdentify = vi.fn()
      ;(window as Window & { umami?: { track: () => void; identify: typeof mockIdentify } }).umami = {
        track: vi.fn(),
        identify: mockIdentify,
      }

      const { getByText } = render(
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <IdentifyComponent userId={null} />
        </AnalyticsProvider>
      )

      await act(async () => {
        getByText('identify').click()
      })

      expect(mockIdentify).toHaveBeenCalledWith({})
    })

    it('er no-op i dev-modus', async () => {
      const mockIdentify = vi.fn()
      ;(window as Window & { umami?: { track: () => void; identify: typeof mockIdentify } }).umami = {
        track: vi.fn(),
        identify: mockIdentify,
      }

      const { getByText } = render(
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
          <IdentifyComponent userId={1} />
        </AnalyticsProvider>
      )

      await act(async () => {
        getByText('identify').click()
      })

      expect(mockIdentify).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    function ResetComponent() {
      const { reset } = useAnalytics()
      return <button onClick={() => reset()}>reset</button>
    }

    it('kaller window.umami.identify({}) for å rydde session', async () => {
  
      const mockIdentify = vi.fn()
      ;(window as Window & { umami?: { track: () => void; identify: typeof mockIdentify } }).umami = {
        track: vi.fn(),
        identify: mockIdentify,
      }

      const { getByText } = render(
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <ResetComponent />
        </AnalyticsProvider>
      )

      await act(async () => {
        getByText('reset').click()
      })

      expect(mockIdentify).toHaveBeenCalledWith({})
    })

    it('er no-op når isEnabled=false (utenfor provider)', async () => {
  
      const mockIdentify = vi.fn()
      ;(window as Window & { umami?: { track: () => void; identify: typeof mockIdentify } }).umami = {
        track: vi.fn(),
        identify: mockIdentify,
      }

      const { getByText } = render(<ResetComponent />)

      await act(async () => {
        getByText('reset').click()
      })

      expect(mockIdentify).not.toHaveBeenCalled()
    })
  })
})
