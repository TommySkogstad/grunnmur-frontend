import { createContext, useContext } from 'react';
/** @internal */
export const AnalyticsContext = createContext({ isEnabled: false });
/** @internal */
export function useAnalyticsContext() {
    return useContext(AnalyticsContext);
}
