import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatFileSize,
  relativeTime
} from '../formatters'

describe('formatCurrency', () => {
  it('formaterer positive beloep i NOK', () => {
    const result = formatCurrency(1234.5)
    // nb-NO: "kr 1 234,50" (kan variere med non-breaking spaces)
    expect(result).toMatch(/kr/)
    expect(result).toMatch(/1\s?234,50/)
  })

  it('formaterer 0', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/kr/)
    expect(result).toMatch(/0,00/)
  })

  it('formaterer negative beloep', () => {
    const result = formatCurrency(-500)
    expect(result).toMatch(/500,00/)
    expect(result).toMatch(/kr/)
  })

  it('returnerer tankestrek for NaN', () => {
    expect(formatCurrency(NaN)).toBe('\u2013')
  })

  it('returnerer tankestrek for Infinity', () => {
    expect(formatCurrency(Infinity)).toBe('\u2013')
  })
})

describe('formatDate', () => {
  it('formaterer ISO-streng til dd.MM.yyyy', () => {
    expect(formatDate('2026-04-08')).toBe('08.04.2026')
  })

  it('formaterer Date-objekt', () => {
    const date = new Date(2026, 3, 8) // april = 3 (0-indeksert)
    expect(formatDate(date)).toBe('08.04.2026')
  })

  it('returnerer tankestrek for ugyldig dato', () => {
    expect(formatDate('ugyldig')).toBe('\u2013')
  })
})

describe('formatDateTime', () => {
  it('formaterer dato med klokkeslett', () => {
    const date = new Date(2026, 3, 8, 14, 30)
    const result = formatDateTime(date)
    expect(result).toMatch(/08\.04\.2026/)
    expect(result).toMatch(/14:30/)
  })

  it('returnerer tankestrek for ugyldig dato', () => {
    expect(formatDateTime('ugyldig')).toBe('\u2013')
  })
})

describe('formatNumber', () => {
  it('formaterer tall med norsk tusenskilletegn', () => {
    const result = formatNumber(1234567)
    // nb-NO bruker mellomrom som tusenskilletegn
    expect(result).toMatch(/1\s?234\s?567/)
  })

  it('formaterer tall med spesifiserte desimaler', () => {
    const result = formatNumber(1234.5, 2)
    expect(result).toMatch(/1\s?234,50/)
  })

  it('formaterer tall med 0 desimaler', () => {
    const result = formatNumber(1234.567, 0)
    expect(result).toMatch(/1\s?235/) // avrundet
  })

  it('returnerer tankestrek for NaN', () => {
    expect(formatNumber(NaN)).toBe('\u2013')
  })
})

describe('formatFileSize', () => {
  it('formaterer 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formaterer bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formaterer kilobytes', () => {
    const result = formatFileSize(1536)
    expect(result).toMatch(/1,5\s?KB/)
  })

  it('formaterer megabytes', () => {
    const result = formatFileSize(1048576)
    expect(result).toMatch(/1,0\s?MB/)
  })

  it('formaterer gigabytes', () => {
    const result = formatFileSize(1073741824)
    expect(result).toMatch(/1,0\s?GB/)
  })

  it('returnerer tankestrek for negative verdier', () => {
    expect(formatFileSize(-1)).toBe('\u2013')
  })

  it('returnerer tankestrek for NaN', () => {
    expect(formatFileSize(NaN)).toBe('\u2013')
  })
})

describe('relativeTime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('viser "1 time siden" for 1 time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T12:00:00'))
    const oneHourAgo = new Date('2026-04-08T11:00:00')
    const result = relativeTime(oneHourAgo)
    expect(result).toMatch(/1 time siden/)
  })

  it('viser minutter for nylige hendelser', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T12:00:00'))
    const fiveMinAgo = new Date('2026-04-08T11:55:00')
    const result = relativeTime(fiveMinAgo)
    expect(result).toMatch(/5 minutter siden/)
  })

  it('viser dager for eldre hendelser', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T12:00:00'))
    const threeDaysAgo = new Date('2026-04-05T12:00:00')
    const result = relativeTime(threeDaysAgo)
    expect(result).toMatch(/3 d(ager|øgn) siden/)
  })

  it('haandterer fremtidige datoer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-08T12:00:00'))
    const tomorrow = new Date('2026-04-09T12:00:00')
    const result = relativeTime(tomorrow)
    expect(result).toMatch(/i morgen|om 1 dag/)
  })

  it('returnerer tankestrek for ugyldig dato', () => {
    expect(relativeTime('ugyldig')).toBe('\u2013')
  })
})
