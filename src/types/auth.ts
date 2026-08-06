import type { UserRole, UserStatus } from './api'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  phone?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
}
