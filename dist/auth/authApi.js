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
/**
 * Opprett auth-API-funksjoner som bruker en apiClient-instans.
 *
 * @param apiClient - API-klient fra createApiClient()
 * @param config - Valgfri konfigurasjon av endepunkter
 * @returns AuthApi med requestCode, verifyCode, getMe, getSession, logout
 */
export function createAuthApi(apiClient, config) {
    const requestCodeEndpoint = config?.requestCodeEndpoint ?? '/auth/request-code';
    const verifyCodeEndpoint = config?.verifyCodeEndpoint ?? '/auth/verify-code';
    const meEndpoint = config?.meEndpoint ?? '/auth/me';
    const logoutEndpoint = config?.logoutEndpoint ?? '/auth/logout';
    const sessionEndpoint = config?.sessionEndpoint ?? '/auth/session';
    async function requestCode(email) {
        await apiClient.request(requestCodeEndpoint, {
            method: 'POST',
            body: { email },
        });
    }
    async function verifyCode(email, code) {
        return apiClient.request(verifyCodeEndpoint, {
            method: 'POST',
            body: { email, code },
        });
    }
    async function getMe() {
        return apiClient.request(meEndpoint);
    }
    async function getSession() {
        return apiClient.request(sessionEndpoint);
    }
    async function logout() {
        await apiClient.request(logoutEndpoint, {
            method: 'POST',
        });
    }
    return { requestCode, verifyCode, getMe, getSession, logout };
}
