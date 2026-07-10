import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared/lib/cn';
export function Section({ children, className, ...props }) {
    return (_jsx("section", { className: cn('py-12 md:py-20', className), ...props, children: children }));
}
