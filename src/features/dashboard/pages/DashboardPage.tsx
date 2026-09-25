import { Box, Card, CardContent, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { PageHeader } from '../../../components/tables/DataTable'
import { FarmDashboardPage } from '../../farm/pages/FarmDashboardPage'
import { useAuth } from '../../../lib/auth/useAuth'
import { formatCurrency } from '../../../utils/format'
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

function PlatformDashboard() {
  const { t } = useTranslation()
  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary })
  const growthQuery = useQuery({ queryKey: ['dashboard', 'growth'], queryFn: dashboardApi.growth })
  const revenueQuery = useQuery({ queryKey: ['dashboard', 'revenue'], queryFn: dashboardApi.revenue })

  if (summaryQuery.isLoading) return <LoadingState label={t('loading')} />
  if (summaryQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(summaryQuery.error as Error).message}
        onRetry={() => void summaryQuery.refetch()}
      />
    )
  }

  const s = summaryQuery.data!

  return (
    <Box>
      <PageHeader title={t('platformDashboard')} subtitle={t('platformDashboardSubtitle')} />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('farmOwners')} value={String(s.suppliers)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('customers')} value={String(s.customers)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('deliveriesAllTime')} value={String(s.deliveries)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={t('outstanding')} value={formatCurrency(s.outstandingBalance)} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                {t('farmOwnerGrowth')}
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthQuery.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" name={t('farms')} stroke="#0F766E" strokeWidth={2} />
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
                {t('revenueCollected')}
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueQuery.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name={t('revenueCollected')}
                      fill="#0D9488"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  if (user?.role === 'FARM_OWNER') return <FarmDashboardPage />
  return <PlatformDashboard />
}
