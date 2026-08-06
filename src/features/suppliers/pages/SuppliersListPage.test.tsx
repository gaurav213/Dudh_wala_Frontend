import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuppliersListPage } from './SuppliersListPage'
import { renderWithProviders } from '../../../test/test-utils'
import * as suppliersApiModule from '../api/suppliersApi'

vi.mock('../api/suppliersApi', () => ({
  suppliersApi: {
    list: vi.fn(),
    get: vi.fn(),
    activate: vi.fn(),
    block: vi.fn(),
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

describe('Supplier filters', () => {
  it('passes search and status filters to the API', async () => {
    const user = userEvent.setup()
    vi.mocked(suppliersApiModule.suppliersApi.list).mockResolvedValue({
      data: [
        {
          id: 's1',
          fullName: 'Ramesh Dairy',
          email: 'ramesh@example.com',
          status: 'ACTIVE',
          customerCount: 5,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { requestId: 'req-1', page: 1, limit: 20, total: 1, totalPages: 1 },
    })

    renderWithProviders(<SuppliersListPage />, { route: '/suppliers' })

    await screen.findByText('Ramesh Dairy')

    await user.type(screen.getByLabelText(/search suppliers/i), 'Ramesh')
    await user.click(screen.getByLabelText(/filter by status/i))
    await user.click(await screen.findByRole('option', { name: 'Blocked' }))

    await waitFor(() => {
      expect(suppliersApiModule.suppliersApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Ramesh',
          status: 'BLOCKED',
        }),
      )
    })
  })
})
