import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { messagesAPI } from '../services/api'

const CustomerUnreadCountContext = createContext({
	count: 0,
	refresh: async () => {},
})

export function sumCustomerUnread(conversations) {
	return (Array.isArray(conversations) ? conversations : []).reduce(
		(total, row) => total + (Number(row?.unreadCount) || 0),
		0
	)
}

export function CustomerUnreadCountProvider({ children }) {
	const { user } = useAuth()
	const { pathname, search } = useLocation()
	const [count, setCount] = useState(0)

	const refresh = useCallback(async () => {
		if (!user || user.role !== 'CUSTOMER') {
			setCount(0)
			return
		}
		try {
			const res = await messagesAPI.customerInbox()
			setCount(sumCustomerUnread(res.data?.conversations))
		} catch {
			setCount(0)
		}
	}, [user])

	useEffect(() => {
		refresh()
	}, [refresh, pathname, search])

	useEffect(() => {
		if (!user || user.role !== 'CUSTOMER') return undefined
		const timer = setInterval(refresh, 20000)
		const onFocus = () => refresh()
		window.addEventListener('focus', onFocus)
		return () => {
			clearInterval(timer)
			window.removeEventListener('focus', onFocus)
		}
	}, [user, refresh])

	return (
		<CustomerUnreadCountContext.Provider value={{ count, refresh }}>
			{children}
		</CustomerUnreadCountContext.Provider>
	)
}

export function useCustomerUnreadCount() {
	return useContext(CustomerUnreadCountContext).count
}

export function useRefreshCustomerUnreadCount() {
	return useContext(CustomerUnreadCountContext).refresh
}
