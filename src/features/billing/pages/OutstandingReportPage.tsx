import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatCurrency, formatDate } from '../../../utils/format'
import { billingApi } from '../api/billingApi'
import type { OutstandingRow } from '../types/billing'

const columnHelper = createColumnHelper<OutstandingRow>()
const defaultFilters = { supplierId: '', page: '1', limit: '20' }

export function OutstandingReportPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['bills', 'outstanding', filters],
    queryFn: () =>
      billingApi.outstanding({
        // Farm owner: backend ignores supplierId and scopes to the signed-in owner.
        // Platform can still pass it; omit empty strings.
        supplierId: filters.supplierId || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('customerName', { header: t('customer') }),
      columnHelper.accessor('supplierName', { header: t('farm') }),
      columnHelper.accessor('outstandingAmount', {
        header: t('outstanding'),
        cell: (i) => formatCurrency(i.getValue()),
      }),
      columnHelper.accessor('oldestDueDate', {
        header: t('from'),
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
      <PageHeader title={t('navOutstanding')} subtitle={t('customers')} />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label={t('farm')}
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
        />
        <TextField select size="small" label={t('more')} value={filters.limit} onChange={(e) => setFilters({ limit: e.target.value, page: '1' })} sx={{ minWidth: 120 }}>
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
