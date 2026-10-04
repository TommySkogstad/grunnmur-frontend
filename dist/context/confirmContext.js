import { createContext, useContext } from 'react';
export const ConfirmContext = createContext(null);
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
export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return confirm;
}
