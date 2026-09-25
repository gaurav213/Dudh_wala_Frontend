/** Map API delivery status / shift enums to i18n keys. */
export function deliveryStatusLabel(
  t: (key: string) => string,
  status: string | undefined | null,
): string {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDING':
      return t('pending')
    case 'OUT_FOR_DELIVERY':
      return t('outForDelivery')
    case 'DELIVERED':
      return t('delivered')
    case 'SKIPPED':
      return t('skipped')
    case 'FAILED':
      return t('failed')
    case 'CANCELLED':
      return t('cancelled')
    case 'DISPUTED':
      return t('disputed')
    case 'CONFIRMED':
    case 'CUSTOMER_CONFIRMED':
      return t('confirmed')
    default:
      return (status ?? '').replaceAll('_', ' ')
  }
}

export function deliveryShiftLabel(
  t: (key: string) => string,
  shift: string | undefined | null,
): string {
  switch ((shift ?? '').toUpperCase()) {
    case 'MORNING':
      return t('morning')
    case 'AFTERNOON':
      return t('afternoon')
    case 'EVENING':
      return t('evening')
    default:
      return shift ?? ''
  }
}
