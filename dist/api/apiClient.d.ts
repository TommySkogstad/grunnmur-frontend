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
/** Resultat av downloadRequest() — Blob med filnavn utledet fra Content-Disposition */
export interface DownloadResult {
    /** Nedlastet innhold */
    blob: Blob;
    /** Filnavn parset fra Content-Disposition (RFC 5987 filename* foretrukket), eller undefined hvis header mangler */
    filename?: string;
    /** Rå respons-headers, for tilfeller filename ikke dekker */
    headers: Headers;
}
/** API-klient returnert av createApiClient() */
export interface ApiClient {
    /** Generisk request med JSON-serialisering */
    request: <T>(path: string, options?: RequestOptions) => Promise<T>;
    /** FormData-request for filopplasting */
    formDataRequest: <T>(path: string, formData: FormData, method?: string) => Promise<T>;
    /** Blob-request for filnedlasting — returnerer Blob med full CSRF/401-håndtering */
    blobRequest: (path: string, options?: RequestOptions) => Promise<Blob>;
    /** Som blobRequest, men inkluderer filnavn parset fra Content-Disposition */
    downloadRequest: (path: string, options?: RequestOptions) => Promise<DownloadResult>;
    /** Hent gjeldende CSRF-token */
    getCsrfToken: () => string | null;
    /**
     * Sett CSRF-token manuelt.
     *
     * **Kun effektiv i `csrfSource: 'memory'`-modus.** I cookie-mode er dette en no-op —
     * token hentes alltid fra cookie, og kallet har ingen virkning.
     * Logger `console.warn` i dev-miljø ved kall i cookie-mode.
     */
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
 * Parse filnavn fra en Content-Disposition-header.
 * Foretrekker RFC 5987 `filename*=UTF-8''...` (prosent-enkodet) hvis til
 * stede — headere kan inneholde begge varianter samtidig, med filename*
 * som det autoritative feltet. Faller tilbake til vanlig `filename="..."`.
 * Returnerer undefined hvis header mangler eller ikke inneholder filnavn.
 */
export declare function parseContentDispositionFilename(header: string | null): string | undefined;
/**
 * Last ned en Blob i nettleseren via en midlertidig objectURL + `<a download>`-klikk.
 * Rydder alltid opp objectURL-en etterpå, selv om klikket kaster.
 */
export declare function saveBlob(blob: Blob, filename: string): void;
/**
 * Opprett en konfigurerbar API-klient.
 *
 * @param config - Valgfri konfigurasjon
 * @returns API-klient med request, formDataRequest, getCsrfToken, setCsrfToken
 */
export declare function createApiClient(config?: ApiClientConfig): ApiClient;
