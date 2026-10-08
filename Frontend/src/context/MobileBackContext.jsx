import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const MobileBackContext = createContext({
	handler: null,
	title: null,
	avatar: null,
	actions: [],
	pushHandler: () => null,
	popHandler: () => {},
})

let nextBackId = 1

function normalizeMeta(meta) {
	if (!meta) return { title: null, avatar: null, actions: [] }
	if (typeof meta === 'string') return { title: meta, avatar: null, actions: [] }
	return {
		title: meta.title || null,
		avatar: meta.avatar || meta.logo || null,
		actions: Array.isArray(meta.actions) ? meta.actions : [],
	}
}

export function MobileBackProvider({ children }) {
	const [stack, setStack] = useState([])

	const pushHandler = useCallback((fn, meta = null) => {
		if (typeof fn !== 'function') return null
		const id = `mb-${nextBackId++}`
		const { title, avatar, actions } = normalizeMeta(meta)
		setStack((prev) => [...prev, { id, fn, title, avatar, actions }])
		return id
	}, [])

	const popHandler = useCallback((id) => {
		if (!id) return
		setStack((prev) => prev.filter((entry) => entry.id !== id))
	}, [])

	const top = stack.length ? stack[stack.length - 1] : null
	const handler = top?.fn || null
	const title = top?.title || null
	const avatar = top?.avatar || null
	const actions = top?.actions || []

	const value = useMemo(
		() => ({ handler, title, avatar, actions, pushHandler, popHandler }),
		[handler, title, avatar, actions, pushHandler, popHandler]
	)

	return <MobileBackContext.Provider value={value}>{children}</MobileBackContext.Provider>
}

export function useMobileBack() {
	return useContext(MobileBackContext)
}

/** Register a mobile top-bar back action while this screen is mounted. */
export function useRegisterMobileBack(handler, enabled = true, meta = null) {
	const { pushHandler, popHandler } = useMobileBack()
	const handlerRef = useRef(handler)
	handlerRef.current = handler
	const actionsRef = useRef([])
	const normalized = normalizeMeta(meta)
	const title = normalized.title
	const avatar = normalized.avatar
	const actions = normalized.actions
	actionsRef.current = actions
	const actionsKey = actions.map((item) => item?.key || item?.label || '').join('|')

	useEffect(() => {
		if (!enabled) return undefined
		const resolvedActions = (actionsRef.current || []).map((item) => ({
			key: item.key || item.label,
			label: item.label,
			danger: Boolean(item.danger),
			onClick: (...args) => {
				const current = (actionsRef.current || []).find(
					(entry) => (entry.key || entry.label) === (item.key || item.label)
				)
				current?.onClick?.(...args)
			},
		}))
		const id = pushHandler(() => handlerRef.current?.(), { title, avatar, actions: resolvedActions })
		return () => popHandler(id)
	}, [enabled, title, avatar, actionsKey, pushHandler, popHandler])
}
