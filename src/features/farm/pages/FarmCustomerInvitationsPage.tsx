import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { CreateCustomerInvitationPayload, DeliveryShift } from '../types/farm'

interface FormState {
  mobileNumber: string
  customerName: string
  productId: string
  quantity: string
  deliveryShift: DeliveryShift
  proposedRate: string
  preferredStartDate: string
  deliveryInstructions: string
}

function emptyForm(): FormState {
  return {
    mobileNumber: '',
    customerName: '',
    productId: '',
    quantity: '1',
    deliveryShift: 'MORNING',
    proposedRate: '',
    preferredStartDate: new Date().toISOString().slice(0, 10),
    deliveryInstructions: '',
  }
}

export function FarmCustomerInvitationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [form, setForm] = useState<FormState>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)

  const productsQuery = useQuery({
    queryKey: ['farm', farmId, 'products'],
    queryFn: () => farmApi.products(farmId!),
    enabled: Boolean(farmId),
  })

  const invitationsQuery = useQuery({
    queryKey: ['farm', farmId, 'customer-invitations'],
    queryFn: () => farmApi.customerInvitations(farmId!, { limit: 50 }),
    enabled: Boolean(farmId),
  })

  const availableProducts = useMemo(
    () => (productsQuery.data ?? []).filter((p) => p.isAvailable),
    [productsQuery.data],
  )

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'customer-invitations'] })
    void queryClient.invalidateQueries({ queryKey: ['farm', 'dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerInvitationPayload) =>
      farmApi.createCustomerInvitation(farmId!, payload),
    onSuccess: () => {
      invalidate()
      setForm(emptyForm())
      setFormError(null)
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => farmApi.cancelCustomerInvitation(farmId!, id),
    onSuccess: invalidate,
  })

  const onSelectProduct = (productId: string) => {
    const product = availableProducts.find((p) => p.id === productId)
    setForm((f) => ({
      ...f,
      productId,
      proposedRate: product ? product.currentRatePerLitre : f.proposedRate,
      deliveryShift: product?.availableShifts[0] ?? f.deliveryShift,
    }))
  }

  const onSubmit = () => {
    if (
      !form.mobileNumber.trim() ||
      !form.productId ||
      !form.quantity.trim() ||
      !form.proposedRate.trim() ||
      !form.preferredStartDate
    ) {
      setFormError(t('fieldRequired'))
      return
    }
    createMutation.mutate({
      mobileNumber: form.mobileNumber.trim(),
      customerName: form.customerName.trim() || undefined,
      productId: form.productId,
      quantity: form.quantity.trim(),
      deliveryShift: form.deliveryShift,
      proposedRate: form.proposedRate.trim(),
      preferredStartDate: form.preferredStartDate,
      deliveryInstructions: form.deliveryInstructions.trim() || undefined,
    })
  }

  if (farmLoading) return <LoadingState label={t('loading')} />

  const selectedProduct = availableProducts.find((p) => p.id === form.productId)
  const invitations = invitationsQuery.data?.data ?? []
  const pending = invitations.filter((i) => i.status === 'PENDING')

  return (
    <Box>
      <PageHeader
        title={t('navCustomerInvitations')}
        subtitle={`${t('invite')} ${t('customers')}`}
      />

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {t('invite')} {t('customer')}
          </Typography>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}
          <Stack spacing={2} sx={{ maxWidth: 640 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('mobileNumber')}
                value={form.mobileNumber}
                onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label={`${t('customer')} ${t('name')} (${t('optional')})`}
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              select
              label={t('products')}
              value={form.productId}
              onChange={(e) => onSelectProduct(e.target.value)}
              fullWidth
              required
              disabled={availableProducts.length === 0}
              helperText={
                availableProducts.length === 0 ? t('noData') : undefined
              }
            >
              {availableProducts.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} · {formatCurrency(product.currentRatePerLitre)}/L
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('quantityL')}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                select
                label={t('shift')}
                value={form.deliveryShift}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deliveryShift: e.target.value as DeliveryShift }))
                }
                fullWidth
              >
                {(selectedProduct?.availableShifts?.length
                  ? selectedProduct.availableShifts
                  : (['MORNING'] as DeliveryShift[])
                ).map((shift) => (
                  <MenuItem key={shift} value={shift}>
                    {shift === 'MORNING'
                      ? t('morning')
                      : shift === 'AFTERNOON'
                        ? t('afternoon')
                        : shift === 'EVENING'
                          ? t('evening')
                          : shift}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t('ratePerLitre')}
                value={form.proposedRate}
                onChange={(e) => setForm((f) => ({ ...f, proposedRate: e.target.value }))}
                fullWidth
                required
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('from')}
                type="date"
                value={form.preferredStartDate}
                onChange={(e) => setForm((f) => ({ ...f, preferredStartDate: e.target.value }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label={`${t('delivery')} ${t('notesOptional')}`}
              value={form.deliveryInstructions}
              onChange={(e) => setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={createMutation.isPending}
              sx={{ alignSelf: 'flex-start' }}
            >
              {createMutation.isPending ? t('loading') : `${t('send')} ${t('invite')}`}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t('pending')} {t('invitations')}
      </Typography>
      {invitationsQuery.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : invitationsQuery.isError ? (
        <ErrorState
          title={t('couldNotLoad')}
          message={(invitationsQuery.error as Error).message}
          onRetry={() => void invitationsQuery.refetch()}
        />
      ) : pending.length === 0 ? (
        <EmptyState title={t('noData')} />
      ) : (
        <Stack spacing={2}>
          {pending.map((invitation) => (
            <Card key={invitation.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={700}>
                        {invitation.customerName || invitation.mobileNumber}
                      </Typography>
                      <StatusChip status={invitation.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {invitation.mobileNumber} · {formatLiters(invitation.quantity)} ·{' '}
                      {invitation.deliveryShift} · {formatCurrency(invitation.proposedRate)}/L ·
                      {t('from')} {formatDate(invitation.preferredStartDate)} · {t('to')}{' '}
                      {formatDate(invitation.expiresAt)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => cancelMutation.mutate(invitation.id)}
                    disabled={cancelMutation.isPending}
                  >
                    {t('cancel')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
