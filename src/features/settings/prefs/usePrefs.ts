import { useContext } from 'react'
import { PrefsContext, type PrefsContextValue } from './PrefsContext'

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider')
  return ctx
}
