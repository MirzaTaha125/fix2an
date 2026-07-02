import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, AUTH_LOGOUT_EVENT, clearAuthSession, getAuthToken } from '../services/api'
import { getFullUrl } from '../config/api.js'

const AuthContext = createContext(null)

function readStoredUser() {
	try {
		const token = getAuthToken()
		if (!token) return null
		const storedUser = localStorage.getItem('user')
		if (!storedUser) return null
		const userData = JSON.parse(storedUser)
		if (userData?.role) userData.role = userData.role.toUpperCase()
		return userData
	} catch {
		return null
	}
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(readStoredUser)
	const [loading, setLoading] = useState(true)
	const [token, setToken] = useState(getAuthToken)

	useEffect(() => {
		const handleLogout = () => {
			setToken(null)
			setUser(null)
		}
		window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout)
		return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout)
	}, [])

	useEffect(() => {
		if (token) {
			fetchUser()
		} else {
			setUser(null)
			setLoading(false)
		}
	}, [token])

	const fetchUser = async () => {
		try {
			const response = await authAPI.getMe()
			const userData = response.data
			// Normalize role to uppercase
			if (userData?.role) {
				userData.role = userData.role.toUpperCase()
			}
			// Convert relative image URL to absolute if needed
			if (userData?.image) {
				userData.image = getFullUrl(userData.image)
			}
			setUser(userData)
			// Update localStorage with fresh user data
			localStorage.setItem('user', JSON.stringify(userData))
		} catch (error) {
			console.error('Failed to fetch user:', error)
			if (error.response?.status === 401) {
				clearAuthSession()
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

			// Normalize role
			if (userData?.role) {
				userData.role = userData.role.toUpperCase()
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

			// Normalize role
			if (userData?.role) {
				userData.role = userData.role.toUpperCase()
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
		clearAuthSession()
		setToken(null)
		setUser(null)
	}

	const setSession = async (newToken, userData) => {
		if (!newToken) {
			throw new Error('Missing auth token')
		}
		if (userData?.role) {
			userData.role = userData.role.toUpperCase()
		}
		localStorage.setItem('token', newToken)
		localStorage.setItem('user', JSON.stringify(userData))
		setToken(newToken)
		setUser(userData)
		try {
			const response = await authAPI.getMe()
			const freshUser = response.data
			if (freshUser?.role) freshUser.role = freshUser.role.toUpperCase()
			if (freshUser?.image) freshUser.image = getFullUrl(freshUser.image)
			localStorage.setItem('user', JSON.stringify(freshUser))
			setUser(freshUser)
		} catch (error) {
			console.error('Failed to refresh user after login:', error)
		}
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, verify2FA, register, logout, fetchUser, setSession }}>
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
