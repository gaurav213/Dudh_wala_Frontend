import { apiClient, apiGet, apiPost, ensureRefresh } from '../../../lib/api/client'
import { tokenStore } from '../../../lib/auth/tokenStore'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  RegisterCustomerRequest,
  RegisterFarmOwnerRequest,
} from '../../../types/auth'

export const authApi = {
  login(payload: LoginRequest) {
    return apiPost<LoginResponse>('/auth/login', payload)
  },
  registerFarmOwner(payload: RegisterFarmOwnerRequest) {
    return apiPost<LoginResponse>('/auth/register/farm-owner', payload)
  },
  registerCustomer(payload: RegisterCustomerRequest) {
    return apiPost<LoginResponse>('/auth/register/customer', payload)
  },
  profile() {
    return apiGet<ProfileResponse>('/auth/profile')
  },
  async uploadAvatar(photo: File) {
    const form = new FormData()
    form.append('photo', photo)
    const { data } = await apiClient.post<{ data: { user: AuthUser } }>(
      '/auth/profile/avatar',
      form,
      { headers: { 'Content-Type': undefined } },
    )
    return data.data.user
  },
  async refresh(_refreshToken?: string) {
    // Use bare refresh client (no interceptors) to avoid 401 retry loops.
    const accessToken = await ensureRefresh()
    if (!accessToken) throw new Error('Refresh failed')
    return {
      accessToken,
      refreshToken: tokenStore.getRefreshToken() ?? undefined,
    }
  },
  logout() {
    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) return Promise.resolve({ success: true })
    return apiPost<{ success: boolean }>('/auth/logout', { refreshToken }).catch(() => ({
      success: true,
    }))
  },
}
