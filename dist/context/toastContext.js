import { createContext, useContext } from 'react';
export const ToastContext = createContext(null);
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
