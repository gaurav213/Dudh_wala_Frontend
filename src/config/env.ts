function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL
  if (configured) return configured
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Refusing to start a production build against a default API URL — set it in the deployment environment.',
    )
  }
  return 'http://localhost:3000/api/v1'
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Doodh Wala',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  apiBaseUrl: resolveApiBaseUrl(),
  enableApiLogs: import.meta.env.VITE_ENABLE_API_LOGS === 'true',
  isDev: (import.meta.env.VITE_APP_ENV ?? 'development') === 'development',
} as const

/** Absolute URL for uploaded assets served at API origin (not under `/api/v1`). */
export function uploadAssetUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const origin = env.apiBaseUrl.replace(/\/api\/v\d+$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
