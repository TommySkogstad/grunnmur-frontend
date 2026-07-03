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
/** Strukturert feilklasse for API-feil */
export class ApiError extends Error {
    constructor(message, status, statusText, body) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.body = body;
        this.name = 'ApiError';
    }
    /** Sjekk om feilen er en spesifikk HTTP-statuskode */
    is(status) {
        return this.status === status;
    }
}
/** HTTP-metoder som IKKE er muterende og ikke trenger CSRF-token */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function shouldRetryStatus(status) {
    return status >= 500 || status === 429;
}
function getRetryAfterMs(response) {
    const header = response.headers.get('Retry-After');
    if (!header)
        return null;
    const seconds = parseInt(header, 10);
    return isNaN(seconds) ? null : seconds * 1000;
}
/**
 * Les en cookie-verdi fra document.cookie.
 * Bruker korrekt regex-mønster med decodeURIComponent.
 */
function getCookieValue(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
/**
 * Parse filnavn fra en Content-Disposition-header.
 * Foretrekker RFC 5987 `filename*=UTF-8''...` (prosent-enkodet) hvis til
 * stede — headere kan inneholde begge varianter samtidig, med filename*
 * som det autoritative feltet. Faller tilbake til vanlig `filename="..."`.
 * Returnerer undefined hvis header mangler eller ikke inneholder filnavn.
 */
export function parseContentDispositionFilename(header) {
    if (!header)
        return undefined;
    const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (extended) {
        try {
            return decodeURIComponent(extended[1].trim());
        }
        catch {
            return extended[1].trim();
        }
    }
    const simple = header.match(/filename\s*=\s*"?([^";]+)"?/i);
    return simple ? simple[1].trim() : undefined;
}
/**
 * Last ned en Blob i nettleseren via en midlertidig objectURL + `<a download>`-klikk.
 * Rydder alltid opp objectURL-en etterpå, selv om klikket kaster.
 */
export function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
/**
 * Opprett en konfigurerbar API-klient.
 *
 * @param config - Valgfri konfigurasjon
 * @returns API-klient med request, formDataRequest, getCsrfToken, setCsrfToken
 */
export function createApiClient(config) {
    const basePath = config?.basePath ?? '/api';
    const csrfSource = config?.csrfSource ?? 'cookie';
    const csrfCookieName = config?.csrfCookieName ?? 'csrf_token';
    const csrfHeaderName = config?.csrfHeaderName ?? 'X-CSRF-Token';
    const onUnauthorized = config?.onUnauthorized;
    const retryCount = config?.retryCount ?? 0;
    const retryDelayBase = config?.retryDelay ?? 500;
    // In-memory CSRF-token (brukes kun i memory-mode)
    let memoryCsrfToken = null;
    // 401-deduplisering
    let unauthorizedHandled = false;
    function getCsrfToken() {
        if (csrfSource === 'memory') {
            return memoryCsrfToken;
        }
        return getCookieValue(csrfCookieName);
    }
    function setCsrfToken(token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (csrfSource !== 'memory' && import.meta.env?.DEV === true) {
            console.warn('[ApiClient] setCsrfToken() kallt i cookie-mode — kallet er en no-op. ' +
                'Bruk csrfSource: "memory" hvis du vil styre token manuelt.');
        }
        memoryCsrfToken = token;
    }
    function resetUnauthorizedFlag() {
        unauthorizedHandled = false;
    }
    /**
     * Håndter feilresponser. Kaster ApiError med parsed body.
     *
     * Feilmelding leses fra body.message, med fallback til body.error
     * (grunnmur-backends StatusPagesConfig sender { error }).
     */
    async function handleErrorResponse(response) {
        let body;
        let message = response.statusText;
        try {
            const text = await response.text();
            if (text) {
                body = JSON.parse(text);
                // grunnmur-backends StatusPagesConfig sender { error }, ikke { message }.
                // message foretrekkes for bakoverkompatibilitet med apper som allerede
                // sender det feltet.
                if (typeof body?.message === 'string') {
                    message = body.message;
                }
                else if (typeof body?.error === 'string') {
                    message = body.error;
                }
            }
        }
        catch {
            // Ikke-JSON respons — bruk statusText
        }
        const error = new ApiError(message, response.status, response.statusText, body);
        // 401-håndtering med deduplisering
        if (response.status === 401 && onUnauthorized && !unauthorizedHandled) {
            unauthorizedHandled = true;
            onUnauthorized(error);
        }
        throw error;
    }
    /**
     * Parse respons-body. Håndterer tom respons.
     */
    async function parseResponse(response) {
        const text = await response.text();
        if (!text) {
            return null;
        }
        try {
            return JSON.parse(text);
        }
        catch {
            throw new ApiError('Ugyldig JSON i respons', response.status, response.statusText);
        }
    }
    async function fetchWithRetry(fn, maxAttempts, parser = parseResponse) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let response;
            try {
                response = await fn();
            }
            catch (err) {
                const networkError = new ApiError(err instanceof TypeError ? 'Nettverksfeil — sjekk tilkoblingen' : String(err), 0, 'NetworkError');
                if (attempt < maxAttempts - 1) {
                    await sleep(retryDelayBase * Math.pow(2, attempt));
                    continue;
                }
                throw networkError;
            }
            if (!response.ok) {
                if (attempt < maxAttempts - 1 && shouldRetryStatus(response.status)) {
                    const delay = getRetryAfterMs(response) ?? retryDelayBase * Math.pow(2, attempt);
                    await sleep(delay);
                    continue;
                }
                return handleErrorResponse(response);
            }
            return parser(response);
        }
        // Nådd kun hvis maxAttempts er 0 (aldri i praksis siden minimum er 1)
        throw new ApiError('Nettverksfeil — sjekk tilkoblingen', 0, 'NetworkError');
    }
    /**
     * Bygg method/headers/body felles for request(), blobRequest() og downloadRequest():
     * CSRF-header på muterende metoder + JSON-serialisering av body.
     */
    function buildJsonRequestInit(method, options) {
        const headers = { ...options?.headers };
        if (!SAFE_METHODS.has(method)) {
            const token = getCsrfToken();
            if (token) {
                headers[csrfHeaderName] = token;
            }
        }
        let body;
        if (options?.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
        }
        return { headers, body };
    }
    async function request(path, options) {
        const method = (options?.method ?? 'GET').toUpperCase();
        const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1;
        const { headers, body } = buildJsonRequestInit(method, options);
        return fetchWithRetry(() => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }), maxAttempts);
    }
    async function formDataRequest(path, formData, method = 'POST') {
        const upperMethod = method.toUpperCase();
        const headers = {};
        // CSRF-token (FormData er alltid muterende)
        const token = getCsrfToken();
        if (token) {
            headers[csrfHeaderName] = token;
        }
        // Ikke sett Content-Type — nettleseren setter multipart boundary selv
        // Kun POST retries: PUT/PATCH/DELETE er ikke nødvendigvis idempotente
        const maxFormAttempts = upperMethod === 'POST' ? 1 + retryCount : 1;
        return fetchWithRetry(() => fetch(`${basePath}${path}`, {
            method: upperMethod,
            headers,
            body: formData,
            credentials: 'include',
        }), maxFormAttempts);
    }
    async function blobRequest(path, options) {
        const method = (options?.method ?? 'GET').toUpperCase();
        const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1;
        const { headers, body } = buildJsonRequestInit(method, options);
        return fetchWithRetry(() => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }), maxAttempts, (response) => response.blob());
    }
    async function downloadRequest(path, options) {
        const method = (options?.method ?? 'GET').toUpperCase();
        const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1;
        const { headers, body } = buildJsonRequestInit(method, options);
        return fetchWithRetry(() => fetch(`${basePath}${path}`, { method, headers, body, credentials: 'include' }), maxAttempts, async (response) => ({
            blob: await response.blob(),
            filename: parseContentDispositionFilename(response.headers.get('Content-Disposition')),
            headers: response.headers,
        }));
    }
    return {
        request,
        formDataRequest,
        blobRequest,
        downloadRequest,
        getCsrfToken,
        setCsrfToken,
        resetUnauthorizedFlag,
    };
}
