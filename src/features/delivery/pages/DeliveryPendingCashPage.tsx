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
import { PageHeader } from '../../../components/tables/DataTable'
import { uploadAssetUrl } from '../../../config/env'
import { isApiError } from '../../../lib/api/client'
import { formatCurrency, formatDate } from '../../../utils/format'
import { deliveryStaffApi, type PendingCashPayment } from '../api/deliveryStaffApi'
import { refreshQueries } from '../../../lib/query/refreshQueries'

export function DeliveryPendingCashPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<PendingCashPayment | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => new Set())

  const query = useQuery({
    queryKey: ['delivery-staff', 'pending-cash'],
    queryFn: () => deliveryStaffApi.pendingCash(),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => deliveryStaffApi.confirmCash(id),
    onSuccess: async (_data, id) => {
      setActionError(null)
      setResolvedIds((prev) => new Set(prev).add(id))
      await refreshQueries(queryClient, [
        ['delivery-staff', 'pending-cash'],
        ['delivery-staff', 'dashboard'],
      ])
    },
    onError: (err) => {
      setActionError(isApiError(err) ? err.message : (err as Error).message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      deliveryStaffApi.rejectCash(id, notes),
    onSuccess: async (_data, vars) => {
      setRejectTarget(null)
      setRejectNotes('')
      setActionError(null)
      setResolvedIds((prev) => new Set(prev).add(vars.id))
      await refreshQueries(queryClient, [
        ['delivery-staff', 'pending-cash'],
        ['delivery-staff', 'dashboard'],
      ])
    },
    onError: (err) => {
      setActionError(isApiError(err) ? err.message : (err as Error).message)
    },
  })

  if (query.isLoading) return <LoadingState label={t('loading')} />
  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const rows = (query.data ?? []).filter((row) => !resolvedIds.has(row.id))
  const busy = confirmMutation.isPending || rejectMutation.isPending

  return (
    <Box>
      <PageHeader
        title={t('pendingCash')}
        subtitle={`${t('confirm')} · ${t('reject')}`}
      />

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title={t('noPendingCash')}
          description={t('pendingCash')}
        />
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => {
            const proofUrl = uploadAssetUrl(row.proofImageUrl)
            const name = row.customer?.name ?? t('customer')
            return (
              <Card key={row.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ sm: 'center' }}
                  >
                    {proofUrl ? (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setPreviewUrl(proofUrl)}
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: 1,
                          borderColor: 'divider',
                          p: 0,
                          cursor: 'pointer',
                          bgcolor: 'transparent',
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          component="img"
                          src={proofUrl}
                          alt={t('photo')}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('noData')}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700}>{name}</Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {formatCurrency(row.amount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(row.paymentDate)}
                        {row.customer?.mobileNumber ? ` · ${row.customer.mobileNumber}` : ''}
                      </Typography>
                      {row.notes ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {row.notes}
                        </Typography>
                      ) : null}
                    </Box>

                    <Stack direction="row" spacing={1} flexShrink={0}>
                      <Button
                        variant="contained"
                        color="success"
                        disabled={busy}
                        onClick={() => confirmMutation.mutate(row.id)}
                      >
                        {t('confirm')}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={busy}
                        onClick={() => {
                          setRejectNotes('')
                          setRejectTarget(row)
                        }}
                      >
                        {t('reject')}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <Dialog open={Boolean(rejectTarget)} onClose={() => !busy && setRejectTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('reject')} · {t('pendingCash')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {rejectTarget
              ? `${t('reject')} ${formatCurrency(rejectTarget.amount)} · ${rejectTarget.customer?.name ?? t('customer')}?`
              : null}
          </Typography>
          <TextField
            label={t('notesOptional')}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy || !rejectTarget}
            onClick={() => {
              if (!rejectTarget) return
              rejectMutation.mutate({
                id: rejectTarget.id,
                notes: rejectNotes.trim() || undefined,
              })
            }}
          >
            {rejectMutation.isPending ? t('updating') : t('reject')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} maxWidth="md" fullWidth>
        <DialogTitle>{t('payment')} · {t('photo')}</DialogTitle>
        <DialogContent>
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt={t('photo')}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewUrl(null)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
