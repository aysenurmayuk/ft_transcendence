import type { AuthResponse, ErrorResponse } from './types.js';

/**
 * API client for authentication endpoints
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new ApiError(
      error.error || 'Request failed',
      response.status,
      error.details
    );
  }

  return data as T;
}

export async function register(
  username: string,
  password: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await fetchApi<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/me', {
    method: 'GET',
  });
}

export { ApiError };
