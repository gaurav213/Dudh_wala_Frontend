import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatDate, formatLiters } from '../../../utils/format'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import {
  customerApi,
  type CustomerInvitation,
  type CustomerServiceRequest,
} from '../api/customerApi'
import { isApiError } from '../../../lib/api/client'

type InboxItem =
  | { kind: 'invitation'; createdAt: string; invitation: CustomerInvitation }
  | { kind: 'request'; createdAt: string; request: CustomerServiceRequest }

/** Unified customer inbox: invitations + service requests for every customer. */
export function CustomerServiceRequestsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const focusId = params.get('focus')

  const query = useQuery({
    queryKey: ['customer', 'service-requests'],
    queryFn: () => customerApi.myServiceRequests({ limit: 50 }),
  })

  const invitationsQuery = useQuery({
    queryKey: ['customer', 'invitations'],
    queryFn: customerApi.myInvitations,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => customerApi.cancelServiceRequest(id),
    onSuccess: async () => {
      await refreshQueries(queryClient, [['customer', 'service-requests']])
    },
  })

  const acceptInvite = useMutation({
    mutationFn: (id: string) => customerApi.acceptInvitation(id),
    onSuccess: async () => {
      await refreshQueries(queryClient, [
        ['customer', 'invitations'],
        ['customer', 'service-requests'],
      ])
    },
  })

  const rejectInvite = useMutation({
    mutationFn: (id: string) => customerApi.rejectInvitation(id),
    onSuccess: async () => {
      await refreshQueries(queryClient, [['customer', 'invitations']])
    },
  })

  if (query.isLoading || invitationsQuery.isLoading) {
    return <LoadingState label={t('loading')} />
  }
  if (query.isError && invitationsQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => {
          void query.refetch()
          void invitationsQuery.refetch()
        }}
      />
    )
  }

  const requests = query.data?.data ?? []
  const invitations = invitationsQuery.data ?? []
  const items: InboxItem[] = [
    ...invitations.map((invitation) => ({
      kind: 'invitation' as const,
      createdAt: invitation.createdAt,
      invitation,
    })),
    ...requests.map((request) => ({
      kind: 'request' as const,
      createdAt: request.createdAt ?? '',
      request,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <Box>
      <PageHeader
        title={t('navInbox')}
        subtitle={`${t('navFarmInvitations')} · ${t('navCustomerRequests')}`}
        actions={
          <Button component={RouterLink} to="/customer/farms" variant="contained">
            {t('findFarms')}
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={t('emptyDefault')}
          description={t('navInbox')}
          action={
            <Button component={RouterLink} to="/customer/farms" variant="contained">
              {t('findFarms')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {items.map((item) => {
            if (item.kind === 'invitation') {
              const invitation = item.invitation
              const pending = invitation.status === 'PENDING'
              return (
                <Card key={`inv-${invitation.id}`} variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography fontWeight={700}>
                            {invitation.farmName ?? t('navFarmInvitations')}
                          </Typography>
                          <StatusChip status={invitation.status} />
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {t('invitations')}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {invitation.productName ?? invitation.milkType ?? t('milk')} ·{' '}
                          {formatLiters(invitation.quantity)} · {t('from')}{' '}
                          {formatDate(invitation.preferredStartDate)}
                        </Typography>
                      </Box>
                      {pending ? (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            disabled={rejectInvite.isPending || acceptInvite.isPending}
                            onClick={() => rejectInvite.mutate(invitation.id)}
                          >
                            {t('decline')}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={acceptInvite.isPending}
                            onClick={() => acceptInvite.mutate(invitation.id)}
                          >
                            {acceptInvite.isPending ? t('loading') : t('accept')}
                          </Button>
                        </Stack>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              )
            }

            const request = item.request
            const borderColor =
              request.status === 'PENDING'
                ? 'warning.main'
                : request.status === 'ACCEPTED'
                  ? 'success.main'
                  : 'divider'
            return (
              <Card
                key={request.id}
                id={`req-${request.id}`}
                variant="outlined"
                sx={{
                  borderLeft: 4,
                  borderLeftColor: borderColor,
                  ...(focusId === request.id
                    ? {
                        bgcolor: 'action.selected',
                        outline: '2px solid',
                        outlineColor: 'warning.main',
                      }
                    : null),
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={700}>
                          {request.farmName ?? `${t('requests')} #${request.id.slice(0, 8)}`}
                        </Typography>
                        <StatusChip status={request.status} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {t('requests')}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {request.productName ?? t('products')} · {formatLiters(request.quantity)} ·{' '}
                        {request.scheduleType?.replaceAll('_', ' ') ?? t('day')} · {t('from')}{' '}
                        {formatDate(request.preferredStartDate)}
                      </Typography>
                      {request.status === 'ACCEPTED' &&
                      (request.firstDeliveryDate || request.nextDeliveryDate) ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {request.firstDeliveryDate
                            ? `${t('delivery')} ${formatDate(request.firstDeliveryDate)}`
                            : ''}
                          {request.firstDeliveryDate && request.nextDeliveryDate ? ' · ' : ''}
                          {request.nextDeliveryDate
                            ? `Next ${formatDate(request.nextDeliveryDate)}`
                            : ''}
                        </Typography>
                      ) : null}
                    </Box>
                    {request.status === 'PENDING' ? (
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
                        {cancelMutation.isPending ? t('updating') : t('cancelRequest')}
                      </Button>
                    ) : null}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}

          {(acceptInvite.error || rejectInvite.error || cancelMutation.error) && (
            <Alert severity="error">
              {(isApiError(acceptInvite.error) && acceptInvite.error.message) ||
                (isApiError(rejectInvite.error) && rejectInvite.error.message) ||
                (isApiError(cancelMutation.error) && cancelMutation.error.message) ||
                t('somethingWentWrong')}
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  )
}
