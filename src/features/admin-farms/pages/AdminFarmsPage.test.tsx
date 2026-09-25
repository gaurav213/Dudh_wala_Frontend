import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/test-utils'
import * as adminFarmsApiModule from '../api/adminFarmsApi'
import { AdminFarmsPage } from './AdminFarmsPage'

vi.mock('../api/adminFarmsApi', () => ({
  adminFarmsApi: {
    list: vi.fn(),
    get: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    suspend: vi.fn(),
    reactivate: vi.fn(),
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

describe('Admin farm filters', () => {
  it('passes search and status filters to the API', async () => {
    const user = userEvent.setup()
    vi.mocked(adminFarmsApiModule.adminFarmsApi.list).mockResolvedValue({
      data: [
        {
          id: 'f1',
          name: 'Shiv Dairy',
          businessName: 'Shiv Milk',
          mobileNumber: '919876543210',
          addressLine1: 'Lane 1',
          area: 'Kothrud',
          city: 'Pune',
          state: 'MH',
          postalCode: '411038',
          status: 'PENDING_APPROVAL',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { requestId: 'req-1', page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    renderWithProviders(<AdminFarmsPage />, { route: '/admin/farms' })

    await screen.findByText('Shiv Dairy')

    await user.type(screen.getByLabelText(/search farms/i), 'Shiv')
    await user.click(screen.getByLabelText(/filter by status/i))
    await user.click(await screen.findByRole('option', { name: 'Pending approval' }))

    await waitFor(() => {
      expect(adminFarmsApiModule.adminFarmsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Shiv',
          status: 'PENDING_APPROVAL',
        }),
      )
    })
  })
})
