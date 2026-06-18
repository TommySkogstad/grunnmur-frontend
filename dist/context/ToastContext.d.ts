import type { ReactNode } from 'react';
/**
 * Tilbyr toast-varsler til hele komponenttreet.
 * Wrap rundt app-roten for å aktivere useToast-hook.
 */
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
