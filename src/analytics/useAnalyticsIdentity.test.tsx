/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, act, cleanup, waitFor } from '@testing-library/react'
import { useAnalyticsIdentity } from './useAnalyticsIdentity'
import type { AnalyticsIdentityUser } from './useAnalyticsIdentity'
import { AnalyticsProvider } from './AnalyticsProvider'

function IdentitySyncTester({
  user,
  traits,
}: {
  user: AnalyticsIdentityUser | null | undefined
  traits?: Record<string, unknown>
}) {
  useAnalyticsIdentity(user, traits)
  return null
}

function mockUmami() {
  const identify = vi.fn()
  const track = vi.fn()
  ;(window as Window & { umami?: { track: typeof track; identify: typeof identify } }).umami = { track, identify }
  return { identify, track }
}

describe('useAnalyticsIdentity', () => {
  afterEach(() => {
    cleanup()
    delete (window as Window & { umami?: unknown }).umami
  })

  it('kaller identify med hashet id og traits når bruker er innlogget', async () => {
    const { identify } = mockUmami()

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <IdentitySyncTester user={{ id: 42 }} traits={{ rolle: 'ADMIN' }} />
      </AnalyticsProvider>
    )

    await waitFor(() => expect(identify).toHaveBeenCalledOnce())
    const [id, traits] = identify.mock.calls[0]
    expect(id).toMatch(/^[0-9a-f]{16}$/)
    expect(traits).toEqual({ rolle: 'ADMIN' })
  })

  it('kaller reset (identify({})) når bruker er null', async () => {
    const { identify } = mockUmami()

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <IdentitySyncTester user={null} />
      </AnalyticsProvider>
    )

    await waitFor(() => expect(identify).toHaveBeenCalledWith({}))
  })

  it('kaller reset når bruker går fra innlogget til utlogget', async () => {
    const { identify } = mockUmami()

    function Wrapper() {
      const [user, setUser] = useState<AnalyticsIdentityUser | null>({ id: 1 })
      return (
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <IdentitySyncTester user={user} />
          <button onClick={() => setUser(null)}>logg ut</button>
        </AnalyticsProvider>
      )
    }

    const { getByText } = render(<Wrapper />)
    await waitFor(() => expect(identify).toHaveBeenCalledTimes(1))

    await act(async () => {
      getByText('logg ut').click()
    })

    await waitFor(() => expect(identify).toHaveBeenCalledWith({}))
  })

  it('er no-op utenfor AnalyticsProvider (context-default isEnabled=false)', () => {
    const { identify } = mockUmami()

    render(<IdentitySyncTester user={{ id: 1 }} />)

    expect(identify).not.toHaveBeenCalled()
  })

  it('logger console.warn i stedet for å kaste hvis identify feiler', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(window as Window & { umami?: { track: () => void; identify: () => void } }).umami = {
      track: vi.fn(),
      identify: () => { throw new Error('umami-feil') },
    }

    expect(() =>
      render(
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <IdentitySyncTester user={{ id: 1 }} />
        </AnalyticsProvider>
      )
    ).not.toThrow()

    await waitFor(() => expect(warnSpy).toHaveBeenCalled())
    expect(warnSpy.mock.calls[0][0]).toContain('[useAnalyticsIdentity]')
    warnSpy.mockRestore()
  })

  it('kaller identify på nytt når traits-innholdet endres (samme bruker)', async () => {
    const { identify } = mockUmami()

    function Wrapper() {
      const [role, setRole] = useState('BIOLOG')
      return (
        <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
          <IdentitySyncTester user={{ id: 1 }} traits={{ rolle: role }} />
          <button onClick={() => setRole('ADMIN')}>endre rolle</button>
        </AnalyticsProvider>
      )
    }

    const { getByText } = render(<Wrapper />)
    await waitFor(() => expect(identify).toHaveBeenCalledTimes(1))

    await act(async () => {
      getByText('endre rolle').click()
    })

    await waitFor(() => expect(identify).toHaveBeenCalledTimes(2))
    expect(identify.mock.calls[1][1]).toEqual({ rolle: 'ADMIN' })
  })
})
