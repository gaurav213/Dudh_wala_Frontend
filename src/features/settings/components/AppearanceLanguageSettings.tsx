import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { AppLocale } from '../../../i18n'
import { usePrefs } from '../prefs/usePrefs'
import type { ThemeModePref } from '../prefs/themePrefs'

export function AppearanceLanguageSettings() {
  const { t } = useTranslation()
  const { themeMode, setThemeMode, locale, setLocale } = usePrefs()

  return (
    <Stack spacing={3}>
      <FormControl>
        <FormLabel>{t('appearance')}</FormLabel>
        <RadioGroup
          value={themeMode}
          onChange={(_, value) => setThemeMode(value as ThemeModePref)}
        >
          <FormControlLabel value="light" control={<Radio />} label={t('themeLight')} />
          <FormControlLabel value="dark" control={<Radio />} label={t('themeDark')} />
          <FormControlLabel value="system" control={<Radio />} label={t('themeSystem')} />
        </RadioGroup>
        <FormHelperText>{t('themeSystemHint')}</FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel>{t('language')}</FormLabel>
        <RadioGroup
          value={locale}
          onChange={(_, value) => void setLocale(value as AppLocale)}
        >
          <FormControlLabel value="en" control={<Radio />} label={t('langEnglish')} />
          <FormControlLabel value="hi" control={<Radio />} label={t('langHindi')} />
          <FormControlLabel value="mr" control={<Radio />} label={t('langMarathi')} />
        </RadioGroup>
      </FormControl>
    </Stack>
  )
}
