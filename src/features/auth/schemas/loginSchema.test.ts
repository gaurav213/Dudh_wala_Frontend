import { describe, expect, it } from 'vitest'
import { loginSchema } from '../schemas/loginSchema'

describe('form validation', () => {
  it('rejects invalid login payloads', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.email?.[0]).toMatch(/valid email/i)
      expect(fields.password?.[0]).toMatch(/at least 8/i)
    }
  })

  it('accepts valid login payloads', () => {
    const result = loginSchema.safeParse({
      email: 'admin@doodhkhata.app',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
})
