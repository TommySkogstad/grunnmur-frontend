/**
 * @tommyskogstad/frontend-core
 * Felles frontend-bibliotek for Kotlin/Ktor-apper.
 *
 * @see README.md for API-referanse og konfigurasjon
 */
import pkg from '../package.json';
export const VERSION = pkg.version;
// API-klient
export { createApiClient, ApiError, saveBlob, parseContentDispositionFilename } from './api/apiClient';
// Auth
export { createAuthProvider } from './auth/AuthContext';
export { createAuthApi } from './auth/authApi';
// Komponenter
export { ErrorBoundary } from './components/ErrorBoundary';
export { createProtectedRoute } from './components/ProtectedRoute';
// Query
export { createQueryClient } from './query/queryClient';
// Formatters
export { formatCurrency, formatDate, formatDateLong, formatDateTime, formatNumber, formatFileSize, relativeTime } from './lib/formatters';
// Context
export { ToastProvider } from './context/ToastContext';
export { useToast } from './context/toastContext';
// Issue-rapportering
export { useIssueReport } from './issues/useIssueReport';
