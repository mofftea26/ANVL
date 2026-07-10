import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef, } from 'react';
import { cn } from '@/shared/lib/cn';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
/**
 * Accessible slide-in panel: same focus and keyboard behavior as `Modal`.
 */
export function Drawer({ open, onClose, children, className, placement = 'right', title, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, }) {
    const panelRef = useRef(null);
    const generatedTitleId = useId();
    const isBottom = placement === 'bottom';
    const isLeft = placement === 'left';
    const hasTitle = title != null && title !== '';
    useDialogFocusTrap({ open, panelRef, onClose });
    if (!open)
        return null;
    const labelledByProp = ariaLabelledBy && ariaLabelledBy.trim() ? ariaLabelledBy.trim() : undefined;
    const titleHeadingId = hasTitle ? generatedTitleId : undefined;
    const panelMotionClass = isBottom
        ? 'anvl-drawer-panel-bottom'
        : isLeft
            ? 'anvl-drawer-panel-left'
            : 'anvl-drawer-panel-right';
    return (_jsxs("div", { className: "fixed inset-0 z-50", children: [_jsx("div", { className: "anvl-drawer-backdrop absolute inset-0 cursor-pointer bg-black/70", onClick: () => onClose(), "aria-hidden": "true" }), _jsxs("aside", { ref: panelRef, tabIndex: -1, className: cn('absolute flex min-h-0 flex-col border-[var(--color-line)] bg-[var(--color-surface)] p-6 outline-none', panelMotionClass, isBottom
                    ? 'bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t'
                    : isLeft
                        ? 'left-0 top-0 h-[100dvh] max-h-[100dvh] w-[88%] max-w-sm overflow-y-auto border-r border-l-0'
                        : 'right-0 top-0 h-full max-h-[100dvh] w-[88%] max-w-sm overflow-y-auto border-l', className), role: "dialog", "aria-modal": "true", "aria-label": labelledByProp || hasTitle ? undefined : ariaLabel?.trim() || 'Panel', "aria-labelledby": labelledByProp ?? titleHeadingId, children: [hasTitle ? (_jsx("h2", { id: titleHeadingId, className: "anvl-heading mb-4 shrink-0 text-2xl", children: title })) : null, _jsx("div", { className: cn('flex min-h-0 flex-1 flex-col', isBottom && 'pb-2'), children: children })] })] }));
}
