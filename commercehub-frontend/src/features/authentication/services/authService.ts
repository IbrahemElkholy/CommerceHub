import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type {
  AuthResponse,
  LoginRequest,
  PasswordResetDto,
  PasswordResetRequestDto,
  RefreshTokenRequest,
  RegisterRequest,
} from '../types';

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  refresh: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', data);
    return response.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  requestPasswordReset: async (data: PasswordResetRequestDto): Promise<void> => {
    await apiClient.post('/auth/password-reset/request', data);
  },

  resetPassword: async (data: PasswordResetDto): Promise<void> => {
    await apiClient.post('/auth/password-reset/confirm', data);
  },
};
