import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '../../config/env'
import { tokenStore } from '../auth/tokenStore'
import { ApiError, mapAxiosError } from './errors'

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

let refreshPromise: Promise<string | null> | null = null
let onUnauthorized: (() => void) | null = null
let onForbidden: (() => void) | null = null

export function setAuthHandlers(handlers: {
  onUnauthorized?: () => void
  onForbidden?: () => void
}) {
  onUnauthorized = handlers.onUnauthorized ?? null
  onForbidden = handlers.onForbidden ?? null
}

function isAuthPath(url?: string): boolean {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/register') ||
    url.includes('/auth/logout')
  )
}

/** Bare client — no interceptors — used only for token refresh. */
const refreshClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.getRefreshToken()
  if (!refresh) return null

  try {
    const { data } = await refreshClient.post<{
      data: { accessToken: string; refreshToken?: string }
    }>('/auth/refresh', { refreshToken: refresh })

    const nextAccess = data.data.accessToken
    const nextRefresh = data.data.refreshToken ?? refresh
    tokenStore.setTokens(nextAccess, nextRefresh)
    return nextAccess
  } catch (err) {
    // Only wipe the session when the server rejects the refresh token.
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    if (status === 401 || status === 403) {
      tokenStore.clear()
    }
    return null
  }
}

export function ensureRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  if (!isAuthPath(config.url)) {
    const access = tokenStore.getAccessToken()
    // If we have a refresh token but no access token (tab reload), refresh first.
    if (!access && tokenStore.getRefreshToken()) {
      const next = await ensureRefresh()
      if (next) {
        config.headers.Authorization = `Bearer ${next}`
      }
    } else if (access) {
      config.headers.Authorization = `Bearer ${access}`
    }
  }
  if (env.enableApiLogs) {
    console.debug('[api]', config.method?.toUpperCase(), config.url, config.params ?? '')
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (env.enableApiLogs) {
      console.debug('[api:ok]', response.config.url, response.status)
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (
      status === 401 &&
      config &&
      !config._retry &&
      !config._skipAuthRefresh &&
      !isAuthPath(config.url)
    ) {
      config._retry = true
      const next = await ensureRefresh()
      if (next) {
        config.headers.Authorization = `Bearer ${next}`
        return apiClient.request(config)
      }
      onUnauthorized?.()
    }

    if (status === 403) {
      onForbidden?.()
    }

    const mapped = mapAxiosError(error)
    if (env.enableApiLogs) {
      console.debug('[api:err]', mapped.code, mapped.message, mapped.requestId)
    }
    return Promise.reject(mapped)
  },
)

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<{ data: T }>(url, { params })
  return data.data
}

export async function apiGetWithMeta<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<{ data: T; meta: import('../../types/api').PaginationMeta }> {
  const { data } = await apiClient.get<{ data: T; meta: import('../../types/api').PaginationMeta }>(
    url,
    { params },
  )
  return { data: data.data, meta: data.meta }
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<{ data: T }>(url, body)
  return data.data
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.patch<{ data: T }>(url, body)
  return data.data
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.put<{ data: T }>(url, body)
  return data.data
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
