import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { IpcResponse } from '@shared/types'

interface AuthState {
  isAuthenticated: boolean
  isDevBypass: boolean
  isLoading: boolean
  needsSetup: boolean
  login: (isDevBypass?: boolean) => void
  logout: () => Promise<void>
  checkSetup: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDevBypass, setIsDevBypass] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  const checkSetup = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = (await window.electronAPI.checkSetup()) as IpcResponse<{
        needsSetup: boolean
      }>
      if (result.data) {
        setNeedsSetup(result.data.needsSetup)
      }
    } catch {
      // If check fails, assume setup is needed
      setNeedsSetup(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSetup()
  }, [checkSetup])

  const login = useCallback((isDevBypassVal = false) => {
    setIsAuthenticated(true)
    setIsDevBypass(isDevBypassVal)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call backend to clear server-side session
      await window.electronAPI.logout()
    } catch {
      // Even if backend call fails, clear local state
      console.error('[WARN] Backend logout failed, clearing local state')
    }
    setIsAuthenticated(false)
    setIsDevBypass(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isDevBypass, isLoading, needsSetup, login, logout, checkSetup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
