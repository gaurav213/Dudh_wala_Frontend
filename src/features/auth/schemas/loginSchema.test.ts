import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { loginSchema } from '../schemas/loginSchema'

const t = ((key: string) => {
  const map: Record<string, string> = {
    enterValidMobile: 'Enter a valid 10-digit mobile number',
    passwordMin8: 'Password must be at least 8 characters',
  }
  return map[key] ?? key
}) as TFunction

describe('form validation', () => {
  it('rejects invalid login payloads', () => {
    const result = loginSchema(t).safeParse({ mobileNumber: '123', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.mobileNumber?.[0]).toMatch(/10-digit/i)
      expect(fields.password?.[0]).toMatch(/at least 8/i)
    }
  })

  it('accepts valid login payloads and normalizes mobile', () => {
    const result = loginSchema(t).safeParse({
      mobileNumber: '9999999999',
      password: 'Admin@12345',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.mobileNumber).toBe('919999999999')
    }
  })
})
