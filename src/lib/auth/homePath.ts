import type { UserRole } from '../../types/api'
import { DELIVERY_STAFF_ENABLED } from '../../config/featureFlags'

/** Where to send a user after login, based on role. */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'CUSTOMER':
      return '/customer'
    case 'DELIVERY_STAFF':
      // TEMP: delivery-staff disabled — restore next update
      return DELIVERY_STAFF_ENABLED ? '/delivery' : '/unauthorized'
    case 'FARM_OWNER':
      return '/farm/today'
    case 'PLATFORM_OWNER':
    default:
      return '/'
  }
}
