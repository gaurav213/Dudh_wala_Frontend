export interface Bill {
  id: string
  customerName: string
  supplierName: string
  periodStart: string
  periodEnd: string
  amount: number
  paidAmount: number
  outstandingAmount: number
  status: string
  generatedAt: string
}

export interface BillDetail extends Bill {
  lineItems: Array<{ description: string; quantityLiters: number; rate: number; amount: number }>
  payments: Array<{ id: string; amount: number; paidAt: string; method: string }>
}

export interface OutstandingRow {
  customerId: string
  customerName: string
  supplierName: string
  outstandingAmount: number
  oldestDueDate?: string | null
}
