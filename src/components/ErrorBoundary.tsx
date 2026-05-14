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

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/** Props for ErrorBoundary-komponenten */
export interface ErrorBoundaryProps {
  /** Barn som beskyttes av error boundary */
  children: ReactNode
  /** CSS-klasse på wrapper-elementet ved feil */
  className?: string
  /** Fallback-UI: ReactNode eller render-funksjon med (error, reset) */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Callback når feil fanges — for logging/rapportering */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Error Boundary som fanger ubehandlede feil i komponenttreet.
 *
 * Class component er påkrevd — React har ingen hook-ekvivalent
 * for getDerivedStateFromError/componentDidCatch.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  /** Nullstill feilstatus — lar brukeren prøve å rendre på nytt */
  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, className, fallback } = this.props

    if (error) {
      let content: ReactNode

      if (typeof fallback === 'function') {
        content = fallback(error, this.reset)
      } else if (fallback !== undefined) {
        content = fallback
      } else {
        content = (
          <>
            <p>Noe gikk galt</p>
            <button type="button" onClick={this.reset}>Last inn på nytt</button>
          </>
        )
      }

      if (className) {
        return <div className={className}>{content}</div>
      }

      return <>{content}</>
    }

    return children
  }
}
