export type UserRole =
  | 'PLATFORM_OWNER'
  | 'FARM_OWNER'
  | 'DELIVERY_STAFF'
  | 'CUSTOMER'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING'

export interface PaginationMeta {
  requestId: string
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export interface ApiSuccessResponse<T> {
  data: T
  meta: PaginationMeta
}

export interface ApiErrorBody {
  statusCode: number
  code: string
  message: string
  details?: unknown
  requestId?: string
  timestamp?: string
}

export interface PaginatedParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
