/**
 * Token storage strategy
 * -----------------------
 * Access + refresh tokens are kept in memory by default (lost on refresh).
 *
 * Optional session bootstrap: a refresh token may be placed in sessionStorage
 * under REFRESH_STORAGE_KEY so a browser tab reload can silently re-auth.
 * sessionStorage is safer than localStorage (cleared when the tab closes) but
 * is still XSS-readable. Never store long-lived tokens in plain localStorage
 * without documenting the XSS risk and preferring httpOnly cookies from the API.
 */

const REFRESH_STORAGE_KEY = 'dk_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken
  },

  getRefreshToken(): string | null {
    if (refreshToken) return refreshToken
    try {
      return sessionStorage.getItem(REFRESH_STORAGE_KEY)
    } catch {
      return null
    }
  },

  setTokens(access: string, refresh: string, persistRefresh = true): void {
    accessToken = access
    refreshToken = refresh
    if (persistRefresh) {
      try {
        sessionStorage.setItem(REFRESH_STORAGE_KEY, refresh)
      } catch {
        // ignore quota / private mode
      }
    }
  },

  clear(): void {
    accessToken = null
    refreshToken = null
    try {
      sessionStorage.removeItem(REFRESH_STORAGE_KEY)
    } catch {
      // ignore
    }
  },
}
