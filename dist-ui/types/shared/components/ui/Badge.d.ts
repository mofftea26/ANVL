import { type VariantProps } from 'class-variance-authority';
import type { PropsWithChildren } from 'react';
/** Status/label pill. Absorbs the retired admin-only AdminStatusBadge's 7-tone set. */
export declare const badgeVariants: (props?: ({
    tone?: "neutral" | "live" | "scheduled" | "archived" | "success" | "danger" | "accent" | null | undefined;
    size?: "sm" | "default" | "chip" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type BadgeProps = PropsWithChildren<VariantProps<typeof badgeVariants> & {
    className?: string;
}>;
export declare function Badge({ children, tone, size, className }: BadgeProps): import("react/jsx-runtime").JSX.Element;
