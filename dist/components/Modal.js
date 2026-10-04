import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
const FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function focusableIn(root) {
    return Array.from(root.querySelectorAll(FOCUSABLE));
}
/** Modal-dialog med fokusfelle og dialog-semantikk. */
export function Modal({ open, onClose, title, children, footer, closeOnEscape = true, closeOnOverlayClick = true, initialFocusRef, busy = false, className = '', }) {
    const titleId = useId();
    const dialogRef = useRef(null);
    // Siste props i ref, slik at tastelytteren ikke må re-registreres ved hver render
    const latest = useRef({ onClose, closeOnEscape });
    useEffect(() => {
        latest.current = { onClose, closeOnEscape };
    });
    // Fokus inn ved åpning, tilbake til opphavet ved lukking/unmount
    useEffect(() => {
        if (!open)
            return;
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        if (dialog) {
            const target = initialFocusRef?.current ?? focusableIn(dialog)[0] ?? dialog;
            target.focus();
        }
        return () => {
            if (opener && opener.isConnected)
                opener.focus();
        };
        // initialFocusRef leses kun ved åpning
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    // Escape og fokusfelle
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (latest.current.closeOnEscape) {
                    e.stopPropagation();
                    latest.current.onClose();
                }
                return;
            }
            if (e.key !== 'Tab')
                return;
            const dialog = dialogRef.current;
            if (!dialog)
                return;
            const items = focusableIn(dialog);
            if (items.length === 0) {
                e.preventDefault();
                dialog.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (!dialog.contains(active)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            }
            else if (e.shiftKey && (active === first || active === dialog)) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);
    if (!open)
        return null;
    return createPortal(_jsx("div", { "data-testid": "modal-overlay", className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", onMouseDown: e => {
            if (closeOnOverlayClick && e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, "aria-busy": busy, tabIndex: -1, className: `w-full max-w-md rounded-xl bg-white p-6 shadow-xl focus:outline-none ${className}`.trim(), children: [_jsx("h2", { id: titleId, className: "text-lg font-semibold text-gray-900", children: title }), _jsx("div", { className: "mt-3 text-sm text-gray-700", children: children }), footer && _jsx("div", { className: "mt-6 flex justify-end gap-3", children: footer })] }) }), document.body);
}
