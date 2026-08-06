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
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate } from '../../../utils/format'
import { suppliersApi } from '../api/suppliersApi'

export function SupplierDetailPage() {
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
        title="Supplier not found"
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
              Back
            </Button>
            {supplier.status !== 'ACTIVE' ? (
              <Button
                variant="contained"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                Activate
              </Button>
            ) : (
              <Button
                color="error"
                variant="contained"
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
              >
                Block
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
                Profile
              </Typography>
              <Stack spacing={1}>
                <Typography>
                  Status: <StatusChip status={supplier.status} />
                </Typography>
                <Typography>Phone: {supplier.phone || '—'}</Typography>
                <Typography>Address: {supplier.address || '—'}</Typography>
                <Typography>Registered: {formatDate(supplier.createdAt)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Billing summary
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">Total billed</Typography>
                  <Typography fontWeight={700}>{formatCurrency(supplier.billing.totalBilled)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">Collected</Typography>
                  <Typography fontWeight={700}>
                    {formatCurrency(supplier.billing.totalCollected)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">Outstanding</Typography>
                  <Typography fontWeight={700}>{formatCurrency(supplier.billing.outstanding)}</Typography>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Last bill: {formatDate(supplier.billing.lastBillDate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            Customers ({supplier.customers.length})
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
              <Typography color="text.secondary">No customers linked</Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
