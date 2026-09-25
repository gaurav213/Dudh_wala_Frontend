import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatCurrency, formatDate } from '../../../utils/format'
import { paymentsApi } from '../api/paymentsApi'
import type { Payment } from '../types/payment'

const columnHelper = createColumnHelper<Payment>()
const defaultFilters = {
  status: '',
  method: '',
  supplierId: '',
  customerId: '',
  from: '',
  to: '',
  page: '1',
  limit: '20',
}

export function PaymentsListPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['payments', filters],
    queryFn: () =>
      paymentsApi.list({
        status: filters.status || undefined,
        method: filters.method || undefined,
        supplierId: filters.supplierId || undefined,
        customerId: filters.customerId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('paidAt', {
        header: t('day'),
        cell: (i) => formatDate(i.getValue()),
      }),
      columnHelper.accessor('customerName', { header: t('customer') }),
      columnHelper.accessor('supplierName', { header: t('farm') }),
      columnHelper.accessor('amount', {
        header: t('amount'),
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('method', { header: t('payment') }),
      columnHelper.accessor('status', {
        header: t('status'),
        cell: (i) => <StatusChip status={i.getValue()} />,
      }),
      columnHelper.accessor('reference', {
        header: t('details'),
        cell: (i) => i.getValue() || '—',
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
      <PageHeader title={t('payments')} subtitle={t('history')} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label={t('status')}
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="SUCCESS">{t('success')}</MenuItem>
          <MenuItem value="PENDING">{t('pending')}</MenuItem>
          <MenuItem value="FAILED">{t('failed')}</MenuItem>
        </TextField>
        <TextField
          select
          label={t('payment')}
          size="small"
          value={filters.method}
          onChange={(e) => setFilters({ method: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="CASH">{t('recordCash')}</MenuItem>
          <MenuItem value="UPI">UPI</MenuItem>
          <MenuItem value="BANK">Bank</MenuItem>
        </TextField>
        <TextField
          label={t('farm')}
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
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
