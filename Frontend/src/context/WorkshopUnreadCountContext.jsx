import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { messagesAPI } from '../services/api'

const WorkshopUnreadCountContext = createContext({
	count: 0,
	refresh: async () => {},
})

export function sumWorkshopUnread(conversations) {
	return (Array.isArray(conversations) ? conversations : []).reduce(
		(total, row) => total + (Number(row?.unreadCount) || 0),
		0
	)
}

export function WorkshopUnreadCountProvider({ children }) {
	const { user } = useAuth()
	const { pathname } = useLocation()
	const [count, setCount] = useState(0)

	const refresh = useCallback(async () => {
		if (!user || user.role !== 'WORKSHOP') {
			setCount(0)
			return
		}
		try {
			const res = await messagesAPI.inbox()
			setCount(sumWorkshopUnread(res.data?.conversations))
		} catch {
			setCount(0)
		}
	}, [user])

	useEffect(() => {
		refresh()
	}, [refresh, pathname])

	useEffect(() => {
		if (!user || user.role !== 'WORKSHOP') return undefined
		const timer = setInterval(refresh, 5000)
		const onFocus = () => refresh()
		const onVisible = () => {
			if (document.visibilityState === 'visible') refresh()
		}
		window.addEventListener('focus', onFocus)
		document.addEventListener('visibilitychange', onVisible)
		return () => {
			clearInterval(timer)
			window.removeEventListener('focus', onFocus)
			document.removeEventListener('visibilitychange', onVisible)
		}
	}, [user, refresh])

	return (
		<WorkshopUnreadCountContext.Provider value={{ count, refresh }}>
			{children}
		</WorkshopUnreadCountContext.Provider>
	)
}

export function useWorkshopUnreadCount() {
	return useContext(WorkshopUnreadCountContext).count
}

export function useRefreshWorkshopUnreadCount() {
	return useContext(WorkshopUnreadCountContext).refresh
}
