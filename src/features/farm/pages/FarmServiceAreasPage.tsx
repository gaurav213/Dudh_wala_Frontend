import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { CreateServiceAreaPayload, FarmServiceArea } from '../types/farm'

const emptyForm: CreateServiceAreaPayload = {
  areaName: '',
  city: '',
  state: '',
  postalCode: '',
  serviceRadiusKm: '',
}

export function FarmServiceAreasPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FarmServiceArea | null>(null)
  const [form, setForm] = useState<CreateServiceAreaPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['farm', farmId, 'service-areas'],
    queryFn: () => farmApi.serviceAreas(farmId!),
    enabled: Boolean(farmId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'service-areas'] })

  const createMutation = useMutation({
    mutationFn: (payload: CreateServiceAreaPayload) =>
      farmApi.createServiceArea(farmId!, payload),
    onSuccess: () => {
      void invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateServiceAreaPayload) =>
      farmApi.updateServiceArea(farmId!, editing!.id, payload),
    onSuccess: () => {
      void invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteServiceArea(farmId!, id),
    onSuccess: invalidate,
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => farmApi.activateServiceArea(farmId!, id),
    onSuccess: invalidate,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => farmApi.deactivateServiceArea(farmId!, id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (area: FarmServiceArea) => {
    setEditing(area)
    setForm({
      areaName: area.areaName,
      city: area.city,
      state: area.state,
      postalCode: area.postalCode ?? '',
      serviceRadiusKm: area.serviceRadiusKm ?? '',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setFormError(null)
  }

  const onSave = () => {
    if (!form.areaName.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError(t('fieldRequired'))
      return
    }
    const payload: CreateServiceAreaPayload = {
      areaName: form.areaName.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode?.trim() || undefined,
      serviceRadiusKm: form.serviceRadiusKm?.trim() || undefined,
    }
    if (editing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (farmLoading || query.isLoading) return <LoadingState label={t('loading')} />
  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const areas = query.data ?? []

  return (
    <Box>
      <PageHeader
        title={t('serviceAreas')}
        subtitle={`${t('city')} · ${t('postalCode')} · ${t('delivery')}`}
        actions={
          <Button variant="contained" onClick={openCreate}>
            {t('add')} {t('serviceAreas')}
          </Button>
        }
      />

      {areas.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('serviceAreas')}
          action={
            <Button variant="contained" onClick={openCreate}>
              {t('add')} {t('serviceAreas')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {areas.map((area) => (
            <Card key={area.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={700}>{area.areaName}</Typography>
                      <StatusChip status={area.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {area.city}, {area.state} {area.postalCode ? `· ${area.postalCode}` : ''}
                      {area.serviceRadiusKm ? ` · ${area.serviceRadiusKm} km radius` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => openEdit(area)}>
                      {t('edit')}
                    </Button>
                    {area.status === 'ACTIVE' ? (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => deactivateMutation.mutate(area.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        {t('cancel')}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="success"
                        onClick={() => activateMutation.mutate(area.id)}
                        disabled={activateMutation.isPending}
                      >
                        {t('active')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm(`${t('delete')} "${area.areaName}"?`)) {
                          deleteMutation.mutate(area.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {t('delete')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('edit') : t('add')} {t('serviceAreas')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label={`${t('address')} ${t('name')}`}
              value={form.areaName}
              onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('city')}
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label={t('state')}
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                fullWidth
                required
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('postalCode')}
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('serviceAreas')}
                value={form.serviceRadiusKm}
                onChange={(e) => setForm((f) => ({ ...f, serviceRadiusKm: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
