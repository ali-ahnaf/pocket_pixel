import AuthApi from './AuthApi';
import ProfileApi from './ProfileApi';

// In production the API serves the UI static export from the same origin, so a
// relative `/api` is correct. In dev the UI (Next, port 3000) and API (port 4000)
// are cross-origin, so NEXT_PUBLIC_API_URL points at the API. Note: NEXT_PUBLIC_*
// vars are inlined at build time, not read at runtime on the server.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const apiUrl = `${apiBaseUrl}/api`;

export const authApi = new AuthApi(apiUrl);
export const profileApi = new ProfileApi(apiUrl);
