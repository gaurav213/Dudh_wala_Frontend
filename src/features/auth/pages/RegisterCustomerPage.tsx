import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/forms/FormFields'
import { useAuth } from '../../../lib/auth/useAuth'
import { friendlyAuthError } from '../../../lib/api/errors'
import { authApi } from '../api/authApi'
import { AuthShell } from '../components/AuthShell'
import {
  registerCustomerSchema,
  type RegisterCustomerFormValues,
} from '../schemas/registerSchema'

export function RegisterCustomerPage() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const schema = useMemo(() => registerCustomerSchema(t), [t])

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterCustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', mobileNumber: '', password: '' },
  })

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await authApi.registerCustomer(values)
      navigate('/login', {
        replace: true,
        state: {
          registered: true,
          message: t('success'),
        },
      })
    } catch (error) {
      setSubmitError(friendlyAuthError(error, t))
    }
  })

  return (
    <AuthShell
      title={`${t('register')} — ${t('customer')}`}
      subtitle={t('createAccount')}
    >
      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={2.5}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <FormTextField name="name" control={control} label={t('name')} fullWidth required />
          <FormTextField
            name="mobileNumber"
            control={control}
            label={t('mobileNumber')}
            type="tel"
            fullWidth
            required
          />
          <FormTextField
            name="password"
            control={control}
            label={t('password')}
            type="password"
            fullWidth
            required
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('registering') : t('createAccount')}
          </Button>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            <Button component={RouterLink} to="/login" size="small">
              {t('alreadyHaveAccount')}
            </Button>
          </Typography>
        </Stack>
      </Box>
    </AuthShell>
  )
}
