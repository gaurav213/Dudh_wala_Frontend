import { Button, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '../../../components/brand/BrandLogo'
import { useAuth } from '../../../lib/auth/useAuth'

export function SessionExpiredPage() {
  const { t } = useTranslation()

  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" px={2}>
      <Paper sx={{ p: 4, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Stack alignItems="center" sx={{ mb: 2 }}>
          <BrandLogo variant="full" height={44} />
        </Stack>
        <Typography variant="h4" gutterBottom>
          {t('sessionExpired')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('sessionExpiredBody')}
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained">
          {t('backToLogin')}
        </Button>
      </Paper>
    </Stack>
  )
}

export function UnauthorizedPage() {
  const { logout, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" px={2}>
      <Paper sx={{ p: 4, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Stack alignItems="center" sx={{ mb: 2 }}>
          <BrandLogo variant="full" height={44} />
        </Stack>
        <Typography variant="h4" gutterBottom>
          {t('accessLimited')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('accessLimitedBody')}
        </Typography>
        {isAuthenticated ? (
          <Button variant="contained" onClick={() => void logout()}>
            {t('signOut')}
          </Button>
        ) : (
          <Button component={RouterLink} to="/login" variant="contained">
            {t('backToLogin')}
          </Button>
        )}
      </Paper>
    </Stack>
  )
}
