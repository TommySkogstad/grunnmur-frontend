/**
 * @tommyskogstad/frontend-core
 * Felles frontend-bibliotek for Kotlin/Ktor-apper.
 *
 * @see README.md for API-referanse og konfigurasjon
 */
export declare const VERSION: string;
export { createApiClient, ApiError } from './api/apiClient';
export type { ApiClientConfig, RequestOptions, ApiClient } from './api/apiClient';
export { createAuthProvider } from './auth/AuthContext';
export type { AuthContextValue, AuthProviderConfig } from './auth/AuthContext';
export { createAuthApi } from './auth/authApi';
export type { AuthApi, AuthApiConfig, LoginResponse } from './auth/authApi';
export { ErrorBoundary } from './components/ErrorBoundary';
export type { ErrorBoundaryProps } from './components/ErrorBoundary';
export { createProtectedRoute } from './components/ProtectedRoute';
export type { ProtectedRouteProps } from './components/ProtectedRoute';
export { createQueryClient } from './query/queryClient';
export { formatCurrency, formatDate, formatDateTime, formatNumber, formatFileSize, relativeTime } from './lib/formatters';
export { AnalyticsProvider } from './analytics/AnalyticsProvider';
export type { AnalyticsProviderProps } from './analytics/AnalyticsProvider';
export { useAnalytics } from './analytics/useAnalytics';
export { TrackClick } from './analytics/TrackClick';
export type { TrackClickProps } from './analytics/TrackClick';
export { usePageView } from './analytics/usePageView';
