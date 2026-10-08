// Defensive safeguard: Ensure window.fetch is writable and cannot throw getter-only error in sandboxed iframes
if (typeof window !== 'undefined') {
  try {
    let currentFetch = window.fetch;
    if (typeof Window !== 'undefined' && Window.prototype) {
      const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
      if (protoDesc && protoDesc.get && !protoDesc.set) {
        Object.defineProperty(Window.prototype, 'fetch', {
          get: protoDesc.get,
          set(val) {
            Object.defineProperty(this, 'fetch', {
              value: val,
              writable: true,
              configurable: true,
              enumerable: true,
            });
          },
          configurable: true,
          enumerable: true,
        });
      }
    }
    if (typeof currentFetch === 'function') {
      Object.defineProperty(window, 'fetch', {
        get() {
          return currentFetch;
        },
        set(val) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true,
      });
    }
  } catch (_) {}
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
