import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useRef, useState } from 'react';
import { Modal } from './Modal';
/** Bekreftelsesdialog med ventetilstand og dobbeltklikk-vern. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Bekreft', cancelLabel = 'Avbryt', variant = 'default', busy = false, onConfirm, onCancel, closeOnOverlayClick = true, }) {
    const [pending, setPending] = useState(false);
    const runningRef = useRef(false);
    const confirmRef = useRef(null);
    const isBusy = busy || pending;
    const handleConfirm = async () => {
        if (runningRef.current || busy)
            return;
        runningRef.current = true;
        setPending(true);
        try {
            await onConfirm();
        }
        finally {
            runningRef.current = false;
            setPending(false);
        }
    };
    const confirmClasses = variant === 'danger'
        ? 'bg-danger-600 text-white hover:bg-danger-700'
        : 'bg-primary-600 text-white hover:bg-primary-700';
    return (_jsx(Modal, { open: open, title: title, onClose: onCancel, closeOnEscape: !isBusy, closeOnOverlayClick: closeOnOverlayClick && !isBusy, busy: isBusy, initialFocusRef: variant === 'danger' ? undefined : confirmRef, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: onCancel, disabled: isBusy, className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50", children: cancelLabel }), _jsx("button", { ref: confirmRef, type: "button", onClick: handleConfirm, disabled: isBusy, "data-variant": variant, className: `rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${confirmClasses}`, children: confirmLabel })] }), children: children }));
}
