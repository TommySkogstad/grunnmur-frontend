/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AnalyticsProvider } from './AnalyticsProvider'

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubEnv('DEV', false)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
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

  it('script-tag legges IKKE til i dev-modus (DEV=true)', () => {
    vi.stubEnv('DEV', true)

    render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <div>innhold</div>
      </AnalyticsProvider>
    )

    const scripts = document.head.querySelectorAll('script[data-website-id]')
    expect(scripts.length).toBe(0)
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

  it('rendrer children uavhengig av tracking-tilstand', () => {
    localStorage.setItem('umami.disabled', '1')

    const { getByText } = render(
      <AnalyticsProvider websiteId="test-id" scriptSrc="https://analytics.example.com/script.js">
        <p>Barn-innhold</p>
      </AnalyticsProvider>
    )

    expect(getByText('Barn-innhold')).toBeDefined()
  })
})
