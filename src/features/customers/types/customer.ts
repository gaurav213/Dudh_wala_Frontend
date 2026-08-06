import type { UserStatus } from '../../../types/api'

export interface Customer {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  status: UserStatus
  supplierId: string
  supplierName: string
  createdAt: string
}

export interface CustomerDelivery {
  id: string
  date: string
  quantityLiters: number
  status: string
}

export interface CustomerBill {
  id: string
  periodStart: string
  periodEnd: string
  amount: number
  status: string
}

export interface CustomerPayment {
  id: string
  paidAt: string
  amount: number
  method: string
  status: string
}

export interface CustomerDetail extends Customer {
  deliveries: CustomerDelivery[]
  bills: CustomerBill[]
  payments: CustomerPayment[]
}
