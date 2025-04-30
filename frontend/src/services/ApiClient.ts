import { RequestOptions, ApiClientError } from "../types";

export class ApiClient {
  private static sanitizeRequestData(data: any): any {
    if (data === null || data === undefined || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeRequestData(item));
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        sanitized[key] = null;
        continue;
      }

      // Recursively sanitize nested objects and arrays
      if (typeof value === "object") {
        sanitized[key] = this.sanitizeRequestData(value);
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  static async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const sanitizedBody = body ? this.sanitizeRequestData(body) : undefined;

    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
    };

    try {
      console.log(
        `${method} request to ${url}`,
        sanitizedBody
          ? {
              bodyPreview:
                typeof sanitizedBody === "object"
                  ? "Object with keys: " + Object.keys(sanitizedBody).join(", ")
                  : typeof sanitizedBody,
            }
          : "No body",
      );

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const error = new Error(`HTTP Error: ${response.status}`) as ApiClientError;
        error.statusCode = response.status;
        error.response = response;
        throw error;
      }

      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {} as T;
      }

      const data = await response.json();
      console.log(`Response from ${url}:`, data ? { previewType: typeof data } : "No data");
      return data as T;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  static get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "GET", headers });
  }

  static post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "POST", body, headers });
  }

  static put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "PUT", body, headers });
  }

  static delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "DELETE", headers });
  }

  static patch<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: "PATCH", body, headers });
  }
}
