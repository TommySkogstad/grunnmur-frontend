/**
 * @tommyskogstad/frontend-core
 * Felles frontend-bibliotek for Kotlin/Ktor-apper.
 *
 * @see README.md for API-referanse og konfigurasjon
 */
import pkg from '../package.json';
export const VERSION = pkg.version;
// API-klient
export { createApiClient, ApiError } from './api/apiClient';
// Auth
export { createAuthProvider } from './auth/AuthContext';
export { createAuthApi } from './auth/authApi';
// Komponenter
export { ErrorBoundary } from './components/ErrorBoundary';
export { createProtectedRoute } from './components/ProtectedRoute';
// Query
export { createQueryClient } from './query/queryClient';
// Formatters
export { formatCurrency, formatDate, formatDateTime, formatNumber, formatFileSize, relativeTime } from './lib/formatters';
// Analytics
export { AnalyticsProvider } from './analytics/AnalyticsProvider';
export { useAnalytics } from './analytics/useAnalytics';
export { TrackClick } from './analytics/TrackClick';
export { usePageView } from './analytics/usePageView';
