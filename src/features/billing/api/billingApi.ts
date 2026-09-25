import { apiGet, apiGetWithMeta, apiPost } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Bill, BillDetail, OutstandingRow } from '../types/billing'

export interface BillListParams extends PaginatedParams {
  status?: string
  customerId?: string
  /** YYYY-MM or YYYY-MM-01 — matches backend ListBillsDto */
  billingMonth?: string
}

function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

export const billingApi = {
  /** GET /bills — only send fields ListBillsDto allows (forbidNonWhitelisted). */
  list(params: BillListParams) {
    return apiGetWithMeta<Bill[]>('/bills', cleanParams(params as Record<string, unknown>))
  },
  get(id: string) {
    return apiGet<BillDetail>(`/bills/${id}`)
  },
  /** POST /bills/generate — create or refresh month bill from delivered milk. */
  generate(payload: { customerId: string; billingMonth: string }) {
    return apiPost<BillDetail>('/bills/generate', payload)
  },
  /** GET /bills/outstanding */
  outstanding(params: PaginatedParams & { supplierId?: string }) {
    return apiGetWithMeta<OutstandingRow[]>(
      '/bills/outstanding',
      cleanParams(params as Record<string, unknown>),
    )
  },
}
