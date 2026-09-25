import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../components/tables/DataTable'
import { uploadAssetUrl } from '../../../config/env'
import { isApiError } from '../../../lib/api/client'
import { useAuth } from '../../../lib/auth/useAuth'

function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase()
}

export function CustomerProfilePage() {
  const { t } = useTranslation()
  const { user, uploadAvatar } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = async (file?: File | null) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadAvatar(file)
    } catch (err) {
      setError(isApiError(err) ? err.message : t('somethingWentWrong'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <PageHeader title={t('profile')} subtitle={t('details')} />
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={uploadAssetUrl(user?.avatarUrl) ?? undefined}
                sx={{ width: 72, height: 72, fontWeight: 700 }}
              >
                {initials(user?.name)}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{user?.name}</Typography>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  sx={{ mt: 0.5 }}
                >
                  {busy ? t('upload') : `${t('update')} ${t('photo')}`}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    void onPick(file)
                  }}
                />
              </Box>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Row label={t('name')} value={user?.name} />
            <Row label={t('mobileNumber')} value={user?.mobileNumber} />
            <Row label={t('emailOptional')} value={user?.email || '—'} />
            <Row label={t('profile')} value={user?.role} />
            <Row label={t('status')} value={user?.status} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600}>{value || '—'}</Typography>
    </Box>
  )
}
