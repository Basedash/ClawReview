import { jsx as _jsx } from "react/jsx-runtime";
import { formatRelativeTime } from '../../lib/format.js';
export function Timestamp({ value }) {
    if (!value) {
        return _jsx("span", { children: "\u2014" });
    }
    return _jsx("time", { dateTime: value, children: formatRelativeTime(value) });
}
