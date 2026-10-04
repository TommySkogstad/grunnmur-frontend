/**
 * @tommyskogstad/frontend-core
 * Felles frontend-bibliotek for Kotlin/Ktor-apper.
 *
 * @see README.md for API-referanse og konfigurasjon
 */
export declare const VERSION: string;
export { createApiClient, ApiError, saveBlob, parseContentDispositionFilename } from './api/apiClient';
export type { ApiClientConfig, RequestOptions, ApiClient, DownloadResult } from './api/apiClient';
export { createAuthProvider } from './auth/AuthContext';
export type { AuthContextValue, AuthProviderConfig } from './auth/AuthContext';
export { createAuthApi } from './auth/authApi';
export type { AuthApi, AuthApiConfig, LoginResponse } from './auth/authApi';
export { ErrorBoundary } from './components/ErrorBoundary';
export type { ErrorBoundaryProps } from './components/ErrorBoundary';
export { createProtectedRoute } from './components/ProtectedRoute';
export type { ProtectedRouteProps } from './components/ProtectedRoute';
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';
export { ConfirmDialog } from './components/ConfirmDialog';
export type { ConfirmDialogProps } from './components/ConfirmDialog';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './components/EmptyState';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';
export { createQueryClient } from './query/queryClient';
export { formatCurrency, formatDate, formatDateLong, formatDateTime, formatNumber, formatFileSize, relativeTime } from './lib/formatters';
export { ToastProvider } from './context/ToastContext';
export { useToast } from './context/toastContext';
export type { ToastType, ToastAction, ToastContextValue } from './context/toastContext';
export { ConfirmProvider } from './context/ConfirmContext';
export { useConfirm } from './context/confirmContext';
export type { ConfirmOptions, ConfirmFn } from './context/confirmContext';
export { useIssueReport } from './issues/useIssueReport';
export type { UseIssueReportOptions, UseIssueReportResult, CreateIssueResponse } from './issues/useIssueReport';
