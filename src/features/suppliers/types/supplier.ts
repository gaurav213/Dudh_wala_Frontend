import type { UserStatus } from '../../../types/api'

export interface Supplier {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  status: UserStatus
  customerCount: number
  createdAt: string
  address?: string | null
  businessName?: string | null
  name?: string
  mobileNumber?: string
}

export interface SupplierBillingSummary {
  totalBilled: number
  totalCollected: number
  outstanding: number
  lastBillDate?: string | null
}

export interface SupplierDetail extends Supplier {
  billing: SupplierBillingSummary
  customers: Array<{ id: string; fullName: string; status: UserStatus }>
}
