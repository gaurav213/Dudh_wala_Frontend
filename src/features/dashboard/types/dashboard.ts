export interface DashboardSummary {
  suppliers: number
  customers: number
  deliveries: number
  outstandingBalance: string
}

export interface DashboardGrowthPoint {
  month: string
  count: number
}

export interface DashboardRevenuePoint {
  month: string
  revenue: string
}

export interface FarmOwnerTodaySummary {
  summary: {
    date: string
    total: number
    pending: number
    delivered: number
    skipped: number
    cancelled: number
  }
}

export interface FarmOwnerMonthSummary {
  billingMonth: string
  deliveryCount: number
  deliveredCount: number
  milkAmount: string
  collected: string
  outstanding: string
  billCount: number
}
