import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { BillDetailPage } from './BillDetailPage'
import { renderWithProviders } from '../../../test/test-utils'
import * as billingApiModule from '../api/billingApi'

vi.mock('../api/billingApi', () => ({
  billingApi: {
    list: vi.fn(),
    get: vi.fn(),
    outstanding: vi.fn(),
  },
}))

vi.mock('../../../lib/auth/useAuth', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/auth/useAuth')>(
    '../../../lib/auth/useAuth',
  )
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '1',
        email: 'admin@test.com',
        fullName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      isAuthenticated: true,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    }),
  }
})

describe('Bill details', () => {
  it('renders bill line items and payments', async () => {
    vi.mocked(billingApiModule.billingApi.get).mockResolvedValue({
      id: 'bill-12345678',
      customerName: 'Anita',
      supplierName: 'Ramesh Dairy',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      amount: 1500,
      paidAmount: 500,
      outstandingAmount: 1000,
      status: 'PARTIAL',
      generatedAt: '2026-08-01',
      lineItems: [
        { description: 'Morning milk', quantityLiters: 30, rate: 50, amount: 1500 },
      ],
      payments: [{ id: 'p1', amount: 500, paidAt: '2026-08-02', method: 'UPI' }],
    })

    renderWithProviders(
      <Routes>
        <Route path="/billing/:id" element={<BillDetailPage />} />
      </Routes>,
      { route: '/billing/bill-12345678' },
    )

    expect(await screen.findByText(/Anita/)).toBeInTheDocument()
    expect(screen.getByText('Morning milk')).toBeInTheDocument()
    expect(screen.getByText(/UPI/)).toBeInTheDocument()
  })
})
