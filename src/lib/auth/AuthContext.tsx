import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthHandlers } from '../api/client'
import { tokenStore } from './tokenStore'
import { queryClient } from '../query/client'
import type { AuthUser, LoginRequest } from '../../types/auth'
import { authApi } from '../../features/auth/api/authApi'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginRequest) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  uploadAvatar: (photo: File) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    queryClient.clear()
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }, [clearSession, navigate])

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.profile()
    setUser(profile.user)
  }, [])

  const uploadAvatar = useCallback(async (photo: File) => {
    const next = await authApi.uploadAvatar(photo)
    setUser(next)
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const result = await authApi.login(payload)
    tokenStore.setTokens(result.accessToken, result.refreshToken)
    setUser(result.user)
    return result.user
  }, [])

  useEffect(() => {
    setAuthHandlers({
      onUnauthorized: () => {
        clearSession()
        navigate('/session-expired', { replace: true })
      },
      // Do not hard-redirect on 403 — pages show their own errors.
      // Global redirect caused false "Unauthorized" after login.
      onForbidden: undefined,
    })
  }, [clearSession, navigate])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const refresh = tokenStore.getRefreshToken()
      if (!refresh) {
        if (!cancelled) setIsBootstrapping(false)
        return
      }

      try {
        const tokens = await authApi.refresh(refresh)
        tokenStore.setTokens(tokens.accessToken, tokens.refreshToken ?? refresh)
        const profile = await authApi.profile()
        if (!cancelled) setUser(profile.user)
      } catch {
        // Transient refresh failure keeps the refresh token; only wipe UI if it's gone.
        if (!tokenStore.getRefreshToken()) {
          if (!cancelled) setUser(null)
        } else {
          try {
            const profile = await authApi.profile()
            if (!cancelled) setUser(profile.user)
          } catch {
            if (!cancelled) setUser(null)
          }
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
      refreshProfile,
      uploadAvatar,
    }),
    [user, isBootstrapping, login, logout, refreshProfile, uploadAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
