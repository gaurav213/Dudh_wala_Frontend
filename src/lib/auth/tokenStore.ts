/**
 * Token storage strategy
 * -----------------------
 * Access token stays in memory (short-lived).
 * Refresh token is persisted in localStorage so sessions survive browser
 * restarts (Instagram-style stay-signed-in). XSS can still read localStorage;
 * httpOnly cookies would be preferable once the API supports them.
 */

const REFRESH_STORAGE_KEY = 'dk_refresh_token'
const LEGACY_SESSION_KEY = 'dk_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null

function readPersistedRefresh(): string | null {
  try {
    const fromLocal = localStorage.getItem(REFRESH_STORAGE_KEY)
    if (fromLocal) return fromLocal
    // Migrate older sessionStorage sessions once.
    const fromSession = sessionStorage.getItem(LEGACY_SESSION_KEY)
    if (fromSession) {
      localStorage.setItem(REFRESH_STORAGE_KEY, fromSession)
      sessionStorage.removeItem(LEGACY_SESSION_KEY)
      return fromSession
    }
  } catch {
    // ignore quota / private mode
  }
  return null
}

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken
  },

  getRefreshToken(): string | null {
    if (refreshToken) return refreshToken
    const persisted = readPersistedRefresh()
    if (persisted) refreshToken = persisted
    return persisted
  },

  setTokens(access: string, refresh: string, persistRefresh = true): void {
    accessToken = access
    refreshToken = refresh
    if (persistRefresh) {
      try {
        localStorage.setItem(REFRESH_STORAGE_KEY, refresh)
        sessionStorage.removeItem(LEGACY_SESSION_KEY)
      } catch {
        // ignore quota / private mode
      }
    }
  },

  clear(): void {
    accessToken = null
    refreshToken = null
    try {
      localStorage.removeItem(REFRESH_STORAGE_KEY)
      sessionStorage.removeItem(LEGACY_SESSION_KEY)
    } catch {
      // ignore
    }
  },
}
