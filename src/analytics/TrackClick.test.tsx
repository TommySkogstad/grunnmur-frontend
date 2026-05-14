/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { TrackClick } from './TrackClick'
import { AnalyticsProvider } from './AnalyticsProvider'

describe('TrackClick', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', false)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    delete (window as Window & { umami?: unknown }).umami
  })

  it('kaller trackEvent og originalOnClick ved klikk', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

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
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

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
    vi.stubEnv('DEV', true)
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack } }).umami = { track: mockTrack }

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
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
