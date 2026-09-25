import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { formatDate } from '../../../utils/format'
import { adminFarmsApi } from '../api/adminFarmsApi'

function errorMessage(err: unknown, fallback: string) {
  return isApiError(err) ? err.message : err instanceof Error ? err.message : fallback
}

export function AdminFarmDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin-farms', id],
    queryFn: () => adminFarmsApi.get(id),
    enabled: Boolean(id),
  })

  const decisionBody = () => (notes.trim() ? { notes: notes.trim() } : {})

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-farms', id] })
    void queryClient.invalidateQueries({ queryKey: ['admin-farms'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => adminFarmsApi.approve(id, decisionBody()),
    onSuccess: () => {
      setActionError(null)
      setNotes('')
      invalidate()
    },
    onError: (err) => setActionError(errorMessage(err, t('somethingWentWrong'))),
  })

  const rejectMutation = useMutation({
    mutationFn: () => adminFarmsApi.reject(id, decisionBody()),
    onSuccess: () => {
      setActionError(null)
      setNotes('')
      invalidate()
    },
    onError: (err) => setActionError(errorMessage(err, t('somethingWentWrong'))),
  })

  const suspendMutation = useMutation({
    mutationFn: () => adminFarmsApi.suspend(id, decisionBody()),
    onSuccess: () => {
      setActionError(null)
      setNotes('')
      invalidate()
    },
    onError: (err) => setActionError(errorMessage(err, t('somethingWentWrong'))),
  })

  const reactivateMutation = useMutation({
    mutationFn: () => adminFarmsApi.reactivate(id, decisionBody()),
    onSuccess: () => {
      setActionError(null)
      setNotes('')
      invalidate()
    },
    onError: (err) => setActionError(errorMessage(err, t('somethingWentWrong'))),
  })

  const actionPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    reactivateMutation.isPending

  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error | undefined)?.message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const farm = query.data
  const address = [farm.addressLine1, farm.addressLine2, farm.area, farm.city, farm.state, farm.postalCode]
    .filter(Boolean)
    .join(', ')

  return (
    <Box>
      <PageHeader
        title={farm.name}
        subtitle={farm.businessName || farm.mobileNumber}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={RouterLink} to="/admin/farms" variant="outlined">
              {t('back')}
            </Button>
            {farm.status === 'PENDING_APPROVAL' ? (
              <>
                <Button
                  variant="contained"
                  onClick={() => approveMutation.mutate()}
                  disabled={actionPending}
                >
                  {t('approve')}
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => rejectMutation.mutate()}
                  disabled={actionPending}
                >
                  {t('reject')}
                </Button>
              </>
            ) : null}
            {farm.status === 'ACTIVE' ? (
              <Button
                color="warning"
                variant="contained"
                onClick={() => suspendMutation.mutate()}
                disabled={actionPending}
              >
                {t('cancel')}
              </Button>
            ) : null}
            {farm.status === 'SUSPENDED' || farm.status === 'REJECTED' ? (
              <Button
                variant="contained"
                onClick={() => reactivateMutation.mutate()}
                disabled={actionPending}
              >
                {t('active')}
              </Button>
            ) : null}
          </Stack>
        }
      />

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('profile')}
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  {t('status')}: <StatusChip status={farm.status} />
                </Typography>
                <Typography>{t('mobileNumber')}: {farm.mobileNumber || '—'}</Typography>
                <Typography>{t('emailOptional')}: {farm.email || '—'}</Typography>
                <Typography>{t('address')}: {address || '—'}</Typography>
                <Typography>{t('status')}: {formatDate(farm.createdAt)}</Typography>
                <Typography>{t('approve')}: {formatDate(farm.approvedAt)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('notes')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('notesOptional')}
              </Typography>
              {farm.approvalNotes ? (
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {t('notes')}: {farm.approvalNotes}
                </Typography>
              ) : null}
              <TextField
                label={t('notesOptional')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                inputProps={{ 'aria-label': t('notes') }}
              />
              {farm.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {t('details')}: {farm.description}
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
