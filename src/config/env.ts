export const env = {
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  enableApiLogs: import.meta.env.VITE_ENABLE_API_LOGS === 'true',
  isDev: (import.meta.env.VITE_APP_ENV ?? 'development') === 'development',
} as const
