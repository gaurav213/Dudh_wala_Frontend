import { apiGet, apiPost } from '../../../lib/api/client'

export interface DeliveryStaffDashboard {
  date: string
  todaysCustomers: number
  pending: number
  outForDelivery: number
  delivered: number
  skipped: number
  failed: number
  disputed: number
  extraRequests: number
  plannedLitres: string
  deliveredLitres: string
  cashToCollect: string
  paymentsCollectedToday: string
}

export interface TodayDeliveryRow {
  id: string
  customerId: string
  status: string
  deliveryShift: string
  expectedQuantity?: string
  scheduledQuantity?: string
  customerExtraQuantity?: string
  staffExtraQuantity?: string
  customerName?: string
  mobileNumber?: string
  address?: string | null
  latitude?: string | null
  longitude?: string | null
  hasMapPin?: boolean
  amount?: string
  assignedUserId?: string | null
  deliverySequence?: number | null
}

export interface StaffCustomerRow {
  customerId: string
  name: string
  mobileNumber?: string | null
  addressSummary?: string | null
  milkType?: string
  regularQuantity?: string
  todayStatus?: string
  todayTotalQuantity?: string
  deliveryId?: string | null
}

export interface PendingCashPayment {
  id: string
  amount: string
  paymentMethod: string
  status: string
  paymentDate: string
  notes?: string | null
  proofImageUrl?: string | null
  customerId: string
  customer?: {
    id: string
    name?: string
    mobileNumber?: string | null
  } | null
  createdAt?: string
}

export const deliveryStaffApi = {
  dashboard() {
    return apiGet<DeliveryStaffDashboard>('/delivery-staff/dashboard')
  },
  today(params?: { status?: string; shift?: string }) {
    return apiGet<TodayDeliveryRow[]>('/deliveries/today', params)
  },
  customers() {
    return apiGet<StaffCustomerRow[]>('/delivery-staff/customers')
  },
  pendingCash() {
    return apiGet<PendingCashPayment[]>('/delivery-staff/pending-cash')
  },
  confirmCash(id: string) {
    return apiPost<PendingCashPayment>(`/payments/${id}/confirm`)
  },
  rejectCash(id: string, notes?: string) {
    return apiPost<PendingCashPayment>(`/payments/${id}/reject`, {
      ...(notes ? { notes } : {}),
    })
  },
  outForDelivery(id: string) {
    return apiPost<TodayDeliveryRow>(`/deliveries/${id}/out-for-delivery`)
  },
  markDelivered(id: string, finalDeliveredQuantity?: string, notes?: string) {
    return apiPost<TodayDeliveryRow>(`/deliveries/${id}/delivered`, {
      ...(finalDeliveredQuantity ? { finalDeliveredQuantity } : {}),
      ...(notes ? { notes } : {}),
    })
  },
  addExtra(id: string, extraQuantity: string, reason?: string) {
    return apiPost<TodayDeliveryRow>(`/deliveries/${id}/add-extra`, {
      extraQuantity,
      ...(reason ? { reason } : {}),
    })
  },
  skip(id: string, notes?: string) {
    return apiPost<TodayDeliveryRow>(`/deliveries/${id}/skipped`, {
      ...(notes ? { notes } : {}),
    })
  },
  fail(id: string, notes?: string) {
    return apiPost<TodayDeliveryRow>(`/deliveries/${id}/failed`, {
      ...(notes ? { notes } : {}),
    })
  },
}
