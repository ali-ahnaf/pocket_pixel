'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker (/sw.js) on the client.
 * Required for the app to be installable as a PWA on Android/Chrome.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    };

    // Register after load so it never competes with first paint.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
