import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { requestsAPI } from '../services/api'

const CustomerOfferCountContext = createContext({
	count: 0,
	refresh: async () => {},
})

export function computeCustomerSentOfferCount(requests) {
	return (Array.isArray(requests) ? requests : []).reduce((total, request) => {
		const bookings = request.bookings || []
		const isAwaiting =
			!bookings.some((b) => ['CONFIRMED', 'RESCHEDULED'].includes(b.status)) &&
			!bookings.some((b) => b.status === 'DONE' || b.status === 'CANCELLED') &&
			!['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(request.status)
		if (!isAwaiting) return total
		const offers = request.offers || []
		return total + offers.filter((o) => o.status === 'SENT').length
	}, 0)
}

export function CustomerOfferCountProvider({ children }) {
	const { user } = useAuth()
	const { pathname } = useLocation()
	const [count, setCount] = useState(0)

	const refresh = useCallback(async () => {
		const customerId = user?.id || user?._id
		if (!customerId || user?.role !== 'CUSTOMER') {
			setCount(0)
			return
		}

		try {
			const res = await requestsAPI.getByCustomer(customerId)
			setCount(computeCustomerSentOfferCount(res.data))
		} catch {
			setCount(0)
		}
	}, [user])

	useEffect(() => {
		refresh()
	}, [refresh, pathname])

	useEffect(() => {
		const onFocus = () => refresh()
		window.addEventListener('focus', onFocus)
		return () => window.removeEventListener('focus', onFocus)
	}, [refresh])

	return (
		<CustomerOfferCountContext.Provider value={{ count, refresh }}>
			{children}
		</CustomerOfferCountContext.Provider>
	)
}

export function useCustomerOfferCount() {
	return useContext(CustomerOfferCountContext).count
}

export function useRefreshCustomerOfferCount() {
	return useContext(CustomerOfferCountContext).refresh
}
