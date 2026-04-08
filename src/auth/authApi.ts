/**
 * Generisk auth-API som bruker apiClient for kommunikasjon.
 *
 * Tilbyr requestCode, verifyCode, getMe og logout — felles for alle apper.
 *
 * @example
 * ```ts
 * const authApi = createAuthApi(apiClient)
 * await authApi.requestCode('ola@example.com')
 * const result = await authApi.verifyCode('ola@example.com', '123456')
 * const user = await authApi.getMe<MyUser>()
 * await authApi.logout()
 * ```
 */

import type { ApiClient } from '../api/apiClient'

/** Respons fra verifyCode — inneholder eventuelt CSRF-token */
export interface LoginResponse {
  /** CSRF-token (returneres ved in-memory CSRF-modus) */
  csrfToken?: string
}

/** Auth-API returnert av createAuthApi() */
export interface AuthApi {
  /** Send engangskode til e-post */
  requestCode: (email: string) => Promise<void>
  /** Verifiser engangskode */
  verifyCode: (email: string, code: string) => Promise<LoginResponse>
  /** Hent innlogget bruker */
  getMe: <TUser>() => Promise<TUser>
  /** Logg ut */
  logout: () => Promise<void>
}

/** Konfigurasjon for auth-API-endepunkter */
export interface AuthApiConfig {
  /** Endepunkt for å sende engangskode (default: '/auth/request-code') */
  requestCodeEndpoint?: string
  /** Endepunkt for å verifisere kode (default: '/auth/verify-code') */
  verifyCodeEndpoint?: string
  /** Endepunkt for å hente brukerinfo (default: '/auth/me') */
  meEndpoint?: string
  /** Endepunkt for utlogging (default: '/auth/logout') */
  logoutEndpoint?: string
}

/**
 * Opprett auth-API-funksjoner som bruker en apiClient-instans.
 *
 * @param apiClient - API-klient fra createApiClient()
 * @param config - Valgfri konfigurasjon av endepunkter
 * @returns AuthApi med requestCode, verifyCode, getMe, logout
 */
export function createAuthApi(apiClient: ApiClient, config?: AuthApiConfig): AuthApi {
  const requestCodeEndpoint = config?.requestCodeEndpoint ?? '/auth/request-code'
  const verifyCodeEndpoint = config?.verifyCodeEndpoint ?? '/auth/verify-code'
  const meEndpoint = config?.meEndpoint ?? '/auth/me'
  const logoutEndpoint = config?.logoutEndpoint ?? '/auth/logout'

  async function requestCode(email: string): Promise<void> {
    await apiClient.request<void>(requestCodeEndpoint, {
      method: 'POST',
      body: { email },
    })
  }

  async function verifyCode(email: string, code: string): Promise<LoginResponse> {
    return apiClient.request<LoginResponse>(verifyCodeEndpoint, {
      method: 'POST',
      body: { email, code },
    })
  }

  async function getMe<TUser>(): Promise<TUser> {
    return apiClient.request<TUser>(meEndpoint)
  }

  async function logout(): Promise<void> {
    await apiClient.request<void>(logoutEndpoint, {
      method: 'POST',
    })
  }

  return { requestCode, verifyCode, getMe, logout }
}
