/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { usePageView } from './usePageView'
import { AnalyticsProvider } from './AnalyticsProvider'

function PageViewTracker() {
  usePageView()
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
})
