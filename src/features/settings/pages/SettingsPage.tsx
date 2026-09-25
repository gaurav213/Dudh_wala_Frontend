import { Card, CardContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../components/tables/DataTable'
import { AppearanceLanguageSettings } from '../components/AppearanceLanguageSettings'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('settings')} subtitle={t('settingsSubtitle')} />
      <Card variant="outlined">
        <CardContent>
          <AppearanceLanguageSettings />
        </CardContent>
      </Card>
    </>
  )
}
