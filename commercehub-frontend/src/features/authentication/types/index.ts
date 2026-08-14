export type UserRole = 'CUSTOMER' | 'ADMIN' | 'WAREHOUSE' | 'SUPPORT' | 'SYSTEM_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  roles: UserRole[];
  emailVerified: boolean;
  createdAt: string;
}

export interface UserSummaryResponse {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
}

export interface AddressResponse {
  id: string;
  label: string | null;
  streetLine1: string;
  streetLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequestDto {
  email: string;
}

export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface CreateAddressRequest {
  label?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  isDefault?: boolean;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}
