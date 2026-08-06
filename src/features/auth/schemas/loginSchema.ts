import { z } from 'zod'
import { emailSchema, passwordSchema } from '../../../lib/validation/common'

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>
