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
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(await screen.findByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('allows ADMIN users through after session restore', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      id: '1',
      email: 'admin@doodhkhata.app',
      fullName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    await waitFor(() => {
      expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
    })
  })

  it('sends non-admin users to unauthorized', async () => {
    tokenStore.setTokens('access', 'refresh')
    vi.mocked(authApiModule.authApi.refresh).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    })
    vi.mocked(authApiModule.authApi.profile).mockResolvedValue({
      id: '2',
      email: 'supplier@doodhkhata.app',
      fullName: 'Supplier',
      role: 'SUPPLIER',
      status: 'ACTIVE',
    })

    renderWithProviders(
      <Routes>
        <Route path="/unauthorized" element={<div>Unauthorized screen</div>} />
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/" element={<div>Secret dashboard</div>} />
        </Route>
      </Routes>,
      { route: '/' },
    )

    expect(await screen.findByText('Unauthorized screen')).toBeInTheDocument()
  })
})
