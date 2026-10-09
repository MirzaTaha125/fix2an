import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
	ArrowLeft,
	ArrowRight,
	Check,
	Camera,
	Eye,
	MessageCircle,
	MoreVertical,
	ChevronDown,
	ChevronRight,
	Paperclip,
	ShieldCheck,
	Star,
	Trash2,
	X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatPrice } from '../../utils/cn'
import { getFullUrl } from '../../config/api.js'
import WorkshopImage from '../WorkshopImage'
import EmptyState from '../ui/EmptyState'
import {
	formatMessagePreview,
	getCaseId,
	getCaseTitle,
	getVehicleLine,
	getCaseStatusKey,
	getActiveBooking,
	getOfferCount,
	getCaseReports,
	getCaseTimeline,
	getCaseStatusLabel,
} from './caseHelpers'
import RepairFlow from './RepairFlow'
import CaseChat from './CaseChat'
import ExtraActionCard, { approvedBookingExtras, pendingBookingExtras } from './ExtraActionCard'
import { useRegisterMobileBack } from '../../context/MobileBackContext'
import { messagesAPI, requestsAPI, reviewsAPI, uploadAPI, workshopAPI } from '../../services/api'

const PANELS = ['details', 'status', 'photos', 'messages']

const STATUS_PILL = {
	offers: 'bg-white text-[#E67E22] border-[#E67E22]',
	new: 'bg-white text-[#E67E22] border-[#E67E22]',
	scheduled: 'bg-white text-[#2563EB] border-[#2563EB]',
	booked: 'bg-white text-[#2563EB] border-[#2563EB]',
	rescheduled: 'bg-white text-[#2563EB] border-[#2563EB]',
	received: 'bg-white text-[#2563EB] border-[#2563EB]',
	repair: 'bg-white text-[#2563EB] border-[#2563EB]',
	ready: 'bg-white text-[#1B8F3E] border-[#1B8F3E]',
	pickup: 'bg-white text-[#1B8F3E] border-[#1B8F3E]',
	closed: 'bg-white text-[#1B8F3E] border-[#1B8F3E]',
	expired: 'bg-white text-gray-500 border-gray-300',
}

function pendingChatExtras(request, workshopId) {
	return (request?.bookings || []).flatMap((booking) => {
		const raw = booking.workshopId
		const id = (raw && typeof raw === 'object' ? raw._id || raw.id : raw) || booking.workshop?.id
		if (!id || String(id) !== String(workshopId)) return []
		return (booking.extraApprovals || [])
			.map((extra, index) => ({ ...extra, index, booking, bookingId: booking._id || booking.id }))
			.filter((extra) => extra.status === 'PENDING')
	})
}

function splitReview(comment = '') {
	const raw = String(comment || '')
	const match = raw.match(/(?:^|\n)\s*\[([^\]]+)\]\s*$/)
	const tags = match
		? match[1].split(',').map((item) => item.trim()).filter(Boolean)
		: []
	const text = raw.replace(/(?:^|\n)\s*\[[^\]]+\]\s*$/, '').trim()
	return { text, tags }
}

function ReviewSummary({ review, t }) {
	const { text, tags } = splitReview(review.comment)
	return (
		<div className="mt-5 border-t border-gray-100 pt-5">
			<h3 className="text-sm font-bold text-brand-dark mb-2">{t('my_cases.flow.summary_review')}</h3>
			<div className="flex gap-1 mb-2">
				{[1, 2, 3, 4, 5].map((n) => (
					<Star key={n} className={`w-4 h-4 ${n <= Number(review.rating) ? 'fill-[#1B8F3E] text-[#1B8F3E]' : 'text-gray-200'}`} />
				))}
			</div>
			{text && <p className="text-sm text-[#374151] leading-relaxed">{text}</p>}
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-3">
					{tags.map((tag) => (
						<span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold border border-[#E5E7EB] bg-white text-[#374151]">
							{t(`payment.flow.tag_${tag}`, { defaultValue: tag })}
						</span>
					))}
				</div>
			)}
		</div>
	)
}

export default function CaseDetailView({
	request,
	onBack,
	hideBack = false,
	suspendBack = false,
	panel = 'details',
	initialWorkshopId = null,
	onPanelChange,
	onComplete,
	onContact,
	onExtraDecision,
	onSeeQuotes,
	onGoPayment,
	onRequestUpdated,
}) {
	const { t } = useTranslation()
	const [photoTab, setPhotoTab] = useState('photos')
	const [uploadingPhoto, setUploadingPhoto] = useState(false)
	const [photoMenuId, setPhotoMenuId] = useState(null)
	const [viewingPhoto, setViewingPhoto] = useState(null)
	const [deletingPhotoId, setDeletingPhotoId] = useState(null)
	const [showCaseDetails, setShowCaseDetails] = useState(false)
	const [messageTab, setMessageTab] = useState('messages')
	const [threads, setThreads] = useState(null)
	const [activeChat, setActiveChat] = useState(null)
	const [directory, setDirectory] = useState([])
	const [caseReview, setCaseReview] = useState(null)
	const requestId = request ? getCaseId(request) : null
	const reviewBookingId = request ? (getActiveBooking(request)?._id || getActiveBooking(request)?.id) : null

	useEffect(() => {
		if (panel !== 'messages' || !initialWorkshopId || !request) return
		const offer = (request.offers || []).find((item) => {
			const raw = item.workshop || item.workshopId
			const id = typeof raw === 'string' ? raw : raw?._id || raw?.id
			return String(id) === String(initialWorkshopId)
		})
		const ws =
			(offer?.workshop && typeof offer.workshop === 'object' ? offer.workshop : null) ||
			(offer?.workshopId && typeof offer.workshopId === 'object' ? offer.workshopId : null)
		setMessageTab('messages')
		setActiveChat({
			workshopId: initialWorkshopId,
			name: ws?.companyName || t('offers_page.workshop'),
			logo: ws?.logo || ws?.image || ws?.userId?.image || '',
			preview: '',
		})
	}, [panel, initialWorkshopId, request, t])

	useEffect(() => {
		if (panel !== 'messages' || !requestId) return undefined
		let stop = false
		const load = async () => {
			if (document.visibilityState === 'hidden') return
			try {
				const response = await messagesAPI.list(requestId)
				if (!stop) {
					const list = response.data.conversations || []
					setThreads(list)
					setActiveChat((current) => {
						if (current?.workshopId && list.some((item) => String(item.workshopId) === String(current.workshopId))) {
							const found = list.find((item) => String(item.workshopId) === String(current.workshopId))
							return {
								...current,
								...found,
								name: found?.name || current.name || '',
								logo: found?.logo || current.logo || '',
							}
						}
						// Don't auto-open a chat — user must pick a conversation
						return current
					})
				}
			} catch {
				if (!stop) setThreads(null)
			}
		}
		load()
		const timer = setInterval(load, 4000)
		return () => {
			stop = true
			clearInterval(timer)
		}
	}, [panel, requestId])

	useEffect(() => {
		if (panel !== 'messages') return undefined
		let stop = false
		workshopAPI.getDirectory()
			.then((response) => {
				if (!stop) setDirectory(Array.isArray(response.data) ? response.data : [])
			})
			.catch(() => {
				if (!stop) setDirectory([])
			})
		return () => { stop = true }
	}, [panel])

	useEffect(() => {
		const saved = request ? getActiveBooking(request)?.review : null
		if (saved) {
			setCaseReview(saved)
			return undefined
		}
		if (!reviewBookingId) {
			setCaseReview(null)
			return undefined
		}
		let stop = false
		reviewsAPI.getByBooking(reviewBookingId)
			.then((res) => { if (!stop) setCaseReview(res.data) })
			.catch(() => { if (!stop) setCaseReview(null) })
		return () => { stop = true }
	}, [reviewBookingId, request])

	useRegisterMobileBack(() => setShowCaseDetails(false), showCaseDetails && !suspendBack)

	if (!request) return null

	const id = getCaseId(request)
	const shortId = String(id).slice(-4).toUpperCase()
	const statusKey = getCaseStatusKey(request)
	const booking = getActiveBooking(request)
	const offerCount = getOfferCount(request)
	const reports = getCaseReports(request)
	const images = reports.filter((file) => isImageFile(file))
	const documents = reports.filter((file) => !isImageFile(file))
	const timeline = getCaseTimeline(request)
	const desc = (request.description || '').trim()
	const setPanel = (next) => onPanelChange?.(next)
	const pill = STATUS_PILL[statusKey] || STATUS_PILL.new
	const label = getCaseStatusLabel(statusKey, t)
	const summaryArea = desc.split(/[.\n]/)[0]?.trim() || '—'
	const pendingExtras = pendingBookingExtras(booking)
	const approvedExtras = approvedBookingExtras(booking)

	if (booking && ['received', 'repair', 'ready', 'pickup'].includes(statusKey) && !showCaseDetails) {
		return (
			<RepairFlow
				request={request}
				booking={booking}
				statusKey={statusKey}
				onBack={onBack}
				suspendBack={suspendBack}
				onComplete={onComplete}
				onContact={onContact}
				onExtraDecision={onExtraDecision}
				onShowDetails={() => setShowCaseDetails(true)}
			/>
		)
	}

	const workshops = (request.offers || []).map((offer) => {
		const raw = offer.workshop || offer.workshopId
		const workshopId = typeof raw === 'string' ? raw : raw?._id || raw?.id || null
		const workshopObj =
			(offer.workshop && typeof offer.workshop === 'object' ? offer.workshop : null) ||
			(offer.workshopId && typeof offer.workshopId === 'object' ? offer.workshopId : null)
		return {
			id: offer._id || offer.id,
			workshopId,
			name: workshopObj?.companyName || t('offers_page.workshop'),
			note: offer.note || t('my_cases.flow.offer_received'),
			time: offer.createdAt,
			logo: workshopObj?.logo || workshopObj?.image || workshopObj?.userId?.image || '',
			unreadCount: 0,
		}
	})

	const source = threads?.length ? threads : workshops
	const conversations = source.map((item) => {
		const fromOffer = workshops.find((ws) => String(ws.workshopId) === String(item.workshopId))
		const fromDirectory = directory.find((ws) => String(ws.id || ws._id) === String(item.workshopId))
		return {
			workshopId: item.workshopId,
			name: item.name || fromOffer?.name || fromDirectory?.companyName || '',
			logo: item.logo || item.image || fromOffer?.logo || fromDirectory?.logo || '',
			preview: formatMessagePreview(item.preview || item.note || '', t, {
				senderRole: item.senderRole,
				viewerRole: 'CUSTOMER',
			}),
			time: item.lastMessageAt || item.time,
			unreadCount: item.unreadCount || 0,
		}
	})
	const chatWorkshop = activeChat?.workshopId
		? {
				...activeChat,
				logo:
					activeChat.logo ||
					conversations.find((item) => String(item.workshopId) === String(activeChat.workshopId))?.logo ||
					directory.find((ws) => String(ws.id || ws._id) === String(activeChat.workshopId))?.logo ||
					'',
			}
		: null
	const mobileChatOpen = Boolean(chatWorkshop?.workshopId) && panel === 'messages' && messageTab === 'messages'

	return (
		<div className={`w-full ${mobileChatOpen ? 'case-detail-chat-lock' : ''}`}>
			<div className={mobileChatOpen ? 'max-lg:hidden' : ''}>
			{showCaseDetails ? (
				<button
					type="button"
					onClick={() => setShowCaseDetails(false)}
					className="mb-5 -ml-1 p-1 text-brand-dark hover:opacity-70 max-lg:hidden"
					aria-label={t('common.back')}
				>
					<ArrowLeft className="w-5 h-5" strokeWidth={2} />
				</button>
			) : null}

			<div className="flex items-center justify-between gap-2 mb-3">
				<span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
					{t('my_cases.flow.case_no', { id: shortId })}
				</span>
				<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pill}`}>
					{label}
				</span>
			</div>

			<h1 className="page-title">{getCaseTitle(request)}</h1>
			<p className="text-sm text-[#4B5563] mb-1">{getVehicleLine(request).replace(' · ', ' • ')}</p>
			<p className="text-xs text-gray-400 mb-5">
				{t('my_cases.flow.created')}: {request.createdAt ? formatDateTime(new Date(request.createdAt)) : '—'}
			</p>

			<div className="flex gap-2 mb-6 overflow-x-auto">
				{PANELS.map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => setPanel(key)}
						className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
							panel === key ? 'bg-brand-btn text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
						}`}
					>
						{t(`my_cases.flow.panel_${key}`)}
					</button>
				))}
			</div>

			{panel !== 'details' && (
				<PanelTabs
					tabs={
						panel === 'status'
							? [
									{ key: 'status', label: t('my_cases.flow.panel_status') },
									{ key: 'history', label: t('my_cases.flow.history') },
								]
							: panel === 'photos'
								? [
										{ key: 'photos', label: t('my_cases.flow.photos') },
										{ key: 'documents', label: t('my_cases.flow.documents') },
									]
								: [
										{ key: 'messages', label: t('my_cases.flow.panel_messages') },
										{ key: 'workshops', label: t('my_cases.flow.workshops') },
									]
					}
					active={panel === 'status' ? 'status' : panel === 'photos' ? photoTab : messageTab}
					onChange={(key) => {
						if (panel === 'photos') setPhotoTab(key)
						else if (panel === 'messages') setMessageTab(key)
					}}
				/>
			)}
			</div>

			{panel === 'details' && (
				<div className="space-y-6">
					<section>
						<h2 className="text-base font-bold text-brand-dark mb-2">{t('my_cases.flow.description')}</h2>
						<ExpandableText text={desc} />
					</section>

					{pendingExtras.length > 0 && (
						<section className="space-y-3">
							{pendingExtras.map((extra) => (
								<ExtraActionCard
									key={`${extra.bookingId}-${extra.index}`}
									extra={extra}
									onDecide={onExtraDecision}
								/>
							))}
						</section>
					)}

					{!booking && !['ready', 'pickup', 'repair', 'received', 'booked', 'scheduled', 'rescheduled', 'closed'].includes(statusKey) && (
					<section className="rounded-2xl bg-[#F5F7F9] p-4">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
							<div className="min-w-0">
								<h2 className="text-base font-bold text-brand-dark mb-1.5">{t('my_cases.flow.next_step')}</h2>
								<p className="text-sm text-[#4B5563] leading-relaxed">
									{offerCount > 0 ? t('my_cases.flow.next_step_offers', { count: offerCount }) : t('my_cases.flow.next_step_wait')}
								</p>
							</div>
							<button
								type="button"
								onClick={() => onSeeQuotes?.()}
								className="w-full lg:w-auto lg:shrink-0 px-6 lg:px-5 min-h-[52px] lg:min-h-[44px] lg:text-sm bg-brand-btn text-white rounded-xl font-semibold flex items-center justify-center"
							>
								{offerCount > 0
									? t('my_cases.flow.see_quotes_count', { count: offerCount })
									: t('my_cases.flow.see_quotes')}
							</button>
						</div>
					</section>
					)}

					<section>
						<div className="flex items-center justify-between mb-1 border-t border-gray-100 pt-5">
							<h2 className="text-base font-bold text-brand-dark">{t('my_cases.flow.summary')}</h2>
							<ChevronRight className="w-5 h-5 text-gray-300" />
						</div>
						<div className="divide-y divide-gray-100">
							<Row
								label={t('my_cases.flow.summary_status')}
								value={label}
								accent={statusKey === 'offers' || statusKey === 'new' ? 'orange' : statusKey === 'closed' || statusKey === 'ready' ? 'green' : 'blue'}
								bullet
							/>
							<Row label={t('my_cases.flow.summary_priority')} value={t('my_cases.flow.priority_normal')} />
							<Row label={t('my_cases.flow.summary_area')} value={summaryArea} />
							<Row label={t('my_cases.flow.summary_category')} value={t('my_cases.flow.category_repair')} />
							{booking?.scheduledAt && (
								<Row label={t('my_cases.flow.summary_booking_date')} value={formatDateTime(new Date(booking.scheduledAt))} />
							)}
						</div>
						{caseReview?.rating && (
							<ReviewSummary review={caseReview} t={t} />
						)}
						{approvedExtras.length > 0 && (
							<div className="mt-5 border-t border-gray-100 pt-5">
								<h3 className="text-base font-bold text-brand-dark mb-3">
									{t('workshop.contracts.extra_approval.approved_title')}
								</h3>
								<div className="space-y-2.5">
									{approvedExtras.map((extra, index) => (
										<div
											key={extra._id || index}
											className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-3 flex items-center justify-between gap-3"
										>
											<p className="text-sm font-semibold text-[#05324f] leading-snug min-w-0">
												{extra.description || t('workshop.contracts.extra_approval.extra_line')}
											</p>
											<p className="text-sm font-bold text-[#05324f] shrink-0">{formatPrice(extra.price)}</p>
										</div>
									))}
								</div>
							</div>
						)}
						{booking && (statusKey === 'closed' || booking.status === 'DONE') && (
							<div className="mt-4 space-y-2">
								<button
									type="button"
									onClick={() => onGoPayment?.(booking, 'payment')}
									className="w-full min-h-[48px] rounded-xl border border-[#1B8F3E] text-[#1B8F3E] text-sm font-semibold"
								>
									{t('payment.flow.overview_title')}
								</button>
								{!caseReview?.rating && (
									<button
										type="button"
										onClick={() => onGoPayment?.(booking, 'rate')}
										className="w-full min-h-[48px] rounded-xl bg-brand-btn text-white text-sm font-semibold"
									>
										{t('payment.flow.add_review')}
									</button>
								)}
							</div>
						)}
					</section>
				</div>
			)}

			{panel === 'status' && (
				<div>
					<ol className="space-y-0">
						{[
							{ done: timeline.done.created, label: t('my_cases.flow.tl_created'), time: timeline.created },
							{ done: timeline.done.matching, label: t('my_cases.flow.tl_matching'), time: timeline.created },
							{ done: timeline.done.offers, label: t('my_cases.flow.tl_offers'), time: timeline.created },
							{ done: timeline.done.choose, label: t('my_cases.flow.tl_choose'), waiting: !timeline.done.choose, waitKey: 'waiting' },
							{ done: timeline.done.booking, label: t('my_cases.flow.tl_booking'), waiting: !timeline.done.booking, waitKey: 'waiting_booking' },
							{ done: timeline.done.work, label: t('my_cases.flow.tl_work'), waiting: !timeline.done.work, waitKey: 'waiting_work' },
							{ done: timeline.done.done, label: t('my_cases.flow.tl_done'), note: timeline.done.done ? null : t(`my_cases.flow.${timeline.progressKey}`) },
						].map((step, index, arr) => {
							const current = !step.done && (index === 0 || arr[index - 1]?.done)
							return (
								<li key={step.label} className="flex gap-3">
									<div className="flex flex-col items-center">
										<div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-brand-btn text-white' : current ? 'border-2 border-[#1B8F3E] bg-white' : 'border border-gray-300 bg-white'}`}>
											{step.done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : null}
										</div>
										{index < arr.length - 1 && <div className={`w-0.5 flex-1 min-h-[28px] ${step.done ? 'bg-[#1B8F3E]' : 'bg-gray-200'}`} />}
									</div>
									<div className="pb-5">
										<p className={`text-sm font-medium ${step.done || current ? 'text-brand-dark' : 'text-gray-400'}`}>{step.label}</p>
										{step.time && step.done && <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(step.time)}</p>}
										{step.note && <p className="text-xs text-gray-400 mt-0.5">{step.note}</p>}
										{step.waiting && <p className="text-xs text-gray-400 mt-0.5">{t(`my_cases.flow.${step.waitKey || 'waiting'}`)}</p>}
									</div>
								</li>
							)
						})}
					</ol>
					<button
						type="button"
						onClick={() => setPanel('messages')}
						className="mt-6 w-full rounded-2xl bg-[#E8F5EC] px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-[#dff0e5] transition-colors"
					>
						<div className="min-w-0">
							<p className="text-sm font-bold text-brand-dark">{t('my_cases.flow.have_questions_title')}</p>
							<p className="text-sm text-[#1F2937] leading-snug mt-0.5">{t('my_cases.flow.have_questions_body')}</p>
						</div>
						<MessageCircle className="w-7 h-7 text-[#1B8F3E] shrink-0" strokeWidth={1.75} />
					</button>
				</div>
			)}

			{panel === 'photos' && (
				<div className="w-full">
					{photoTab === 'photos' ? (
						<>
							<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.uploaded_photos')}</h2>
							<div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full lg:max-w-sm">
								{images.map((file, index) => {
									const fileId = String(file._id || file.id || index)
									const src = getFullUrl(file.fileUrl || file.url)
									const menuOpen = photoMenuId === fileId
									return (
										<div key={fileId} className={`relative aspect-square rounded-xl lg:rounded-2xl bg-gray-100 ${menuOpen ? 'z-50' : ''}`}>
											<button
												type="button"
												className="absolute inset-0 rounded-xl lg:rounded-2xl overflow-hidden"
												onClick={() => {
													setPhotoMenuId(null)
													setViewingPhoto(src)
												}}
												aria-label={t('my_cases.flow.photo_view')}
											>
												<img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
											</button>
											<div className="absolute top-2 right-2 z-10">
												<button
													type="button"
													className="w-7 h-7 rounded-full bg-white shadow-sm text-brand-dark flex items-center justify-center"
													aria-label="More"
													aria-expanded={menuOpen}
													onClick={(event) => {
														event.stopPropagation()
														setPhotoMenuId(menuOpen ? null : fileId)
													}}
												>
													<MoreVertical className="w-4 h-4" />
												</button>
												{menuOpen ? (
													<div className="absolute right-0 top-9 w-36 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden py-1">
														<button
															type="button"
															className="w-full px-3 py-2.5 text-left text-sm text-brand-dark flex items-center gap-2.5 hover:bg-gray-50"
															onClick={(event) => {
																event.stopPropagation()
																setPhotoMenuId(null)
																setViewingPhoto(src)
															}}
														>
															<Eye className="w-4 h-4 text-[#6B7280]" />
															{t('my_cases.flow.photo_view')}
														</button>
														<button
															type="button"
															disabled={deletingPhotoId === fileId}
															className="w-full px-3 py-2.5 text-left text-sm text-[#DC2626] flex items-center gap-2.5 hover:bg-red-50 disabled:opacity-50"
															onClick={(event) => {
																event.stopPropagation()
																handleDeletePhoto(file, id, t, setDeletingPhotoId, setPhotoMenuId, onRequestUpdated)
															}}
														>
															<Trash2 className="w-4 h-4" />
															{t('my_cases.flow.photo_delete')}
														</button>
													</div>
												) : null}
											</div>
										</div>
									)
								})}
								<label className={`aspect-square rounded-xl lg:rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 hover:border-[#1B8F3E]/50 transition-colors cursor-pointer ${uploadingPhoto ? 'opacity-60 pointer-events-none' : ''}`}>
									<input
										type="file"
										accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
										multiple
										className="sr-only"
										disabled={uploadingPhoto}
										onChange={(event) => handleAddPhotos(event, id, t, setUploadingPhoto, onRequestUpdated)}
									/>
									<Camera className="w-7 h-7 text-[#2563EB]" strokeWidth={1.75} />
									<span className="text-xs font-medium text-center px-3 text-[#1e3a5f]">
										{uploadingPhoto ? t('my_cases.flow.photo_uploading') : t('my_cases.flow.add_photo')}
									</span>
								</label>
							</div>
							<div className="mt-5 rounded-lg lg:rounded-2xl bg-[#E8F5EC] px-4 py-3.5 flex items-start gap-3">
								<ShieldCheck className="w-5 h-5 text-[#1B8F3E] shrink-0 mt-0.5" strokeWidth={2} />
								<p className="text-sm text-[#1F2937] leading-snug">{t('my_cases.flow.photos_private')}</p>
							</div>
							{photoMenuId ? (
								<button
									type="button"
									className="fixed inset-0 z-40 cursor-default"
									aria-label="Close menu"
									onClick={() => setPhotoMenuId(null)}
								/>
							) : null}
							{viewingPhoto ? (
								<div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
									<button
										type="button"
										className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
										aria-label={t('common.close') || 'Close'}
										onClick={() => setViewingPhoto(null)}
									>
										<X className="w-5 h-5" />
									</button>
									<img
										src={viewingPhoto}
										alt=""
										className="max-w-full max-h-[85vh] rounded-xl object-contain"
										onClick={(event) => event.stopPropagation()}
									/>
								</div>
							) : null}
						</>
					) : (
						<>
							<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.documents')}</h2>
							{documents.length === 0 ? (
								<p className="text-sm text-gray-500">{t('my_cases.flow.no_documents')}</p>
							) : (
								<div className="rounded-xl lg:rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
									{documents.map((file, index) => (
										<a
											key={file._id || index}
											href={getFullUrl(file.fileUrl || file.url)}
											target="_blank"
											rel="noreferrer"
											className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-brand-dark hover:bg-gray-50"
										>
											<span className="truncate">{file.fileName || t('my_cases.flow.documents')}</span>
											<ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
										</a>
									))}
								</div>
							)}
						</>
					)}
				</div>
			)}

			{panel === 'messages' && (
				<div className={`w-full ${mobileChatOpen ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}`}>
					{messageTab === 'messages' ? (
						<div className={`lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)] lg:gap-6 lg:items-start ${mobileChatOpen ? 'max-lg:flex-1 max-lg:min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-hidden lg:items-stretch' : ''}`}>
							<div className={activeChat?.workshopId ? 'max-lg:hidden' : ''}>
								<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.conversations')}</h2>
								{conversations.length === 0 ? (
									<EmptyState
										compact
										title={t('common.empty.messages_title')}
										description={t('common.empty.messages_desc')}
									/>
								) : (
									<div className="rounded-xl lg:rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden mb-5">
										{conversations.map((ws) => (
											<button
												key={ws.workshopId || ws.name}
												type="button"
												onClick={() => ws.workshopId && setActiveChat(ws)}
												className={`w-full text-left flex items-start gap-3 px-3.5 py-3.5 hover:bg-gray-50 ${chatWorkshop?.workshopId === ws.workshopId ? 'bg-[#F3FBF6]' : ''}`}
											>
												<div className="w-11 h-11 rounded-full overflow-hidden bg-[#E8F5EC] shrink-0">
													<WorkshopImage workshop={{ companyName: ws.name, logo: ws.logo }} alt={ws.name} className="w-full h-full" />
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-3">
														<p className="text-sm font-bold text-brand-dark truncate">{ws.name}</p>
														{ws.time && (
															<span className="text-[11px] text-gray-400 shrink-0 pt-0.5">{formatMessageTime(ws.time, t)}</span>
														)}
													</div>
													<div className="flex items-start justify-between gap-3 mt-0.5">
														<p className="text-xs text-[#6B7280] line-clamp-2 leading-snug">{ws.preview}</p>
														{ws.unreadCount > 0 && (
															<span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-brand-btn text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
																{ws.unreadCount}
															</span>
														)}
													</div>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
							<div
								className={`lg:min-h-[360px] lg:mt-0 lg:rounded-2xl lg:border lg:border-gray-200 lg:p-4 ${
									activeChat?.workshopId
										? mobileChatOpen
											? 'max-lg:flex-1 max-lg:min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-hidden'
											: ''
										: 'max-lg:hidden mt-4 lg:mt-0'
								}`}
							>
								{chatWorkshop?.workshopId ? (
									<div className={mobileChatOpen ? 'max-lg:flex-1 max-lg:min-h-0 max-lg:flex max-lg:flex-col max-lg:overflow-hidden lg:contents' : ''}>
									<CaseChat
										key={chatWorkshop.workshopId}
										requestId={id}
										workshopId={chatWorkshop.workshopId}
										title={chatWorkshop.name}
										logo={chatWorkshop.logo}
										viewerRole="CUSTOMER"
										extras={pendingChatExtras(request, chatWorkshop.workshopId)}
										onExtraDecision={onExtraDecision}
										onBack={() => setActiveChat(null)}
									/>
									</div>
								) : (
									<div className="max-lg:hidden">
										<EmptyChat t={t} />
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="w-full">
							<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.registered_workshops')}</h2>
							{directory.length === 0 ? (
								<EmptyState
									compact
									title={t('common.empty.workshops_title')}
									description={t('common.empty.workshops_desc')}
								/>
							) : (
								<div className="rounded-xl lg:rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
									{directory.map((ws) => {
										const workshopId = ws.id || ws._id
										const location = [ws.city, ws.postalCode].filter(Boolean).join(' · ')
										return (
											<div key={workshopId} className="flex items-center gap-3 px-3.5 py-3.5">
												<div className="w-11 h-11 rounded-full overflow-hidden bg-[#E8F5EC] shrink-0">
													<WorkshopImage workshop={{ companyName: ws.companyName, logo: ws.logo }} alt={ws.companyName} className="w-full h-full" />
												</div>
												<div className="min-w-0 flex-1">
													<p className="text-sm font-bold text-brand-dark truncate">{ws.companyName}</p>
													{location ? (
														<p className="text-xs text-[#6B7280] mt-0.5 truncate">{location}</p>
													) : null}
													{(ws.rating > 0 || ws.reviewCount > 0) && (
														<p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1">
															<Star className="w-3 h-3 text-[#E67E22] fill-[#E67E22]" />
															{Number(ws.rating || 0).toFixed(1)}
															{ws.reviewCount > 0 ? ` (${ws.reviewCount})` : ''}
														</p>
													)}
												</div>
												<button
													type="button"
													onClick={() => {
														setActiveChat({
															workshopId,
															name: ws.companyName,
															logo: ws.logo,
															preview: '',
														})
														setMessageTab('messages')
													}}
													className="shrink-0 px-3 min-h-[42px] rounded-lg bg-brand-btn text-white text-xs font-semibold"
												>
													{t('my_cases.flow.message_workshop')}
												</button>
											</div>
										)
									})}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

function EmptyChat({ t }) {
	return (
		<div className="flex flex-col min-h-[40vh] lg:min-h-[320px]">
			<p className="text-sm text-gray-400 text-center flex-1 pt-8">{t('my_cases.flow.chat_pick')}</p>
			<div className="flex items-center gap-2">
				<div className="flex-1 flex items-center h-11 lg:h-12 rounded-full border border-gray-200 bg-gray-50 px-4 gap-2">
					<input
						disabled
						placeholder={t('my_cases.flow.chat_placeholder')}
						className="flex-1 min-w-0 text-sm bg-transparent outline-none"
					/>
					<Paperclip className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.75} />
				</div>
				<button type="button" disabled className="h-11 w-11 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0" aria-label={t('my_cases.flow.chat_send')}>
					<ArrowRight className="w-5 h-5" />
				</button>
			</div>
		</div>
	)
}

function ExpandableText({ text }) {
	const { t } = useTranslation()
	const longDesc = (text || '').length > 120
	const [open, setOpen] = useState(false)
	return (
		<>
			<p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
				{longDesc && !open ? `${text.slice(0, 120)}…` : text || '—'}
			</p>
			{longDesc && (
				<button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 w-full flex items-center justify-end gap-1 text-sm font-semibold text-[#1B8F3E]">
					{open ? t('common.show_less') : t('my_cases.flow.show_more')}
					<ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
				</button>
			)}
		</>
	)
}

function PanelTabs({ tabs, active, onChange }) {
	return (
		<div className="flex w-full border-b border-gray-200 mb-5 pt-1">
			{tabs.map((tab) => {
				const isActive = tab.key === active
				const Comp = onChange ? 'button' : 'span'
				return (
					<Comp
						key={tab.key}
						type={onChange ? 'button' : undefined}
						onClick={onChange ? () => onChange(tab.key) : undefined}
						className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${
							isActive ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'
						}`}
					>
						{tab.label}
					</Comp>
				)
			})}
		</div>
	)
}

function Row({ label, value, accent, bullet }) {
	const valueClass =
		accent === 'orange' ? 'text-[#E67E22]' : accent === 'green' ? 'text-[#1B8F3E]' : accent === 'blue' ? 'text-[#2563EB]' : 'text-[#4B5563]'
	return (
		<div className="py-3.5 flex justify-between gap-3 text-sm">
			<span className="text-brand-dark font-medium">{label}</span>
			<span className={`font-medium text-right ${valueClass}`}>{bullet ? `• ${value}` : value}</span>
		</div>
	)
}

function isPhotoFile(file) {
	return file?.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file?.name || '')
}

async function handleAddPhotos(event, requestId, t, setUploadingPhoto, onRequestUpdated) {
	const files = [...(event.target.files || [])].filter(isPhotoFile)
	event.target.value = ''
	if (!files.length || !requestId) {
		if (!files.length) toast.error(t('errors.invalid_file_type'))
		return
	}
	setUploadingPhoto(true)
	try {
		const ids = []
		for (const file of files) {
			const formData = new FormData()
			formData.append('file', file)
			const response = await uploadAPI.uploadFile(formData)
			const reportId = response.data?.id || response.data?._id
			if (reportId) ids.push(reportId)
		}
		if (!ids.length) {
			toast.error(t('errors.upload_failed'))
			return
		}
		const updated = await requestsAPI.update(requestId, { addReportIds: ids })
		onRequestUpdated?.(updated.data)
		toast.success(t('my_cases.flow.photo_added'))
	} catch (error) {
		toast.error(error.response?.data?.message || t('errors.upload_failed'))
	} finally {
		setUploadingPhoto(false)
	}
}

async function handleDeletePhoto(file, requestId, t, setDeletingPhotoId, setPhotoMenuId, onRequestUpdated) {
	const reportId = file?._id || file?.id
	if (!reportId || !requestId) return
	if (!window.confirm(t('my_cases.flow.photo_delete_confirm'))) {
		setPhotoMenuId(null)
		return
	}
	const key = String(reportId)
	setDeletingPhotoId(key)
	try {
		const updated = await requestsAPI.update(requestId, { removeReportIds: [reportId] })
		onRequestUpdated?.(updated.data)
		setPhotoMenuId(null)
		toast.success(t('my_cases.flow.photo_deleted'))
	} catch (error) {
		toast.error(error.response?.data?.message || t('errors.generic') || 'Failed')
	} finally {
		setDeletingPhotoId(null)
	}
}

function isImageFile(file) {
	const url = file?.fileUrl || file?.url || ''
	return (file?.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|gif)$/i.test(url)
}

function formatMessageTime(value, t) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const now = new Date()
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const startMessage = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const dayDiff = Math.round((startToday - startMessage) / 86400000)
	if (dayDiff === 1) return t('my_cases.flow.yesterday')
	if (dayDiff === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
