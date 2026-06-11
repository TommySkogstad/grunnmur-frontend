import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useRef } from 'react';
const ToastContext = createContext(null);
/**
 * Tilbyr toast-varsler til hele komponenttreet.
 * Wrap rundt app-roten for å aktivere useToast-hook.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);
    const timerRef = useRef(new Map());
    const showToast = useCallback((message, type, durationMs = 4000) => {
        const id = ++idRef.current;
        const timerId = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timerRef.current.delete(id);
        }, durationMs);
        timerRef.current.set(id, timerId);
        setToasts(prev => [...prev, { id, message, type }]);
        return id;
    }, []);
    const removeToast = useCallback((id) => {
        const timerId = timerRef.current.get(id);
        if (timerId !== undefined) {
            clearTimeout(timerId);
            timerRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { showToast, removeToast }, children: [children, _jsx(ToastContainer, { toasts: toasts, onRemove: removeToast })] }));
}
/**
 * Returnerer showToast-funksjonen for å vise toast-varsler.
 * Må brukes innenfor en ToastProvider.
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-50 flex flex-col gap-2", "aria-live": "polite", "aria-atomic": "false", children: toasts.map(toast => (_jsx(ToastItemComponent, { toast: toast, onRemove: onRemove }, toast.id))) }));
}
function ToastItemComponent({ toast, onRemove }) {
    const iconBg = {
        success: 'bg-success-50',
        error: 'bg-danger-50',
        info: 'bg-primary-50',
    }[toast.type];
    const iconColor = {
        success: 'text-success-600',
        error: 'text-danger-600',
        info: 'text-primary-600',
    }[toast.type];
    return (_jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-200 animate-slide-in-right", role: "alert", children: [_jsxs("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`, children: [toast.type === 'success' && (_jsx("svg", { className: `h-4 w-4 ${iconColor}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })), toast.type === 'error' && (_jsx("svg", { className: `h-4 w-4 ${iconColor}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" }) })), toast.type === 'info' && (_jsx("svg", { className: `h-4 w-4 ${iconColor}`, fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" }) }))] }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: toast.message }), _jsx("button", { onClick: () => onRemove(toast.id), className: "p-1 text-gray-400 hover:text-gray-600", "aria-label": "Lukk", children: _jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })] }));
}
