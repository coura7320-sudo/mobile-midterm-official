import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { secureStorage } from '../utils/secureStorage';

const BACKEND_PORT = 4000;

/**
 * Resolves the appropriate backend base URL across physical devices (Expo Go LAN host),
 * Android Emulator (10.0.2.2), iOS Simulator (localhost), and Web.
 */
export function getBackendBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const lanHost = hostUri.split(':')[0];
    if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
      return `http://${lanHost}:${BACKEND_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string>
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authenticated?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, authenticated = true, headers, ...rest } = options;
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (authenticated) {
    const token = await secureStorage.getToken();
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiClientError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.errors
    );
  }

  return data as T;
}
