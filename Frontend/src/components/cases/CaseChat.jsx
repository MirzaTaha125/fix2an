import { useEffect, useRef, useState } from 'react'
import { CheckCheck, FileText, Paperclip, Send, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import WorkshopImage from '../WorkshopImage'
import { Skeleton } from '../ui/Skeleton'
import ExtraActionCard from './ExtraActionCard'
import { useRegisterMobileBack } from '../../context/MobileBackContext'
import { useRefreshCustomerUnreadCount } from '../../context/CustomerUnreadCountContext'
import { useRefreshWorkshopUnreadCount } from '../../context/WorkshopUnreadCountContext'
import { getFullUrl } from '../../config/api.js'
import { messagesAPI, uploadAPI } from '../../services/api'

function dayKey(value) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function dayLabel(value, t) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const now = new Date()
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diff = Math.round((startToday - start) / 86400000)
	if (diff === 0) return t('my_cases.flow.chat_today')
	if (diff === 1) return t('my_cases.flow.yesterday')
	return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function clock(value) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function isImageAttachment(file) {
	return file?.mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file?.fileName || file?.fileUrl || '')
}

function MessageAttachments({ attachments }) {
	if (!attachments?.length) return null
	return (
		<div className={`space-y-2 ${attachments.length ? 'mt-2' : ''}`}>
			{attachments.map((file) => {
				const href = getFullUrl(file.fileUrl)
				if (isImageAttachment(file)) {
					return (
						<a key={`${file.fileUrl}-${file.fileName}`} href={href} target="_blank" rel="noreferrer" className="block">
							<img
								src={href}
								alt={file.fileName || ''}
								className="max-h-48 max-w-full rounded-xl object-cover border border-black/5"
							/>
						</a>
					)
				}
				return (
					<a
						key={`${file.fileUrl}-${file.fileName}`}
						href={href}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-2 rounded-xl bg-white/80 border border-black/5 px-3 py-2 text-sm text-[#1F2937] hover:bg-white"
					>
						<FileText className="w-4 h-4 text-[#1B8F3E] shrink-0" strokeWidth={1.75} />
						<span className="truncate">{file.fileName || 'File'}</span>
					</a>
				)
			})}
		</div>
	)
}

function ChatMessagesSkeleton() {
	const bubble = (widthClass) => (
		<div className={`rounded-2xl bg-[#F3F4F6] px-3.5 py-3 ${widthClass} space-y-2`}>
			<div className="flex items-center justify-between gap-3">
				<Skeleton className="h-3.5 w-24" />
				<Skeleton className="h-3 w-10" />
			</div>
			<Skeleton className="h-3 w-full" />
			<Skeleton className="h-3 w-4/5" />
		</div>
	)

	return (
		<div className="space-y-4 pt-2" aria-hidden>
			<div className="flex items-start gap-2.5">
				<Skeleton className="w-9 h-9 rounded-full shrink-0" />
				{bubble('w-[72%]')}
			</div>
			<div className="flex justify-end">
				{bubble('w-[68%]')}
			</div>
			<div className="flex items-start gap-2.5">
				<Skeleton className="w-9 h-9 rounded-full shrink-0" />
				{bubble('w-[60%]')}
			</div>
			<div className="flex justify-end">
				{bubble('w-[55%]')}
			</div>
		</div>
	)
}

function MessageBubble({
	mine,
	title,
	logo,
	bodyText,
	attachments,
	createdAt,
	readAt,
	youLabel,
	workshopPanel,
}) {
	const time = clock(createdAt)
	const name = mine ? youLabel : title

	const bubble = (
		<div
			className={`rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
				mine
					? 'bg-[#E7F6EC] text-[#1F2937]'
					: workshopPanel
						? 'bg-[#F3F4F6] text-[#374151]'
						: 'bg-white border border-[#EEF0F4] text-[#374151]'
			}`}
		>
			<div className="flex items-center justify-between gap-3 mb-1">
				<p className="text-sm font-medium text-[#05324f] truncate">
					{name}
				</p>
				<span className="text-[11px] text-[#9CA3AF] shrink-0">{time}</span>
			</div>
			{bodyText ? <p className="whitespace-pre-wrap text-[#1F2937]">{bodyText}</p> : null}
			<MessageAttachments attachments={attachments} />
			{mine && (
				<div className="flex justify-end mt-1.5">
					<CheckCheck
						className={`w-3.5 h-3.5 ${readAt ? 'text-[#1B8F3E]' : 'text-[#9CA3AF]'}`}
						strokeWidth={2.25}
					/>
				</div>
			)}
		</div>
	)

	if (mine) {
		return (
			<div className="flex justify-end">
				<div className="max-w-[85%] min-w-0">{bubble}</div>
			</div>
		)
	}

	return (
		<div className="flex items-start gap-2.5">
			<div className="w-9 h-9 rounded-full overflow-hidden bg-[#E8F5EC] shrink-0">
				{workshopPanel && !logo ? (
					<div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
						<User className="w-4 h-4" strokeWidth={1.75} />
					</div>
				) : (
					<WorkshopImage workshop={{ companyName: title, logo }} alt={title} className="w-full h-full" />
				)}
			</div>
			<div className="max-w-[85%] min-w-0 flex-1">{bubble}</div>
		</div>
	)
}

export default function CaseChat({
	requestId,
	workshopId,
	title,
	logo,
	viewerRole = 'CUSTOMER',
	onBack,
	extras = [],
	onExtraDecision,
	variant = 'customer',
	subtitle,
	placeholder,
	headerActive = true,
	/** When true, pin composer above bottom nav; false = pin above safe-area only (e.g. messages page). */
	dockAboveBottomNav = true,
}) {
	const { t } = useTranslation()
	const workshopPanel = variant === 'workshop'
	const refreshCustomerUnread = useRefreshCustomerUnreadCount()
	const refreshWorkshopUnread = useRefreshWorkshopUnreadCount()
	const [messages, setMessages] = useState([])
	const [loading, setLoading] = useState(true)
	const [draft, setDraft] = useState('')
	const [attachments, setAttachments] = useState([])
	const [sending, setSending] = useState(false)
	const [uploading, setUploading] = useState(false)
	const endRef = useRef(null)
	const fileRef = useRef(null)
	const seenCount = useRef(0)
	const lastRemoteCount = useRef(0)

	useRegisterMobileBack(onBack, Boolean(onBack), title ? { title, avatar: logo || undefined } : null)

	const refreshNavUnread = () => {
		if (viewerRole === 'CUSTOMER') refreshCustomerUnread()
		else if (viewerRole === 'WORKSHOP') refreshWorkshopUnread()
	}

	useEffect(() => {
		const rid = requestId ? String(requestId) : ''
		const wid = workshopId ? String(workshopId) : ''
		if (!rid || !wid || wid === 'undefined' || wid === 'null') {
			setLoading(false)
			return undefined
		}
		let stop = false
		setLoading(true)
		seenCount.current = 0
		lastRemoteCount.current = 0

		const load = async (isInitial = false) => {
			if (document.visibilityState === 'hidden' && !isInitial) return
			try {
				const response = await messagesAPI.thread(rid, wid)
				const next = response.data.messages || []
				if (stop) return
				setMessages((prev) => {
					const optimistic = prev.filter((item) => String(item._id || item.id || '').startsWith('temp-'))
					// Keep in-flight optimistic bubbles until server echoes them
					const pending = optimistic.filter((item) => {
						const match = next.some(
							(server) =>
								server.senderRole === item.senderRole &&
								String(server.body || '') === String(item.body || '') &&
								Math.abs(new Date(server.createdAt) - new Date(item.createdAt)) < 60000
						)
						return !match
					})
					const merged = [...next, ...pending]
					const sameLength = prev.length === merged.length
					const sameIds =
						sameLength &&
						prev.every((item, index) => String(item._id || item.id) === String(merged[index]?._id || merged[index]?.id))
					if (sameIds) return prev
					return merged
				})
				if (isInitial || next.length !== lastRemoteCount.current) {
					refreshNavUnread()
				}
				lastRemoteCount.current = next.length
			} catch (error) {
				if (isInitial && error?.response?.status && error.response.status !== 401) {
					toast.error(error.response?.data?.message || t('my_cases.flow.chat_open_error') || 'Could not open chat')
				}
			} finally {
				if (!stop && isInitial) setLoading(false)
			}
		}

		load(true)
		const timer = setInterval(() => load(false), 1500)
		return () => {
			stop = true
			clearInterval(timer)
		}
	}, [requestId, workshopId, t, viewerRole, refreshCustomerUnread, refreshWorkshopUnread])

	useEffect(() => {
		if (loading) return
		if (messages.length > seenCount.current) {
			endRef.current?.scrollIntoView({ block: 'end' })
		}
		seenCount.current = messages.length
	}, [messages, extras.length, attachments.length, loading])

	const addFiles = async (event) => {
		const files = [...(event.target.files || [])]
		event.target.value = ''
		if (!files.length) return
		if (attachments.length + files.length > 5) {
			toast.error(t('my_cases.flow.chat_attach_limit'))
			return
		}
		setUploading(true)
		try {
			const uploaded = []
			for (const file of files) {
				const formData = new FormData()
				formData.append('file', file)
				const response = await uploadAPI.uploadFile(formData)
				const data = response.data || {}
				if (!data.fileUrl) throw new Error('upload failed')
				uploaded.push({
					fileName: data.fileName || file.name,
					fileUrl: data.fileUrl,
					fileSize: data.fileSize || file.size || 0,
					mimeType: data.mimeType || file.type || '',
				})
			}
			setAttachments((prev) => [...prev, ...uploaded].slice(0, 5))
		} catch (error) {
			toast.error(error.response?.data?.message || t('my_cases.flow.chat_attach_error'))
		} finally {
			setUploading(false)
		}
	}

	const send = async () => {
		const body = draft.trim()
		const files = attachments
		if ((!body && files.length === 0) || sending || uploading) return

		const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
		const optimistic = {
			_id: tempId,
			id: tempId,
			senderRole: viewerRole,
			body,
			attachments: files,
			createdAt: new Date().toISOString(),
			readAt: null,
		}

		// Show instantly — don't wait for network
		setMessages((prev) => [...prev, optimistic])
		setDraft('')
		setAttachments([])
		setSending(true)

		try {
			const response = await messagesAPI.send({
				requestId,
				workshopId,
				body,
				attachments: files,
			})
			const saved = response.data?.message
			setMessages((prev) => {
				const withoutTemp = prev.filter((item) => String(item._id || item.id) !== tempId)
				if (!saved) return withoutTemp
				const already = withoutTemp.some((item) => String(item._id || item.id) === String(saved._id || saved.id))
				return already ? withoutTemp : [...withoutTemp, saved]
			})
			refreshNavUnread()
		} catch (error) {
			setMessages((prev) => prev.filter((item) => String(item._id || item.id) !== tempId))
			setDraft(body)
			setAttachments(files)
			toast.error(error.response?.data?.message || t('my_cases.flow.chat_send_error'))
		} finally {
			setSending(false)
		}
	}

	let lastDay = ''
	const canSend = Boolean(draft.trim() || attachments.length) && !sending && !uploading
	const youLabel = t('my_cases.flow.chat_you')
	const peerName = title || (workshopPanel ? t('my_cases.flow.panel_messages') : t('my_cases.flow.workshops'))

	return (
		<div className={`case-chat-root flex flex-col flex-1 min-h-0 h-full overflow-hidden ${workshopPanel ? '' : 'lg:min-h-[420px]'}`}>
			{!workshopPanel && title ? (
				<div className="case-chat-header shrink-0 mb-3 flex items-center gap-2 max-lg:hidden">
					<div className="w-8 h-8 rounded-full overflow-hidden bg-[#E8F5EC] shrink-0">
						<WorkshopImage workshop={{ companyName: title, logo }} alt={title} className="w-full h-full" />
					</div>
					<p className="text-sm font-bold text-brand-dark truncate">{title}</p>
				</div>
			) : null}
			{workshopPanel && (
				<div className="case-chat-header shrink-0 mb-4 pb-4 flex items-center gap-3 border-b border-[#E6E8EC] max-lg:hidden">
					<div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
						{workshopPanel && !logo ? (
							<div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
								<User className="w-5 h-5" strokeWidth={1.75} />
							</div>
						) : (
							<WorkshopImage workshop={{ companyName: title, logo }} alt={title} className="w-full h-full" />
						)}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-bold text-[#05324f] truncate">{title}</p>
						{subtitle ? <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{subtitle}</p> : null}
					</div>
				</div>
			)}

			<div className={`case-chat-list flex-1 min-h-0 space-y-3 overflow-y-auto no-scrollbar overscroll-contain ${workshopPanel ? 'pt-2 max-lg:pb-16' : 'pt-1'}`}>
				{loading ? (
					<ChatMessagesSkeleton />
				) : (
					<>
						{messages.length === 0 && extras.length === 0 && (
							<p className="text-sm text-gray-400 text-center pt-8">
								{t(workshopPanel ? 'my_cases.flow.chat_empty_workshop' : 'my_cases.flow.chat_empty')}
							</p>
						)}
						{messages.map((message) => {
							const mine = message.senderRole === viewerRole
							const key = dayKey(message.createdAt)
							const showDay = key && key !== lastDay
							if (showDay) lastDay = key
							const bodyText =
								message.body &&
								!(message.attachments?.length && message.body === message.attachments[0]?.fileName)
									? message.body
									: ''
							return (
								<div key={message._id || message.id}>
									{showDay && (
										<p className="text-center text-xs text-gray-400 mb-3">{dayLabel(message.createdAt, t)}</p>
									)}
									<MessageBubble
										mine={mine}
										title={peerName}
										logo={mine ? null : logo}
										bodyText={bodyText}
										attachments={message.attachments}
										createdAt={message.createdAt}
										readAt={message.readAt}
										youLabel={youLabel}
										workshopPanel={workshopPanel}
									/>
								</div>
							)
						})}

						{extras.map((extra) => (
							<ExtraActionCard
								key={`${extra.bookingId}-${extra.index}`}
								extra={extra}
								onDecide={onExtraDecision}
							/>
						))}
					</>
				)}
				<div ref={endRef} />
			</div>

			<div
				className={`case-chat-composer shrink-0 bg-white pt-1.5 pb-0 ${
					workshopPanel
						? `max-lg:fixed max-lg:inset-x-0 max-lg:z-30 max-lg:px-6 max-lg:sm:px-8 max-lg:pb-1 ${
							dockAboveBottomNav
								? 'max-lg:bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))]'
								: 'max-lg:bottom-[max(0.35rem,env(safe-area-inset-bottom,0px))]'
						}`
						: ''
				}`}
			>
			{attachments.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-2">
					{attachments.map((file) => (
						<div key={`${file.fileUrl}-${file.fileName}`} className="inline-flex items-center gap-1.5 max-w-full rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#374151]">
							{isImageAttachment(file) ? (
								<img src={getFullUrl(file.fileUrl)} alt="" className="w-5 h-5 rounded object-cover" />
							) : (
								<FileText className="w-3.5 h-3.5 text-[#1B8F3E] shrink-0" />
							)}
							<span className="truncate max-w-[140px]">{file.fileName}</span>
							<button
								type="button"
								onClick={() => setAttachments((prev) => prev.filter((item) => item.fileUrl !== file.fileUrl))}
								className="p-0.5 text-gray-400 hover:text-gray-600"
								aria-label={t('common.close')}
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			<form
				onSubmit={(event) => {
					event.preventDefault()
					send()
				}}
			>
				<input
					ref={fileRef}
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
					multiple
					className="hidden"
					onChange={addFiles}
				/>
				<div className="flex items-center h-12 rounded-3xl border border-gray-200 bg-white pl-4 pr-3 gap-1.5">
					<input
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder={placeholder || t('my_cases.flow.chat_placeholder')}
						maxLength={1000}
						className="flex-1 min-w-0 text-sm outline-none bg-transparent placeholder:text-gray-400"
					/>
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						disabled={uploading || sending || attachments.length >= 5}
						className="p-1 text-[#1B8F3E] disabled:opacity-40 shrink-0"
						aria-label={t('my_cases.flow.chat_attach')}
						title={t('my_cases.flow.chat_attach')}
					>
						<Paperclip className="w-4 h-4" strokeWidth={1.75} />
					</button>
					<button
						type="submit"
						disabled={!canSend}
						className="p-1 flex items-center justify-center shrink-0 text-[#1B8F3E] disabled:opacity-100"
						aria-label={t('my_cases.flow.chat_send')}
					>
						<Send className="w-[18px] h-[18px] text-[#1B8F3E]" strokeWidth={2.25} />
					</button>
				</div>
			</form>
			</div>
		</div>
	)
}
