import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export const PROFILE_STORAGE_KEY = 'pocket_pixel_profile';
const SIGN_IN_PATH = '/signin';

function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  const current = window.location.pathname.replace(/\/$/, '');
  if (current !== SIGN_IN_PATH) {
    try {
      import('next/navigation')
        .then(({ useRouter: _unused, ...mod }) => {
          window.location.href = SIGN_IN_PATH;
        })
        .catch(() => {
          window.location.href = SIGN_IN_PATH;
        });
    } catch {
      window.location.href = SIGN_IN_PATH;
    }
  }
}

export default class ApiClient {
  private axiosInstance: AxiosInstance;
  protected baseUrl: string;

  constructor(baseURL: string, baseConfig?: AxiosRequestConfig) {
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
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
