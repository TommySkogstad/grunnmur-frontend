/// <reference types="vitest/config" />
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createProtectedRoute } from './ProtectedRoute'
import type { AuthContextValue } from '../auth/AuthContext'

// Hjelpefunksjon: lag mock useAuth med gitte verdier
function createMockUseAuth<TUser>(overrides: Partial<AuthContextValue<TUser>> = {}) {
  const defaults: AuthContextValue<TUser> = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }
  return () => ({ ...defaults, ...overrides })
}

interface TestUser {
  id: number
  email: string
  role: string
}

describe('createProtectedRoute', () => {
  it('redirecter til loginPath når bruker ikke er autentisert', () => {
    const useAuth = createMockUseAuth<TestUser>({ isAuthenticated: false })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/logg-inn" element={<p>Innloggingsside</p>} />
          <Route element={<ProtectedRoute loginPath="/logg-inn" />}>
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Innloggingsside')).toBeDefined()
  })

  it('viser children/outlet når bruker er autentisert', () => {
    const useAuth = createMockUseAuth<TestUser>({
      isAuthenticated: true,
      user: { id: 1, email: 'test@test.no', role: 'user' },
    })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/logg-inn" element={<p>Innloggingsside</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeDefined()
  })

  it('viser loadingComponent når isLoading er true', () => {
    const useAuth = createMockUseAuth<TestUser>({ isLoading: true })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute loadingComponent={<p>Laster...</p>} />}>
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Laster...')).toBeDefined()
  })

  it('returnerer null som standard ved isLoading uten loadingComponent', () => {
    const useAuth = createMockUseAuth<TestUser>({ isLoading: true })
    const ProtectedRoute = createProtectedRoute(useAuth)

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(container.textContent).toBe('')
  })

  it('redirecter med roleCheck som avviser bruker', () => {
    const useAuth = createMockUseAuth<TestUser>({
      isAuthenticated: true,
      user: { id: 1, email: 'test@test.no', role: 'user' },
    })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/logg-inn" element={<p>Innloggingsside</p>} />
          <Route path="/ingen-tilgang" element={<p>Ingen tilgang</p>} />
          <Route
            element={
              <ProtectedRoute
                loginPath="/logg-inn"
                roleCheck={(user) => user.role === 'admin'}
                unauthorizedPath="/ingen-tilgang"
              />
            }
          >
            <Route path="/admin" element={<p>Admin-panel</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Ingen tilgang')).toBeDefined()
  })

  it('viser innhold når roleCheck godkjenner bruker', () => {
    const useAuth = createMockUseAuth<TestUser>({
      isAuthenticated: true,
      user: { id: 1, email: 'admin@test.no', role: 'admin' },
    })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            element={
              <ProtectedRoute roleCheck={(user) => user.role === 'admin'} />
            }
          >
            <Route path="/admin" element={<p>Admin-panel</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Admin-panel')).toBeDefined()
  })

  it('bruker standard loginPath /logg-inn', () => {
    const useAuth = createMockUseAuth<TestUser>({ isAuthenticated: false })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/logg-inn" element={<p>Standard innlogging</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Standard innlogging')).toBeDefined()
  })

  it('redirecter til loginPath ved feilet roleCheck uten unauthorizedPath', () => {
    const useAuth = createMockUseAuth<TestUser>({
      isAuthenticated: true,
      user: { id: 1, email: 'test@test.no', role: 'user' },
    })
    const ProtectedRoute = createProtectedRoute(useAuth)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/logg-inn" element={<p>Innlogging</p>} />
          <Route
            element={
              <ProtectedRoute roleCheck={(user) => user.role === 'admin'} />
            }
          >
            <Route path="/admin" element={<p>Admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Innlogging')).toBeDefined()
  })
})
