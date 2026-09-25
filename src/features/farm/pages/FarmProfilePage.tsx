import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { uploadAssetUrl } from '../../../config/env'
import { isApiError } from '../../../lib/api/client'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import { formatDate } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { UpdateFarmPayload } from '../types/farm'

const MAX_FARM_PHOTOS = 5
const MAX_LANGUAGES = 5
const LANGUAGE_OPTIONS = ['mr', 'hi', 'en', 'gu', 'kn', 'ta'] as const

const emptyForm: UpdateFarmPayload = {
  name: '',
  businessName: '',
  description: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  area: '',
  city: '',
  state: '',
  postalCode: '',
  spokenLanguages: [],
}

export function FarmProfilePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { farm, farmId, isLoading, isError, error, refetch } = useMyFarm()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<UpdateFarmPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (farm) {
      setForm({
        name: farm.name,
        businessName: farm.businessName ?? '',
        description: farm.description ?? '',
        email: farm.email ?? '',
        addressLine1: farm.addressLine1,
        addressLine2: farm.addressLine2 ?? '',
        area: farm.area,
        city: farm.city,
        state: farm.state,
        postalCode: farm.postalCode,
        spokenLanguages: farm.spokenLanguages ?? [],
      })
    }
  }, [farm])

  const mediaQuery = useQuery({
    queryKey: ['farm', farmId, 'media'],
    queryFn: () => farmApi.listMedia(farmId!),
    enabled: Boolean(farmId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['farm', 'my'] })
    void queryClient.invalidateQueries({ queryKey: ['farm', 'dashboard'] })
  }

  const refreshMedia = () =>
    refreshQueries(queryClient, [['farm', farmId!, 'media']])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateFarmPayload) => farmApi.updateFarm(farmId!, payload),
    onSuccess: () => {
      invalidate()
      setEditOpen(false)
      setFormError(null)
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => farmApi.deactivateFarm(farmId!),
    onSuccess: invalidate,
    onError: (err) => setActionError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const requestDeletionMutation = useMutation({
    mutationFn: () => farmApi.requestDeletion(farmId!),
    onSuccess: (result) => {
      invalidate()
      setActionError(result.deleted ? null : result.message)
    },
    onError: (err) =>
      setActionError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const uploadMediaMutation = useMutation({
    mutationFn: (file: File) => farmApi.uploadMedia(farmId!, file),
    onSuccess: async () => {
      setMediaError(null)
      await refreshMedia()
    },
    onError: (err) =>
      setMediaError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) => farmApi.deleteMedia(farmId!, mediaId),
    onSuccess: async () => {
      setMediaError(null)
      await refreshMedia()
    },
    onError: (err) =>
      setMediaError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  if (isLoading) return <LoadingState label={t('loading')} />
  if (isError || !farm) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(error as Error)?.message}
        onRetry={() => void refetch()}
      />
    )
  }

  const onSave = () => {
    if (!form.name?.trim() || !form.addressLine1?.trim() || !form.city?.trim()) {
      setFormError(t('fieldRequired'))
      return
    }
    updateMutation.mutate(form)
  }

  const toggleLanguage = (code: string) => {
    setForm((f) => {
      const selected = f.spokenLanguages ?? []
      if (selected.includes(code)) {
        return { ...f, spokenLanguages: selected.filter((c) => c !== code) }
      }
      if (selected.length >= MAX_LANGUAGES) {
        setFormError(t('language'))
        return f
      }
      setFormError(null)
      return { ...f, spokenLanguages: [...selected, code] }
    })
  }

  const languageLabel = (code: string) =>
    code === 'mr'
      ? t('langMarathi')
      : code === 'hi'
        ? t('langHindi')
        : code === 'en'
          ? t('langEnglish')
          : ({ gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ta: 'தமிழ்' }[code] ?? code)


  return (
    <Box>
      <PageHeader
        title={t('farmProfile')}
        subtitle={t('details')}
        actions={
          <Button variant="contained" onClick={() => setEditOpen(true)}>
            {t('editProfile')}
          </Button>
        }
      />

      {actionError ? (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {farm.name}
            </Typography>
            <StatusChip status={farm.status} />
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('name')}
              </Typography>
              <Typography>{farm.businessName || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('emailOptional')}
              </Typography>
              <Typography>{farm.email || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('mobileNumber')}
              </Typography>
              <Typography>{farm.mobileNumber}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('status')}
              </Typography>
              <Typography>{formatDate(farm.createdAt)}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                {t('details')}
              </Typography>
              <Typography>{farm.description || '—'}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                {t('language')} ({(farm.spokenLanguages ?? []).length}/{MAX_LANGUAGES})
              </Typography>
              {(farm.spokenLanguages ?? []).length === 0 ? (
                <Typography>—</Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {(farm.spokenLanguages ?? []).map((code) => (
                    <Chip key={code} size="small" label={languageLabel(code)} />
                  ))}
                </Stack>
              )}
            </Grid>
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('address')}
              </Typography>
              <Typography>
                {farm.addressLine1}
                {farm.addressLine2 ? `, ${farm.addressLine2}` : ''}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                {t('address')}
              </Typography>
              <Typography>
                {farm.area}, {farm.city}, {farm.state} {farm.postalCode}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography fontWeight={700}>{t('farm')} {t('photo')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('customers')} · {MAX_FARM_PHOTOS}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              disabled={
                uploadMediaMutation.isPending ||
                (mediaQuery.data?.length ?? 0) >= MAX_FARM_PHOTOS
              }
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMediaMutation.isPending ? t('upload') : `${t('add')} ${t('photo')}`}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) uploadMediaMutation.mutate(file)
              }}
            />
          </Stack>
          {mediaError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMediaError(null)}>
              {mediaError}
            </Alert>
          ) : null}
          {(mediaQuery.data?.length ?? 0) === 0 ? (
            <Typography color="text.secondary">{t('noData')}</Typography>
          ) : (
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {mediaQuery.data!.map((img) => (
                <Box key={img.id} sx={{ position: 'relative', flex: '0 0 auto' }}>
                  <Box
                    component="img"
                    src={uploadAssetUrl(img.url) ?? undefined}
                    alt=""
                    sx={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 2 }}
                  />
                  <IconButton
                    size="small"
                    aria-label={t('delete')}
                    disabled={deleteMediaMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`${t('delete')} ${t('photo')}?`)) {
                        deleteMediaMutation.mutate(img.id)
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={700} gutterBottom>
            {t('warning')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('warning')} · {t('farm')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              color="warning"
              variant="outlined"
              disabled={deactivateMutation.isPending || farm.status === 'CLOSED'}
              onClick={() => {
                if (window.confirm(`${t('cancel')} ${t('farm')}?`)) {
                  deactivateMutation.mutate()
                }
              }}
            >
              {t('cancel')} {t('farm')}
            </Button>
            <Button
              color="error"
              variant="outlined"
              disabled={requestDeletionMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `${t('delete')} ${t('farm')}?`,
                  )
                ) {
                  requestDeletionMutation.mutate()
                }
              }}
            >
              {t('delete')} {t('farm')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('editProfile')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label={`${t('farm')} ${t('name')}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('name')}
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('emailOptional')}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('details')}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {t('language')} ({(form.spokenLanguages ?? []).length}/{MAX_LANGUAGES})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {t('select')} {t('language')} · {MAX_LANGUAGES}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {LANGUAGE_OPTIONS.map((code) => {
                  const selected = (form.spokenLanguages ?? []).includes(code)
                  return (
                    <Chip
                      key={code}
                      label={languageLabel(code)}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      onClick={() => toggleLanguage(code)}
                    />
                  )
                })}
              </Stack>
            </Box>
            <TextField
              label={t('address')}
              value={form.addressLine1}
              onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('address')}
              value={form.addressLine2}
              onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('address')}
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label={t('city')}
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                fullWidth
                required
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('state')}
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('postalCode')}
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={onSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
