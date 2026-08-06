import { Box, Card, CardContent, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { dashboardApi } from '../api/dashboardApi'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary })
  const growthQuery = useQuery({ queryKey: ['dashboard', 'growth'], queryFn: dashboardApi.growth })
  const revenueQuery = useQuery({ queryKey: ['dashboard', 'revenue'], queryFn: dashboardApi.revenue })
  const recentQuery = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardApi.recentRegistrations,
  })
  const syncQuery = useQuery({
    queryKey: ['dashboard', 'failed-syncs'],
    queryFn: dashboardApi.failedSyncs,
  })

  if (summaryQuery.isLoading) return <LoadingState label="Loading dashboard…" />
  if (summaryQuery.isError) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={(summaryQuery.error as Error).message}
        onRetry={() => void summaryQuery.refetch()}
      />
    )
  }

  const s = summaryQuery.data!

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Operational snapshot across the milk network" />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Total suppliers" value={String(s.totalSuppliers)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Active suppliers" value={String(s.activeSuppliers)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Customers" value={String(s.totalCustomers)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Deliveries today" value={String(s.deliveriesToday)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Milk this month" value={formatLiters(s.milkThisMonthLiters)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Billed this month" value={formatCurrency(s.billedThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Payments this month" value={formatCurrency(s.paymentsThisMonth)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Outstanding" value={formatCurrency(s.outstandingAmount)} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Growth
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthQuery.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="suppliers" stroke="#0F766E" strokeWidth={2} />
                    <Line type="monotone" dataKey="customers" stroke="#334155" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Revenue
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueQuery.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="billed" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" fill="#334155" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Recent registrations
              </Typography>
              <Stack spacing={1.5}>
                {(recentQuery.data ?? []).map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography fontWeight={600}>{item.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.role} · {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    <StatusChip status={item.status} />
                  </Stack>
                ))}
                {!recentQuery.data?.length && !recentQuery.isLoading ? (
                  <Typography color="text.secondary">No recent registrations</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                Failed syncs
              </Typography>
              <Stack spacing={1.5}>
                {(syncQuery.data ?? []).map((item) => (
                  <Box key={item.id}>
                    <Typography fontWeight={600}>
                      {item.entityType} · {item.entityId}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      {item.errorMessage}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(item.failedAt)}
                    </Typography>
                  </Box>
                ))}
                {!syncQuery.data?.length && !syncQuery.isLoading ? (
                  <Typography color="text.secondary">No failed syncs</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
