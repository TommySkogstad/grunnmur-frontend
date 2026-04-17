/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuthApi } from './authApi'
import type { ApiClient } from '../api/apiClient'

function createMockApiClient(): ApiClient {
  return {
    request: vi.fn(),
    formDataRequest: vi.fn(),
    getCsrfToken: vi.fn(() => null),
    setCsrfToken: vi.fn(),
    resetUnauthorizedFlag: vi.fn(),
  }
}

describe('createAuthApi', () => {
  let mockClient: ApiClient

  beforeEach(() => {
    mockClient = createMockApiClient()
  })

  it('requestCode sender POST med e-post', async () => {
    vi.mocked(mockClient.request).mockResolvedValue(undefined)

    const authApi = createAuthApi(mockClient)
    await authApi.requestCode('ola@example.com')

    expect(mockClient.request).toHaveBeenCalledWith('/auth/request-code', {
      method: 'POST',
      body: { email: 'ola@example.com' },
    })
  })

  it('verifyCode sender POST med e-post og kode', async () => {
    vi.mocked(mockClient.request).mockResolvedValue({ csrfToken: 'tok123' })

    const authApi = createAuthApi(mockClient)
    const result = await authApi.verifyCode('ola@example.com', '123456')

    expect(mockClient.request).toHaveBeenCalledWith('/auth/verify-code', {
      method: 'POST',
      body: { email: 'ola@example.com', code: '123456' },
    })
    expect(result).toEqual({ csrfToken: 'tok123' })
  })

  it('getMe henter brukerinfo', async () => {
    const mockUser = { id: 1, email: 'ola@example.com' }
    vi.mocked(mockClient.request).mockResolvedValue(mockUser)

    const authApi = createAuthApi(mockClient)
    const user = await authApi.getMe()

    expect(mockClient.request).toHaveBeenCalledWith('/auth/me')
    expect(user).toEqual(mockUser)
  })

  it('logout sender POST', async () => {
    vi.mocked(mockClient.request).mockResolvedValue(undefined)

    const authApi = createAuthApi(mockClient)
    await authApi.logout()

    expect(mockClient.request).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
    })
  })

  it('bruker egendefinerte endepunkter', async () => {
    vi.mocked(mockClient.request).mockResolvedValue(undefined)

    const authApi = createAuthApi(mockClient, {
      requestCodeEndpoint: '/custom/send-code',
      verifyCodeEndpoint: '/custom/verify',
      meEndpoint: '/custom/me',
      logoutEndpoint: '/custom/logout',
      sessionEndpoint: '/custom/session',
    })

    await authApi.requestCode('ola@example.com')
    expect(mockClient.request).toHaveBeenCalledWith('/custom/send-code', expect.any(Object))

    await authApi.getMe()
    expect(mockClient.request).toHaveBeenCalledWith('/custom/me')

    await authApi.logout()
    expect(mockClient.request).toHaveBeenCalledWith('/custom/logout', expect.any(Object))

    vi.mocked(mockClient.request).mockResolvedValue({ authenticated: false })
    await authApi.getSession()
    expect(mockClient.request).toHaveBeenCalledWith('/custom/session')
  })

  it('getSession returnerer anonym respons fra default-endepunkt', async () => {
    vi.mocked(mockClient.request).mockResolvedValue({ authenticated: false })

    const authApi = createAuthApi(mockClient)
    const result = await authApi.getSession()

    expect(mockClient.request).toHaveBeenCalledWith('/auth/session')
    expect(result).toEqual({ authenticated: false })
  })

  it('getSession returnerer autentisert respons med user', async () => {
    const mockUser = { id: 1, email: 'ola@example.com' }
    vi.mocked(mockClient.request).mockResolvedValue({
      authenticated: true,
      user: mockUser,
    })

    const authApi = createAuthApi(mockClient)
    const result = await authApi.getSession<typeof mockUser>()

    expect(mockClient.request).toHaveBeenCalledWith('/auth/session')
    expect(result).toEqual({ authenticated: true, user: mockUser })
  })
})
