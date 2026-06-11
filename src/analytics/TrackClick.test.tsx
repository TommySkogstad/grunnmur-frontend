/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { TrackClick } from './TrackClick'
import { AnalyticsProvider } from './AnalyticsProvider'

describe('TrackClick', () => {
  afterEach(() => {
    cleanup()
    delete (window as Window & { umami?: unknown }).umami
  })

  it('kaller trackEvent og originalOnClick ved klikk', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const originalClick = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="btn.klikk" data={{ side: 'hjem' }}>
          <button onClick={originalClick}>Klikk meg</button>
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk meg').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('btn.klikk', { side: 'hjem' })
    expect(originalClick).toHaveBeenCalledOnce()
  })

  it('krasjer ikke når barn ikke har onClick', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="btn.klikk">
          <button>Ingen onClick</button>
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Ingen onClick').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('btn.klikk', undefined)
  })

  it('rendrer ikke-React-element-barn uten sporing', () => {
    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="test">ren tekst</TrackClick>
      </AnalyticsProvider>
    )

    expect(getByText('ren tekst')).toBeDefined()
  })

  it('sporer ikke klikk i DEV-modus', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
        <TrackClick event="btn.klikk">
          <button>Klikk</button>
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk').click()
    })

    expect(mockTrack).not.toHaveBeenCalled()
  })
})
