import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatCurrency, formatDate } from '../../../utils/format'
import { billingApi } from '../api/billingApi'
import type { OutstandingRow } from '../types/billing'

const columnHelper = createColumnHelper<OutstandingRow>()
const defaultFilters = { supplierId: '', page: '1', limit: '20' }

export function OutstandingReportPage() {
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['bills', 'outstanding', filters],
    queryFn: () =>
      billingApi.outstanding({
        supplierId: filters.supplierId || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('customerName', { header: 'Customer' }),
      columnHelper.accessor('supplierName', { header: 'Supplier' }),
      columnHelper.accessor('outstandingAmount', {
        header: 'Outstanding',
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('oldestDueDate', {
        header: 'Oldest due',
        cell: (i) => formatDate(i.getValue()),
      }),
    ],
    [],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load outstanding report"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Outstanding report" subtitle="Customers with unpaid balances" />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Supplier ID"
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
        />
        <TextField select size="small" label="Page size" value={filters.limit} onChange={(e) => setFilters({ limit: e.target.value, page: '1' })} sx={{ minWidth: 120 }}>
          <MenuItem value="10">10</MenuItem>
          <MenuItem value="20">20</MenuItem>
          <MenuItem value="50">50</MenuItem>
        </TextField>
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
