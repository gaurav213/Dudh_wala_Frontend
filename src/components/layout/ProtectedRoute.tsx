import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../feedback/LoadingState'
import { useAuth } from '../../lib/auth/useAuth'
import type { UserRole } from '../../types/api'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <LoadingState label="Restoring session…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
