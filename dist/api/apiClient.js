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
        memoryCsrfToken = token;
    }
    function resetUnauthorizedFlag() {
        unauthorizedHandled = false;
    }
    /**
     * Håndter feilresponser. Kaster ApiError med parsed body.
     */
    async function handleErrorResponse(response) {
        let body;
        let message = response.statusText;
        try {
            const text = await response.text();
            if (text) {
                body = JSON.parse(text);
                if (typeof body?.message === 'string') {
                    message = body.message;
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
    async function fetchWithRetry(fn, maxAttempts) {
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
            return parseResponse(response);
        }
        // Nådd kun hvis maxAttempts er 0 (aldri i praksis siden minimum er 1)
        throw new ApiError('Nettverksfeil — sjekk tilkoblingen', 0, 'NetworkError');
    }
    async function request(path, options) {
        const method = (options?.method ?? 'GET').toUpperCase();
        const headers = { ...options?.headers };
        const maxAttempts = SAFE_METHODS.has(method) ? 1 + retryCount : 1;
        // CSRF-token på muterende requests
        if (!SAFE_METHODS.has(method)) {
            const token = getCsrfToken();
            if (token) {
                headers[csrfHeaderName] = token;
            }
        }
        // Content-Type og body-serialisering
        let body;
        if (options?.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
        }
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
    return {
        request,
        formDataRequest,
        getCsrfToken,
        setCsrfToken,
        resetUnauthorizedFlag,
    };
}
