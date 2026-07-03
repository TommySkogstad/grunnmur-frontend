import { describe, it, expect } from 'vitest'
import { anonymizePathname } from './anonymizePathname'

describe('anonymizePathname', () => {
  it('lar rot-sti stå urørt', () => {
    expect(anonymizePathname('/')).toBe('/')
    expect(anonymizePathname('')).toBe('')
  })

  it('lar rene tekst-segmenter stå urørt', () => {
    expect(anonymizePathname('/om-oss')).toBe('/om-oss')
    expect(anonymizePathname('/portal/profil')).toBe('/portal/profil')
  })

  it('anonymiserer numeriske ID-segmenter til :id', () => {
    expect(anonymizePathname('/oppdrag/42')).toBe('/oppdrag/:id')
    expect(anonymizePathname('/oppdrag/42/rapport/7')).toBe('/oppdrag/:id/rapport/:id')
  })

  it('anonymiserer UUID-segmenter til :id', () => {
    expect(anonymizePathname('/kontrakt/550e8400-e29b-41d4-a716-446655440000')).toBe('/kontrakt/:id')
  })

  it('anonymiserer UUID uavhengig av store/små bokstaver', () => {
    expect(anonymizePathname('/kontrakt/550E8400-E29B-41D4-A716-446655440000')).toBe('/kontrakt/:id')
  })

  it('anonymiserer lange hex-tokens (32 tegn) til :token', () => {
    const token = 'a'.repeat(32)
    expect(anonymizePathname(`/biologkontrakt/${token}`)).toBe('/biologkontrakt/:token')
  })

  it('anonymiserer lange hex-tokens (64 tegn) til :token', () => {
    const token = 'f'.repeat(64)
    expect(anonymizePathname(`/bilder/${token}`)).toBe('/bilder/:token')
  })

  it('lar korte hex-lignende segmenter (under 24 tegn) stå urørt', () => {
    expect(anonymizePathname('/tag/abcdef')).toBe('/tag/abcdef')
  })

  it('håndterer blandede stier med flere segmenttyper', () => {
    const token = 'b'.repeat(40)
    expect(anonymizePathname(`/oppdrag/42/delingslenke/${token}`)).toBe('/oppdrag/:id/delingslenke/:token')
  })
})
