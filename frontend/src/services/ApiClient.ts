type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

interface ApiClientError extends Error {
  statusCode?: number;
  response?: Response;
}

export class ApiClient {
  static async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };
    
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const error = new Error(`HTTP Error: ${response.status}`) as ApiClientError;
        error.statusCode = response.status;
        error.response = response;
        throw error;
      }
      
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
  
  static get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  }
  
  static post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }
  
  static put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  static delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  static patch<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body, headers });
  }
}