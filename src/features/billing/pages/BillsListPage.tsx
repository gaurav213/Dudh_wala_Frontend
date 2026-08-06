import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
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
  supplierId: '',
  customerId: '',
  from: '',
  to: '',
  page: '1',
  limit: '20',
}

export function BillsListPage() {
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['bills', filters],
    queryFn: () =>
      billingApi.list({
        status: filters.status || undefined,
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
      columnHelper.accessor('id', {
        header: 'Bill',
        cell: (info) => (
          <Button component={RouterLink} to={`/billing/${info.getValue()}`} size="small">
            {info.getValue().slice(0, 8)}…
          </Button>
        ),
      }),
      columnHelper.accessor('customerName', { header: 'Customer' }),
      columnHelper.accessor('supplierName', { header: 'Supplier' }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('outstandingAmount', {
        header: 'Outstanding',
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (i) => <StatusChip status={i.getValue()} />,
      }),
      columnHelper.accessor('generatedAt', {
        header: 'Generated',
        cell: (i) => formatDate(i.getValue()),
      }),
    ],
    [],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load bills"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Billing" subtitle="Bills with period and payment status filters" />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Status"
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PAID">Paid</MenuItem>
          <MenuItem value="PARTIAL">Partial</MenuItem>
          <MenuItem value="OUTSTANDING">Outstanding</MenuItem>
        </TextField>
        <TextField
          label="Supplier ID"
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
        />
        <TextField
          label="Customer ID"
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
