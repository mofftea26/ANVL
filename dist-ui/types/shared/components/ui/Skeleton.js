import { jsx as _jsx } from "react/jsx-runtime";
export function Skeleton({ className }) {
    return _jsx("div", { className: `animate-pulse rounded-md bg-[var(--color-surface-elevated)] ${className ?? ''}` });
}
