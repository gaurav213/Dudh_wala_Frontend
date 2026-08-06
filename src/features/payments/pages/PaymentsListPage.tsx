import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
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
        header: 'Date',
        cell: (i) => formatDate(i.getValue()),
      }),
      columnHelper.accessor('customerName', { header: 'Customer' }),
      columnHelper.accessor('supplierName', { header: 'Supplier' }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('method', { header: 'Method' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (i) => <StatusChip status={i.getValue()} />,
      }),
      columnHelper.accessor('reference', {
        header: 'Reference',
        cell: (i) => i.getValue() || '—',
      }),
    ],
    [],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load payments"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Payments" subtitle="Collection history across the network" />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Status"
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="SUCCESS">Success</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="FAILED">Failed</MenuItem>
        </TextField>
        <TextField
          select
          label="Method"
          size="small"
          value={filters.method}
          onChange={(e) => setFilters({ method: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="CASH">Cash</MenuItem>
          <MenuItem value="UPI">UPI</MenuItem>
          <MenuItem value="BANK">Bank</MenuItem>
        </TextField>
        <TextField
          label="Supplier ID"
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
