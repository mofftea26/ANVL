/**
 * Quantity stepper. Uses md-size buttons (h-10) on touch surfaces so the
 * decrement / increment targets meet WCAG 2.5.5 (RESP-05).
 */
export declare function QuantityStepper({ value, onChange, }: {
    value: number;
    onChange: (value: number) => void;
}): import("react/jsx-runtime").JSX.Element;
