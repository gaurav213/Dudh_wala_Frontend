import { apiGet, apiPost } from '../../../lib/api/client'
import type { AuthUser, LoginRequest, LoginResponse } from '../../../types/auth'

export const authApi = {
  login(payload: LoginRequest) {
    return apiPost<LoginResponse>('/auth/login', payload)
  },
  profile() {
    return apiGet<AuthUser>('/auth/profile')
  },
  refresh(refreshToken: string) {
    return apiPost<{ accessToken: string; refreshToken?: string }>('/auth/refresh', {
      refreshToken,
    })
  },
  logout() {
    return apiPost<{ success: boolean }>('/auth/logout').catch(() => ({ success: true }))
  },
}
