import { apiGet, apiGetWithMeta, apiPost } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Farm, FarmStatus } from '../../farm/types/farm'

export interface AdminFarmListParams extends PaginatedParams {
  status?: FarmStatus | string
  city?: string
  postalCode?: string
}

export interface FarmDecisionPayload {
  notes?: string
}

export const adminFarmsApi = {
  /** GET /admin/farms — platform-owner farm list */
  list(params: AdminFarmListParams) {
    return apiGetWithMeta<Farm[]>('/admin/farms', params as Record<string, unknown>)
  },
  get(id: string) {
    return apiGet<Farm>(`/admin/farms/${id}`)
  },
  approve(id: string, body?: FarmDecisionPayload) {
    return apiPost<Farm>(`/admin/farms/${id}/approve`, body ?? {})
  },
  reject(id: string, body?: FarmDecisionPayload) {
    return apiPost<Farm>(`/admin/farms/${id}/reject`, body ?? {})
  },
  suspend(id: string, body?: FarmDecisionPayload) {
    return apiPost<Farm>(`/admin/farms/${id}/suspend`, body ?? {})
  },
  reactivate(id: string, body?: FarmDecisionPayload) {
    return apiPost<Farm>(`/admin/farms/${id}/reactivate`, body ?? {})
  },
}
