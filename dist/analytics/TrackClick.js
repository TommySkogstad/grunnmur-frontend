import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * TrackClick — deklarativ wrapper som sporer klikk på barnelementet.
 *
 * @example
 * ```tsx
 * <TrackClick event="cta.opprett-mote">
 *   <Button>Opprett møte</Button>
 * </TrackClick>
 * ```
 */
import { cloneElement, isValidElement } from 'react';
import { useAnalytics } from './useAnalytics';
/**
 * Injiserer trackEvent i barnelementets onClick-handler.
 * Er barnelementet ikke et React-element, rendres det uten sporing.
 */
export function TrackClick({ event, data, children }) {
    const { trackEvent } = useAnalytics();
    if (!isValidElement(children))
        return _jsx(_Fragment, { children: children });
    const child = children;
    const originalOnClick = child.props.onClick;
    return cloneElement(child, {
        onClick: (e) => {
            trackEvent(event, data);
            originalOnClick?.(e);
        },
    });
}
