/**
 * Konfigurerbar ProtectedRoute-komponent for rutebeskyttelse.
 *
 * Factory-funksjon som tar en useAuth-hook og returnerer en
 * ProtectedRoute-komponent bundet til den spesifikke auth-konteksten.
 *
 * @example
 * ```tsx
 * const { AuthProvider, useAuth } = createAuthProvider<MyUser>({...})
 * const ProtectedRoute = createProtectedRoute(useAuth)
 *
 * // Som layout-route med Outlet:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * // Med rollesjekk:
 * <Route element={<ProtectedRoute roleCheck={(u) => u.role === 'admin'} />}>
 *   <Route path="/admin" element={<Admin />} />
 * </Route>
 * ```
 */
import type { ReactNode } from 'react';
import type { AuthContextValue } from '../auth/AuthContext';
/** Props for ProtectedRoute-komponenten */
export interface ProtectedRouteProps<TUser> {
    /** Sti til innloggingsside (default: '/logg-inn') */
    loginPath?: string;
    /** Valgfri rollesjekk — returnerer true hvis bruker har tilgang */
    roleCheck?: (user: TUser) => boolean;
    /** Redirect-sti ved feilet rollesjekk (default: loginPath) */
    unauthorizedPath?: string;
    /** Komponent som vises under lasting */
    loadingComponent?: ReactNode;
}
/**
 * Opprett en ProtectedRoute-komponent bundet til en spesifikk useAuth-hook.
 *
 * @param useAuth - useAuth-hook fra createAuthProvider()
 * @returns ProtectedRoute React-komponent
 */
export declare function createProtectedRoute<TUser>(useAuth: () => AuthContextValue<TUser>): React.FC<ProtectedRouteProps<TUser>>;
