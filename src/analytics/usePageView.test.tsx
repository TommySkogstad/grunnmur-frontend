/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { usePageView } from './usePageView'
import type { UsePageViewOptions } from './usePageView'
import { AnalyticsProvider } from './AnalyticsProvider'

function PageViewTracker() {
  usePageView()
  return null
}

function PageViewTrackerWithOptions({ options }: { options?: UsePageViewOptions }) {
  usePageView(options)
  return null
}

function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(to)}>naviger</button>
}

function TestApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <PageViewTracker />
        <Routes>
          <Route path="*" element={<NavigateButton to="/om-oss" />} />
        </Routes>
      </AnalyticsProvider>
    </MemoryRouter>
  )
}

describe('usePageView', () => {
  afterEach(() => {
    cleanup()
    delete (window as Window & { umami?: unknown }).umami
  })

  it('kaller window.umami.track ved mount med initial pathname', () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    render(<TestApp />)

    expect(mockTrack).toHaveBeenCalledWith({ url: '/' })
  })

  it('kaller window.umami.track på nytt ved navigasjon', async () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    const { getByText } = render(<TestApp />)

    await act(async () => {
      getByText('naviger').click()
    })

    expect(mockTrack).toHaveBeenCalledWith({ url: '/om-oss' })
  })

  it('kaller IKKE window.umami.track i DEV-modus', () => {
    const mockTrack = vi.fn()
    ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

    render(
      <MemoryRouter initialEntries={['/']}>
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
          <PageViewTracker />
          <Routes>
            <Route path="*" element={<NavigateButton to="/om-oss" />} />
          </Routes>
        </AnalyticsProvider>
      </MemoryRouter>
    )

    expect(mockTrack).not.toHaveBeenCalled()
  })

  it('krasjer ikke når window.umami er undefined', () => {
    expect(() => render(<TestApp />)).not.toThrow()
  })

  describe('transformUrl-opsjon', () => {
    function TestAppWithTransform({ options }: { options?: UsePageViewOptions }) {
      return (
        <MemoryRouter initialEntries={['/oppdrag/42']}>
          <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
            <PageViewTrackerWithOptions options={options} />
          </AnalyticsProvider>
        </MemoryRouter>
      )
    }

    it('sender rå pathname når transformUrl ikke er satt', () => {
      const mockTrack = vi.fn()
      ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

      render(<TestAppWithTransform />)

      expect(mockTrack).toHaveBeenCalledWith({ url: '/oppdrag/42' })
    })

    it('sender transformert url når transformUrl er satt', () => {
      const mockTrack = vi.fn()
      ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

      render(<TestAppWithTransform options={{ transformUrl: () => '/oppdrag/:id' }} />)

      expect(mockTrack).toHaveBeenCalledWith({ url: '/oppdrag/:id' })
    })

    it('kaller transformUrl med rå pathname som argument', () => {
      const mockTrack = vi.fn()
      ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }
      const transformUrl = vi.fn().mockReturnValue('/anonymisert')

      render(<TestAppWithTransform options={{ transformUrl }} />)

      expect(transformUrl).toHaveBeenCalledWith('/oppdrag/42')
    })

    it('re-rendrer ikke track() på hver render når transformUrl er en ny inline-funksjon', () => {
      const mockTrack = vi.fn()
      ;(window as Window & { umami?: { track: typeof mockTrack; identify: () => void } }).umami = { track: mockTrack, identify: vi.fn() }

      function Wrapper() {
        const [, setTick] = useState(0)
        return (
          <MemoryRouter initialEntries={['/oppdrag/42']}>
            <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
              <PageViewTrackerWithOptions options={{ transformUrl: (p) => p }} />
              <button onClick={() => setTick((t) => t + 1)}>tick</button>
            </AnalyticsProvider>
          </MemoryRouter>
        )
      }

      const { getByText } = render(<Wrapper />)
      expect(mockTrack).toHaveBeenCalledTimes(1)

      act(() => {
        getByText('tick').click()
      })

      // Samme pathname, ny transformUrl-referanse ved re-render — skal IKKE spore på nytt
      expect(mockTrack).toHaveBeenCalledTimes(1)
    })
  })
})
