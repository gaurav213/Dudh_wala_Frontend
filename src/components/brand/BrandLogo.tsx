import { Box, Typography } from '@mui/material'
import { appBrand } from '../../branding/appBrand'

export type BrandLogoVariant = 'full' | 'compact' | 'mono' | 'light' | 'dark'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  height?: number
  showTagline?: boolean
  alt?: string
}

function markSrc(variant: BrandLogoVariant): string {
  switch (variant) {
    case 'mono':
      return appBrand.logoMono
    case 'dark':
      return appBrand.logoOnDark
    case 'compact':
    case 'light':
    case 'full':
    default:
      return appBrand.logoCompact
  }
}

/** Reusable Doodh Wala logo — Bullet mark PNG + optional wordmark. */
export function BrandLogo({
  variant = 'full',
  height = 40,
  showTagline = false,
  alt = appBrand.name,
}: BrandLogoProps) {
  const compact = variant === 'compact' || variant === 'mono'
  const onDark = variant === 'dark'
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: compact ? 'center' : 'flex-start',
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="img"
          src={markSrc(variant)}
          alt={alt}
          sx={{
            height,
            width: height,
            display: 'block',
            objectFit: 'contain',
          }}
        />
        {!compact ? (
          <Typography
            component="span"
            sx={{
              fontFamily: 'Georgia, Fraunces, serif',
              fontWeight: 700,
              fontSize: Math.min(34, Math.max(18, height * 0.42)),
              color: onDark ? '#fff' : 'primary.dark',
              lineHeight: 1.1,
            }}
          >
            {appBrand.name}
          </Typography>
        ) : null}
      </Box>
      {showTagline ? (
        <Typography
          variant="caption"
          sx={{ mt: 0.5, color: onDark ? 'rgba(255,255,255,0.85)' : 'text.secondary' }}
        >
          {appBrand.tagline}
        </Typography>
      ) : null}
    </Box>
  )
}
