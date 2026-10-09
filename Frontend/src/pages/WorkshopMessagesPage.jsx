import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import WorkshopShell from '../components/workshop/WorkshopShell'
import CaseChat from '../components/cases/CaseChat'
import { formatMessagePreview } from '../components/cases/caseHelpers'
import EmptyState from '../components/ui/EmptyState'
import OfferCountBadge from '../components/OfferCountBadge'
import { Skeleton } from '../components/ui/Skeleton'
import { useRefreshWorkshopUnreadCount } from '../context/WorkshopUnreadCountContext'
import { getFullUrl } from '../config/api.js'
import { messagesAPI, workshopAPI } from '../services/api'

function listTime(value, t) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const now = new Date()
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diff = Math.round((startToday - start) / 86400000)
	if (diff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	if (diff === 1) return t('my_cases.flow.yesterday')
	if (diff < 7) return t('workshop.panel.days_ago', { count: diff })
	return date.toLocaleDateString()
}

function MessagesListSkeleton({ rows = 5 } = {}) {
	return (
		<div className="flex-1 min-h-0 overflow-hidden" aria-hidden>
			{Array.from({ length: rows }).map((_, index) => (
				<div key={index} className="flex items-center gap-3 px-3 py-3.5 border-b border-[#EEF0F4]">
					<Skeleton className="w-11 h-11 rounded-full shrink-0" />
					<div className="min-w-0 flex-1 space-y-2 py-0.5">
						<Skeleton className="h-3 w-20 max-w-[40%]" />
						<Skeleton className="h-3.5 w-32 max-w-[55%]" />
						<Skeleton className="h-3 w-3/4" />
					</div>
					<div className="flex flex-col items-end gap-2 shrink-0 pl-3">
						<Skeleton className="h-3 w-12" />
						<Skeleton className="h-[18px] w-[18px] rounded-full" />
					</div>
				</div>
			))}
		</div>
	)
}

function ConversationRow({ row, selectedId, onSelect, t }) {
	const active = selectedId === row.id || row.unread > 0
	const preview = formatMessagePreview(row.preview, t, {
		senderRole: row.senderRole,
		viewerRole: 'WORKSHOP',
	})
	return (
		<button
			type="button"
			onClick={() => onSelect(row.id)}
			className={`w-full text-left flex items-center gap-3 px-3 py-3.5 border-b border-[#EEF0F4] ${selectedId === row.id ? 'bg-[#F3FBF6]' : ''}`}
		>
			{row.image ? (
				<div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
					<img
						src={getFullUrl(row.image)}
						alt={row.name}
						className="w-full h-full object-cover"
					/>
				</div>
			) : (
				<div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-brand-btn text-white' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>
					<User className="w-5 h-5" strokeWidth={1.75} />
				</div>
			)}
			<div className="min-w-0 flex-1 py-0.5">
				<p className="text-xs text-[#1B8F3E] truncate leading-snug">
					{t('workshop.panel.case_no', { id: row.caseNo })}
				</p>
				<p className="text-sm font-bold text-[#05324f] truncate leading-snug mt-0.5">
					{row.name}
				</p>
				{preview ? (
					<p className="text-xs text-[#6B7280] truncate leading-snug mt-1">
						{preview}
					</p>
				) : null}
			</div>
			<div className="flex flex-col items-end gap-2 shrink-0 pl-3 self-start pt-0.5">
				<p className="text-[11px] text-[#9CA3AF]">{listTime(row.time, t)}</p>
				<OfferCountBadge count={row.unread} />
			</div>
		</button>
	)
}

export default function WorkshopMessagesPage() {
	const { t } = useTranslation()
	const refreshUnread = useRefreshWorkshopUnreadCount()
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(true)
	const [workshopId, setWorkshopId] = useState('')
	const [selectedId, setSelectedId] = useState(null)
	const [tab, setTab] = useState('all')
	const [showAllMessages, setShowAllMessages] = useState(false)
	const [listOverflows, setListOverflows] = useState(false)
	const listRef = useRef(null)

	useEffect(() => {
		let stop = false
		const load = (isInitial = false) => {
			if (document.visibilityState === 'hidden' && !isInitial) return
			Promise.all([messagesAPI.inbox(), workshopAPI.getProfile()])
				.then(([inboxRes, profileRes]) => {
					if (stop) return
					setWorkshopId(profileRes.data?.workshop?.id || '')
					const conversations = Array.isArray(inboxRes.data?.conversations) ? inboxRes.data.conversations : []
					setRows(conversations.map((row) => ({
						id: row.offerId || row.requestId,
						requestId: row.requestId,
						caseNo: String(row.requestId || '').slice(-5).toUpperCase(),
						name: row.name || t('common.customer'),
						image: row.image || '',
						time: row.lastMessageAt,
						unread: row.unreadCount || 0,
						preview: row.preview || '',
						senderRole: row.senderRole || null,
					})).filter((row) => row.requestId))
					refreshUnread()
				})
				.catch(() => {
					if (!stop) setRows([])
				})
				.finally(() => {
					if (!stop && isInitial) setLoading(false)
				})
		}
		load(true)
		const timer = setInterval(() => load(false), 4000)
		return () => {
			stop = true
			clearInterval(timer)
		}
	}, [t, refreshUnread])

	const unreadRows = rows.filter((row) => row.unread > 0)
	const pool = tab === 'unread' ? unreadRows : rows
	const selected = rows.find((row) => row.id === selectedId) || null
	const showViewAll = !loading && !showAllMessages && pool.length > 0 && listOverflows

	useLayoutEffect(() => {
		if (showAllMessages || loading || pool.length === 0) {
			setListOverflows(false)
			return undefined
		}
		const el = listRef.current
		if (!el) return undefined

		const check = () => {
			setListOverflows(el.scrollHeight > el.clientHeight + 2)
		}
		check()
		const frame = requestAnimationFrame(check)
		const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
		observer?.observe(el)
		return () => {
			cancelAnimationFrame(frame)
			observer?.disconnect()
		}
	}, [pool, showAllMessages, loading, tab, selectedId])

	return (
		<WorkshopShell>
			<div className="workshop-messages-page list-page-shell bg-transparent flex flex-col max-lg:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] max-lg:max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] max-lg:overflow-hidden">
				<div className="list-page-content !max-w-none flex-1 !min-h-0 flex flex-col !pb-0 !pt-4 overflow-hidden">
					<h1 className={`page-title shrink-0 !mb-0 ${selected ? 'max-lg:hidden' : ''}`}>
						{t('workshop.panel.messages_title')}
					</h1>
					<div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch">
						<div className={`relative flex flex-col min-h-0 h-full overflow-hidden lg:border-r border-[#E6E8EC] lg:pr-8 ${selected ? 'max-lg:hidden' : ''}`}>
							<div className="shrink-0 flex w-full border-b border-[#EEF0F4] mb-1 pt-3">
								<button
									type="button"
									onClick={() => {
										setTab('all')
										setShowAllMessages(false)
									}}
									className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${tab === 'all' ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}
								>
									{t('workshop.panel.filter_all')}
								</button>
								<button
									type="button"
									onClick={() => {
										setTab('unread')
										setShowAllMessages(false)
									}}
									className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${tab === 'unread' ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}
								>
									{t('workshop.panel.unread')} ({unreadRows.length})
								</button>
							</div>

							<div className="relative flex-1 min-h-0">
								<div
									ref={listRef}
									className={`absolute inset-0 overscroll-contain no-scrollbar ${
										showAllMessages ? 'overflow-y-auto' : 'overflow-hidden'
									}`}
								>
									{loading ? (
										<MessagesListSkeleton />
									) : pool.length === 0 ? (
										<EmptyState
											title={t('common.empty.workshop_messages_title')}
											description={t('common.empty.workshop_messages_desc')}
										/>
									) : (
										pool.map((row) => (
											<ConversationRow
												key={row.id}
												row={row}
												selectedId={selectedId}
												onSelect={setSelectedId}
												t={t}
											/>
										))
									)}
								</div>
							</div>

							{showViewAll ? (
								<button
									type="button"
									onClick={() => setShowAllMessages(true)}
									className="shrink-0 w-full mt-3 mb-1 min-h-[52px] rounded-xl border border-[#1B8F3E] bg-white text-sm font-semibold text-[#1B8F3E] hover:bg-[#F3FBF6]"
								>
									{t('workshop.panel.view_all')}
								</button>
							) : null}
						</div>

						<div className={`relative flex flex-col min-h-0 h-full overflow-hidden lg:pl-8 lg:pt-12 ${selected ? '' : 'max-lg:hidden'}`}>
							{selected && workshopId ? (
								<div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden lg:static lg:h-full">
									<div className="case-chat-root h-full">
										<CaseChat
											key={selected.id}
											requestId={selected.requestId}
											workshopId={workshopId}
											title={selected.name}
											logo={selected.image}
											subtitle={t('workshop.panel.case_no', { id: selected.caseNo })}
											placeholder={t('workshop.panel.write_message')}
											viewerRole="WORKSHOP"
											variant="workshop"
											dockAboveBottomNav={false}
											headerActive={selected.unread > 0 || selectedId === selected.id}
											onBack={() => setSelectedId(null)}
										/>
									</div>
								</div>
							) : (
								<p className="text-sm text-gray-400 text-center pt-16">{t('workshop.panel.chat_pick')}</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</WorkshopShell>
	)
}
