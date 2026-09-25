import { apiGet } from '../../../lib/api/client'
import type {
  DashboardGrowthPoint,
  DashboardRevenuePoint,
  DashboardSummary,
  FarmOwnerMonthSummary,
  FarmOwnerTodaySummary,
} from '../types/dashboard'

export const dashboardApi = {
  async summary() {
    return apiGet<DashboardSummary>('/dashboard/admin/summary')
  },
  async growth() {
    const data = await apiGet<{ supplierGrowth: Array<{ month: string; count: string }> }>(
      '/dashboard/admin/growth',
    )
    return (data.supplierGrowth ?? []).map(
      (row): DashboardGrowthPoint => ({
        month: row.month,
        count: Number(row.count),
      }),
    )
  },
  async revenue() {
    const data = await apiGet<{
      revenueByMonth: Array<{ month: string; revenue: string }>
    }>('/dashboard/admin/revenue')
    return (data.revenueByMonth ?? []).map(
      (row): DashboardRevenuePoint => ({
        month: row.month,
        revenue: row.revenue,
      }),
    )
  },
  farmToday() {
    return apiGet<FarmOwnerTodaySummary>('/dashboard/supplier/today')
  },
  farmMonth(month?: string) {
    return apiGet<FarmOwnerMonthSummary>(
      '/dashboard/supplier/month',
      month ? { month } : undefined,
    )
  },
}
