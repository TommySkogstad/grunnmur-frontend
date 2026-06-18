/** Toast-type for visuell stil og semantikk */
export type ToastType = 'success' | 'error' | 'info';
/** Verdi eksponert via useToast-hook */
export interface ToastContextValue {
    showToast: (message: string, type: ToastType, durationMs?: number) => number;
    removeToast: (id: number) => void;
}
export declare const ToastContext: import("react").Context<ToastContextValue | null>;
/**
 * Returnerer showToast-funksjonen for å vise toast-varsler.
 * Må brukes innenfor en ToastProvider.
 */
export declare function useToast(): ToastContextValue;
