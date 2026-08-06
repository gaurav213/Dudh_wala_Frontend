import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { FormTextField } from '../../../components/forms/FormFields'
import { useAuth } from '../../../lib/auth/useAuth'
import { isApiError } from '../../../lib/api/client'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'

export function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await login(values)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(isApiError(error) ? error.message : 'Login failed')
    }
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(ellipse at top left, rgba(20,184,166,0.18), transparent 50%), linear-gradient(160deg, #0F172A 0%, #134E4A 45%, #F1F5F9 45%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}>
            Doodh Khata
          </Typography>
          <Typography color="text.secondary">
            Sign in to the admin console to manage suppliers, deliveries, and billing.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2.5}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <FormTextField
              name="email"
              control={control}
              label="Email"
              type="email"
              autoComplete="username"
              fullWidth
              required
              inputProps={{ 'aria-required': true }}
            />
            <FormTextField
              name="password"
              control={control}
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              required
              inputProps={{ 'aria-required': true }}
            />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
