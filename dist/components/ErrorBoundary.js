import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
/**
 * Error Boundary som fanger ubehandlede feil i komponenttreet.
 *
 * Class component er påkrevd — React har ingen hook-ekvivalent
 * for getDerivedStateFromError/componentDidCatch.
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        /** Nullstill feilstatus — lar brukeren prøve å rendre på nytt */
        this.reset = () => {
            this.setState({ error: null });
        };
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, errorInfo) {
        this.props.onError?.(error, errorInfo);
    }
    render() {
        const { error } = this.state;
        const { children, className, fallback } = this.props;
        if (error) {
            let content;
            if (typeof fallback === 'function') {
                content = fallback(error, this.reset);
            }
            else if (fallback !== undefined) {
                content = fallback;
            }
            else {
                content = (_jsxs(_Fragment, { children: [_jsx("p", { children: "Noe gikk galt" }), _jsx("button", { type: "button", onClick: this.reset, children: "Last inn p\u00E5 nytt" })] }));
            }
            if (className) {
                return _jsx("div", { className: className, children: content });
            }
            return _jsx(_Fragment, { children: content });
        }
        return children;
    }
}
