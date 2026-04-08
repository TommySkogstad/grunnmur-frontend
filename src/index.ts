// @grunnmur/frontend-core
// Felles frontend-bibliotek for Kotlin/Ktor-apper
//
// Moduler legges til via sub-issues:
// #2 — apiClient (CSRF, fetch, feilhåndtering)
// #3 — AuthContext (generisk auth provider)
// #4 — ErrorBoundary, ProtectedRoute
// #5 — queryClient, formatters, konfig
// #6 — Dokumentasjon og v1.0.0 release

export const VERSION = '0.0.1'

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

// Formatters
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatFileSize,
  relativeTime
} from './lib/formatters'
