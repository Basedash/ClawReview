import { useCallback, useEffect, useState } from 'react';
const STORAGE_KEY = 'clawreview-theme';
function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light')
        return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    else {
        document.documentElement.removeAttribute('data-theme');
    }
}
export function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    const toggle = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);
    return { theme, toggle };
}
