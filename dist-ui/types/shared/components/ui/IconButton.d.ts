import { type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
/**
 * Square icon button. `size="md"` (default) is 44 × 44 px to meet WCAG 2.5.5
 * Target Size on touch surfaces (RESP-05) — always use it on the storefront
 * for any control that could be a primary touch target. `size="sm"` (36 × 36)
 * is for mouse-driven, densely packed chrome: admin topbars/toolbars, or
 * desktop-only hover-reveal overlay controls (gallery arrows, zoom) that
 * never appear as someone's only way to reach an action on touch.
 */
declare const iconButtonClass: (props?: ({
    size?: "sm" | "md" | null | undefined;
    variant?: "default" | "ghost" | "overlay" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof iconButtonClass>;
export declare function IconButton({ className, type, size, variant, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
