/** @internal — brukt av useAnalytics og usePageView */
export interface AnalyticsContextValue {
    isEnabled: boolean;
}
/** @internal */
export declare const AnalyticsContext: import("react").Context<AnalyticsContextValue>;
/** @internal */
export declare function useAnalyticsContext(): AnalyticsContextValue;
