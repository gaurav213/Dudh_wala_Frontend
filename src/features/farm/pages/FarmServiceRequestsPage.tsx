import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { DELIVERY_STAFF_ENABLED } from '../../../config/featureFlags'
import { formatDate, formatLiters } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { CustomerServiceRequest, DeliveryScheduleType, FarmProduct } from '../types/farm'
import { refreshQueries } from '../../../lib/query/refreshQueries'

function scheduleKey(type?: DeliveryScheduleType) {
  switch (type) {
    case 'EVERY_DAY':
      return 'day'
    case 'ALTERNATE_DAYS':
      return 'period'
    case 'WEEKDAYS':
      return 'thisWeek'
    case 'WEEKLY':
      return 'thisWeek'
    case 'CUSTOM':
      return 'customDay'
    default:
      return type ? 'period' : 'day'
  }
}

function ratingLabel(avg?: number | null, count?: number, empty = '') {
  if (!count || avg == null) return empty
  return `★ ${avg.toFixed(1)} (${count})`
}

export function FarmServiceRequestsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [rejectTarget, setRejectTarget] = useState<CustomerServiceRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acceptTarget, setAcceptTarget] = useState<CustomerServiceRequest | null>(null)
  const [assignedStaff, setAssignedStaff] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['farm', farmId, 'service-requests'],
    queryFn: () => farmApi.serviceRequests(farmId!, { limit: 50 }),
    enabled: Boolean(farmId),
  })

  const productsQuery = useQuery({
    queryKey: ['farm', farmId, 'products'],
    queryFn: () => farmApi.products(farmId!),
    enabled: Boolean(farmId),
  })

  const membersQuery = useQuery({
    queryKey: ['farm', farmId, 'members'],
    queryFn: () => farmApi.members(farmId!),
    enabled: Boolean(farmId) && DELIVERY_STAFF_ENABLED,
  })

  const productsById = useMemo(() => {
    const map = new Map<string, FarmProduct>()
    for (const p of productsQuery.data ?? []) map.set(p.id, p)
    return map
  }, [productsQuery.data])

  const staffOptions = (membersQuery.data ?? []).filter(
    (m) => m.memberRole === 'DELIVERY_STAFF' && m.status === 'ACTIVE',
  )

  const invalidate = async () => {
    await refreshQueries(queryClient, [
      ['farm', farmId!, 'service-requests'],
      ['farm', 'dashboard'],
    ])
  }

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      farmApi.acceptServiceRequest(farmId!, id, {
        assignedMemberUserId: assignedStaff || undefined,
      }),
    onSuccess: async () => {
      await invalidate()
      setAcceptTarget(null)
      setAssignedStaff('')
      setActionError(null)
    },
    onError: (err) => setActionError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      farmApi.rejectServiceRequest(farmId!, id, { rejectionReason: rejectReason || undefined }),
    onSuccess: async () => {
      await invalidate()
      setRejectTarget(null)
      setRejectReason('')
      setActionError(null)
    },
    onError: (err) => setActionError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => farmApi.cancelServiceRequest(farmId!, id),
    onSuccess: async () => {
      await invalidate()
      setActionError(null)
    },
    onError: (err) => setActionError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

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

  const requests = query.data?.data ?? []
  const pending = requests.filter((r) => r.status === 'PENDING')
  const accepted = requests.filter((r) => r.status === 'ACCEPTED')

  const renderCard = (request: CustomerServiceRequest) => {
    const product = productsById.get(request.productId)
    const productLabel = request.productName ?? product?.name ?? t('products')
    const isPending = request.status === 'PENDING'
    return (
      <Card
        key={request.id}
        variant="outlined"
        sx={{ borderLeft: 4, borderLeftColor: isPending ? 'warning.main' : 'success.main' }}
      >
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Avatar src={request.customerAvatarUrl ?? undefined}>
                {(request.customerName ?? 'C').slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography fontWeight={700}>{request.customerName ?? t('customer')}</Typography>
                  <StatusChip status={request.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t('reviews')}: {ratingLabel(request.customerAverageRating, request.customerReviewCount, t('noData'))}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {productLabel} · {formatLiters(request.quantity)} · {t(scheduleKey(request.scheduleType))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isPending ? t('requests') : t('accept')} {formatDate(request.createdAt)}
                </Typography>
              </Box>
            </Stack>
            {isPending ? (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setAcceptTarget(request)
                    setAssignedStaff('')
                    setActionError(null)
                  }}
                >
                  {t('accept')}
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('cancelRequestBody'))) {
                      cancelMutation.mutate(request.id)
                    }
                  }}
                >
                  {cancelMutation.isPending ? t('updating') : t('cancel')}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      <PageHeader
        title={t('navCustomerRequests')}
        subtitle={`${t('pending')} · ${t('approve')}`}
      />

      {requests.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('navCustomerRequests')}
        />
      ) : (
        <Stack spacing={3}>
          {pending.length > 0 ? (
            <Box>
              <Typography fontWeight={800} color="warning.main" sx={{ mb: 1 }}>
                {t('pending')} ({pending.length})
              </Typography>
              <Stack spacing={2}>{pending.map(renderCard)}</Stack>
            </Box>
          ) : null}
          {accepted.length > 0 ? (
            <Box>
              <Typography fontWeight={800} color="success.main" sx={{ mb: 1 }}>
                {t('approve')} ({accepted.length})
              </Typography>
              <Stack spacing={2}>{accepted.map(renderCard)}</Stack>
            </Box>
          ) : null}
        </Stack>
      )}

      <Dialog open={Boolean(acceptTarget)} onClose={() => setAcceptTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('accept')} {t('requests')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {t('accept')} · {t('connected')} · {t('subscription')}
            </Typography>
            {DELIVERY_STAFF_ENABLED ? (
              <TextField
                select
                label={`${t('navDeliveryStaff')} (${t('optional')})`}
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                fullWidth
              >
                <MenuItem value="">{t('none')}</MenuItem>
                {staffOptions.map((member) => (
                  <MenuItem key={member.id} value={member.userId}>
                    {member.user?.name ?? member.user?.mobileNumber ?? member.userId}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptTarget(null)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => acceptMutation.mutate(acceptTarget!.id)}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? t('updating') : t('accept')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('reject')} {t('requests')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            <TextField
              label={t('notesOptional')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>{t('cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => rejectMutation.mutate(rejectTarget!.id)}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? t('updating') : t('reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
