import { Alert, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../lib/auth/useAuth'

export function DeliveryProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>
        {t('profile')}
      </Typography>
      <Alert severity="info">
        {t('signIn')} · <strong>{user?.name}</strong> ({user?.mobileNumber}) · {user?.role}.{' '}
        <strong>{t('datesToday')}</strong> · {t('markDelivered')} · {t('extra')} · {t('skip')}
      </Alert>
    </Stack>
  )
}
