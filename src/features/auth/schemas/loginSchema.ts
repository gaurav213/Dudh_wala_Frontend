import { z } from 'zod'
import type { TFunction } from 'i18next'
import { mobileNumberSchema, passwordSchema } from '../../../lib/validation/common'

export function loginSchema(t: TFunction) {
  return z.object({
    mobileNumber: mobileNumberSchema(t),
    password: passwordSchema(t),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>
