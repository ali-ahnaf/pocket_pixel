import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
export const PROFILE_STORAGE_KEY = 'pocket_pixel_profile';
const SIGN_IN_PATH = '/signin';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

/**
 * Handle an expired/invalid session. Clears the stored credentials so a stale
 * profile can no longer keep `userId` alive while the token is dead, then sends
 * the user to sign in. Guards against redirect loops and SSR.
 */
function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  if (window.location.pathname !== SIGN_IN_PATH) {
    window.location.href = SIGN_IN_PATH;
  }
}

export default class ApiClient {
  private axiosInstance: AxiosInstance;
  protected baseUrl: string;

  constructor(baseURL: string, baseConfig?: AxiosRequestConfig) {
    this.axiosInstance = axios.create({
      baseURL,
      ...baseConfig,
    });

    this.baseUrl = baseURL;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  private async request<T = any>(method: Method, url: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request({
        method,
        url,
        ...config,
        headers: {
          ...(config.headers ?? {}),
          ...(getStoredAuthToken() ? { Authorization: `Bearer ${getStoredAuthToken()}` } : {}),
        },
      });

      return response.data;
    } catch (error: any) {
      console.log('error', error);
      if (error.response?.status === 401) {
        handleUnauthorized();
      }
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          error.response.data = JSON.parse(text);
        } catch (e) {
          console.error('Error parsing blob error:', e);
        }
      }

      throw error.response?.data || error;
    }
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, { ...config, data });
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, { ...config, data });
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, { ...config, data });
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, config);
  }

  parseError(error: any): string {
    const errorData = error.response?.data;

    if (errorData?.message && Array.isArray(errorData.message)) {
      return errorData.message.join(', ');
    }

    if (errorData?.resultCode) {
      return errorData.message || 'Failed to make request';
    }

    if (error.response?.status) {
      return error.response?.statusText || 'Failed to make request';
    }

    return error.message || 'Failed to make request';
  }
}
