import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export interface ForwardResponse<T = any> {
  resultCode: number;
  message: string;
  data?: T;
}

export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
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

  private async request<T = any>(method: Method, url: string, config: AxiosRequestConfig = {}): Promise<ForwardResponse<T>> {
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

      const raw = response.data as any;
      if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'resultCode' in raw) {
        return raw as ForwardResponse<T>;
      }
      return { resultCode: response.status, message: 'Success', data: raw as T };
    } catch (error: any) {
      console.log('error', error);
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          error.response.data = JSON.parse(text);
        } catch (e) {
          console.error('Error parsing blob error:', e);
        }
      }

      const errorData = error.response?.data;
      return {
        resultCode: errorData?.resultCode || error.response?.status || 500,
        message: this.parseError(error),
        data: errorData?.data,
      };
    }
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ForwardResponse<T>> {
    return this.request<T>('GET', url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ForwardResponse<T>> {
    return this.request<T>('POST', url, { ...config, data });
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ForwardResponse<T>> {
    return this.request<T>('PUT', url, { ...config, data });
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ForwardResponse<T>> {
    return this.request<T>('PATCH', url, { ...config, data });
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ForwardResponse<T>> {
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
