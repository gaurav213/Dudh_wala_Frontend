import { apiClient, apiGet, apiGetWithMeta, apiPatch, apiPost } from '../../../lib/api/client'
import type { AuthUser, ProfileResponse } from '../../../types/auth'

export interface CustomerAddress {
  id: string
  label: string
  addressLine1: string
  addressLine2?: string | null
  area: string
  city: string
  state: string
  postalCode: string
  latitude?: string | null
  longitude?: string | null
  deliveryInstructions?: string | null
  isDefault: boolean
}

export type MilkType = 'COW' | 'BUFFALO' | 'MIXED' | 'TONED' | 'OTHER'
export type DeliveryShift = 'MORNING' | 'AFTERNOON' | 'EVENING'
export type ServiceAreaMatchTier = 'EXACT_PIN' | 'AREA_CITY' | 'CITY' | 'NONE'

export interface FarmSearchProduct {
  id: string
  name: string
  milkType: MilkType
  currentRatePerLitre: string
  minimumQuantity: string
  maximumQuantity?: string | null
  availableShifts: DeliveryShift[]
}

export interface FarmSearchResult {
  id: string
  name: string
  description?: string | null
  city?: string | null
  area?: string | null
  postalCode?: string | null
  serviceAreaMatch?: ServiceAreaMatchTier
  products?: FarmSearchProduct[]
  connection?: {
    connected: boolean
    products: { name: string; milkType: string }[]
  }
}

export interface SearchDiagnosticReason {
  code: string
  message: string
}

export interface SearchFarmsMeta {
  requestId: string
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  diagnostics?: { reasons: SearchDiagnosticReason[] }
}

export interface PublicFarm {
  id: string
  name: string
  businessName?: string | null
  description?: string | null
  area: string
  city: string
  state: string
  postalCode: string
  latitude?: string | null
  longitude?: string | null
  createdAt: string
  products?: FarmSearchProduct[]
  images?: { id: string; url: string; sortOrder?: number }[]
  averageRating?: number | null
  reviewCount?: number
  reviews?: { id: string; rating: number; comment?: string | null; createdAt: string }[]
}

export type ServiceRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export type DeliveryScheduleType =
  | 'EVERY_DAY'
  | 'ALTERNATE_DAYS'
  | 'WEEKLY'
  | 'WEEKDAYS'
  | 'CUSTOM'

export interface CustomerServiceRequest {
  id: string
  farmId: string
  customerUserId: string
  addressId: string
  productId: string
  quantity: string
  deliveryShift: DeliveryShift
  scheduleType?: DeliveryScheduleType
  preferredStartDate: string
  deliveryInstructions?: string | null
  status: ServiceRequestStatus
  rejectionReason?: string | null
  assignedMemberUserId?: string | null
  createdAt: string
  updatedAt?: string
  farmName?: string | null
  productName?: string | null
  milkType?: string | null
  firstDeliveryDate?: string | null
  nextDeliveryDate?: string | null
}

export interface CreateServiceRequestPayload {
  farmId: string
  addressId: string
  productId: string
  quantity: string
  deliveryShift: DeliveryShift
  preferredStartDate: string
  scheduleType?: DeliveryScheduleType
  deliveryInstructions?: string
}

export interface CustomerInvitation {
  id: string
  farmId: string
  farmName?: string | null
  farmArea?: string | null
  farmCity?: string | null
  mobileNumber: string
  customerName?: string | null
  productId: string
  productName?: string | null
  milkType?: string | null
  quantity: string
  deliveryShift: DeliveryShift
  proposedRate: string
  preferredStartDate: string
  deliveryInstructions?: string | null
  status: InvitationStatus
  expiresAt: string
  createdAt: string
  updatedAt?: string
}

export interface CreateAddressPayload {
  label: string
  addressLine1: string
  addressLine2?: string
  area: string
  city: string
  state: string
  postalCode: string
  latitude?: string
  longitude?: string
  deliveryInstructions?: string
  isDefault?: boolean
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>

export interface SearchFarmsParams {
  addressId?: string
  postalCode?: string
  area?: string
  city?: string
  milkType?: MilkType
  deliveryShift?: DeliveryShift
  includeDiagnostics?: boolean
  page?: number
  limit?: number
}

export type PaymentStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'

export interface CustomerBillingSummary {
  todaysAmount: string
  monthDeliveredDays: number
  monthRegularQuantity: string
  monthExtraQuantity: string
  monthTotalQuantity: string
  monthMilkCharges: string
  previousBalance: string
  paymentsThisMonth: string
  pendingCashThisMonth: string
  pendingCashClaims: number
  outstandingBalance: string
  billTillToday: string
  advanceBalance?: string
}

export interface CustomerPayment {
  id: string
  amount: string
  paymentMethod: string
  status: PaymentStatus | string
  paymentDate: string
  notes?: string | null
  proofImageUrl?: string | null
  rejectionNote?: string | null
  clientReferenceId?: string
  farmId?: string | null
  createdAt?: string
}

export interface ClaimCashPayload {
  amount: string | number
  proof: File
  clientReferenceId: string
  notes?: string
  farmId?: string
}

export interface CustomerDelivery {
  id: string
  customerId: string
  subscriptionId?: string | null
  farmId?: string | null
  deliveryDate: string
  deliveryShift: string
  status: string
  confirmationStatus: string
  scheduledQuantity?: string
  customerExtraQuantity?: string
  staffExtraQuantity?: string
  finalDeliveredQuantity?: string | null
  quantity?: string
  ratePerLitre?: string
  amount?: string
  deliveredAt?: string | null
  notes?: string | null
  deliveryNotes?: string | null
}

export type DeliveryIssueType =
  | 'NOT_RECEIVED'
  | 'WRONG_QUANTITY'
  | 'WRONG_PRODUCT'
  | 'QUALITY_ISSUE'
  | 'OTHER'

export const customerApi = {
  profile() {
    return apiGet<ProfileResponse>('/auth/profile')
  },
  addresses() {
    return apiGet<CustomerAddress[]>('/customer-addresses')
  },
  createAddress(payload: CreateAddressPayload) {
    return apiPost<CustomerAddress>('/customer-addresses', payload)
  },
  updateAddress(id: string, payload: UpdateAddressPayload) {
    return apiPatch<CustomerAddress>(`/customer-addresses/${id}`, payload)
  },
  setDefaultAddress(id: string) {
    return apiPost<CustomerAddress>(`/customer-addresses/${id}/set-default`)
  },
  async removeAddress(id: string) {
    await apiClient.delete(`/customer-addresses/${id}`)
  },
  async searchFarms(params: SearchFarmsParams) {
    const result = await apiGetWithMeta<FarmSearchResult[]>(
      '/farms/search',
      params as Record<string, unknown>,
    )
    return result as { data: FarmSearchResult[]; meta: SearchFarmsMeta }
  },
  getPublicFarm(farmId: string) {
    return apiGet<PublicFarm>(`/farms/${farmId}/public`)
  },
  submitFarmReview(farmId: string, payload: { rating: number; comment?: string }) {
    return apiPost(`/farms/${farmId}/reviews`, payload)
  },
  createServiceRequest(payload: CreateServiceRequestPayload) {
    return apiPost<CustomerServiceRequest>('/service-requests', payload)
  },
  myServiceRequests(params?: { status?: ServiceRequestStatus; page?: number; limit?: number }) {
    return apiGetWithMeta<CustomerServiceRequest[]>('/service-requests/my', params)
  },
  cancelServiceRequest(id: string) {
    return apiPost<CustomerServiceRequest>(`/service-requests/${id}/cancel`)
  },
  myInvitations() {
    return apiGet<CustomerInvitation[]>('/customer-invitations/my')
  },
  acceptInvitation(id: string) {
    return apiPost<{ invitation: CustomerInvitation }>(`/customer-invitations/${id}/accept`)
  },
  rejectInvitation(id: string) {
    return apiPost<CustomerInvitation>(`/customer-invitations/${id}/reject`)
  },
  billingSummary() {
    return apiGet<CustomerBillingSummary>('/me/billing-summary')
  },
  myPayments(params?: { page?: number; limit?: number }) {
    return apiGetWithMeta<CustomerPayment[]>('/me/payments', params)
  },
  async claimCash(payload: ClaimCashPayload) {
    const form = new FormData()
    form.append('amount', String(payload.amount))
    form.append('clientReferenceId', payload.clientReferenceId)
    form.append('proof', payload.proof)
    if (payload.notes) form.append('notes', payload.notes)
    if (payload.farmId) form.append('farmId', payload.farmId)
    // Let the browser set multipart boundary — do not force JSON Content-Type.
    const { data } = await apiClient.post<{ data: CustomerPayment }>(
      '/me/payments/cash-claim',
      form,
      { headers: { 'Content-Type': undefined } },
    )
    return data.data
  },
  myDeliveries(params?: { page?: number; limit?: number }) {
    return apiGetWithMeta<CustomerDelivery[]>('/me/deliveries', params)
  },
  confirmDelivery(deliveryId: string, notes?: string) {
    return apiPost(`/deliveries/${deliveryId}/customer-confirm`, {
      ...(notes ? { notes } : {}),
    })
  },
  skipToday(deliveryId: string, notes?: string) {
    return apiPost(`/deliveries/${deliveryId}/customer-skip-today`, {
      ...(notes ? { notes } : {}),
    })
  },

  skipDay(date: string, notes?: string) {
    return apiPost<{ date: string; skipped: number }>('/me/skip-day', {
      date,
      ...(notes ? { notes } : {}),
    })
  },

  unskipDay(date: string, notes?: string) {
    return apiPost<{ date: string; restored: number }>('/me/unskip-day', {
      date,
      ...(notes ? { notes } : {}),
    })
  },
  markReceived(deliveryId: string, notes?: string) {
    return apiPost(`/deliveries/${deliveryId}/customer-mark-received`, {
      ...(notes ? { notes } : {}),
    })
  },
  reportDeliveryIssue(
    deliveryId: string,
    issueType: DeliveryIssueType,
    description?: string,
  ) {
    return apiPost(`/deliveries/${deliveryId}/customer-not-received`, {
      issueType,
      ...(description ? { description } : {}),
    })
  },
}

export type { AuthUser }
