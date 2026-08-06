import { apiGet, apiGetWithMeta } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Bill, BillDetail, OutstandingRow } from '../types/billing'

export interface BillListParams extends PaginatedParams {
  status?: string
  supplierId?: string
  customerId?: string
  from?: string
  to?: string
}

export const billingApi = {
  /** GET /bills */
  list(params: BillListParams) {
    return apiGetWithMeta<Bill[]>('/bills', params as Record<string, unknown>)
  },
  get(id: string) {
    return apiGet<BillDetail>(`/bills/${id}`)
  },
  /** GET /bills/outstanding */
  outstanding(params: PaginatedParams & { supplierId?: string }) {
    return apiGetWithMeta<OutstandingRow[]>('/bills/outstanding', params as Record<string, unknown>)
  },
}
