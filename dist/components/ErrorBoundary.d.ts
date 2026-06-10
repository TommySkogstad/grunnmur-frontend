/**
 * Styling-agnostisk ErrorBoundary-komponent.
 *
 * Fanger ubehandlede feil i React-komponenttreet og viser en
 * konfigurerbar fallback-UI. Støtter både enkel ReactNode-fallback
 * og render-funksjon med error + reset-callback.
 *
 * @example
 * ```tsx
 * // Enkel bruk med standard fallback
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // Med custom render-funksjon
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Feil: {error.message}</p>
 *       <button onClick={reset}>Prøv igjen</button>
 *     </div>
 *   )}
 *   onError={(error, info) => loggTilServer(error)}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
/** Props for ErrorBoundary-komponenten */
export interface ErrorBoundaryProps {
    /** Barn som beskyttes av error boundary */
    children: ReactNode;
    /** CSS-klasse på wrapper-elementet ved feil */
    className?: string;
    /** Fallback-UI: ReactNode eller render-funksjon med (error, reset) */
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    /** Callback når feil fanges — for logging/rapportering */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface ErrorBoundaryState {
    error: Error | null;
}
/**
 * Error Boundary som fanger ubehandlede feil i komponenttreet.
 *
 * Class component er påkrevd — React har ingen hook-ekvivalent
 * for getDerivedStateFromError/componentDidCatch.
 */
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    /** Nullstill feilstatus — lar brukeren prøve å rendre på nytt */
    private reset;
    render(): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
}
export {};
