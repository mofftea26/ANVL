import { type PropsWithChildren, type ReactNode } from 'react';
export type DrawerAriaProps = {
    'aria-labelledby'?: string;
    'aria-label'?: string;
};
export type DrawerProps = PropsWithChildren<{
    open: boolean;
    onClose: () => void;
    className?: string;
    placement?: 'left' | 'right' | 'bottom';
    title?: ReactNode;
} & DrawerAriaProps>;
/**
 * Accessible slide-in panel: same focus and keyboard behavior as `Modal`.
 */
export declare function Drawer({ open, onClose, children, className, placement, title, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, }: DrawerProps): import("react/jsx-runtime").JSX.Element | null;
