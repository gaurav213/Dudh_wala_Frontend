import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as RouterLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/forms/FormFields'
import { useAuth } from '../../../lib/auth/useAuth'
import { homePathForRole } from '../../../lib/auth/homePath'
import { friendlyAuthError } from '../../../lib/api/errors'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { appBrand } from '../../../branding/appBrand'
import { AuthShell } from '../components/AuthShell'

export function LoginPage() {
  const { login, isAuthenticated, isBootstrapping, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const registeredMessage =
    (location.state as { registered?: boolean; message?: string } | null)?.message ?? null
  const schema = useMemo(() => loginSchema(t), [t])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mobileNumber: '', password: '' },
  })

  if (!isBootstrapping && isAuthenticated && user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const loggedIn = await login(values)
      const from = (location.state as { from?: string } | null)?.from
      const fallback = homePathForRole(loggedIn.role)
      // Only honor deep-link "from" for roles that can use the console.
      const dest =
        from && (loggedIn.role === 'PLATFORM_OWNER' || loggedIn.role === 'FARM_OWNER')
          ? from
          : fallback
      navigate(dest, { replace: true })
    } catch (error) {
      setSubmitError(friendlyAuthError(error, t))
    }
  })

  return (
    <AuthShell
      title={appBrand.name}
      subtitle={t('signIn')}
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
          {registeredMessage ? <Alert severity="success">{registeredMessage}</Alert> : null}
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <FormTextField
            name="mobileNumber"
            control={control}
            label={t('mobileNumber')}
            type="tel"
            autoComplete="tel"
            fullWidth
            required
            helperText={t('invalidMobile')}
            inputProps={{ 'aria-required': true, inputMode: 'numeric' }}
          />
          <FormTextField
            name="password"
            control={control}
            label={t('password')}
            type="password"
            autoComplete="current-password"
            fullWidth
            required
            inputProps={{ 'aria-required': true }}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('signingIn') : t('signIn')}
          </Button>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              {t('createAccount')}
            </Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/register/farm-owner"
            variant="outlined"
            size="large"
            fullWidth
          >
            {t('register')} — {t('farm')}
          </Button>
          <Button
            component={RouterLink}
            to="/register/customer"
            variant="text"
            size="large"
            fullWidth
          >
            {t('register')} — {t('customer')}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  )
}
