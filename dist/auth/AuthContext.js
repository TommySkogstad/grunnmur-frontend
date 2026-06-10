import { jsx as _jsx } from "react/jsx-runtime";
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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/apiClient';
import { createAuthApi } from './authApi';
import { createProtectedRoute } from '../components/ProtectedRoute';
/**
 * Opprett en typet AuthProvider og useAuth-hook.
 *
 * @param config - Konfigurasjon med apiClient og valgfrie callbacks
 * @returns Objekt med AuthProvider-komponent og useAuth-hook
 */
export function createAuthProvider(config) {
    const { apiClient, onLogout: onLogoutCallback, onSessionError, parseUser, useSessionEndpoint, ...authApiConfig } = config;
    const authApi = createAuthApi(apiClient, authApiConfig);
    // Context med undefined som sentinel for "utenfor provider"
    const AuthContext = createContext(undefined);
    function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const isMountedRef = useRef(true);
        const fetchUser = useCallback(async () => {
            try {
                if (useSessionEndpoint) {
                    const session = await authApi.getSession();
                    if (!isMountedRef.current)
                        return;
                    if (!session.authenticated || session.user === undefined) {
                        setUser(null);
                        return;
                    }
                    const parsed = parseUser ? parseUser(session.user) : session.user;
                    setUser(parsed);
                    return;
                }
                const data = await authApi.getMe();
                if (!isMountedRef.current)
                    return;
                const parsed = parseUser ? parseUser(data) : data;
                setUser(parsed);
            }
            catch (error) {
                if (!isMountedRef.current)
                    return;
                // 401 betyr at brukeren ikke er innlogget — det er forventet
                if (error instanceof ApiError && error.is(401)) {
                    setUser(null);
                }
                else {
                    setUser(null);
                    onSessionError?.(error);
                }
            }
        }, []); // authApi, parseUser, useSessionEndpoint og onSessionError er factory-scope konstanter, ikke React-tilstand
        const refreshUser = useCallback(async () => {
            await fetchUser();
        }, [fetchUser]);
        const login = useCallback(async (email, code) => {
            apiClient.resetUnauthorizedFlag();
            const response = await authApi.verifyCode(email, code);
            await fetchUser();
            return response;
        }, [fetchUser]);
        const logout = useCallback(async () => {
            await authApi.logout();
            setUser(null);
            onLogoutCallback?.();
        }, []); // authApi og onLogoutCallback er factory-scope konstanter, ikke React-tilstand
        // Sjekk sesjon ved mount — cleanup hindrer state-oppdatering etter unmount
        useEffect(() => {
            isMountedRef.current = true;
            fetchUser().finally(() => {
                if (isMountedRef.current)
                    setIsLoading(false);
            });
            return () => { isMountedRef.current = false; };
        }, [fetchUser]);
        const value = useMemo(() => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            login,
            logout,
            refreshUser,
        }), [user, isLoading, login, logout, refreshUser]);
        return (_jsx(AuthContext.Provider, { value: value, children: children }));
    }
    function useAuth() {
        const context = useContext(AuthContext);
        if (context === undefined) {
            throw new Error('useAuth må brukes innenfor en AuthProvider');
        }
        return context;
    }
    const ProtectedRoute = createProtectedRoute(useAuth);
    return { AuthProvider, useAuth, ProtectedRoute };
}
