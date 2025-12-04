"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type UserRole = "employer" | "employee" | "auditor"

export interface User {
  id: string
  username: string
  role: UserRole
  name?: string
  email?: string
  employee_tag?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  isLoading: boolean
  refresh: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    const employee = data.employee
    return {
      id: employee.employee_id,
      username: employee.username,
      role: employee.role || "employee",
      name: employee.profile?.name,
      email: employee.profile?.email,
      employee_tag: employee.employee_tag,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const sessionUser = await fetchSession()
    setUser(sessionUser)
    setIsLoading(false)
    return sessionUser
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Login failed")
    }
    const data = await res.json()
    const employee = data.employee
    const newUser: User = {
      id: employee.employee_id,
      username: employee.username,
      role: employee.role || "employee",
      name: employee.profile?.name,
      email: employee.profile?.email,
      employee_tag: employee.employee_tag,
    }
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
