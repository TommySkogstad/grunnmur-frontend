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
    basePath?: string;
    /** Hvor CSRF-token hentes fra (default: 'cookie') */
    csrfSource?: 'cookie' | 'memory';
    /** Navn på CSRF-cookie (default: 'csrf_token') */
    csrfCookieName?: string;
    /** Navn på CSRF-header (default: 'X-CSRF-Token') */
    csrfHeaderName?: string;
    /**
     * Kalles ved 401-respons. Mottar ApiError-objektet.
     * Har innebygd deduplisering — kalles maks én gang inntil resetUnauthorizedFlag().
     */
    onUnauthorized?: (error: ApiError) => void;
    /** Antall automatiske retries ved nettverksfeil eller 5xx (default: 0) */
    retryCount?: number;
    /** Grunnforsinkelse mellom retries i ms — dobles eksponentielt (default: 500) */
    retryDelay?: number;
}
/** Alternativer for enkeltrequest */
export interface RequestOptions {
    /** HTTP-metode (default: 'GET') */
    method?: string;
    /** Request-body — serialiseres automatisk til JSON */
    body?: unknown;
    /** Ekstra headers */
    headers?: Record<string, string>;
}
/** API-klient returnert av createApiClient() */
export interface ApiClient {
    /** Generisk request med JSON-serialisering */
    request: <T>(path: string, options?: RequestOptions) => Promise<T>;
    /** FormData-request for filopplasting */
    formDataRequest: <T>(path: string, formData: FormData, method?: string) => Promise<T>;
    /** Hent gjeldende CSRF-token */
    getCsrfToken: () => string | null;
    /** Sett CSRF-token manuelt (for memory-mode) */
    setCsrfToken: (token: string) => void;
    /** Resett 401-deduplisering (kall etter re-autentisering) */
    resetUnauthorizedFlag: () => void;
}
/** Strukturert feilklasse for API-feil */
export declare class ApiError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body?: Record<string, unknown> | undefined;
    readonly name = "ApiError";
    constructor(message: string, status: number, statusText: string, body?: Record<string, unknown> | undefined);
    /** Sjekk om feilen er en spesifikk HTTP-statuskode */
    is(status: number): boolean;
}
/**
 * Opprett en konfigurerbar API-klient.
 *
 * @param config - Valgfri konfigurasjon
 * @returns API-klient med request, formDataRequest, getCsrfToken, setCsrfToken
 */
export declare function createApiClient(config?: ApiClientConfig): ApiClient;
