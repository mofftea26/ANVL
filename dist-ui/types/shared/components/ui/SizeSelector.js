import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function SizeSelector({ sizes, value, disabledSizes, onChange, }) {
    return (_jsx("div", { className: "flex flex-wrap gap-2", role: "listbox", "aria-label": "Size", children: sizes.map((size) => {
            const disabled = disabledSizes?.has(size) ?? false;
            return (_jsx("button", { type: "button", role: "option", "aria-selected": value === size, "aria-disabled": disabled, disabled: disabled, onClick: () => {
                    if (!disabled)
                        onChange(size);
                }, className: cn('focus-ring rounded-md border px-3 py-2 text-sm font-semibold', disabled &&
                    'cursor-not-allowed border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)] line-through opacity-60', !disabled && value === size
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]'
                    : !disabled &&
                        'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)]'), children: size }, size));
        }) }));
}
