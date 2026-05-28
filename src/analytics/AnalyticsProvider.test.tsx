/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { useState } from 'react'
import { AnalyticsProvider } from './AnalyticsProvider'

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    // Rydd opp script-tags som kan være lagt til
    document.head.querySelectorAll('script[data-website-id]').forEach(s => s.remove())
  })

  it('script-tag legges IKKE til når localStorage umami.disabled er 1', () => {
    localStorage.setItem('umami.disabled', '1')

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <div>innhold</div>
      </AnalyticsProvider>
    )

    const scripts = document.head.querySelectorAll('script[data-website-id]')
    expect(scripts.length).toBe(0)
  })

  it('script-tag legges IKKE til når isDev={true}', () => {
    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js" isDev={true}>
        <div>innhold</div>
      </AnalyticsProvider>
    )

    const scripts = document.head.querySelectorAll('script[data-website-id]')
    expect(scripts.length).toBe(0)
  })

  it('script-tag legges til når isDev={false}', () => {
    render(
      <AnalyticsProvider websiteId="dev-false-id" scriptSrc="https://analytics.example.com/script.js" isDev={false}>
        <div>innhold</div>
      </AnalyticsProvider>
    )

    const scripts = document.head.querySelectorAll('script[data-website-id="dev-false-id"]')
    expect(scripts.length).toBe(1)
  })

  it('script-tag legges til i produksjonsmodus uten opt-out', () => {
    render(
      <AnalyticsProvider websiteId="prod-id" scriptSrc="https://analytics.example.com/script.js">
        <div>innhold</div>
      </AnalyticsProvider>
    )

    const scripts = document.head.querySelectorAll('script[data-website-id="prod-id"]')
    expect(scripts.length).toBe(1)
    expect((scripts[0] as HTMLScriptElement).src).toBe('https://analytics.example.com/script.js')
  })

  it('opt-out leses kun én gang — localStorage-endring etter mount endrer ikke isEnabled', () => {
    // Wrapper som tvinger re-render via state-endring i parent
    function Wrapper() {
      const [, setTick] = useState(0)
      return (
        <AnalyticsProvider websiteId="stable-id" scriptSrc="https://analytics.example.com/script.js">
          <button onClick={() => setTick(t => t + 1)}>re-render</button>
        </AnalyticsProvider>
      )
    }

    const { getByText } = render(<Wrapper />)

    // Script er lagt til på mount (ingen opt-out)
    expect(document.head.querySelectorAll('script[data-website-id="stable-id"]').length).toBe(1)

    // Sett opt-out etter mount og tving re-render
    localStorage.setItem('umami.disabled', '1')
    act(() => { getByText('re-render').click() })

    // isEnabled skal IKKE ha endret seg — script skal fortsatt være i DOM
    expect(document.head.querySelectorAll('script[data-website-id="stable-id"]').length).toBe(1)
  })

  it('rendrer children uavhengig av tracking-tilstand', () => {
    localStorage.setItem('umami.disabled', '1')

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <p>Barn-innhold</p>
      </AnalyticsProvider>
    )

    expect(getByText('Barn-innhold')).toBeDefined()
  })

  it('script-tag fjernes fra document.head ved unmount', () => {
    const { unmount } = render(
      <AnalyticsProvider websiteId="prod-id" scriptSrc="https://analytics.example.com/script.js">
        <div />
      </AnalyticsProvider>
    )
    expect(document.head.querySelectorAll('script[data-website-id]').length).toBe(1)
    unmount()
    expect(document.head.querySelectorAll('script[data-website-id]').length).toBe(0)
  })

  it('console.warn trigges ved http:// scriptSrc', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="http://analytics.example.com/script.js">
        <div />
      </AnalyticsProvider>
    )
    expect(warnSpy).toHaveBeenCalledWith(
      '[Analytics] scriptSrc bør bruke https://',
      'http://analytics.example.com/script.js'
    )
    warnSpy.mockRestore()
  })

  it('console.warn trigges ikke ved https:// scriptSrc', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <div />
      </AnalyticsProvider>
    )
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
