import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const primaryClasses = 'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700';
const secondaryClasses = 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';
/** Viser at en liste eller side er tom, med forklaring og neste steg. */
export function EmptyState({ icon, title, description, actions = [], headingLevel = 2, className = '', }) {
    const Heading = `h${headingLevel}`;
    return (_jsxs("div", { className: `flex flex-col items-center justify-center px-4 py-12 text-center ${className}`.trim(), children: [icon && (_jsx("div", { "aria-hidden": "true", className: "mb-4 text-gray-400", children: icon })), _jsx(Heading, { className: "text-lg font-semibold text-gray-900", children: title }), description && _jsx("p", { className: "mt-2 max-w-md text-sm text-gray-600", children: description }), actions.length > 0 && (_jsx("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: actions.slice(0, 2).map((action, i) => {
                    const classes = i === 0 ? primaryClasses : secondaryClasses;
                    return action.href !== undefined ? (_jsx("a", { href: action.href, onClick: action.onClick, className: classes, children: action.label }, `${i}-${action.label}`)) : (_jsx("button", { type: "button", onClick: action.onClick, className: classes, children: action.label }, `${i}-${action.label}`));
                }) }))] }));
}
