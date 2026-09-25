import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { customerApi } from '../api/customerApi'
import { refreshQueries } from '../../../lib/query/refreshQueries'

export function CustomerInvitationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customer', 'invitations'],
    queryFn: customerApi.myInvitations,
  })

  const invalidate = () =>
    refreshQueries(queryClient, [['customer', 'invitations']])

  const acceptMutation = useMutation({
    mutationFn: (id: string) => customerApi.acceptInvitation(id),
    onSuccess: async () => {
      await invalidate()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => customerApi.rejectInvitation(id),
    onSuccess: async () => {
      await invalidate()
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

  const invitations = query.data ?? []
  const pending = invitations.filter((i) => i.status === 'PENDING')
  const others = invitations.filter((i) => i.status !== 'PENDING')

  return (
    <Box>
      <PageHeader
        title={t('navFarmInvitations')}
        subtitle={`${t('invitations')} · ${t('mobileNumber')}`}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        {t('invitations')} · <strong>{t('navFarmInvitations')}</strong> ·{' '}
        <Button component={RouterLink} to="/customer/requests" size="small">
          {t('navServiceRequests')}
        </Button>
        {' · '}{t('mobileNumber')}
      </Alert>

      {pending.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('invitations')}
        />
      ) : (
        <Stack spacing={2} sx={{ mb: others.length ? 4 : 0 }}>
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
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={800} variant="h6">
                        {invitation.farmName ?? t('navFarmInvitations')}
                      </Typography>
                      <StatusChip status={invitation.status} />
                    </Stack>
                    {(invitation.farmArea || invitation.farmCity) && (
                      <Typography variant="body2" color="text.secondary">
                        {[invitation.farmArea, invitation.farmCity].filter(Boolean).join(', ')}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {invitation.productName ?? invitation.milkType ?? t('milk')} ·{' '}
                      {formatLiters(invitation.quantity)} · {invitation.deliveryShift} ·{' '}
                      {formatCurrency(invitation.proposedRate)}/L · {t('from')}{' '}
                      {formatDate(invitation.preferredStartDate)} · {t('to')}{' '}
                      {formatDate(invitation.expiresAt)}
                    </Typography>
                    {invitation.deliveryInstructions ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('notes')}: {invitation.deliveryInstructions}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => acceptMutation.mutate(invitation.id)}
                      disabled={acceptMutation.isPending}
                    >
                      {t('accept')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => rejectMutation.mutate(invitation.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {t('decline')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {others.length > 0 ? (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            {t('history')} · {t('invitations')}
          </Typography>
          <Stack spacing={2}>
            {others.map((invitation) => (
              <Card key={invitation.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={700}>
                      {invitation.farmName ?? `${t('invitations')} #${invitation.id.slice(0, 8)}`}
                    </Typography>
                    <StatusChip status={invitation.status} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {invitation.productName ?? t('milk')} · {formatLiters(invitation.quantity)} ·{' '}
                    {invitation.deliveryShift} · {formatCurrency(invitation.proposedRate)}/L
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
