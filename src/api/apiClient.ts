/**
 * Konfigurerbar API-klient for Kotlin/Ktor-apper.
 *
 * Håndterer CSRF-tokens (cookie eller in-memory), JSON-serialisering,
 * 401-deduplisering og FormData-opplasting.
 *
 * @example
 * ```ts
 * const api = createApiClient({
 *   onUnauthorized: (error) => window.location.href = '/logg-inn',
 * })
 *
 * const users = await api.request<User[]>('/users')
 * await api.request('/users', { method: 'POST', body: { name: 'Ola' } })
 * ```
 */

/** Konfigurasjon for API-klienten */
export interface ApiClientConfig {
  /** URL-prefiks for alle requests (default: '/api') */
  basePath?: string
  /** Hvor CSRF-token hentes fra (default: 'cookie') */
  csrfSource?: 'cookie' | 'memory'
  /** Navn på CSRF-cookie (default: 'csrf_token') */
  csrfCookieName?: string
  /** Navn på CSRF-header (default: 'X-CSRF-Token') */
  csrfHeaderName?: string
  /**
   * Kalles ved 401-respons. Mottar ApiError-objektet.
   * Har innebygd deduplisering — kalles maks én gang inntil resetUnauthorizedFlag().
   */
  onUnauthorized?: (error: ApiError) => void
}

/** Alternativer for enkeltrequest */
export interface RequestOptions {
  /** HTTP-metode (default: 'GET') */
  method?: string
  /** Request-body — serialiseres automatisk til JSON */
  body?: unknown
  /** Ekstra headers */
  headers?: Record<string, string>
}

/** API-klient returnert av createApiClient() */
export interface ApiClient {
  /** Generisk request med JSON-serialisering */
  request: <T>(path: string, options?: RequestOptions) => Promise<T>
  /** FormData-request for filopplasting */
  formDataRequest: <T>(path: string, formData: FormData, method?: string) => Promise<T>
  /** Hent gjeldende CSRF-token */
  getCsrfToken: () => string | null
  /** Sett CSRF-token manuelt (for memory-mode) */
  setCsrfToken: (token: string) => void
  /** Resett 401-deduplisering (kall etter re-autentisering) */
  resetUnauthorizedFlag: () => void
}

/** Strukturert feilklasse for API-feil */
export class ApiError extends Error {
  public readonly name = 'ApiError'

  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: Record<string, unknown>
  ) {
    super(message)
  }

  /** Sjekk om feilen er en spesifikk HTTP-statuskode */
  is(status: number): boolean {
    return this.status === status
  }
}

/** HTTP-metoder som IKKE er muterende og ikke trenger CSRF-token */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Les en cookie-verdi fra document.cookie.
 * Bruker korrekt regex-mønster med decodeURIComponent.
 */
function getCookieValue(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Opprett en konfigurerbar API-klient.
 *
 * @param config - Valgfri konfigurasjon
 * @returns API-klient med request, formDataRequest, getCsrfToken, setCsrfToken
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  const basePath = config?.basePath ?? '/api'
  const csrfSource = config?.csrfSource ?? 'cookie'
  const csrfCookieName = config?.csrfCookieName ?? 'csrf_token'
  const csrfHeaderName = config?.csrfHeaderName ?? 'X-CSRF-Token'
  const onUnauthorized = config?.onUnauthorized

  // In-memory CSRF-token (brukes kun i memory-mode)
  let memoryCsrfToken: string | null = null

  // 401-deduplisering
  let unauthorizedHandled = false

  function getCsrfToken(): string | null {
    if (csrfSource === 'memory') {
      return memoryCsrfToken
    }
    return getCookieValue(csrfCookieName)
  }

  function setCsrfToken(token: string): void {
    memoryCsrfToken = token
  }

  function resetUnauthorizedFlag(): void {
    unauthorizedHandled = false
  }

  /**
   * Håndter feilresponser. Kaster ApiError med parsed body.
   */
  async function handleErrorResponse(response: Response): Promise<never> {
    let body: Record<string, unknown> | undefined
    let message = response.statusText

    try {
      const text = await response.text()
      if (text) {
        body = JSON.parse(text) as Record<string, unknown>
        if (typeof body?.message === 'string') {
          message = body.message
        }
      }
    } catch {
      // Ikke-JSON respons — bruk statusText
    }

    const error = new ApiError(message, response.status, response.statusText, body)

    // 401-håndtering med deduplisering
    if (response.status === 401 && onUnauthorized && !unauthorizedHandled) {
      unauthorizedHandled = true
      onUnauthorized(error)
    }

    throw error
  }

  /**
   * Parse respons-body. Håndterer tom respons.
   */
  async function parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text()
    if (!text) {
      return null as T
    }
    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError(
        'Ugyldig JSON i respons',
        response.status,
        response.statusText
      )
    }
  }

  async function request<T>(path: string, options?: RequestOptions): Promise<T> {
    const method = (options?.method ?? 'GET').toUpperCase()
    const headers: Record<string, string> = { ...options?.headers }

    // CSRF-token på muterende requests
    if (!SAFE_METHODS.has(method)) {
      const token = getCsrfToken()
      if (token) {
        headers[csrfHeaderName] = token
      }
    }

    // Content-Type og body-serialisering
    let body: string | undefined
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    let response: Response
    try {
      response = await fetch(`${basePath}${path}`, {
        method,
        headers,
        body,
        credentials: 'include',
      })
    } catch (err) {
      throw new ApiError(
        err instanceof TypeError ? 'Nettverksfeil — sjekk tilkoblingen' : String(err),
        0,
        'NetworkError'
      )
    }

    if (!response.ok) {
      return handleErrorResponse(response)
    }

    return parseResponse<T>(response)
  }

  async function formDataRequest<T>(
    path: string,
    formData: FormData,
    method = 'POST'
  ): Promise<T> {
    const upperMethod = method.toUpperCase()
    const headers: Record<string, string> = {}

    // CSRF-token (FormData er alltid muterende)
    const token = getCsrfToken()
    if (token) {
      headers[csrfHeaderName] = token
    }

    // Ikke sett Content-Type — nettleseren setter multipart boundary selv
    let response: Response
    try {
      response = await fetch(`${basePath}${path}`, {
        method: upperMethod,
        headers,
        body: formData,
        credentials: 'include',
      })
    } catch (err) {
      throw new ApiError(
        err instanceof TypeError ? 'Nettverksfeil — sjekk tilkoblingen' : String(err),
        0,
        'NetworkError'
      )
    }

    if (!response.ok) {
      return handleErrorResponse(response)
    }

    return parseResponse<T>(response)
  }

  return {
    request,
    formDataRequest,
    getCsrfToken,
    setCsrfToken,
    resetUnauthorizedFlag,
  }
}
