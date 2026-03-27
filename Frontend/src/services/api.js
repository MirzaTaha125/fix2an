import axios from 'axios'
import { API_BASE_URL } from '../config/api.js'

const isDev = import.meta.env.DEV

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		...(isDev && { 'ngrok-skip-browser-warning': 'true' }),
	},
	timeout: 30000,
})

// Add token to requests if available
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// Handle auth errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// Log network errors for debugging
		if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
			console.error('Network error - is the backend server running?', error)
			return Promise.reject({
				...error,
				response: {
					data: { message: 'Cannot connect to server. Please make sure the backend is running and ngrok tunnel is active.' }
				}
			})
		}
		
		// Handle timeout errors
		if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
			console.error('Request timeout - server may be slow or ngrok tunnel may be inactive', error)
			return Promise.reject({
				...error,
				response: {
					data: { message: 'Request timed out. Please check your ngrok tunnel and try again.' }
				}
			})
		}
		
		if (error.response?.status === 401) {
			console.log('401 Unauthorized - clearing token')
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			// Don't redirect on login page or if already on a public route - let the component handle it
			const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/verify-email', '/auth/2fa-verify', '/signin', '/signup', '/', '/how-it-works', '/workshop/signup']
			const isPublicRoute = publicRoutes.some(route => window.location.pathname.includes(route))
			if (!isPublicRoute) {
				// Use setTimeout to avoid navigation conflicts during back button navigation
				setTimeout(() => {
					window.location.href = '/auth/signin'
				}, 100)
			}
		}
		return Promise.reject(error)
	}
)

// Auth API
export const authAPI = {
	register: (data) => api.post('/api/auth/register', data),
	login: (data) => api.post('/api/auth/login', data),
	verifyEmail: (data) => api.post('/api/auth/verify-email', data),
	verify2FALogin: (data) => api.post('/api/auth/2fa/verify-login', data),
	getMe: () => api.get('/api/auth/me'),
	updateProfile: (userId, data) => api.patch(`/api/auth/profile/${userId}`, data),
	get2FAStatus: () => api.get('/api/auth/2fa/status'),
	get2FASetup: () => api.get('/api/auth/2fa/setup'),
	verify2FASetup: (data) => api.post('/api/auth/2fa/verify-setup', data),
	disable2FA: (data) => api.post('/api/auth/2fa/disable', data),
	deleteAccount: () => api.delete('/api/auth/self-delete'),
}

// Vehicles API
export const vehiclesAPI = {
	create: (data) => api.post('/api/vehicles', data),
	getAll: () => api.get('/api/vehicles'),
}

// Requests API
export const requestsAPI = {
	create: (data) => api.post('/api/requests', data),
	getByCustomer: (customerId) => api.get(`/api/requests/customer/${customerId}`),
	getAvailable: (params) => api.get('/api/requests/available', { params }),
	getById: (requestId) => api.get(`/api/requests/${requestId}`),
}

// Offers API
export const offersAPI = {
	create: (data) => api.post('/api/offers', data),
	update: (offerId, data) => api.patch(`/api/offers/${offerId}`, data),
	getByRequest: (requestId, params) =>
		api.get(`/api/offers/request/${requestId}`, { params }),
	getByWorkshop: () => api.get('/api/offers/workshop/me'),
	getAvailableRequests: (params) => api.get('/api/offers/requests/available', { params }),
}

// Bookings API
export const bookingsAPI = {
	create: (data) => api.post('/api/bookings', data),
	getByCustomer: (customerId) => api.get(`/api/bookings/customer/${customerId}`),
	getByWorkshop: (workshopId) => workshopId ? api.get(`/api/bookings/workshop/${workshopId}`) : api.get('/api/bookings/workshop/me'),
	getByWorkshopMe: () => api.get('/api/bookings/workshop/me'),
	update: (bookingId, data) => api.patch(`/api/bookings/${bookingId}`, data),
	cancel: (bookingId) => api.patch(`/api/bookings/${bookingId}`, { status: 'CANCELLED' }),
	reschedule: (bookingId, scheduledAt) => api.patch(`/api/bookings/${bookingId}`, { scheduledAt, status: 'RESCHEDULED' }),
	complete: (bookingId) => api.patch(`/api/bookings/${bookingId}`, { status: 'DONE' }),
}

// Upload API
export const uploadAPI = {
	uploadFile: (formData) =>
		api.post('/api/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		}),
}

// Reviews API
export const reviewsAPI = {
	create: (data) => api.post('/api/reviews', data),
	getByWorkshop: (workshopId) => api.get(`/api/reviews/workshop/${workshopId}`),
	getByBooking: (bookingId) => api.get(`/api/reviews/booking/${bookingId}`),
}

// Workshop API
export const workshopAPI = {
	register: (data) => api.post('/api/workshop/register', data),
	getStats: () => api.get('/api/workshop/stats'),
	getProfile: () => api.get('/api/workshop/profile'),
	updateProfile: (data) => api.patch('/api/workshop/profile', data),
	getReviews: () => api.get('/api/workshop/reviews'),
}

// Admin API
export const adminAPI = {
	getStats: () => api.get('/api/admin/stats'),
	getUsers: (params) => api.get('/api/admin/users', { params }),
	updateUser: (id, data) => api.patch(`/api/admin/users/${id}`, data),
	getPendingWorkshops: () => api.get('/api/admin/pending-workshops'),
	getWorkshops: (params) => api.get('/api/admin/workshops', { params }),
	getWorkshopById: (id) => api.get(`/api/admin/workshops/${id}`),
	updateWorkshop: (data) => api.patch('/api/admin/workshops', data),
	getRequests: (params) => api.get('/api/admin/requests', { params }),
	getOffers: (params) => api.get('/api/admin/offers', { params }),
	getBookings: (params) => api.get('/api/admin/bookings', { params }),
	getEmailConfig: () => api.get('/api/admin/email-config'),
}

export { api }
export default api

