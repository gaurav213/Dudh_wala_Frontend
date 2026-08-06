export interface Payment {
  id: string
  customerName: string
  supplierName: string
  amount: number
  method: string
  status: string
  paidAt: string
  billId?: string | null
  reference?: string | null
}
