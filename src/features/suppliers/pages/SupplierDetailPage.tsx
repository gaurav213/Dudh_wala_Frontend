import {
  Box,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate } from '../../../utils/format'
import { suppliersApi } from '../api/suppliersApi'

export function SupplierDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => suppliersApi.get(id),
    enabled: Boolean(id),
  })

  const activateMutation = useMutation({
    mutationFn: () => suppliersApi.activate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['suppliers', id] }),
  })
  const blockMutation = useMutation({
    mutationFn: () => suppliersApi.block(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['suppliers', id] }),
  })

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

  const supplier = query.data

  return (
    <Box>
      <PageHeader
        title={supplier.fullName}
        subtitle={supplier.phone || supplier.mobileNumber || supplier.email || undefined}
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/suppliers" variant="outlined">
              {t('back')}
            </Button>
            {supplier.status !== 'ACTIVE' ? (
              <Button
                variant="contained"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                {t('active')}
              </Button>
            ) : (
              <Button
                color="error"
                variant="contained"
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
              >
                {t('blocked')}
              </Button>
            )}
          </Stack>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('profile')}
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  {t('status')}: <StatusChip status={supplier.status} />
                </Typography>
                <Typography>{t('mobileNumber')}: {supplier.phone || '—'}</Typography>
                <Typography>{t('address')}: {supplier.address || '—'}</Typography>
                <Typography>{t('status')}: {formatDate(supplier.createdAt)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {t('billing')}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">{t('total')} {t('billing')}</Typography>
                  <Typography fontWeight={700}>{formatCurrency(supplier.billing.totalBilled)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">{t('collected')}</Typography>
                  <Typography fontWeight={700}>
                    {formatCurrency(supplier.billing.totalCollected)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">{t('outstanding')}</Typography>
                  <Typography fontWeight={700}>{formatCurrency(supplier.billing.outstanding)}</Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('bills')}: {formatDate(supplier.billing.lastBillDate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {t('customers')} ({supplier.customers.length})
          </Typography>
          <Stack spacing={1}>
            {supplier.customers.map((c) => (
              <Stack key={c.id} direction="row" justifyContent="space-between" alignItems="center">
                <Button component={RouterLink} to={`/customers/${c.id}`} size="small">
                  {c.fullName}
                </Button>
                <StatusChip status={c.status} />
              </Stack>
            ))}
            {!supplier.customers.length ? (
              <Typography color="text.secondary">{t('noData')}</Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
