import { describe, it, expect } from 'vitest'
import { createQueryClient } from '../queryClient'

describe('createQueryClient', () => {
  it('returnerer QueryClient med staleTime 300000 (5 min)', () => {
    const client = createQueryClient()
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(300_000)
  })

  it('returnerer QueryClient med retry: 1', () => {
    const client = createQueryClient()
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(1)
  })

  it('returnerer QueryClient med gcTime 300000 (5 min)', () => {
    const client = createQueryClient()
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.gcTime).toBe(300_000)
  })

  it('overrides kan overskrive staleTime', () => {
    const client = createQueryClient({ queries: { staleTime: 0 } })
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(0)
  })

  it('overrides beholder andre defaults', () => {
    const client = createQueryClient({ queries: { staleTime: 0 } })
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.queries?.gcTime).toBe(300_000)
  })

  it('overrides kan overskrive retry', () => {
    const client = createQueryClient({ queries: { retry: 3 } })
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.retry).toBe(3)
  })

  it('overrides kan sette mutations-config', () => {
    const client = createQueryClient({ mutations: { retry: 2 } })
    const defaults = client.getDefaultOptions()
    expect(defaults.mutations?.retry).toBe(2)
  })

  it('tomt overrides-objekt gir defaults', () => {
    const client = createQueryClient({})
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(300_000)
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.queries?.gcTime).toBe(300_000)
  })

  it('returnerer en ny instans ved hvert kall', () => {
    const client1 = createQueryClient()
    const client2 = createQueryClient()
    expect(client1).not.toBe(client2)
  })
})
