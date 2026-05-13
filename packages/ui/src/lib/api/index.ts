import AuthApi from './AuthApi';
import ProfileApi from './ProfileApi';

const apiUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api`;

export const authApi = new AuthApi(apiUrl);
export const profileApi = new ProfileApi(apiUrl);
