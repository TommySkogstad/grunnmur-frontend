import { createContext, useContext } from 'react'

/** @internal — brukt av useAnalytics og usePageView */
export interface AnalyticsContextValue {
  isEnabled: boolean
}

/** @internal */
export const AnalyticsContext = createContext<AnalyticsContextValue>({ isEnabled: false })

/** @internal */
export function useAnalyticsContext(): AnalyticsContextValue {
  return useContext(AnalyticsContext)
}
