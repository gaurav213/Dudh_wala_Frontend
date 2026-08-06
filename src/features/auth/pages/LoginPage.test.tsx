import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { renderWithProviders } from '../../../test/test-utils'
import * as authApiModule from '../api/authApi'
import { tokenStore } from '../../../lib/auth/tokenStore'

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    profile: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}))

describe('Login form', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: '/login' },
    )

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(authApiModule.authApi.login).not.toHaveBeenCalled()
  })

  it('submits valid credentials and stores tokens in memory', async () => {
    const user = userEvent.setup()
    vi.mocked(authApiModule.authApi.login).mockResolvedValue({
      user: {
        id: '1',
        email: 'admin@doodhkhata.app',
        fullName: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Dashboard home</div>} />
      </Routes>,
      { route: '/login' },
    )

    await user.type(screen.getByLabelText(/email/i), 'admin@doodhkhata.app')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApiModule.authApi.login).toHaveBeenCalledWith({
        email: 'admin@doodhkhata.app',
        password: 'password123',
      })
    })

    expect(tokenStore.getAccessToken()).toBe('access-token')
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument()
  })
})
