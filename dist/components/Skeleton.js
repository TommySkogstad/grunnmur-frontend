import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const block = 'animate-pulse motion-reduce:animate-none rounded bg-gray-200';
/** Plassholdere for innhold som lastes. */
export function Skeleton({ variant = 'line', count = 1, columns = 4, label = 'Laster', className = '', }) {
    const items = Array.from({ length: Math.max(0, count) }, (_, i) => i);
    return (_jsx("div", { role: "status", "aria-busy": "true", "aria-label": label, className: `space-y-3 ${className}`.trim(), children: items.map(i => {
            if (variant === 'table-row') {
                return (_jsx("div", { "data-skeleton": "table-row", "aria-hidden": "true", className: "flex gap-4", children: Array.from({ length: Math.max(1, columns) }, (_, c) => (_jsx("div", { "data-skeleton": "cell", className: `${block} h-4 flex-1` }, c))) }, i));
            }
            if (variant === 'card') {
                return (_jsxs("div", { "data-skeleton": "card", "aria-hidden": "true", className: "space-y-3 rounded-lg border border-gray-200 p-4", children: [_jsx("div", { "data-skeleton": "block", className: `${block} h-5 w-1/3` }), _jsx("div", { "data-skeleton": "block", className: `${block} h-4 w-full` }), _jsx("div", { "data-skeleton": "block", className: `${block} h-4 w-5/6` })] }, i));
            }
            return _jsx("div", { "data-skeleton": "line", "aria-hidden": "true", className: `${block} h-4 w-full` }, i);
        }) }));
}
