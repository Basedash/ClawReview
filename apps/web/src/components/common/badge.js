import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
export function Badge({ children, tone = 'default' }) {
    return (_jsx("span", { className: clsx('badge', {
            'badge-success': tone === 'success',
            'badge-danger': tone === 'danger',
            'badge-warning': tone === 'warning',
            'badge-muted': tone === 'muted' || tone === 'neutral',
        }), children: children }));
}
