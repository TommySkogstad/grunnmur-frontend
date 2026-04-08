/**
 * Generisk AuthContext med provider og hook for autentisering.
 *
 * Bruker createAuthApi() for kommunikasjon og tilbyr en
 * factory-funksjon createAuthProvider<TUser>() som returnerer
 * en typet AuthProvider og useAuth-hook.
 *
 * @example
 * ```tsx
 * interface MyUser { id: number; email: string; role: string }
 *
 * const { AuthProvider, useAuth } = createAuthProvider<MyUser>({
 *   apiClient,
 *   loginPath: '/logg-inn',
 *   onLogout: () => queryClient.clear(),
 * })
 *
 * // I app root:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // I komponent:
 * const { user, isAuthenticated, logout } = useAuth()
 * ```
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ApiClient } from '../api/apiClient'
import { ApiError } from '../api/apiClient'
import { createAuthApi } from './authApi'
import type { AuthApiConfig, LoginResponse } from './authApi'
import { createProtectedRoute } from '../components/ProtectedRoute'
import type { ProtectedRouteProps } from '../components/ProtectedRoute'

/** Verdier eksponert av useAuth() */
export interface AuthContextValue<TUser> {
  /** Innlogget bruker, eller null */
  user: TUser | null
  /** Om bruker er autentisert */
  isAuthenticated: boolean
  /** Om initial sessjonssjekk pågår */
  isLoading: boolean
  /** Logg inn med e-post og kode */
  login: (email: string, code: string) => Promise<LoginResponse>
  /** Logg ut */
  logout: () => Promise<void>
  /** Hent brukerinfo på nytt */
  refreshUser: () => Promise<void>
}

/** Konfigurasjon for createAuthProvider() */
export interface AuthProviderConfig<TUser> extends AuthApiConfig {
  /** API-klient fra createApiClient() */
  apiClient: ApiClient
  /** Sti til innloggingsside (default: '/login') */
  loginPath?: string
  /** Callback ved utlogging — f.eks. queryClient.clear() */
  onLogout?: () => void
  /** Custom parsing av brukerdata fra /me-endepunktet */
  parseUser?: (data: unknown) => TUser
}

/**
 * Opprett en typet AuthProvider og useAuth-hook.
 *
 * @param config - Konfigurasjon med apiClient og valgfrie callbacks
 * @returns Objekt med AuthProvider-komponent og useAuth-hook
 */
export function createAuthProvider<TUser>(config: AuthProviderConfig<TUser>): {
  AuthProvider: React.FC<{ children: ReactNode }>
  useAuth: () => AuthContextValue<TUser>
  ProtectedRoute: React.FC<ProtectedRouteProps<TUser>>
} {
  const {
    apiClient,
    onLogout: onLogoutCallback,
    parseUser,
    ...authApiConfig
  } = config

  const authApi = createAuthApi(apiClient, authApiConfig)

  // Context med undefined som sentinel for "utenfor provider"
  const AuthContext = createContext<AuthContextValue<TUser> | undefined>(undefined)

  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchUser = useCallback(async () => {
      try {
        const data = await authApi.getMe<TUser>()
        const parsed = parseUser ? parseUser(data) : data
        setUser(parsed)
      } catch (error) {
        // 401 betyr at brukeren ikke er innlogget — det er forventet
        if (error instanceof ApiError && error.is(401)) {
          setUser(null)
        } else {
          // Andre feil (nettverksfeil etc.) — sett user til null
          setUser(null)
        }
      }
    }, [])

    const refreshUser = useCallback(async () => {
      await fetchUser()
    }, [fetchUser])

    const login = useCallback(async (email: string, code: string): Promise<LoginResponse> => {
      const response = await authApi.verifyCode(email, code)
      // Etter vellykket login, hent brukerinfo
      await fetchUser()
      apiClient.resetUnauthorizedFlag()
      return response
    }, [fetchUser])

    const logout = useCallback(async () => {
      await authApi.logout()
      setUser(null)
      onLogoutCallback?.()
    }, [])

    // Sjekk sesjon ved mount
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState i async callback er trygt
      fetchUser().finally(() => setIsLoading(false))
    }, [fetchUser])

    const value = useMemo<AuthContextValue<TUser>>(() => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      refreshUser,
    }), [user, isLoading, login, logout, refreshUser])

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    )
  }

  function useAuth(): AuthContextValue<TUser> {
    const context = useContext(AuthContext)
    if (context === undefined) {
      throw new Error('useAuth må brukes innenfor en AuthProvider')
    }
    return context
  }

  const ProtectedRoute = createProtectedRoute<TUser>(useAuth)

  return { AuthProvider, useAuth, ProtectedRoute }
}
