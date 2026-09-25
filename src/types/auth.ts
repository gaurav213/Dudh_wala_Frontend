import type { UserRole, UserStatus } from './api'

export interface AuthUser {
  id: string
  name: string
  mobileNumber: string
  email?: string | null
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
  preferredLanguage?: string | null
  timezone?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  mobileNumber: string
  password: string
  deviceId?: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface ProfileResponse {
  user: AuthUser
  supplierProfile?: unknown
  farms?: unknown[]
}

export interface RegisterFarmOwnerRequest {
  name: string
  mobileNumber: string
  password: string
  farmName: string
  addressLine1: string
  area: string
  city: string
  state: string
  postalCode: string
  businessName?: string
  email?: string
  addressLine2?: string
  description?: string
}

export interface RegisterCustomerRequest {
  name: string
  mobileNumber: string
  password: string
}
