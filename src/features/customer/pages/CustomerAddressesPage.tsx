import { MapOutlined, MyLocationOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { customerApi, type CreateAddressPayload } from '../api/customerApi'

const emptyForm: CreateAddressPayload = {
  label: '',
  addressLine1: '',
  area: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: true,
}

function mapsUrl(lat: string, lng: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`
}

function readCurrentPosition(errorMessage: string): Promise<{ latitude: string; longitude: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(errorMessage))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        })
      },
      () => {
        reject(
          new Error(
            errorMessage,
          ),
        )
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    )
  })
}

export function CustomerAddressesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CreateAddressPayload>(() => ({
    ...emptyForm,
    label: t('navHome'),
  }))
  const [formError, setFormError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: customerApi.addresses,
  })

  const createMutation = useMutation({
    mutationFn: customerApi.createAddress,
    onSuccess: async () => {
      setForm({ ...emptyForm, label: t('navHome') })
      setFormError(null)
      await queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] })
    },
    onError: (error) => {
      setFormError(isApiError(error) ? error.message : t('somethingWentWrong'))
    },
  })

  const defaultMutation = useMutation({
    mutationFn: customerApi.setDefaultAddress,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: customerApi.removeAddress,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] })
    },
  })

  const pinMutation = useMutation({
    mutationFn: ({
      id,
      latitude,
      longitude,
    }: {
      id: string
      latitude: string
      longitude: string
    }) => customerApi.updateAddress(id, { latitude, longitude }),
    onSuccess: async () => {
      setPinError(null)
      setPinningId(null)
      await queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] })
    },
    onError: (error) => {
      setPinningId(null)
      setPinError(isApiError(error) ? error.message : t('somethingWentWrong'))
    },
  })

  const onCreate = () => {
    if (!form.addressLine1.trim() || !form.area.trim() || !form.city.trim()) {
      setFormError(t('fieldRequired'))
      return
    }
    createMutation.mutate({
      ...form,
      label: form.label.trim() || t('navHome'),
      addressLine1: form.addressLine1.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      state: form.state.trim() || 'Maharashtra',
      postalCode: form.postalCode.trim() || '000000',
    })
  }

  const markExactPoint = async (addressId: string) => {
    setPinError(null)
    setPinningId(addressId)
    try {
      const coords = await readCurrentPosition(t('somethingWentWrong'))
      pinMutation.mutate({ id: addressId, ...coords })
    } catch (error) {
      setPinningId(null)
      setPinError((error as Error).message)
    }
  }

  const markPinOnCreateForm = async () => {
    setFormError(null)
    try {
      const coords = await readCurrentPosition(t('somethingWentWrong'))
      setForm((f) => ({ ...f, ...coords }))
    } catch (error) {
      setFormError((error as Error).message)
    }
  }

  return (
    <Box>
      <PageHeader
        title={t('navAddresses')}
        subtitle={`${t('address')} · ${t('map')}`}
      />

      {listQuery.isLoading ? <LoadingState label={t('loading')} /> : null}
      {listQuery.isError ? (
        <ErrorState
          title={t('couldNotLoad')}
          message={(listQuery.error as Error).message}
          onRetry={() => void listQuery.refetch()}
        />
      ) : null}

      {pinError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPinError(null)}>
          {pinError}
        </Alert>
      ) : null}

      <Stack spacing={2} sx={{ mb: 4 }}>
        {(listQuery.data ?? []).map((address) => {
          const hasPin = Boolean(address.latitude && address.longitude)
          return (
            <Card key={address.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                  gap={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={700}>{address.label}</Typography>
                      {address.isDefault ? (
                        <Chip size="small" color="primary" label={t('defaultLabel')} />
                      ) : null}
                      <Chip
                        size="small"
                        color={hasPin ? 'success' : 'warning'}
                        variant="outlined"
                        label={hasPin ? t('saved') : t('noData')}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.area}, {address.city}, {address.state} {address.postalCode}
                    </Typography>
                    {hasPin ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                        {t('map')}: {Number(address.latitude).toFixed(5)},{' '}
                        {Number(address.longitude).toFixed(5)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="warning.dark" display="block" sx={{ mt: 0.75 }}>
                        {t('map')} · {t('deliverTo')}
                      </Typography>
                    )}
                  </Box>
                  <Stack spacing={1} sx={{ minWidth: { sm: 210 } }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<MyLocationOutlined />}
                      onClick={() => void markExactPoint(address.id)}
                      disabled={pinMutation.isPending && pinningId === address.id}
                    >
                      {pinMutation.isPending && pinningId === address.id
                        ? t('saving')
                        : hasPin
                          ? `${t('update')} ${t('map')}`
                          : `${t('markDelivered')} · ${t('map')}`}
                    </Button>
                    {hasPin ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MapOutlined />}
                        component="a"
                        href={mapsUrl(address.latitude!, address.longitude!)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('view')} {t('map')}
                      </Button>
                    ) : null}
                    {!address.isDefault ? (
                      <Button
                        size="small"
                        onClick={() => defaultMutation.mutate(address.id)}
                        disabled={defaultMutation.isPending}
                      >
                        {t('defaultLabel')}
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeMutation.mutate(address.id)}
                      disabled={removeMutation.isPending}
                    >
                      {t('delete')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
        {!listQuery.isLoading && !listQuery.data?.length ? (
          <Alert severity="info">{t('noData')} · {t('address')}</Alert>
        ) : null}
      </Stack>

      <Card variant="outlined" sx={{ maxWidth: 640 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            {t('add')} {t('address')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {t('address')} · {t('deliverTo')}
          </Typography>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}
          <Stack spacing={2}>
            <TextField
              label={t('name')}
              placeholder={t('navHome')}
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('address')}
              placeholder={t('address')}
              value={form.addressLine1}
              onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('address')}
              placeholder={t('optional')}
              value={form.addressLine2 ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('address')}
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
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
                sx={{ flex: 3 }}
              />
              <TextField
                label={t('postalCode')}
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                fullWidth
                sx={{ flex: 2 }}
              />
            </Stack>
            <TextField
              label={t('state')}
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('notes')}
              placeholder={t('notesOptional')}
              value={form.deliveryInstructions ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))
              }
              fullWidth
              multiline
              minRows={2}
            />
            <Alert
              severity={form.latitude && form.longitude ? 'success' : 'info'}
              icon={<MyLocationOutlined fontSize="inherit" />}
            >
              {form.latitude && form.longitude
                ? `${t('saved')} · ${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`
                : `${t('optional')} · ${t('map')}`}
            </Alert>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<MyLocationOutlined />}
                onClick={() => void markPinOnCreateForm()}
              >
                {form.latitude && form.longitude
                  ? `${t('update')} ${t('map')}`
                  : t('map')}
              </Button>
            </Stack>
            <Button
              variant="contained"
              onClick={onCreate}
              disabled={createMutation.isPending}
              sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minWidth: 160 }}
            >
              {createMutation.isPending ? t('saving') : t('save')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
