import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ConfirmContext } from './confirmContext';
/**
 * Tilbyr useConfirm til hele komponenttreet og rendrer dialogen.
 * Wrap rundt app-roten, innenfor eller utenfor ToastProvider.
 */
export function ConfirmProvider({ children }) {
    const [pending, setPending] = useState(null);
    const pendingRef = useRef(null);
    const settle = useCallback((value) => {
        const current = pendingRef.current;
        pendingRef.current = null;
        setPending(null);
        current?.resolve(value);
    }, []);
    const confirm = useCallback(options => new Promise(resolve => {
        // En ny bekreftelse avbryter en som allerede er åpen
        pendingRef.current?.resolve(false);
        const next = { options: typeof options === 'string' ? { message: options } : options, resolve };
        pendingRef.current = next;
        setPending(next);
    }), []);
    useEffect(() => () => {
        pendingRef.current?.resolve(false);
        pendingRef.current = null;
    }, []);
    const options = pending?.options;
    return (_jsxs(ConfirmContext.Provider, { value: confirm, children: [children, _jsx(ConfirmDialog, { open: pending !== null, title: options?.title ?? 'Bekreft', confirmLabel: options?.confirmLabel, cancelLabel: options?.cancelLabel, variant: options?.variant, onConfirm: () => settle(true), onCancel: () => settle(false), children: options?.message })] }));
}
