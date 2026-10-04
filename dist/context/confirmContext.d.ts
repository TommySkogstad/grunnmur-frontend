import type { ReactNode } from 'react';
/** Opsjoner for en bekreftelse via useConfirm */
export interface ConfirmOptions {
    /** Tittel (default: «Bekreft») */
    title?: ReactNode;
    /** Innhold, f.eks. en liste over hva som skjer */
    message?: ReactNode;
    /** Tekst på bekreft-knappen */
    confirmLabel?: string;
    /** Tekst på avbryt-knappen */
    cancelLabel?: string;
    /** `danger` for farlige handlinger */
    variant?: 'default' | 'danger';
}
/** Funksjonen useConfirm returnerer. En ren streng tolkes som `message`. */
export type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;
export declare const ConfirmContext: import("react").Context<ConfirmFn | null>;
/**
 * Returnerer en `confirm`-funksjon som viser en ConfirmDialog og løser til
 * `true` ved bekreft og `false` ved avbryt, Escape eller klikk utenfor.
 * Må brukes innenfor en ConfirmProvider.
 *
 * @example
 * ```tsx
 * const confirm = useConfirm()
 * if (!(await confirm({ title: 'Slette?', variant: 'danger' }))) return
 * ```
 */
export declare function useConfirm(): ConfirmFn;
