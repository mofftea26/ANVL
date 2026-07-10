import { type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes } from 'react';
/**
 * Canonical button — the only button primitive storefront/admin surfaces
 * should reach for. `density="compact"` renders admin's dense pill-chip
 * proportions; `density="comfortable"` (default) renders the storefront's
 * gradient pill. Same variant colors/tokens either way — only shape/sizing
 * changes, so admin and storefront share one visual language.
 */
export declare const buttonVariants: (props?: ({
    variant?: "success" | "primary" | "secondary" | "ghost" | "destructive" | null | undefined;
    size?: "sm" | "md" | "lg" | "icon" | null | undefined;
    density?: "comfortable" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
    /** Shows an inline spinner and disables interaction. */
    loading?: boolean;
};
export declare const Button: import("react").ForwardRefExoticComponent<ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<(props?: ({
    variant?: "success" | "primary" | "secondary" | "ghost" | "destructive" | null | undefined;
    size?: "sm" | "md" | "lg" | "icon" | null | undefined;
    density?: "comfortable" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string> & {
    /** Shows an inline spinner and disables interaction. */
    loading?: boolean;
} & import("react").RefAttributes<HTMLButtonElement>>;
