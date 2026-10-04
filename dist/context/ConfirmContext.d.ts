import type { ReactNode } from 'react';
/**
 * Tilbyr useConfirm til hele komponenttreet og rendrer dialogen.
 * Wrap rundt app-roten, innenfor eller utenfor ToastProvider.
 */
export declare function ConfirmProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
