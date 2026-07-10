/**
 * Modern toggle switch. Controlled. Accessible (role=switch + aria-checked).
 * Use for boolean preferences instead of a bare checkbox.
 */
export declare function Switch({ checked, onChange, label, description, id, }: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    description?: string;
    id?: string;
}): import("react/jsx-runtime").JSX.Element;
