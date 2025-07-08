// Data Transfer Objects for API requests/responses

import type { User } from './types.d'

// For user registration
export interface RegisterRequest {
  email?: string;
  password?: string;
}

// For user login
export interface LoginRequest {
  email?: string;
  password?: string;
  deviceName?: string;
}

// Publicly viewable user data (excluding password)
export type UserPublic = Omit<User, 'password'>;

// Response for successful login or user fetch
export interface AuthUserResponse {
  user: UserPublic;
}

// Response for successful login (includes token)
export interface LoginResponse extends AuthUserResponse {
  token: string;
  message?: string;
}

// Response for successful registration
export interface RegisterResponse {
  user: UserPublic;
  message?: string;
}

// Generic message response
export interface MessageResponse {
  message: string;
}
