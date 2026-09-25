import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '../../../components/brand/BrandLogo'
import { appBrand } from '../../../branding/appBrand'

export function AuthShell({
  title,
  subtitle,
  children,
  maxWidth = 420,
}: {
  title: string
  subtitle: string
  children: ReactNode
  maxWidth?: number
}) {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        background:
          'radial-gradient(ellipse at top left, rgba(20,184,166,0.18), transparent 50%), linear-gradient(160deg, #0F172A 0%, #134E4A 45%, #F1F5F9 45%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth,
          p: { xs: 3, sm: 4 },
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Stack spacing={1.5} sx={{ mb: 3 }} alignItems="flex-start">
          <BrandLogo variant="full" height={48} />
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}>
            {title === appBrand.name ? t('welcomeTo', { name: appBrand.name }) : title}
          </Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </Stack>
        {children}
      </Paper>
    </Box>
  )
}
