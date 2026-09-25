import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'

export const SUPPORTED_LOCALES = ['en', 'hi', 'mr'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_LOCALE = 'prefs.locale'

export function readStoredLocale(): AppLocale {
  const raw = localStorage.getItem(STORAGE_LOCALE)
  if (raw === 'hi' || raw === 'mr' || raw === 'en') return raw
  return 'en'
}

export function persistLocale(locale: AppLocale) {
  localStorage.setItem(STORAGE_LOCALE, locale)
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: readStoredLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
