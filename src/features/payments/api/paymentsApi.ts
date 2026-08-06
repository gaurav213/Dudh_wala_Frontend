import { apiGetWithMeta } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Payment } from '../types/payment'

export interface PaymentListParams extends PaginatedParams {
  status?: string
  method?: string
  supplierId?: string
  customerId?: string
  from?: string
  to?: string
}

export const paymentsApi = {
  /** GET /payments */
  list(params: PaymentListParams) {
    return apiGetWithMeta<Payment[]>('/payments', params as Record<string, unknown>)
  },
}
