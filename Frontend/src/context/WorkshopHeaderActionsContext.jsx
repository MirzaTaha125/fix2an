import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const WorkshopHeaderActionsContext = createContext({
	actions: [],
	setActions: () => {},
})

export function WorkshopHeaderActionsProvider({ children }) {
	const [actions, setActionsState] = useState([])
	const setActions = useCallback((next) => {
		setActionsState(Array.isArray(next) ? next : [])
	}, [])
	const value = useMemo(() => ({ actions, setActions }), [actions, setActions])
	return (
		<WorkshopHeaderActionsContext.Provider value={value}>
			{children}
		</WorkshopHeaderActionsContext.Provider>
	)
}

export function useWorkshopHeaderActions() {
	return useContext(WorkshopHeaderActionsContext)
}

/** Register top-bar ⋯ menu actions while this screen is mounted. */
export function useRegisterWorkshopHeaderActions(actions, enabled = true) {
	const { setActions } = useWorkshopHeaderActions()
	const actionsRef = useRef(actions)
	actionsRef.current = actions
	const key = (actions || []).map((item) => `${item?.key || ''}:${item?.label || ''}`).join('|')

	useEffect(() => {
		if (!enabled || !actionsRef.current?.length) {
			setActions([])
			return () => setActions([])
		}
		const snapshot = (actionsRef.current || []).map((item) => ({
			key: item.key || item.label,
			label: item.label,
			danger: Boolean(item.danger),
			onClick: () => {
				const current = (actionsRef.current || []).find(
					(entry) => (entry.key || entry.label) === (item.key || item.label)
				)
				current?.onClick?.()
			},
		}))
		setActions(snapshot)
		return () => setActions([])
	}, [enabled, key, setActions])
}
