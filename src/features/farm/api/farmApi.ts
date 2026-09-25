import { apiClient, apiGet, apiGetWithMeta, apiPatch, apiPost } from '../../../lib/api/client'
import type { PaginatedParams, PaginationMeta } from '../../../types/api'
import type {
  AcceptServiceRequestPayload,
  ChangeRatePayload,
  CreateCustomerInvitationPayload,
  CreateManagedCustomerPayload,
  CreateProductPayload,
  CreateServiceAreaPayload,
  CustomerServiceRequest,
  Farm,
  FarmCustomerConnection,
  FarmCustomerInvitation,
  FarmDashboard,
  FarmMember,
  FarmMemberInvitation,
  FarmProduct,
  InviteStaffPayload,
  MilkRateHistoryEntry,
  RejectServiceRequestPayload,
  UpdateFarmPayload,
  UpdateProductPayload,
  UpdateServiceAreaPayload,
  FarmStaffDetail,
  FarmStaffTodayResponse,
  FarmTodayMetrics,
} from '../types/farm'

/**
 * Resolves the caller's active farm id. GET /farms/my may return either a
 * single farm or an array (backend returns an array of owned farms); this
 * takes the first one since farm owners currently manage a single farm.
 */
export async function getMyFarmId(): Promise<string | null> {
  const farms = await apiGet<Farm[] | Farm>('/farms/my')
  const list = Array.isArray(farms) ? farms : [farms]
  const active = list.find((f) => f && f.id) ?? null
  return active?.id ?? null
}

export const farmApi = {
  myFarms() {
    return apiGet<Farm[]>('/farms/my')
  },
  getMyFarmId,
  myDashboard(params?: { date?: string; from?: string; to?: string }) {
    return apiGet<FarmDashboard>('/farms/my/dashboard', params)
  },
  getFarm(farmId: string) {
    return apiGet<Farm>(`/farms/${farmId}`)
  },
  updateFarm(farmId: string, payload: UpdateFarmPayload) {
    return apiPatch<Farm>(`/farms/${farmId}`, payload)
  },
  deactivateFarm(farmId: string) {
    return apiPost<Farm>(`/farms/${farmId}/deactivate`)
  },
  requestDeletion(farmId: string) {
    return apiPost<{ farm: Farm; deleted: boolean; message: string }>(
      `/farms/${farmId}/request-deletion`,
    )
  },

  listMedia(farmId: string) {
    return apiGet<{ id: string; url: string; sortOrder: number }[]>(`/farms/${farmId}/media`)
  },
  async uploadMedia(farmId: string, photo: File) {
    const form = new FormData()
    form.append('photo', photo)
    const { data } = await apiClient.post<{ data: { id: string; url: string; sortOrder: number } }>(
      `/farms/${farmId}/media`,
      form,
      { headers: { 'Content-Type': undefined } },
    )
    return data.data
  },
  async deleteMedia(farmId: string, mediaId: string) {
    await apiClient.delete(`/farms/${farmId}/media/${mediaId}`)
  },

  // Service areas
  serviceAreas(farmId: string) {
    return apiGet<import('../types/farm').FarmServiceArea[]>(`/farms/${farmId}/service-areas`)
  },
  createServiceArea(farmId: string, payload: CreateServiceAreaPayload) {
    return apiPost<import('../types/farm').FarmServiceArea>(
      `/farms/${farmId}/service-areas`,
      payload,
    )
  },
  updateServiceArea(farmId: string, id: string, payload: UpdateServiceAreaPayload) {
    return apiPatch<import('../types/farm').FarmServiceArea>(
      `/farms/${farmId}/service-areas/${id}`,
      payload,
    )
  },
  async deleteServiceArea(farmId: string, id: string) {
    await apiClient.delete(`/farms/${farmId}/service-areas/${id}`)
  },
  activateServiceArea(farmId: string, id: string) {
    return apiPost<import('../types/farm').FarmServiceArea>(
      `/farms/${farmId}/service-areas/${id}/activate`,
    )
  },
  deactivateServiceArea(farmId: string, id: string) {
    return apiPost<import('../types/farm').FarmServiceArea>(
      `/farms/${farmId}/service-areas/${id}/deactivate`,
    )
  },

  // Products
  products(farmId: string) {
    return apiGet<FarmProduct[]>(`/farms/${farmId}/products`)
  },
  createProduct(farmId: string, payload: CreateProductPayload) {
    return apiPost<FarmProduct>(`/farms/${farmId}/products`, payload)
  },
  updateProduct(farmId: string, id: string, payload: UpdateProductPayload) {
    return apiPatch<FarmProduct>(`/farms/${farmId}/products/${id}`, payload)
  },
  async deleteProduct(farmId: string, id: string) {
    await apiClient.delete(`/farms/${farmId}/products/${id}`)
  },
  activateProduct(farmId: string, id: string) {
    return apiPost<FarmProduct>(`/farms/${farmId}/products/${id}/activate`)
  },
  deactivateProduct(farmId: string, id: string) {
    return apiPost<FarmProduct>(`/farms/${farmId}/products/${id}/deactivate`)
  },
  changeRate(farmId: string, id: string, payload: ChangeRatePayload) {
    return apiPost<{ product: FarmProduct; rateHistory: MilkRateHistoryEntry }>(
      `/farms/${farmId}/products/${id}/change-rate`,
      payload,
    )
  },
  rateHistory(farmId: string, id: string) {
    return apiGet<MilkRateHistoryEntry[]>(`/farms/${farmId}/products/${id}/rate-history`)
  },

  // Staff / members
  members(farmId: string) {
    return apiGet<FarmMember[]>(`/farms/${farmId}/members`)
  },
  inviteStaff(farmId: string, payload: InviteStaffPayload) {
    return apiPost<FarmMemberInvitation>(`/farms/${farmId}/staff/invitations`, payload)
  },
  staffInvitations(farmId: string) {
    return apiGet<FarmMemberInvitation[]>(`/farms/${farmId}/staff/invitations`)
  },
  resendStaffInvitation(farmId: string, id: string) {
    return apiPost<FarmMemberInvitation>(`/farms/${farmId}/staff/invitations/${id}/resend`)
  },
  cancelStaffInvitation(farmId: string, id: string) {
    return apiPost<FarmMemberInvitation>(`/farms/${farmId}/staff/invitations/${id}/cancel`)
  },
  deactivateMember(farmId: string, memberId: string) {
    return apiPost<FarmMember>(`/farms/${farmId}/staff/members/${memberId}/deactivate`)
  },
  reactivateMember(farmId: string, memberId: string) {
    return apiPost<FarmMember>(`/farms/${farmId}/staff/members/${memberId}/reactivate`)
  },
  removeMember(farmId: string, memberId: string) {
    return apiPost<FarmMember>(`/farms/${farmId}/staff/members/${memberId}/remove`)
  },
  staffDetail(farmId: string, staffUserId: string) {
    return apiGet<FarmStaffDetail>(`/farms/${farmId}/staff/${staffUserId}`)
  },
  staffToday(
    farmId: string,
    staffUserId: string,
    section: 'all' | 'pending' | 'extra' | 'edited' = 'all',
  ) {
    return apiGet<FarmStaffTodayResponse>(`/farms/${farmId}/staff/${staffUserId}/today`, {
      section,
    })
  },
  farmTodayMetrics(params?: { farmId?: string; date?: string; from?: string; to?: string }) {
    return apiGet<FarmTodayMetrics>('/dashboard/farm/today', params)
  },

  // Service requests
  serviceRequests(farmId: string, params?: PaginatedParams & { status?: string }) {
    return apiGetWithMeta<CustomerServiceRequest[]>(
      `/farms/${farmId}/service-requests`,
      params as Record<string, unknown> | undefined,
    )
  },
  acceptServiceRequest(farmId: string, id: string, payload: AcceptServiceRequestPayload) {
    return apiPost<{ request: CustomerServiceRequest }>(
      `/farms/${farmId}/service-requests/${id}/accept`,
      payload,
    )
  },
  rejectServiceRequest(farmId: string, id: string, payload: RejectServiceRequestPayload) {
    return apiPost<CustomerServiceRequest>(
      `/farms/${farmId}/service-requests/${id}/reject`,
      payload,
    )
  },
  cancelServiceRequest(farmId: string, id: string) {
    return apiPost<CustomerServiceRequest>(`/farms/${farmId}/service-requests/${id}/cancel`)
  },

  // Customer invitations
  customerInvitations(farmId: string, params?: PaginatedParams & { status?: string }) {
    return apiGetWithMeta<FarmCustomerInvitation[]>(
      `/farms/${farmId}/customer-invitations`,
      params as Record<string, unknown> | undefined,
    )
  },
  createCustomerInvitation(farmId: string, payload: CreateCustomerInvitationPayload) {
    return apiPost<FarmCustomerInvitation>(`/farms/${farmId}/customer-invitations`, payload)
  },
  cancelCustomerInvitation(farmId: string, id: string) {
    return apiPost<FarmCustomerInvitation>(`/farms/${farmId}/customer-invitations/${id}/cancel`)
  },

  // Connected + managed customers
  customers(farmId: string, params?: PaginatedParams & { status?: string }) {
    return apiGetWithMeta<FarmCustomerConnection[]>(
      `/farms/${farmId}/customers`,
      params as Record<string, unknown> | undefined,
    )
  },
  customer(farmId: string, customerUserId: string) {
    return apiGet<FarmCustomerConnection>(`/farms/${farmId}/customers/${customerUserId}`)
  },
  createManagedCustomer(farmId: string, payload: CreateManagedCustomerPayload) {
    return apiPost<{
      source: 'MANAGED'
      ledgerCustomerId: string
      customer: unknown
      subscription: unknown
    }>(`/farms/${farmId}/customers/managed`, payload)
  },
}

export type { PaginationMeta }
