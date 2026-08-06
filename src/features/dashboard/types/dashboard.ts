export interface DashboardSummary {
  totalSuppliers: number
  activeSuppliers: number
  totalCustomers: number
  deliveriesToday: number
  milkThisMonthLiters: number
  billedThisMonth: number
  paymentsThisMonth: number
  outstandingAmount: number
}

export interface RecentRegistration {
  id: string
  fullName: string
  role: string
  createdAt: string
  status: string
}

export interface FailedSync {
  id: string
  entityType: string
  entityId: string
  errorMessage: string
  failedAt: string
}

export interface DashboardGrowthPoint {
  month: string
  suppliers: number
  customers: number
}

export interface DashboardRevenuePoint {
  month: string
  billed: number
  collected: number
}
