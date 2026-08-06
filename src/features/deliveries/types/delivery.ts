export interface DeliveryReportRow {
  id: string
  date: string
  supplierName: string
  customerName: string
  quantityLiters: number
  status: string
  syncedAt?: string | null
}
