'use client';

import { useCallback } from 'react';

// In prod the API serves the UI from the same origin, so a relative `/api` works.
// In dev the API is cross-origin (port 4000), addressed via NEXT_PUBLIC_API_URL.
const GOOGLE_AUTH_START_URL = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/auth/google`;

export default function GoogleSignInButton() {
  const handleClick = useCallback(() => {
    // Full-page navigation: the API redirects on to Google's consent screen,
    // then back to /auth/google/callback with the minted token.
    window.location.href = GOOGLE_AUTH_START_URL;
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        w-full relative flex items-center justify-center gap-3 py-3 px-4
        bg-white border-4 border-black
        shadow-[4px_4px_0_0_rgba(0,0,0,1)]
        hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-75 cursor-pointer select-nones
        group
      "
    >
      {/* Google SVG logo */}
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>

      <span className="font-anybody font-extrabold text-[13px] tracking-wider uppercase text-gray-900 group-hover:text-gray-700 transition-colors">Login with Google</span>
    </button>
  );
}
