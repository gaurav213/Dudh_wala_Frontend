import { apiGetWithMeta } from '../../../lib/api/client'
import type { PaginatedParams } from '../../../types/api'
import type { AuditLog } from '../types/audit'

export interface AuditListParams extends PaginatedParams {
  action?: string
  entityType?: string
  actorId?: string
  from?: string
  to?: string
}

export const auditApi = {
  /** GET /audit-logs — read-only */
  list(params: AuditListParams) {
    return apiGetWithMeta<AuditLog[]>('/audit-logs', params as Record<string, unknown>)
  },
}
