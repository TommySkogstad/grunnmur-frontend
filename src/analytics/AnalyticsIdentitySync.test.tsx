/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { AnalyticsIdentitySync } from './AnalyticsIdentitySync'
import { AnalyticsProvider } from './AnalyticsProvider'

describe('AnalyticsIdentitySync', () => {
  afterEach(() => {
    cleanup()
    delete (window as Window & { umami?: unknown }).umami
  })

  it('rendrer ingenting', () => {
    const { container } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <AnalyticsIdentitySync user={{ id: 1 }} />
      </AnalyticsProvider>
    )

    expect(container.textContent).toBe('')
  })

  it('delegerer til identify() med traits når bruker er satt', async () => {
    const identify = vi.fn()
    ;(window as Window & { umami?: { track: () => void; identify: typeof identify } }).umami = {
      track: vi.fn(),
      identify,
    }

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <AnalyticsIdentitySync user={{ id: 7 }} traits={{ rolle: 'STYRELEDER', tenant: '6810' }} />
      </AnalyticsProvider>
    )

    await waitFor(() => expect(identify).toHaveBeenCalledOnce())
    expect(identify.mock.calls[0][1]).toEqual({ rolle: 'STYRELEDER', tenant: '6810' })
  })

  it('delegerer til reset() når bruker er undefined', async () => {
    const identify = vi.fn()
    ;(window as Window & { umami?: { track: () => void; identify: typeof identify } }).umami = {
      track: vi.fn(),
      identify,
    }

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <AnalyticsIdentitySync user={undefined} />
      </AnalyticsProvider>
    )

    await waitFor(() => expect(identify).toHaveBeenCalledWith({}))
  })
})
