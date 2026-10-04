/**
 * Bekreftelsesdialog bygd på Modal.
 *
 * Erstatter `window.confirm()`. Innholdet er barn, så appen kan liste hva som
 * skjer. Er `onConfirm` async, vises ventetilstand til promiset er ferdig, og
 * dobbeltklikk hindres. Escape og klikk utenfor avbryter ikke mens handlingen
 * kjører.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={open}
 *   title="Slette medlem?"
 *   variant="danger"
 *   confirmLabel="Slett"
 *   onConfirm={async () => { await api.delete(`/medlemmer/${id}`); setOpen(false) }}
 *   onCancel={() => setOpen(false)}
 * >
 *   Medlemmet og alle stemmer fjernes.
 * </ConfirmDialog>
 * ```
 */
import type { ReactNode } from 'react';
/** Props for ConfirmDialog-komponenten */
export interface ConfirmDialogProps {
    /** Om dialogen vises */
    open: boolean;
    /** Tittel */
    title: ReactNode;
    /** Innhold, f.eks. en liste over hva som skjer */
    children?: ReactNode;
    /** Tekst på bekreft-knappen (default: «Bekreft») */
    confirmLabel?: string;
    /** Tekst på avbryt-knappen (default: «Avbryt») */
    cancelLabel?: string;
    /** `danger` markerer bekreft-knappen som farlig og gir fokus til avbryt (default: `default`) */
    variant?: 'default' | 'danger';
    /** Ytre ventetilstand, i tillegg til den som følger av et async `onConfirm` */
    busy?: boolean;
    /** Kalles ved bekreft. Returnerer den et promise, vises ventetilstand til det er ferdig. */
    onConfirm: () => void | Promise<void>;
    /** Kalles ved avbryt, Escape eller klikk utenfor */
    onCancel: () => void;
    /** Lukk ved klikk utenfor (default: true) */
    closeOnOverlayClick?: boolean;
}
/** Bekreftelsesdialog med ventetilstand og dobbeltklikk-vern. */
export declare function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel, variant, busy, onConfirm, onCancel, closeOnOverlayClick, }: ConfirmDialogProps): import("react").JSX.Element;
