import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { FileDownloadOutlined } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { downloadCsv, formatDate, formatLiters } from '../../../utils/format'
import { deliveriesApi } from '../api/deliveriesApi'
import type { DeliveryReportRow } from '../types/delivery'

const columnHelper = createColumnHelper<DeliveryReportRow>()
const defaultFilters = {
  from: '',
  to: '',
  supplierId: '',
  customerId: '',
  status: '',
  page: '1',
  limit: '20',
}

export function DeliveriesReportPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['deliveries', 'report', filters],
    queryFn: () =>
      deliveriesApi.report({
        from: filters.from || undefined,
        to: filters.to || undefined,
        supplierId: filters.supplierId || undefined,
        customerId: filters.customerId || undefined,
        status: filters.status || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: t('day'),
        cell: (i) => formatDate(i.getValue()),
      }),
      columnHelper.accessor('supplierName', { header: t('farm') }),
      columnHelper.accessor('customerName', { header: t('customer') }),
      columnHelper.accessor('quantityLiters', {
        header: t('quantityL'),
        cell: (i) => formatLiters(i.getValue()),
      }),
      columnHelper.accessor('status', {
        header: t('status'),
        cell: (i) => <StatusChip status={i.getValue()} />,
      }),
    ],
    [t],
  )

  const exportCsv = () => {
    const rows = query.data?.data ?? []
    downloadCsv('deliveries-report.csv', [
      [t('day'), t('farm'), t('customer'), t('quantityL'), t('status')],
      ...rows.map((r) => [
        r.date,
        r.supplierName,
        r.customerName,
        String(r.quantityLiters),
        r.status,
      ]),
    ])
  }

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
      <PageHeader
        title={t('deliveries')}
        subtitle={`${t('filter')} · ${t('navReports')}`}
        actions={
          <Button
            startIcon={<FileDownloadOutlined />}
            variant="outlined"
            onClick={exportCsv}
            disabled={!query.data?.data.length}
          >
            {t('download')}
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <TextField
          label={t('from')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => setFilters({ from: e.target.value, page: '1' })}
        />
        <TextField
          label={t('to')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.to}
          onChange={(e) => setFilters({ to: e.target.value, page: '1' })}
        />
        <TextField
          label={t('farm')}
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
        />
        <TextField
          label={t('customer')}
          size="small"
          value={filters.customerId}
          onChange={(e) => setFilters({ customerId: e.target.value, page: '1' })}
        />
        <TextField
          select
          label={t('status')}
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="DELIVERED">{t('delivered')}</MenuItem>
          <MenuItem value="MISSED">{t('failed')}</MenuItem>
          <MenuItem value="PARTIAL">{t('less')}</MenuItem>
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
