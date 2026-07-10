import * as SelectPrimitive from '@radix-ui/react-select';
import { type VariantProps } from 'class-variance-authority';
import { type ReactNode } from 'react';
declare const selectTriggerClass: (props?: ({
    density?: "comfortable" | "compact" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type SelectDensity = VariantProps<typeof selectTriggerClass>['density'];
/**
 * Modern, fully custom dropdown (Radix UI primitive under the hood — native
 * `<select>` options can't be styled cross-browser). `density="comfortable"`
 * (default) matches {@link Input}'s touch-friendly chrome; `density="compact"`
 * is admin's dense utility chrome. Controlled: pass `value` + `onValueChange`,
 * and `SelectItem`s as children.
 */
export declare function Select({ value, defaultValue, onValueChange, placeholder, disabled, id, name, density, className, children, valueLabel, 'aria-label': ariaLabel, }: {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    density?: SelectDensity;
    className?: string;
    children: ReactNode;
    /** Overrides the closed trigger's displayed content (default: Radix clones the selected item's own content, which can be too rich for a single-line trigger — e.g. an item with a description). */
    valueLabel?: ReactNode;
    'aria-label'?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare const SelectItem: import("react").ForwardRefExoticComponent<Omit<SelectPrimitive.SelectItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    density?: SelectDensity;
} & import("react").RefAttributes<HTMLDivElement>>;
export {};
