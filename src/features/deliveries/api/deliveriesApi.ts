import { apiGetWithMeta } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { DeliveryReportRow } from '../types/delivery'

export interface DeliveryReportParams extends PaginatedParams {
  from?: string
  to?: string
  supplierId?: string
  customerId?: string
  status?: string
}

export const deliveriesApi = {
  /** GET /deliveries/report */
  report(params: DeliveryReportParams) {
    return apiGetWithMeta<DeliveryReportRow[]>('/deliveries/report', params as Record<string, unknown>)
  },
}
