import type { ReactNode } from 'react';
/** Toast-type for visuell stil og semantikk */
export type ToastType = 'success' | 'error' | 'info';
/** Verdi eksponert via useToast-hook */
export interface ToastContextValue {
    showToast: (message: string, type: ToastType, durationMs?: number) => number;
    removeToast: (id: number) => void;
}
/**
 * Tilbyr toast-varsler til hele komponenttreet.
 * Wrap rundt app-roten for å aktivere useToast-hook.
 */
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
/**
 * Returnerer showToast-funksjonen for å vise toast-varsler.
 * Må brukes innenfor en ToastProvider.
 */
export declare function useToast(): ToastContextValue;
