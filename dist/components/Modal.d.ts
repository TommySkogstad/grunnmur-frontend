/**
 * Tilgjengelig modal-dialog.
 *
 * Har `role="dialog"`, `aria-modal="true"` og `aria-labelledby` mot tittelen,
 * holder fokus inne i dialogen (Tab/Shift+Tab går rundt), lukker på Escape og
 * klikk utenfor (begge kan slås av), og gir fokus tilbake til elementet som
 * hadde det da dialogen åpnet.
 *
 * @example
 * ```tsx
 * <Modal open={open} title="Rediger" onClose={() => setOpen(false)}>
 *   <input />
 *   <button onClick={() => setOpen(false)}>Lukk</button>
 * </Modal>
 * ```
 */
import type { ReactNode, RefObject } from 'react';
/** Props for Modal-komponenten */
export interface ModalProps {
    /** Om dialogen vises */
    open: boolean;
    /** Kalles når brukeren ber om å lukke (Escape eller klikk utenfor) */
    onClose: () => void;
    /** Tittel; knyttes til dialogen via aria-labelledby */
    title: ReactNode;
    /** Innhold i dialogen */
    children?: ReactNode;
    /** Valgfri bunnlinje, typisk knapper */
    footer?: ReactNode;
    /** Lukk på Escape (default: true) */
    closeOnEscape?: boolean;
    /** Lukk ved klikk utenfor dialogen (default: true) */
    closeOnOverlayClick?: boolean;
    /** Elementet som skal få fokus ved åpning (default: første fokuserbare element) */
    initialFocusRef?: RefObject<HTMLElement | null>;
    /** Markerer dialogen som opptatt (aria-busy), f.eks. mens en handling kjører */
    busy?: boolean;
    /** Ekstra CSS-klasser på dialogboksen */
    className?: string;
}
/** Modal-dialog med fokusfelle og dialog-semantikk. */
export declare function Modal({ open, onClose, title, children, footer, closeOnEscape, closeOnOverlayClick, initialFocusRef, busy, className, }: ModalProps): import("react").ReactPortal | null;
