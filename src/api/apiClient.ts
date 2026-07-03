/**
 * Konfigurerbar API-klient for Kotlin/Ktor-apper.
 *
 * Håndterer CSRF-tokens (cookie eller in-memory), JSON-serialisering,
 * 401-deduplisering, FormData-opplasting og blob-nedlasting.
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
  /** Antall automatiske retries ved nettverksfeil eller 5xx (default: 0) */
  retryCount?: number
  /** Grunnforsinkelse mellom retries i ms — dobles eksponentielt (default: 500) */
  retryDelay?: number
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

/** Resultat av downloadRequest() — Blob med filnavn utledet fra Content-Disposition */
export interface DownloadResult {
  /** Nedlastet innhold */
  blob: Blob
  /** Filnavn parset fra Content-Disposition (RFC 5987 filename* foretrukket), eller undefined hvis header mangler */
  filename?: string
  /** Rå respons-headers, for tilfeller filename ikke dekker */
  headers: Headers
}

/** API-klient returnert av createApiClient() */
export interface ApiClient {
  /** Generisk request med JSON-serialisering */
  request: <T>(path: string, options?: RequestOptions) => Promise<T>
  /** FormData-request for filopplasting */
  formDataRequest: <T>(path: string, formData: FormData, method?: string) => Promise<T>
  /** Blob-request for filnedlasting — returnerer Blob med full CSRF/401-håndtering */
  blobRequest: (path: string, options?: RequestOptions) => Promise<Blob>
  /** Som blobRequest, men inkluderer filnavn parset fra Content-Disposition */
  downloadRequest: (path: string, options?: RequestOptions) => Promise<DownloadResult>
  /** Hent gjeldende CSRF-token */
  getCsrfToken: () => string | null
  /**
   * Sett CSRF-token manuelt.
   *
   * **Kun effektiv i `csrfSource: 'memory'`-modus.** I cookie-mode er dette en no-op —
   * token hentes alltid fra cookie, og kallet har ingen virkning.
   * Logger `console.warn` i dev-miljø ved kall i cookie-mode.
   */
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shouldRetryStatus(status: number): boolean {
  return status >= 500 || status === 429
}

function getRetryAfterMs(response: Response): number | null {
  const header = response.headers.get('Retry-After')
  if (!header) return null
  const seconds = parseInt(header, 10)
  return isNaN(seconds) ? null : seconds * 1000
}

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
 * Parse filnavn fra en Content-Disposition-header.
 * Foretrekker RFC 5987 `filename*=UTF-8''...` (prosent-enkodet) hvis til
 * stede — headere kan inneholde begge varianter samtidig, med filename*
 * som det autoritative feltet. Faller tilbake til vanlig `filename="..."`.
 * Returnerer undefined hvis header mangler eller ikke inneholder filnavn.
 */
export function parseContentDispositionFilename(header: string | null): string | undefined {
  if (!header) return undefined

  const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (extended) {
    try {
      return decodeURIComponent(extended[1].trim())
    } catch {
      return extended[1].trim()
    }
  }

  const simple = header.match(/filename\s*=\s*"?([^";]+)"?/i)
  return simple ? simple[1].trim() : undefined
}

/**
 * Last ned en Blob i nettleseren via en midlertidig objectURL + `<a download>`-klikk.
 * Rydder alltid opp objectURL-en etterpå, selv om klikket kaster.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
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
  const retryCount = config?.retryCount ?? 0
  const retryDelayBase = config?.retryDelay ?? 500

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (csrfSource !== 'memory' && (import.meta as any).env?.DEV === true) {
      console.warn(
        '[ApiClient] setCsrfToken() kallt i cookie-mode — kallet er en no-op. ' +
        'Bruk csrfSource: "memory" hvis du vil styre token manuelt.'
      )
    }
    memoryCsrfToken = token
  }

  function resetUnauthorizedFlag(): void {
    unauthorizedHandled = false
  }

  /**
   * Håndter feilresponser. Kaster ApiError med parsed body.
   *
   * Feilmelding leses fra body.message, med fallback til body.error
   * (grunnmur-backends StatusPagesConfig sender { error }).
   */
  async function handleErrorResponse(response: Response): Promise<never> {
    let body: Record<string, unknown> | undefined
    let message = response.statusText

    try {
      const text = await response.text()
      if (text) {
        body = JSON.parse(text) as Record<string, unknown>
        // grunnmur-backends StatusPagesConfig sender { error }, ikke { message }.
        // message foretrekkes for bakoverkompatibilitet med apper som allerede
        // sender det feltet.
        if (typeof body?.message === 'string') {
          message = body.message
        } else if (typeof body?.error === 'string') {
          message = body.error
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

  async function fetchWithRetry<T>(
    fn: () => Promise<Response>,
    maxAttempts: number,
    parser: (response: Response) => Promise<T> = parseResponse
  ): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let response: Response
      try {
        response = await fn()
      } catch (err) {
        const networkError = new ApiError(
          err instanceof TypeError ? 'Nettverksfeil — sjekk tilkoblingen' : String(err),
          0,
          'NetworkError'
        )
        if (attempt < maxAttempts - 1) {
          await sleep(retryDelayBase * Math.pow(2, attempt))
          continue
        }
        throw networkError
      }

      if (!response.ok) {
        if (attempt < maxAttempts - 1 && shouldRetryStatus(response.status)) {
          const delay = getRetryAfterMs(response) ?? retryDelayBase * Math.pow(2, attempt)
          await sleep(delay)
          continue
        }
        return handleErrorResponse(response)
      }

      return parser(response)
    }

    // Nådd kun hvis maxAttempts er 0 (aldri i praksis siden minimum er 1)
    throw new ApiError('Nettverksfeil — sjekk tilkoblingen', 0, 'NetworkError')
  }

  /**
   * Bygg method/headers/body felles for request(), blobRequest() og downloadRequest():
   * CSRF-header på muterende metoder + JSON-serialisering av body.
   */
  function buildJsonRequestInit(
    method: string,
    options?: RequestOptions
  ): { headers: Record<string, string>; body?: string } {
    const headers: Record<string, string> = { ...options?.headers }

    if (!SAFE_METHODS.has(method)) {
      const token = getCsrfToken()
      if (token) {
        headers[csrfHeaderName] = token
      }
    }

    let body: string | undefined
    if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    return { headers, body }
  }

  async function request<T>(path: string, options?: RequestOptions): Promise<T> {
    const method = (options?.method ?? 'GET').toUpperCase()
    const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1
    const { headers, body } = buildJsonRequestInit(method, options)

    return fetchWithRetry<T>(
      () => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }),
      maxAttempts
    )
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
    // Kun POST retries: PUT/PATCH/DELETE er ikke nødvendigvis idempotente
    const maxFormAttempts = upperMethod === 'POST' ? 1 + retryCount : 1
    return fetchWithRetry<T>(
      () => fetch(`${basePath}${path}`, {
        method: upperMethod,
        headers,
        body: formData,
        credentials: 'include',
      }),
      maxFormAttempts
    )
  }

  async function blobRequest(path: string, options?: RequestOptions): Promise<Blob> {
    const method = (options?.method ?? 'GET').toUpperCase()
    const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1
    const { headers, body } = buildJsonRequestInit(method, options)

    return fetchWithRetry<Blob>(
      () => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }),
      maxAttempts,
      (response) => response.blob()
    )
  }

  async function downloadRequest(path: string, options?: RequestOptions): Promise<DownloadResult> {
    const method = (options?.method ?? 'GET').toUpperCase()
    const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1
    const { headers, body } = buildJsonRequestInit(method, options)

    return fetchWithRetry<DownloadResult>(
      () => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }),
      maxAttempts,
      async (response) => ({
        blob: await response.blob(),
        filename: parseContentDispositionFilename(response.headers.get('Content-Disposition')),
        headers: response.headers,
      })
    )
  }

  return {
    request,
    formDataRequest,
    blobRequest,
    downloadRequest,
    getCsrfToken,
    setCsrfToken,
    resetUnauthorizedFlag,
  }
}
