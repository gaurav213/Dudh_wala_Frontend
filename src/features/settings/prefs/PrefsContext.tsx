import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { apiPatch } from '../../../lib/api/client'
import {
  persistLocale,
  readStoredLocale,
  type AppLocale,
} from '../../../i18n'
import {
  persistThemeMode,
  readStoredThemeMode,
  resolveThemeMode,
  type ThemeModePref,
} from './themePrefs'

export type PrefsContextValue = {
  themeMode: ThemeModePref
  resolvedMode: 'light' | 'dark'
  setThemeMode: (mode: ThemeModePref) => void
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const PrefsContext = createContext<PrefsContextValue | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [themeMode, setThemeModeState] = useState<ThemeModePref>(() => readStoredThemeMode())
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() =>
    resolveThemeMode(readStoredThemeMode()),
  )
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale())

  useEffect(() => {
    const apply = () => setResolvedMode(resolveThemeMode(themeMode))
    apply()
    if (themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [themeMode])

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedMode
  }, [resolvedMode])

  const setThemeMode = useCallback((mode: ThemeModePref) => {
    setThemeModeState(mode)
    persistThemeMode(mode)
  }, [])

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next)
      persistLocale(next)
      document.documentElement.lang = next
      await i18n.changeLanguage(next)
      try {
        await apiPatch('/auth/profile', { preferredLanguage: next })
      } catch {
        // Offline / logged out — local locale still applied.
      }
    },
    [i18n],
  )

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({ themeMode, resolvedMode, setThemeMode, locale, setLocale }),
    [themeMode, resolvedMode, setThemeMode, locale, setLocale],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}
