import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	// Initialize user from localStorage if available
	const [user, setUser] = useState(() => {
		try {
			const storedUser = localStorage.getItem('user')
			return storedUser ? JSON.parse(storedUser) : null
		} catch {
			return null
		}
	})
	const [loading, setLoading] = useState(true)
	const [token, setToken] = useState(localStorage.getItem('token'))

	useEffect(() => {
		if (token) {
			fetchUser()
		} else {
			// If no token, clear user and stop loading
			setUser(null)
			setLoading(false)
		}
	}, [token])

	const fetchUser = async () => {
		try {
			const response = await authAPI.getMe()
			const userData = response.data
			// Convert relative image URL to absolute if needed
			if (userData?.image) {
				userData.image = getFullUrl(userData.image)
			}
			setUser(userData)
			// Update localStorage with fresh user data
			localStorage.setItem('user', JSON.stringify(userData))
		} catch (error) {
			console.error('Failed to fetch user:', error)
			// Only clear if it's a 401 (unauthorized) error
			if (error.response?.status === 401) {
				localStorage.removeItem('token')
				localStorage.removeItem('user')
				setToken(null)
				setUser(null)
			}
			// For other errors, keep the cached user but still set loading to false
		} finally {
			setLoading(false)
		}
	}

	const login = async (email, password) => {
		try {
			const normalizedEmail = email.trim().toLowerCase()
			const response = await authAPI.login({ email: normalizedEmail, password })
			const { requiresTwoFactor, tempToken, token: newToken, user: userData } = response.data

			if (requiresTwoFactor && tempToken) {
				return { success: false, requiresTwoFactor: true, tempToken, email: response.data.email || normalizedEmail }
			}

			if (!newToken || !userData) {
				throw new Error('Invalid response from server')
			}

			localStorage.setItem('token', newToken)
			localStorage.setItem('user', JSON.stringify(userData))
			setToken(newToken)
			setUser(userData)
			return { success: true, user: userData }
		} catch (error) {
			// Provide more specific error messages
			let errorMessage = 'Login failed'
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message
			} else if (error.response?.status === 401) {
				errorMessage = 'Invalid email or password. Please check your credentials and try again.'
			} else if (error.response?.status === 403) {
				errorMessage = error.response.data.message || 'Your account is inactive. Please contact support.'
			} else if (error.response?.status === 500) {
				errorMessage = 'Server error. Please try again later.'
			} else if (error.message) {
				errorMessage = error.message
			}
			
			return {
				success: false,
				message: errorMessage,
			}
		}
	}

	const register = async (userData) => {
		try {
			const response = await authAPI.register(userData)
			return { success: true, data: response.data }
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || 'Registration failed',
				errors: error.response?.data?.errors || {},
			}
		}
	}

	const verify2FA = async (tempToken, code) => {
		try {
			const response = await authAPI.verify2FALogin({ tempToken, code })
			const { token: newToken, user: userData } = response.data
			if (!newToken || !userData) {
				throw new Error('Invalid response from server')
			}
			localStorage.setItem('token', newToken)
			localStorage.setItem('user', JSON.stringify(userData))
			setToken(newToken)
			setUser(userData)
			return { success: true, user: userData }
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || 'Invalid or expired code. Please try again.',
			}
		}
	}

	const logout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		setToken(null)
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, verify2FA, register, logout, fetchUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
