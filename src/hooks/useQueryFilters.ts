import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo, useRef } from 'react'

/**
 * Sync report/list filters with URL query params (server-side pagination friendly).
 */
export function useQueryFilters<T extends Record<string, string | undefined>>(
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults

  const values = useMemo(() => {
    const base = defaultsRef.current
    const next = { ...base }
    for (const key of Object.keys(base) as (keyof T)[]) {
      const raw = searchParams.get(String(key))
      if (raw !== null && raw !== '') {
        next[key] = raw as T[keyof T]
      }
    }
    return next
  }, [searchParams])

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        const base = defaultsRef.current
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === '' || value === base[key as keyof T]) {
            params.delete(key)
          } else {
            params.set(key, String(value))
          }
        }
        return params
      })
    },
    [setSearchParams],
  )

  const reset = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  return [values, setFilters, reset]
}
