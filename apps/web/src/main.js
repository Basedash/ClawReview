import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/tokens.css';
import './styles/globals.css';
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Failed to find root element.');
}
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
