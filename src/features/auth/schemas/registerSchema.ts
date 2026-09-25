import { z } from 'zod'
import type { TFunction } from 'i18next'
import { mobileNumberSchema, passwordSchema } from '../../../lib/validation/common'

export function registerFarmOwnerSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t('enterYourName')).max(150),
    mobileNumber: mobileNumberSchema(t),
    password: passwordSchema(t),
    farmName: z.string().trim().min(2, t('enterFarmName')).max(150),
    businessName: z.string().trim().max(150).optional().or(z.literal('')),
    addressLine1: z.string().trim().min(3, t('enterAddress')).max(255),
    area: z.string().trim().min(2, t('enterArea')).max(100),
    city: z.string().trim().min(2, t('enterCity')).max(100),
    state: z.string().trim().min(2, t('enterState')).max(100),
    postalCode: z.string().trim().min(5, t('enterPostalCode')).max(20),
  })
}

export type RegisterFarmOwnerFormValues = z.infer<
  ReturnType<typeof registerFarmOwnerSchema>
>

export function registerCustomerSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t('enterYourName')).max(150),
    mobileNumber: mobileNumberSchema(t),
    password: passwordSchema(t),
  })
}

export type RegisterCustomerFormValues = z.infer<
  ReturnType<typeof registerCustomerSchema>
>
