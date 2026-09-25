export type FarmStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'REJECTED'
  | 'CLOSED'

export type MilkType = 'COW' | 'BUFFALO' | 'MIXED' | 'TONED' | 'OTHER'

export type DeliveryShift = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type ServiceAreaStatus = 'ACTIVE' | 'INACTIVE'

export type FarmMemberRole = 'OWNER' | 'DELIVERY_STAFF'

export type FarmMemberStatus = 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'REMOVED'

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export type ServiceRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'CLOSED'

export interface Farm {
  id: string
  name: string
  businessName?: string | null
  description?: string | null
  mobileNumber: string
  email?: string | null
  addressLine1: string
  addressLine2?: string | null
  area: string
  city: string
  state: string
  postalCode: string
  latitude?: string | null
  longitude?: string | null
  spokenLanguages?: string[]
  status: FarmStatus
  approvalNotes?: string | null
  approvedAt?: string | null
  deactivatedAt?: string | null
  deletionRequestedAt?: string | null
  createdByUserId?: string
  createdAt: string
  updatedAt?: string
}

export interface UpdateFarmPayload {
  name?: string
  businessName?: string
  description?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  area?: string
  city?: string
  state?: string
  postalCode?: string
  spokenLanguages?: string[]
}

export interface FarmDashboard {
  farm: {
    id: string
    name: string
    status: FarmStatus
    createdAt: string
  }
  profileCompletionPercent: number
  counts: {
    serviceAreas: number
    activeServiceAreas: number
    products: number
    availableProducts: number
    staff: number
    connections: number
    pendingServiceRequests: number
    pendingCustomerInvitations: number
    pendingMemberInvitations: number
    todayDeliveries: number
    outstandingBalance: string
    advanceBalance?: string
  }
  money?: {
    fromDate?: string
    toDate?: string
    asOfDate?: string
    madeInRange?: string
    collectedInRange?: string
    madeToday: string
    madeThisWeek: string
    madeThisMonth: string
    collectedToday: string
    collectedThisWeek: string
    collectedThisMonth: string
    toCollect: string
    advanceBalance?: string
  }
  onboardingChecklist: {
    isApproved: boolean
    hasServiceArea: boolean
    hasProduct: boolean
    hasStaff: boolean
    profileComplete: boolean
  }
}

export interface FarmServiceArea {
  id: string
  farmId: string
  areaName: string
  city: string
  state: string
  postalCode?: string | null
  latitude?: string | null
  longitude?: string | null
  serviceRadiusKm?: string | null
  status: ServiceAreaStatus
  createdAt: string
  updatedAt?: string
}

export interface CreateServiceAreaPayload {
  areaName: string
  city: string
  state: string
  postalCode?: string
  latitude?: string
  longitude?: string
  serviceRadiusKm?: string
  status?: ServiceAreaStatus
}

export type UpdateServiceAreaPayload = Partial<CreateServiceAreaPayload>

export interface FarmProduct {
  id: string
  farmId: string
  name: string
  milkType: MilkType
  description?: string | null
  currentRatePerLitre: string
  minimumQuantity: string
  maximumQuantity?: string | null
  availableShifts: DeliveryShift[]
  isAvailable: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateProductPayload {
  name: string
  milkType: MilkType
  description?: string
  currentRatePerLitre: string
  minimumQuantity: string
  maximumQuantity?: string
  availableShifts: DeliveryShift[]
  isAvailable?: boolean
}

export interface UpdateProductPayload {
  name?: string
  milkType?: MilkType
  description?: string
  minimumQuantity?: string
  maximumQuantity?: string
  availableShifts?: DeliveryShift[]
  isAvailable?: boolean
}

export interface ChangeRatePayload {
  ratePerLitre: string
  effectiveFrom?: string
}

export interface MilkRateHistoryEntry {
  id: string
  farmProductId: string
  ratePerLitre: string
  effectiveFrom: string
  effectiveTo?: string | null
  createdByUserId: string
  createdAt: string
}

export interface FarmMemberUser {
  id: string
  name: string
  mobileNumber: string
  email?: string | null
}

export interface FarmMember {
  id: string
  farmId: string
  userId: string
  user?: FarmMemberUser
  memberRole: FarmMemberRole
  status: FarmMemberStatus
  joinedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface FarmMemberInvitation {
  id: string
  farmId: string
  mobileNumber: string
  name?: string | null
  role: FarmMemberRole
  status: InvitationStatus
  invitedByUserId: string
  expiresAt: string
  createdAt: string
  updatedAt?: string
}

export interface InviteStaffPayload {
  mobileNumber: string
  name?: string
  expiresInDays?: number
}

export type DeliveryScheduleType =
  | 'EVERY_DAY'
  | 'ALTERNATE_DAYS'
  | 'WEEKDAYS'
  | 'WEEKLY'
  | 'CUSTOM'

export interface CustomerServiceRequest {
  id: string
  farmId: string
  customerUserId: string
  customerUser?: FarmMemberUser
  addressId: string
  productId: string
  product?: FarmProduct
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
  customerName?: string | null
  customerMobileNumber?: string | null
  customerAvatarUrl?: string | null
  customerAverageRating?: number | null
  customerReviewCount?: number
  productName?: string | null
  milkType?: string | null
  addressSummary?: string | null
}

export interface AcceptServiceRequestPayload {
  assignedMemberUserId?: string
}

export interface RejectServiceRequestPayload {
  rejectionReason?: string
}

export interface FarmCustomerInvitation {
  id: string
  farmId: string
  mobileNumber: string
  customerName?: string | null
  productId: string
  quantity: string
  deliveryShift: DeliveryShift
  proposedRate: string
  preferredStartDate: string
  deliveryInstructions?: string | null
  status: InvitationStatus
  invitedByUserId: string
  expiresAt: string
  createdAt: string
  updatedAt?: string
}

export interface CreateCustomerInvitationPayload {
  mobileNumber: string
  customerName?: string
  productId: string
  quantity: string
  deliveryShift: DeliveryShift
  proposedRate: string
  preferredStartDate: string
  deliveryInstructions?: string
  expiresInDays?: number
}

export interface FarmCustomerConnection {
  id: string
  farmId: string
  customerUserId: string | null
  customerUser?: FarmMemberUser | null
  status: ConnectionStatus
  connectedAt?: string | null
  blockedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt?: string
  source?: 'CONNECTION' | 'MANAGED'
  ledgerCustomerId?: string | null
  name?: string | null
  mobileNumber?: string | null
  address?: string | null
  subscriptions?: ConnectionSubscription[]
}

export type CreateManagedCustomerPayload = {
  name: string
  mobileNumber?: string
  address?: string
  notes?: string
  milkType: string
  quantity: string
  ratePerLitre: string
  deliveryShift: string
  startDate: string
  scheduleType?: string
}

export interface ConnectionSubscription {
  id: string
  milkType: string
  defaultQuantity: string
  deliveryShift: string
  ratePerLitre: string
  assignedDeliveryUserId?: string | null
  assignedDeliveryUserName?: string | null
  status: string
  startDate: string
}

export interface FarmTodayMetrics {
  date: string
  scheduledQuantity: string
  customerExtraQuantity: string
  staffExtraQuantity: string
  totalExtraQuantity: string
  totalDeliveredQuantity: string
  pendingCount: number
  deliveredCount: number
  skippedCount: number
  editedDeliveryCount: number
  totalCount: number
  collectionsToday?: string
  extraBreakdown?: {
    customerRequested: string
    staffAdded: string
    total: string
  }
}

export interface FarmStaffDetail {
  member: FarmMember
  profile: {
    id: string
    name: string
    mobileNumber: string
    email?: string | null
    status: FarmMemberStatus
    memberRole?: FarmMemberRole
    joinedAt?: string | null
    farmId: string
  }
  today: {
    assignedCustomers: number
    deliveredCount: number
    pendingCount: number
    skippedCount: number
    scheduledQuantity: string
    totalExtraQuantity: string
    totalDeliveredQuantity: string
    editedDeliveryCount: number
    cashCollected: string
  }
  lifetimeDeliveryCount: number
  editStats: {
    editedToday: number
    editedThisWeek: number
    editedThisMonth: number
  }
}

export interface FarmStaffTodayDelivery {
  id: string
  customerId: string
  customerName?: string | null
  mobileNumber?: string | null
  address?: string | null
  productName?: string | null
  scheduledQuantity: string
  customerExtraQuantity?: string
  staffExtraQuantity?: string
  extraQuantity: string
  finalDeliveredQuantity?: string | null
  status: string
  deliveredAt?: string | null
  isEdited: boolean
  editReviewStatus: string
}

export interface FarmStaffTodayResponse {
  date: string
  summary: {
    scheduledQuantity: string
    totalExtraQuantity: string
    totalDeliveredQuantity: string
    pendingCount: number
    deliveredCount: number
    skippedCount: number
    editedDeliveryCount: number
    totalCount: number
  }
  totalExtraDelivered: string
  deliveries: FarmStaffTodayDelivery[]
}

export interface FarmCustomerDeliveryDetail {
  customer: {
    id: string
    name: string
    mobileNumber: string
    address?: string | null
    notes?: string | null
  }
  today: Array<{
    id: string
    status: string
    deliveryShift: string
    scheduledQuantity: string
    customerExtraQuantity: string
    staffExtraQuantity: string
    finalDeliveredQuantity?: string | null
    expectedQuantity?: string
    amount: string
    isEdited?: boolean
    deliveredAt?: string | null
  }>
  billing?: {
    todaysAmount: string
    monthDeliveredDays: number
    monthRegularQuantity: string
    monthExtraQuantity: string
    monthTotalQuantity: string
    monthMilkCharges: string
    paymentsThisMonth?: string
    outstandingBalance: string
    billTillToday: string
    advanceBalance?: string
  } | null
}
