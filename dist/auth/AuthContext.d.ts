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
import type { ReactNode } from 'react';
import type { ApiClient } from '../api/apiClient';
import type { AuthApiConfig, LoginResponse } from './authApi';
import type { ProtectedRouteProps } from '../components/ProtectedRoute';
/** Verdier eksponert av useAuth() */
export interface AuthContextValue<TUser> {
    /** Innlogget bruker, eller null */
    user: TUser | null;
    /** Om bruker er autentisert */
    isAuthenticated: boolean;
    /** Om initial sessjonssjekk pågår */
    isLoading: boolean;
    /** Logg inn med e-post og kode */
    login: (email: string, code: string) => Promise<LoginResponse>;
    /** Logg ut */
    logout: () => Promise<void>;
    /** Hent brukerinfo på nytt */
    refreshUser: () => Promise<void>;
}
/** Konfigurasjon for createAuthProvider() */
export interface AuthProviderConfig<TUser> extends AuthApiConfig {
    /** API-klient fra createApiClient() */
    apiClient: ApiClient;
    /** Sti til innloggingsside (default: '/login') */
    loginPath?: string;
    /** Callback ved utlogging — f.eks. queryClient.clear() */
    onLogout?: () => void;
    /** Custom parsing av brukerdata fra /me- eller /session-endepunktet */
    parseUser?: (data: unknown) => TUser;
    /** Kalles ved uventet feil under sessjonssjekk (ikke 401) */
    onSessionError?: (error: unknown) => void;
    /**
     * Bruk session-endepunkt (2xx for både anonyme og autentiserte) i stedet for
     * /me (som returnerer 401 for anonyme og logger nettverksfeil i konsollen).
     *
     * Krever at backend returnerer `{ authenticated: boolean, user?: TUser }` på
     * `sessionEndpoint` (default: `/auth/session`). Default: false.
     */
    useSessionEndpoint?: boolean;
}
/**
 * Opprett en typet AuthProvider og useAuth-hook.
 *
 * @param config - Konfigurasjon med apiClient og valgfrie callbacks
 * @returns Objekt med AuthProvider-komponent og useAuth-hook
 */
export declare function createAuthProvider<TUser>(config: AuthProviderConfig<TUser>): {
    AuthProvider: React.FC<{
        children: ReactNode;
    }>;
    useAuth: () => AuthContextValue<TUser>;
    ProtectedRoute: React.FC<ProtectedRouteProps<TUser>>;
};
