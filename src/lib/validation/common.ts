import { z } from 'zod'
import type { TFunction } from 'i18next'

export function emailSchema(t: TFunction) {
  return z.string().trim().email(t('enterValidEmail'))
}

/** Accepts 10-digit Indian mobile or 12-digit with 91 prefix. */
export function mobileNumberSchema(t: TFunction) {
  return z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine(
      (digits) =>
        digits.length === 10 || (digits.length === 12 && digits.startsWith('91')),
      { message: t('enterValidMobile') },
    )
    .transform((digits) => (digits.length === 10 ? `91${digits}` : digits))
}

export function passwordSchema(t: TFunction) {
  return z
    .string()
    .min(8, t('passwordMin8'))
    .max(128, t('passwordTooLong'))
}

/** Positive quantity in litres, bounded to catch fat-finger entry. */
export function quantityLitresSchema(t: TFunction) {
  return z.coerce
    .number({ invalid_type_error: t('enterValidNumber') })
    .positive(t('mustBeGreaterThanZero'))
    .max(1000, t('realisticQtyMax1000'))
}

/** Positive currency rate in ₹, bounded to catch fat-finger entry. */
export function rateSchema(t: TFunction) {
  return z.coerce
    .number({ invalid_type_error: t('enterValidNumber') })
    .positive(t('mustBeGreaterThanZero'))
    .max(100000, t('realisticRateMax'))
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
