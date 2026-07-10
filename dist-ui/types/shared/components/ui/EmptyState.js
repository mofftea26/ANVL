import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnvlCompactMark } from '@/shared/assets/brand';
import { Button } from './Button';
export function EmptyState({ title, description, actionLabel, onAction, }) {
    return (_jsxs("article", { className: "relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center", children: [_jsx(AnvlCompactMark, { "aria-hidden": "true", className: "pointer-events-none absolute -right-8 -top-8 h-40 w-auto text-[var(--color-heading)] opacity-[0.04] md:h-48" }), _jsxs("div", { className: "relative", children: [_jsx(AnvlCompactMark, { className: "mx-auto h-12 w-auto text-[var(--color-text-muted)] opacity-50" }), _jsx("h2", { className: "anvl-heading mt-4 text-3xl", children: title }), _jsx("p", { className: "mt-2 text-sm text-[var(--color-text-muted)]", children: description }), _jsx(Button, { className: "mt-5", onClick: onAction, children: actionLabel })] })] }));
}
