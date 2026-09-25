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
    farmToday: vi.fn(),
    farmMonth: vi.fn(),
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
        name: 'Platform Owner',
        mobileNumber: '919999999999',
        role: 'PLATFORM_OWNER',
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
      suppliers: 12,
      customers: 80,
      deliveries: 40,
      outstandingBalance: '8000',
    })
    vi.mocked(dashboardApiModule.dashboardApi.growth).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.revenue).mockResolvedValue([])

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('Farm owners')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    const user = userEvent.setup()
    vi.mocked(dashboardApiModule.dashboardApi.summary).mockRejectedValue(
      new ApiError({ statusCode: 500, code: 'SERVER', message: 'Summary unavailable' }),
    )

    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText(/could not load/i)).toBeInTheDocument()
    expect(screen.getByText('Summary unavailable')).toBeInTheDocument()

    vi.mocked(dashboardApiModule.dashboardApi.summary).mockResolvedValue({
      suppliers: 1,
      customers: 1,
      deliveries: 1,
      outstandingBalance: '1',
    })
    vi.mocked(dashboardApiModule.dashboardApi.growth).mockResolvedValue([])
    vi.mocked(dashboardApiModule.dashboardApi.revenue).mockResolvedValue([])

    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(screen.getByText('Farm owners')).toBeInTheDocument()
    })
  })
})
