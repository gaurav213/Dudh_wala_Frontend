import { apiGet, apiGetWithMeta } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Customer, CustomerDetail } from '../types/customer'

export interface CustomerListParams extends PaginatedParams {
  status?: string
  supplierId?: string
}

export const customersApi = {
  /** GET /customers */
  list(params: CustomerListParams) {
    return apiGetWithMeta<Customer[]>('/customers', params as Record<string, unknown>)
  },
  get(id: string) {
    return apiGet<CustomerDetail>(`/customers/${id}`)
  },
}
