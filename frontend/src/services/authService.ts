import { apiRequest } from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
      authenticated: false,
    }),

  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
      authenticated: false,
    }),

  getMe: () =>
    apiRequest<{ success: boolean; user: User }>('/api/auth/me', {
      method: 'GET',
      authenticated: true,
    }),

  updateProfile: (payload: Partial<Pick<User, 'fullName' | 'about' | 'avatarUrl'>>) =>
    apiRequest<{ success: boolean; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: payload,
      authenticated: true,
    }),
};
