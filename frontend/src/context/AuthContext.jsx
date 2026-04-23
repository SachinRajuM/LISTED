import { createContext, useContext, useState } from 'react'
import { authAPI } from '../api'
 
const AuthContext = createContext(null)
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
 
  const login = async (credentials) => {
    const res = await authAPI.login(credentials)
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }
 
  const register = async (data) => {
    const res = await authAPI.register(data)
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }
 
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }
 
  const value = {
    user,
    login,
    register,
    logout,
    isAdmin:       user?.role === 'admin',
    isRecruiter:   user?.role === 'recruiter' || user?.role === 'admin' || user?.role === 'hiring_manager',
    isAuthenticated: !!user,
  }
 
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
 
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
 