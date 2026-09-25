import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { renderWithProviders } from '../../../test/test-utils'
import * as authApiModule from '../api/authApi'
import { tokenStore } from '../../../lib/auth/tokenStore'
import { ApiError } from '../../../lib/api/errors'

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

    expect(await screen.findByText(/10-digit/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(authApiModule.authApi.login).not.toHaveBeenCalled()
  })

  it('submits valid credentials and stores tokens in memory', async () => {
    const user = userEvent.setup()
    vi.mocked(authApiModule.authApi.login).mockResolvedValue({
      user: {
        id: '1',
        name: 'Platform Owner',
        mobileNumber: '919999999999',
        role: 'PLATFORM_OWNER',
        status: 'ACTIVE',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Dashboard home</div>} />
        <Route path="/customer" element={<div>Customer welcome</div>} />
      </Routes>,
      { route: '/login' },
    )

    await user.type(screen.getByLabelText(/mobile number/i), '9999999999')
    await user.type(screen.getByLabelText(/password/i), 'Admin@12345')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApiModule.authApi.login).toHaveBeenCalledWith({
        mobileNumber: '919999999999',
        password: 'Admin@12345',
      })
    })

    expect(tokenStore.getAccessToken()).toBe('access-token')
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument()
  })

  it('shows a friendly localized error for invalid credentials', async () => {
    const user = userEvent.setup()
    vi.mocked(authApiModule.authApi.login).mockRejectedValue(
      new ApiError({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      }),
    )

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: '/login' },
    )

    await user.type(screen.getByLabelText(/mobile number/i), '9999999999')
    await user.type(screen.getByLabelText(/password/i), 'Admin@12345')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Incorrect mobile number or password.')).toBeInTheDocument()
  })
})
