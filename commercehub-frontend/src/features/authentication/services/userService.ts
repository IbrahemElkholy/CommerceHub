import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserResponse,
  UserSummaryResponse,
} from '../types';

export const userService = {
  getMe: async (accessToken?: string): Promise<UserResponse> => {
    const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me', config);
    return response.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/users/me/change-password', data);
  },

  assignRole: async (id: string, role: string): Promise<UserResponse> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>(`/users/${id}/roles`, { role });
    return response.data.data;
  },

  removeRole: async (id: string, role: string): Promise<UserResponse> => {
    const response = await apiClient.delete<ApiResponse<UserResponse>>(`/users/${id}/roles`, { data: { role } });
    return response.data.data;
  },

  updateMe: async (data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>('/users/me', data);
    return response.data.data;
  },

  getUserById: async (id: string): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
    return response.data.data;
  },

  listUsers: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<UserSummaryResponse>> => {
    const response = await apiClient.get<PaginatedResponse<UserSummaryResponse>>('/users', {
      params,
    });
    return response.data;
  },

  updateUserStatus: async (id: string, data: UpdateUserStatusRequest): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>(
      `/users/${id}/status`,
      data,
    );
    return response.data.data;
  },

  getAddresses: async (): Promise<AddressResponse[]> => {
    const response = await apiClient.get<ApiResponse<AddressResponse[]>>('/users/me/addresses');
    return response.data.data;
  },

  addAddress: async (data: CreateAddressRequest): Promise<AddressResponse> => {
    const response = await apiClient.post<ApiResponse<AddressResponse>>(
      '/users/me/addresses',
      data,
    );
    return response.data.data;
  },

  updateAddress: async (id: string, data: UpdateAddressRequest): Promise<AddressResponse> => {
    const response = await apiClient.put<ApiResponse<AddressResponse>>(
      `/users/me/addresses/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/me/addresses/${id}`);
  },
};
