import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '../feedback/LoadingState'
import { useAuth } from '../../lib/auth/useAuth'
import { homePathForRole } from '../../lib/auth/homePath'
import type { UserRole } from '../../types/api'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (isBootstrapping) return <LoadingState label={t('restoringSession')} />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && user && !roles.includes(user.role)) {
    // Send the user to their own home — never bounce them into another
    // role's guarded route (that caused an infinite /customer loop for
    // DELIVERY_STAFF).
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <Outlet />
}
