/**
 * @tommyskogstad/frontend-core
 * Felles frontend-bibliotek for Kotlin/Ktor-apper.
 *
 * @see README.md for API-referanse og konfigurasjon
 */

export const VERSION = '1.0.0'

// API-klient
export { createApiClient, ApiError } from './api/apiClient'
export type { ApiClientConfig, RequestOptions, ApiClient } from './api/apiClient'

// Auth
export { createAuthProvider } from './auth/AuthContext'
export type { AuthContextValue, AuthProviderConfig } from './auth/AuthContext'
export { createAuthApi } from './auth/authApi'
export type { AuthApi, AuthApiConfig, LoginResponse } from './auth/authApi'

// Komponenter
export { ErrorBoundary } from './components/ErrorBoundary'
export type { ErrorBoundaryProps } from './components/ErrorBoundary'
export { createProtectedRoute } from './components/ProtectedRoute'
export type { ProtectedRouteProps } from './components/ProtectedRoute'

// Query
export { createQueryClient } from './query/queryClient'

// Formatters
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatFileSize,
  relativeTime
} from './lib/formatters'
