import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatCurrency, formatDate } from '../../../utils/format'
import { billingApi } from '../api/billingApi'
import type { Bill } from '../types/billing'

const columnHelper = createColumnHelper<Bill>()
const defaultFilters = {
  status: '',
  customerId: '',
  billingMonth: '',
  page: '1',
  limit: '20',
}

export function BillsListPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['bills', filters],
    queryFn: () =>
      billingApi.list({
        status: filters.status || undefined,
        customerId: filters.customerId || undefined,
        billingMonth: filters.billingMonth || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: t('bills'),
        cell: (info) => (
          <Button component={RouterLink} to={`/billing/${info.getValue()}`} size="small">
            {info.getValue().slice(0, 8)}…
          </Button>
        ),
      }),
      columnHelper.accessor('customerName', { header: t('customer') }),
      columnHelper.accessor('supplierName', { header: t('farm') }),
      columnHelper.accessor('amount', {
        header: t('amount'),
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('outstandingAmount', {
        header: t('outstanding'),
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('status', {
        header: t('status'),
        cell: (i) => <StatusChip status={i.getValue()} />,
      }),
      columnHelper.accessor('generatedAt', {
        header: t('generate'),
        cell: (i) => formatDate(i.getValue()),
      }),
    ],
    [t],
  )

  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title={t('billing')} subtitle={t('thisMonth')} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label={t('status')}
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="DRAFT">{t('pending')}</MenuItem>
          <MenuItem value="ISSUED">{t('open')}</MenuItem>
          <MenuItem value="PARTIALLY_PAID">{t('payment')}</MenuItem>
          <MenuItem value="PAID">{t('done')}</MenuItem>
          <MenuItem value="OVERDUE">{t('outstanding')}</MenuItem>
          <MenuItem value="VOID">{t('cancelled')}</MenuItem>
        </TextField>
        <TextField
          label={`${t('billing')} · ${t('thisMonth')}`}
          size="small"
          placeholder="YYYY-MM"
          value={filters.billingMonth}
          onChange={(e) => setFilters({ billingMonth: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        />
        <TextField
          label={t('customer')}
          size="small"
          value={filters.customerId}
          onChange={(e) => setFilters({ customerId: e.target.value, page: '1' })}
        />
      </Stack>
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        page={Number(filters.page) || 1}
        limit={Number(filters.limit) || 20}
        total={query.data?.meta.total ?? 0}
        onPageChange={(page) => setFilters({ page: String(page) })}
        onLimitChange={(limit) => setFilters({ limit: String(limit), page: '1' })}
      />
    </Box>
  )
}
