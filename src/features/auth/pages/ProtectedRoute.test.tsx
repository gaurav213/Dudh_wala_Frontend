import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../../../components/layout/ProtectedRoute'
import { renderWithProviders } from '../../../test/test-utils'
import { tokenStore } from '../../../lib/auth/tokenStore'
import * as authApiModule from '../api/authApi'

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    profile: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('Protected routes', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  it('redirects unauthenticated users to login', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute roles={['PLATFORM_OWNER', 'FARM_OWNER']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(await screen.findByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('allows PLATFORM_OWNER users through after session restore', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      user: {
        id: '1',
        name: 'Platform Owner',
        mobileNumber: '919999999999',
        role: 'PLATFORM_OWNER',
        status: 'ACTIVE',
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute roles={['PLATFORM_OWNER', 'FARM_OWNER']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    await waitFor(() => {
      expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
    })
  })

  it('allows FARM_OWNER users through', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      user: {
        id: '2',
        name: 'Farm Owner',
        mobileNumber: '919888888888',
        role: 'FARM_OWNER',
        status: 'ACTIVE',
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/unauthorized" element={<div>Unauthorized screen</div>} />
        <Route element={<ProtectedRoute roles={['PLATFORM_OWNER', 'FARM_OWNER']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(await screen.findByText('Secret dashboard')).toBeInTheDocument()
  })

  it('sends customer users to customer dashboard route', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      user: {
        id: '3',
        name: 'Customer',
        mobileNumber: '919777777777',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/customer" element={<div>Customer dashboard</div>} />
        <Route element={<ProtectedRoute roles={['PLATFORM_OWNER', 'FARM_OWNER']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(await screen.findByText('Customer dashboard')).toBeInTheDocument()
  })

  it('sends delivery staff to /delivery instead of looping on /customer', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      user: {
        id: '4',
        name: 'Delivery Staff',
        mobileNumber: '919777000003',
        role: 'DELIVERY_STAFF',
        status: 'ACTIVE',
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/delivery" element={<div>Delivery dashboard</div>} />
        <Route path="/customer" element={<div>Customer dashboard</div>} />
        <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
          <Route path="/customer-only" element={<div>Customer only</div>} />
        </Route>
      </Routes>,
      { route: '/customer-only' },
    )

    expect(await screen.findByText('Delivery dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Customer dashboard')).not.toBeInTheDocument()
  })
})
