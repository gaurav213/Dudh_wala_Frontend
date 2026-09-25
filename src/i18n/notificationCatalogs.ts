import en from './notifications/en.json'
import hi from './notifications/hi.json'
import mr from './notifications/mr.json'

export type NotifEntry = { title: string; body: string }
export type NotifCatalog = Record<string, NotifEntry>

export const notificationCatalogs: Record<'en' | 'hi' | 'mr', NotifCatalog> = {
  en: en as NotifCatalog,
  hi: hi as NotifCatalog,
  mr: mr as NotifCatalog,
}

const typeToKey: Record<string, string> = {
  OUT_FOR_DELIVERY: 'notifOutForDelivery',
  MILK_DELIVERED: 'notifMilkDelivered',
  CUSTOMER_NO_MILK_TODAY: 'notifCustomerNoMilk',
  FARM_NO_DELIVERY_TODAY: 'notifFarmNoDeliveryToday',
  CUSTOMER_CONFIRMED_DELIVERY: 'notifCustomerConfirmed',
  CUSTOMER_MARKED_RECEIVED: 'notifCustomerMarkedReceived',
  DELIVERY_ISSUE_RESOLVED: 'notifIssueResolved',
  CUSTOMER_REPORTED_NOT_RECEIVED: 'notifIssueReported',
  WRONG_QUANTITY_REPORTED: 'notifIssueReported',
  DELIVERY_EDITED: 'notifDeliveryEdited',
  DELIVERY_QUANTITY_CHANGED: 'notifQuantityChanged',
  DELIVERY_EXTRA_CHANGED: 'notifExtraChanged',
  DELIVERY_AMOUNT_CHANGED: 'notifAmountChanged',
  DELIVERY_EDIT_CONFIRMED: 'notifEditConfirmed',
  DELIVERY_EDIT_FLAGGED: 'notifEditFlagged',
  EXTRA_MILK_REQUESTED: 'notifExtraRequested',
  EXTRA_REQUEST_ACCEPTED: 'notifExtraAccepted',
  EXTRA_REQUEST_REJECTED: 'notifExtraRejected',
  CASH_PAYMENT_RECORDED: 'notifCashRecorded',
  CASH_PAYMENT_CLAIMED: 'notifCashToConfirm',
  CASH_PAYMENT_CONFIRMED: 'notifCashConfirmed',
  CASH_PAYMENT_REJECTED: 'notifCashRejected',
  PRODUCT_RATE_CHANGED: 'notifRateUpdated',
  SERVICE_REQUEST_CREATED: 'notifServiceRequestCreated',
  SERVICE_REQUEST_ACCEPTED: 'notifServiceRequestAccepted',
  SERVICE_REQUEST_CANCELLED: 'notifServiceRequestCancelled',
  CUSTOMER_REVIEW_ADDED: 'notifReviewAdded',
  CUSTOMER_REVIEW_REPORTED: 'notifReviewReported',
}

function interpolate(
  template: string,
  params?: Record<string, string | number | null | undefined>,
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key]
    return v === null || v === undefined ? '' : String(v)
  })
}

function extractParams(template: string, actual: string): Record<string, string> | undefined {
  const re = /\{(\w+)\}/g
  const keys: string[] = []
  const parts: string[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(template))) {
    parts.push(template.slice(last, m.index))
    keys.push(m[1])
    last = m.index + m[0].length
  }
  parts.push(template.slice(last))
  if (!keys.length) return actual === template ? {} : undefined
  if (!actual.startsWith(parts[0])) return undefined
  let rest = actual.slice(parts[0].length)
  const out: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    const lit = parts[i + 1]
    if (!lit) {
      out[keys[i]] = rest
      rest = ''
      continue
    }
    const idx = rest.indexOf(lit)
    if (idx < 0) return undefined
    out[keys[i]] = rest.slice(0, idx)
    rest = rest.slice(idx + lit.length)
  }
  if (rest) return undefined
  return out
}

function resolveKey(
  messageKey: string | undefined,
  fallbackTitle: string,
  type?: string,
): string | undefined {
  if (messageKey) return messageKey
  for (const [key, entry] of Object.entries(notificationCatalogs.en)) {
    if (entry.title === fallbackTitle) return key
  }
  if (type && typeToKey[type]) return typeToKey[type]
  return undefined
}

export function resolveNotificationCopy(
  lang: string | undefined,
  messageKey: string | undefined,
  params: Record<string, string | number | null | undefined> | undefined,
  fallback: { title: string; body: string },
  type?: string,
): { title: string; body: string } {
  const key = resolveKey(messageKey, fallback.title, type)
  if (!key) return fallback
  let resolvedParams = params
  if (!resolvedParams || Object.keys(resolvedParams).length === 0) {
    const extracted = extractParams(notificationCatalogs.en[key]?.body ?? '', fallback.body)
    if (extracted) resolvedParams = extracted
  }
  const code = lang?.toLowerCase().startsWith('hi')
    ? 'hi'
    : lang?.toLowerCase().startsWith('mr')
      ? 'mr'
      : 'en'
  const entry =
    notificationCatalogs[code][key] ?? notificationCatalogs.en[key]
  if (!entry) return fallback
  return {
    title: interpolate(entry.title, resolvedParams),
    body: interpolate(entry.body, resolvedParams),
  }
}
