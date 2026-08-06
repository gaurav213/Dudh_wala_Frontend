import { apiGet } from '../../../lib/api/client'
import type {
  DashboardGrowthPoint,
  DashboardRevenuePoint,
  DashboardSummary,
  FailedSync,
  RecentRegistration,
} from '../types/dashboard'

export const dashboardApi = {
  summary() {
    return apiGet<DashboardSummary>('/dashboard/admin/summary')
  },
  growth() {
    return apiGet<DashboardGrowthPoint[]>('/dashboard/admin/growth')
  },
  revenue() {
    return apiGet<DashboardRevenuePoint[]>('/dashboard/admin/revenue')
  },
  recentRegistrations() {
    return apiGet<RecentRegistration[]>('/dashboard/admin/recent-registrations')
  },
  failedSyncs() {
    return apiGet<FailedSync[]>('/dashboard/admin/failed-syncs')
  },
}
