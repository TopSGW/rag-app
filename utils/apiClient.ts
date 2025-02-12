import { getApiUrl } from '../config/api';
import { getToken } from './tokenStorage';

interface ApiResponse<T = any> {
  data: T;
  status: number;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const apiUrl = getApiUrl();
  return fetch(`${apiUrl}${url}`, {
    ...options,
    headers,
  });
}

export async function get<T = any>(url: string): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url);
  const data = await response.json();
  return { data, status: response.status };
}

export async function post<T = any>(url: string, body: any): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { data, status: response.status };
}

export async function put<T = any>(url: string, body: any): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { data, status: response.status };
}

export async function del<T = any>(url: string): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  const data = await response.json();
  return { data, status: response.status };
}