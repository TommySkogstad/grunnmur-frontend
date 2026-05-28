import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
/**
 * Opprett en ProtectedRoute-komponent bundet til en spesifikk useAuth-hook.
 *
 * @param useAuth - useAuth-hook fra createAuthProvider()
 * @returns ProtectedRoute React-komponent
 */
export function createProtectedRoute(useAuth) {
    function ProtectedRoute({ loginPath = '/logg-inn', roleCheck, unauthorizedPath, loadingComponent, }) {
        const { isAuthenticated, isLoading, user } = useAuth();
        if (isLoading) {
            return _jsx(_Fragment, { children: loadingComponent ?? null });
        }
        if (!isAuthenticated) {
            return _jsx(Navigate, { to: loginPath, replace: true });
        }
        if (roleCheck && (!user || !roleCheck(user))) {
            return _jsx(Navigate, { to: unauthorizedPath ?? loginPath, replace: true });
        }
        return _jsx(Outlet, {});
    }
    return ProtectedRoute;
}
