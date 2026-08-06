import type { ApiErrorBody } from '../../types/api'

export class ApiError extends Error {
  statusCode: number
  code: string
  details?: unknown
  requestId?: string
  timestamp?: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.statusCode = body.statusCode
    this.code = body.code
    this.details = body.details
    this.requestId = body.requestId
    this.timestamp = body.timestamp
  }
}

export function mapAxiosError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  const axiosLike = error as {
    response?: { status?: number; data?: Partial<ApiErrorBody> & { errors?: ApiErrorBody } }
    message?: string
    code?: string
  }

  const status = axiosLike.response?.status ?? 500
  const payload = axiosLike.response?.data
  const nested = payload?.errors

  if (nested) {
    return new ApiError({
      statusCode: nested.statusCode ?? status,
      code: nested.code ?? 'UNKNOWN_ERROR',
      message: nested.message ?? 'Request failed',
      details: nested.details,
      requestId: nested.requestId,
      timestamp: nested.timestamp,
    })
  }

  if (payload?.message || payload?.code) {
    return new ApiError({
      statusCode: payload.statusCode ?? status,
      code: payload.code ?? 'UNKNOWN_ERROR',
      message: payload.message ?? 'Request failed',
      details: payload.details,
      requestId: payload.requestId,
      timestamp: payload.timestamp,
    })
  }

  if (axiosLike.code === 'ECONNABORTED') {
    return new ApiError({
      statusCode: 408,
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
    })
  }

  return new ApiError({
    statusCode: status,
    code: 'NETWORK_ERROR',
    message: axiosLike.message ?? 'Unable to reach the server',
  })
}
