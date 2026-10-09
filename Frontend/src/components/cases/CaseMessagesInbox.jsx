import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import WorkshopImage from '../WorkshopImage'
import { ConversationListSkeleton, Skeleton } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import CaseChat from './CaseChat'
import { messagesAPI, workshopAPI } from '../../services/api'
import { useRefreshCustomerUnreadCount } from '../../context/CustomerUnreadCountContext'
import { formatMessagePreview, getCaseId } from './caseHelpers'

const CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'EXPIRED'])

function workshopIdOf(offer) {
	const raw = offer?.workshop || offer?.workshopId
	if (!raw) return null
	if (typeof raw === 'string') return raw
	return raw._id || raw.id || null
}

function pickRequestForWorkshop(requests, workshopId) {
	const list = Array.isArray(requests) ? requests : []
	const open = list.filter((request) => !CLOSED_STATUSES.has(String(request?.status || '').toUpperCase()))
	const withOffer = open.find((request) =>
		(request.offers || []).some((offer) => String(workshopIdOf(offer) || '') === String(workshopId))
	)
	if (withOffer) return withOffer
	if (open[0]) return open[0]
	return list[0] || null
}

function groupByWorkshop(rows) {
	const byWorkshop = new Map()
	rows.forEach((row) => {
		const key = String(row.workshopId || '')
		if (!key) return
		const existing = byWorkshop.get(key)
		const rowTime = new Date(row.time || 0).getTime()
		const existingTime = new Date(existing?.time || 0).getTime()
		if (!existing || rowTime >= existingTime) {
			byWorkshop.set(key, {
				...row,
				id: key,
				unread: (existing?.unread || 0) + (row.unread || 0),
			})
		} else {
			byWorkshop.set(key, {
				...existing,
				unread: (existing.unread || 0) + (row.unread || 0),
			})
		}
	})
	return [...byWorkshop.values()].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
}

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

function pendingExtras(request, workshopId) {
	return (request.bookings || []).flatMap((booking) => {
		const raw = booking.workshopId
		const id = (raw && typeof raw === 'object' ? raw._id || raw.id : raw) || booking.workshop?.id
		if (!id || String(id) !== String(workshopId)) return []
		return (booking.extraApprovals || [])
			.map((extra, index) => ({ ...extra, index, booking, bookingId: booking._id || booking.id }))
			.filter((extra) => extra.status === 'PENDING')
	})
}

export default function CaseMessagesInbox({ requests, onExtraDecision }) {
	const { t } = useTranslation()
	const refreshUnread = useRefreshCustomerUnreadCount()
	const [selectedId, setSelectedId] = useState(null)
	const [mainTab, setMainTab] = useState('messages')
	const [rows, setRows] = useState([])
	const [directory, setDirectory] = useState([])
	const [loadingInbox, setLoadingInbox] = useState(true)
	const [loadingDirectory, setLoadingDirectory] = useState(false)
	const requestsRef = useRef(requests)
	const inboxLoadedRef = useRef(false)
	requestsRef.current = requests

	useEffect(() => {
		let stop = false
		const load = () => {
			if (document.visibilityState === 'hidden') return
			messagesAPI.customerInbox()
				.then((response) => {
					if (stop) return
					const conversations = Array.isArray(response.data?.conversations) ? response.data.conversations : []
					setRows(groupByWorkshop(conversations.map((row) => ({
						id: String(row.workshopId),
						requestId: row.requestId,
						workshopId: row.workshopId,
						caseNo: String(row.requestId || '').slice(-5).toUpperCase(),
						name: row.name || t('offers_page.workshop'),
						logo: row.logo || '',
						time: row.lastMessageAt,
						preview: formatMessagePreview(row.preview || '', t, {
							senderRole: row.senderRole,
							viewerRole: 'CUSTOMER',
						}),
						unread: row.unreadCount || 0,
					})).filter((row) => row.requestId && row.workshopId)))
					refreshUnread()
				})
				.catch(() => {
					if (stop) return
					const fallback = []
					requestsRef.current.forEach((request) => {
						;(request.offers || []).forEach((offer) => {
							const workshopId = offer.workshop?.id || offer.workshopId?._id || offer.workshopId
							const requestId = getCaseId(request)
							if (!workshopId || !requestId) return
							fallback.push({
								id: String(workshopId),
								requestId,
								workshopId,
								caseNo: String(requestId).slice(-5).toUpperCase(),
								name: offer.workshop?.companyName || t('offers_page.workshop'),
								logo: offer.workshop?.logo || '',
								time: offer.createdAt,
								preview: offer.note || '',
								unread: 0,
							})
						})
					})
					setRows(groupByWorkshop(fallback))
				})
				.finally(() => {
					if (stop) return
					inboxLoadedRef.current = true
					setLoadingInbox(false)
				})
		}
		if (!inboxLoadedRef.current) setLoadingInbox(true)
		load()
		const timer = setInterval(load, 4000)
		return () => {
			stop = true
			clearInterval(timer)
		}
	}, [t, refreshUnread])

	useEffect(() => {
		if (!selectedId) return undefined
		const timer = setTimeout(() => refreshUnread(), 800)
		return () => clearTimeout(timer)
	}, [selectedId, refreshUnread])

	useEffect(() => {
		let stop = false
		if (mainTab === 'workshops') setLoadingDirectory(true)
		workshopAPI.getDirectory()
			.then((response) => {
				if (!stop) setDirectory(Array.isArray(response.data) ? response.data : [])
			})
			.catch(() => {
				if (!stop) setDirectory([])
			})
			.finally(() => {
				if (!stop) setLoadingDirectory(false)
			})
		return () => { stop = true }
	}, [mainTab])

	const extrasFor = (workshopId) => (
		requests.flatMap((request) => pendingExtras(request, workshopId))
	)

	const selectedRaw = rows.find((row) => row.id === selectedId) || null
	const selected = selectedRaw
		? {
				...selectedRaw,
				logo:
					selectedRaw.logo ||
					directory.find((ws) => String(ws.id || ws._id) === String(selectedRaw.workshopId))?.logo ||
					'',
			}
		: null
	const hideListOnMobile = Boolean(selected)

	return (
		<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
			{!hideListOnMobile && (
				<div className="shrink-0 flex w-full border-b border-gray-200 mb-1 pt-4 lg:hidden">
					{[
						{ key: 'messages', label: t('my_cases.flow.panel_messages') },
						{ key: 'workshops', label: t('my_cases.flow.workshops') },
					].map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => {
								setMainTab(tab.key)
								setSelectedId(null)
							}}
							className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${
								mainTab === tab.key
									? 'text-[#1B8F3E] border-[#1B8F3E]'
									: 'text-[#9CA3AF] border-transparent'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			)}

			<div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch">
				<div className={`flex flex-col min-h-0 h-full overflow-hidden lg:border-r border-[#E6E8EC] lg:pr-8 ${hideListOnMobile ? 'max-lg:hidden' : ''}`}>
					<div className="hidden lg:flex shrink-0 w-full border-b border-gray-200 mb-1 pt-2">
						{[
							{ key: 'messages', label: t('my_cases.flow.panel_messages') },
							{ key: 'workshops', label: t('my_cases.flow.workshops') },
						].map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => {
									setMainTab(tab.key)
									setSelectedId(null)
								}}
								className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${
									mainTab === tab.key
										? 'text-[#1B8F3E] border-[#1B8F3E]'
										: 'text-[#9CA3AF] border-transparent'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar pt-2 max-lg:pt-2">
						{mainTab === 'messages' ? (
							<>
								<p className="messages-list-title">
									{t('my_cases.flow.conversations')}
								</p>
								{loadingInbox ? (
									<ConversationListSkeleton />
								) : rows.length === 0 ? (
									<EmptyState
										title={t('common.empty.messages_title')}
										description={t('common.empty.messages_desc')}
									/>
								) : (
									<div className="rounded-xl border border-[#E5E7EB] bg-white divide-y divide-[#EEF0F4] overflow-hidden">
										{rows.map((row) => (
											<button
												key={row.id}
												type="button"
												onClick={() => setSelectedId(row.id)}
												className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8FAF9] ${
													selectedId === row.id ? 'bg-[#F3FBF6]' : 'bg-white'
												}`}
											>
												<div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
													<WorkshopImage
														workshop={{
															companyName: row.name,
															logo:
																row.logo ||
																directory.find((ws) => String(ws.id || ws._id) === String(row.workshopId))?.logo ||
																'',
														}}
														alt={row.name}
														className="w-full h-full"
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-3">
														<p className="text-sm font-semibold text-[#05324f] truncate leading-snug font-['Inter',sans-serif]">
															{row.name}
														</p>
														<p className="text-[11px] text-[#9CA3AF] shrink-0 pt-0.5">
															{listTime(row.time, t)}
														</p>
													</div>
													<div className="flex items-start justify-between gap-3 mt-1">
														<p className="text-xs text-[#6B7280] line-clamp-1 leading-snug">
															{row.preview || t('workshop.panel.case_no', { id: row.caseNo })}
														</p>
														{row.unread > 0 && (
															<span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-brand-btn text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
																{row.unread}
															</span>
														)}
													</div>
												</div>
											</button>
										))}
									</div>
								)}
							</>
						) : (
							<>
								<p className="messages-list-title">
									{t('my_cases.flow.registered_workshops')}
								</p>
								{loadingDirectory ? (
									<ConversationListSkeleton />
								) : directory.length === 0 ? (
									<EmptyState
										title={t('common.empty.workshops_title')}
										description={t('common.empty.workshops_desc')}
									/>
								) : (
									<div className="rounded-xl border border-[#E5E7EB] bg-white divide-y divide-[#EEF0F4] overflow-hidden">
										{directory.map((ws) => {
											const workshopId = String(ws.id || ws._id || '')
											const location = [ws.city, ws.postalCode].filter(Boolean).join(' · ')
											const chatRequest = pickRequestForWorkshop(requests, workshopId)
											const requestId = chatRequest ? getCaseId(chatRequest) : null
											return (
												<div key={workshopId || ws.companyName} className="flex items-center gap-3 px-4 py-3.5">
													<div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#E8F5EC]">
														<WorkshopImage workshop={{ companyName: ws.companyName, logo: ws.logo }} alt={ws.companyName} className="w-full h-full" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="text-sm font-semibold text-[#05324f] truncate font-['Inter',sans-serif]">{ws.companyName}</p>
														{location ? <p className="text-xs text-[#6B7280] mt-0.5 truncate">{location}</p> : null}
														{(ws.rating > 0 || ws.reviewCount > 0) && (
															<p className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-1">
																<Star className="w-3 h-3 text-[#E67E22] fill-[#E67E22]" />
																{Number(ws.rating || 0).toFixed(1)}
																{ws.reviewCount > 0 ? ` (${ws.reviewCount})` : ''}
															</p>
														)}
													</div>
													<button
														type="button"
														onClick={() => {
															if (!workshopId) return
															if (!requestId) {
																toast.error(t('my_cases.flow.chat_needs_case') || 'Create a case first to message a workshop.')
																return
															}
															const existing = rows.find((row) => String(row.workshopId) === workshopId)
															if (existing) {
																setSelectedId(String(existing.id))
															} else {
																setRows((prev) => groupByWorkshop([{
																	id: workshopId,
																	requestId: String(requestId),
																	workshopId,
																	caseNo: String(requestId).slice(-5).toUpperCase(),
																	name: ws.companyName,
																	logo: ws.logo || '',
																	time: new Date().toISOString(),
																	preview: '',
																	unread: 0,
																}, ...prev]))
																setSelectedId(workshopId)
															}
															setMainTab('messages')
														}}
														className="shrink-0 w-9 h-9 flex items-center justify-center text-[#1B8F3E] hover:opacity-70"
														aria-label={t('my_cases.flow.message_workshop')}
														title={t('my_cases.flow.message_workshop')}
													>
														<MessageCircle className="w-5 h-5" strokeWidth={1.75} />
													</button>
												</div>
											)
										})}
									</div>
								)}
							</>
						)}
					</div>
				</div>

				<div className={`flex flex-col min-h-0 h-full overflow-hidden lg:pl-8 lg:pt-12 ${selected ? '' : 'max-lg:hidden'}`}>
					{selected ? (
						<div className="case-chat-root">
						<CaseChat
							key={selected.id}
							requestId={selected.requestId}
							workshopId={selected.workshopId}
							title={selected.name}
							logo={selected.logo}
							placeholder={t('workshop.panel.write_message')}
							viewerRole="CUSTOMER"
							variant="workshop"
							headerActive={selected.unread > 0 || selectedId === selected.id}
							extras={extrasFor(selected.workshopId)}
							onExtraDecision={onExtraDecision}
							onBack={() => setSelectedId(null)}
						/>
						</div>
					) : (
						<p className="text-sm text-gray-400 text-center pt-16 max-lg:hidden">{t('my_cases.flow.chat_pick')}</p>
					)}
				</div>
			</div>
		</div>
	)
}
