/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor, cleanup } from '@testing-library/react'
import { createAuthProvider } from './AuthContext'
import { ApiError } from '../api/apiClient'
import type { ApiClient } from '../api/apiClient'

interface TestUser {
  id: number
  email: string
  role: string
}

const testUser: TestUser = { id: 1, email: 'ola@example.com', role: 'admin' }

function createMockApiClient(): ApiClient {
  return {
    request: vi.fn(),
    formDataRequest: vi.fn(),
    getCsrfToken: vi.fn(() => null),
    setCsrfToken: vi.fn(),
    resetUnauthorizedFlag: vi.fn(),
  }
}

describe('createAuthProvider', () => {
  let mockClient: ApiClient

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mockClient = createMockApiClient()
  })

  it('useAuth returnerer isAuthenticated=false initialt når getMe feiler med 401', async () => {
    vi.mocked(mockClient.request).mockRejectedValue(
      new ApiError('Unauthorized', 401, 'Unauthorized')
    )

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    function TestComponent() {
      const { isAuthenticated, isLoading, user } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('etter login returnerer useAuth user og isAuthenticated=true', async () => {
    // Første kall (mount getMe) feiler med 401, etter login returnerer user
    let callCount = 0
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        callCount++
        if (callCount === 1) {
          throw new ApiError('Unauthorized', 401, 'Unauthorized')
        }
        return testUser
      }
      if (path === '/auth/verify-code') {
        return { csrfToken: 'tok123' }
      }
      return undefined
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    let loginFn: ((email: string, code: string) => Promise<unknown>) | null = null

    function TestComponent() {
      const { isAuthenticated, isLoading, user, login } = useAuth()
      loginFn = login
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')

    // Login
    await act(async () => {
      await loginFn!('ola@example.com', '123456')
    })

    expect(screen.getByTestId('auth').textContent).toBe('true')
    expect(screen.getByTestId('user').textContent).toBe('ola@example.com')
    expect(mockClient.resetUnauthorizedFlag).toHaveBeenCalled()
  })

  it('logout kaller onLogout og setter isAuthenticated=false', async () => {
    // getMe returnerer bruker ved mount
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') return testUser
      return undefined
    })

    const onLogout = vi.fn()

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
      onLogout,
    })

    let logoutFn: (() => Promise<void>) | null = null

    function TestComponent() {
      const { isAuthenticated, isLoading, user, logout } = useAuth()
      logoutFn = logout
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true')
    })

    // Logout
    await act(async () => {
      await logoutFn!()
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('generisk TUser — bruker custom User-type med parseUser', async () => {
    interface CustomUser {
      userId: number
      displayName: string
    }

    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        // Server returnerer rå data
        return { user_id: 42, display_name: 'Kari' }
      }
      return undefined
    })

    const { AuthProvider, useAuth } = createAuthProvider<CustomUser>({
      apiClient: mockClient,
      parseUser: (data) => {
        const raw = data as { user_id: number; display_name: string }
        return { userId: raw.user_id, displayName: raw.display_name }
      },
    })

    function TestComponent() {
      const { user, isLoading } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="name">{user ? user.displayName : 'null'}</span>
          <span data-testid="id">{user ? String(user.userId) : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('name').textContent).toBe('Kari')
    expect(screen.getByTestId('id').textContent).toBe('42')
  })

  it('useAuth utenfor AuthProvider kaster feil', () => {
    const { useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    function BadComponent() {
      useAuth()
      return <div />
    }

    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<BadComponent />)).toThrow(
      'useAuth må brukes innenfor en AuthProvider'
    )

    spy.mockRestore()
  })

  it('useSessionEndpoint=true: anonym session setter user=null uten å kalle getMe', async () => {
    const calls: string[] = []
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      calls.push(path)
      if (path === '/auth/session') return { authenticated: false }
      throw new Error(`Uventet kall til ${path}`)
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
      useSessionEndpoint: true,
    })

    function TestComponent() {
      const { isAuthenticated, isLoading, user } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(calls).toEqual(['/auth/session'])
    expect(calls).not.toContain('/auth/me')
  })

  it('useSessionEndpoint=true: autentisert session setter user direkte', async () => {
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return { authenticated: true, user: testUser }
      }
      throw new Error(`Uventet kall til ${path}`)
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
      useSessionEndpoint: true,
    })

    function TestComponent() {
      const { isAuthenticated, isLoading, user } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true')
    })

    expect(screen.getByTestId('user').textContent).toBe('ola@example.com')
  })

  it('useSessionEndpoint=true: session-feil (500) setter user=null og avslutter loading', async () => {
    vi.mocked(mockClient.request).mockRejectedValue(
      new ApiError('Server error', 500, 'Internal Server Error')
    )

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
      useSessionEndpoint: true,
    })

    function TestComponent() {
      const { isAuthenticated, isLoading, user } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('auth').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('useSessionEndpoint=true: parseUser brukes på user fra session-respons', async () => {
    interface CustomUser {
      userId: number
      displayName: string
    }

    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return {
          authenticated: true,
          user: { user_id: 42, display_name: 'Kari' },
        }
      }
      throw new Error(`Uventet kall til ${path}`)
    })

    const { AuthProvider, useAuth } = createAuthProvider<CustomUser>({
      apiClient: mockClient,
      useSessionEndpoint: true,
      parseUser: (data) => {
        const raw = data as { user_id: number; display_name: string }
        return { userId: raw.user_id, displayName: raw.display_name }
      },
    })

    function TestComponent() {
      const { user, isLoading } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="name">{user ? user.displayName : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('name').textContent).toBe('Kari')
  })

  it('uten useSessionEndpoint: getMe kalles som før (bakoverkompatibilitet)', async () => {
    const calls: string[] = []
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      calls.push(path)
      if (path === '/auth/me') return testUser
      throw new Error(`Uventet kall til ${path}`)
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    function TestComponent() {
      const { isAuthenticated, isLoading } = useAuth()
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('true')
    })

    expect(calls).toEqual(['/auth/me'])
  })

  it('isLoading er true ved mount og false etter resolve', async () => {
    let resolveMe: ((value: TestUser) => void) | undefined = undefined

    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        return new Promise<TestUser>((resolve) => {
          resolveMe = resolve
        })
      }
      return undefined
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    function TestComponent() {
      const { isLoading } = useAuth()
      return <span data-testid="loading">{String(isLoading)}</span>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initiell render: isLoading=true mens sesjonskall pågår
    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(resolveMe).toBeDefined()

    await act(async () => {
      resolveMe!(testUser)
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('useSessionEndpoint=true: login bruker /auth/session (ikke /auth/me) for bruker-refresh', async () => {
    const calls: string[] = []
    let authenticated = false

    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      calls.push(path)
      if (path === '/auth/session') {
        return authenticated
          ? { authenticated: true, user: testUser }
          : { authenticated: false }
      }
      if (path === '/auth/verify-code') {
        authenticated = true
        return { csrfToken: 'tok' }
      }
      throw new Error(`Uventet kall til ${path}`)
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
      useSessionEndpoint: true,
    })

    let loginFn: ((email: string, code: string) => Promise<unknown>) | null = null

    function TestComponent() {
      const { isAuthenticated, isLoading, user, login } = useAuth()
      loginFn = login
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    // Anonym ved mount
    expect(screen.getByTestId('auth').textContent).toBe('false')

    calls.length = 0 // nullstill for å sjekke kun post-login kall

    await act(async () => {
      await loginFn!('ola@example.com', '123456')
    })

    // Etter login: session-endepunkt brukes (ikke /auth/me), bruker er satt
    expect(calls).toEqual(['/auth/verify-code', '/auth/session'])
    expect(screen.getByTestId('auth').textContent).toBe('true')
    expect(screen.getByTestId('user').textContent).toBe('ola@example.com')
  })

  it('refreshUser henter brukerdata på nytt', async () => {
    let refreshCount = 0
    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        refreshCount++
        return { ...testUser, email: `user-${refreshCount}@example.com` }
      }
      return undefined
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    let refreshFn: (() => Promise<void>) | null = null

    function TestComponent() {
      const { user, isLoading, refreshUser } = useAuth()
      refreshFn = refreshUser
      return (
        <div>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="user">{user ? user.email : 'null'}</span>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-1@example.com')
    })

    await act(async () => {
      await refreshFn!()
    })

    expect(screen.getByTestId('user').textContent).toBe('user-2@example.com')
  })

  it('unmount under pågående fetchUser produserer ikke feil etter resolve', async () => {
    let resolveMe: ((value: TestUser) => void) | undefined

    vi.mocked(mockClient.request).mockImplementation(async (path: string) => {
      if (path === '/auth/me') {
        return new Promise<TestUser>((resolve) => {
          resolveMe = resolve
        })
      }
      return undefined
    })

    const { AuthProvider, useAuth } = createAuthProvider<TestUser>({
      apiClient: mockClient,
    })

    function TestComponent() {
      const { isLoading } = useAuth()
      return <span data-testid="loading">{String(isLoading)}</span>
    }

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading').textContent).toBe('true')
    expect(resolveMe).toBeDefined()

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Unmount FØR promisen resolver
    unmount()

    // Resolver promisen etter unmount — uten cancel-flag ville dette kalt
    // setIsLoading(false) og setUser(parsed) på unmountet komponent,
    // noe som i jsdom-teardown-kontekst trigger 'window is not defined'
    await act(async () => {
      resolveMe!(testUser)
      await Promise.resolve()
    })

    const errors = errorSpy.mock.calls
    expect(errors).toHaveLength(0)

    errorSpy.mockRestore()
  })
})
