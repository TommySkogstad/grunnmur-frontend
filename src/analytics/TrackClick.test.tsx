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

  it('kaller trackEvent ved klikk via render prop', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="btn.klikk" data={{ side: 'hjem' }}>
          {(onClick) => <button onClick={onClick}>Klikk meg</button>}
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk meg').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('btn.klikk', { side: 'hjem' })
  })

  it('konsumentens onClick kjøres i tillegg til sporing når konsumenten kjeder den', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const egnKlikk = vi.fn()

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="btn.klikk">
          {(track) => (
            <button onClick={(e) => { track(e); egnKlikk(e) }}>Klikk meg</button>
          )}
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk meg').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('btn.klikk', undefined)
    expect(egnKlikk).toHaveBeenCalledOnce()
  })

  it('sporer ikke klikk i DEV-modus', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
        <TrackClick event="btn.klikk">
          {(onClick) => <button onClick={onClick}>Klikk</button>}
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk').click()
    })

    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('sporer uten data når data er utelatt', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <TrackClick event="btn.ingen-data">
          {(onClick) => <button onClick={onClick}>Klikk</button>}
        </TrackClick>
      </AnalyticsProvider>
    )

    await act(async () => {
      getByText('Klikk').click()
    })

    expect(mockTrack).toHaveBeenCalledWith('btn.ingen-data', undefined)
  })
})
