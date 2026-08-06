import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from './DashboardPage'
import { renderWithProviders } from '../../../test/test-utils'
import * as dashboardApiModule from '../api/dashboardApi'
import { ApiError } from '../../../lib/api/errors'

vi.mock('../api/dashboardApi', () => ({
  dashboardApi: {
    summary: vi.fn(),
    growth: vi.fn(),
    revenue: vi.fn(),
    recentRegistrations: vi.fn(),
    failedSyncs: vi.fn(),
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

describe('Dashboard API states', () => {
  it('renders summary metrics on success', async () => {
    vi.mocked(dashboardApiModule.dashboardApi.summary).mockResolvedValue({
      totalSuppliers: 12,
      activeSuppliers: 10,
      totalCustomers: 80,
      deliveriesToday: 40,
      milkThisMonthLiters: 1200,
      billedThisMonth: 50000,
      paymentsThisMonth: 42000,
      outstandingAmount: 8000,
    })
    vi.mocked(dashboardApiModule.dashboardApi.growth).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.revenue).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.recentRegistrations).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.failedSyncs).mockResolvedValue([])

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('Total suppliers')).toBeInTheDocument()
    expect(screen.getByText('Active suppliers')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    const user = userEvent.setup()
    vi.mocked(dashboardApiModule.dashboardApi.summary).mockRejectedValue(
      new ApiError({ statusCode: 500, code: 'SERVER', message: 'Summary unavailable' }),
    )

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText(/failed to load dashboard/i)).toBeInTheDocument()
    expect(screen.getByText('Summary unavailable')).toBeInTheDocument()

    vi.mocked(dashboardApiModule.dashboardApi.summary).mockResolvedValue({
      totalSuppliers: 1,
      activeSuppliers: 1,
      totalCustomers: 1,
      deliveriesToday: 1,
      milkThisMonthLiters: 1,
      billedThisMonth: 1,
      paymentsThisMonth: 1,
      outstandingAmount: 1,
    })
    vi.mocked(dashboardApiModule.dashboardApi.growth).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.revenue).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.recentRegistrations).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.failedSyncs).mockResolvedValue([])

    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByText('Total suppliers')).toBeInTheDocument()
    })
  })
})
