import { describe, expect, it } from 'vitest'
import { ApiError, mapAxiosError } from './errors'

describe('unauthorized handling', () => {
  it('maps 401 API errors with nested errors payload', () => {
    const mapped = mapAxiosError({
      response: {
        status: 401,
        data: {
          errors: {
            statusCode: 401,
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
            requestId: 'req-401',
            timestamp: '2026-08-06T00:00:00.000Z',
          },
        },
      },
    })

    expect(mapped).toBeInstanceOf(ApiError)
    expect(mapped.statusCode).toBe(401)
    expect(mapped.code).toBe('UNAUTHORIZED')
    expect(mapped.message).toBe('Invalid or expired token')
    expect(mapped.requestId).toBe('req-401')
  })

  it('maps 403 forbidden responses', () => {
    const mapped = mapAxiosError({
      response: {
        status: 403,
        data: {
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Admin role required',
        },
      },
    })

    expect(mapped.statusCode).toBe(403)
    expect(mapped.code).toBe('FORBIDDEN')
  })
})
