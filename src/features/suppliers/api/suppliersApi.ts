import { apiGet, apiGetWithMeta, apiPatch } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { Supplier, SupplierDetail } from '../types/supplier'

export interface SupplierListParams extends PaginatedParams {
  status?: string
}

export const suppliersApi = {
  /** GET /suppliers — admin supplier list */
  list(params: SupplierListParams) {
    return apiGetWithMeta<Supplier[]>('/suppliers', params as Record<string, unknown>)
  },
  get(id: string) {
    return apiGet<SupplierDetail>(`/suppliers/${id}`)
  },
  activate(id: string) {
    return apiPatch<Supplier>(`/suppliers/${id}/activate`)
  },
  block(id: string) {
    return apiPatch<Supplier>(`/suppliers/${id}/block`)
  },
}
