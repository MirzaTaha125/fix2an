import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '../components/ui/Dialog'
import { WorkshopJobsListSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { formatPrice, formatDateTime } from '../utils/cn'
import { getFullUrl } from '../config/api.js'
import { getCaseTitle, getVehicleLine, getCaseTimeline } from '../components/cases/caseHelpers'
import CaseChat from '../components/cases/CaseChat'
import { formatSwedishPhone, stripSwedishPhoneForTel } from '../utils/swedishPhone'
import { useTranslation } from 'react-i18next'
import {
	Phone,
	Mail,
	User,
	Calendar,
	Plus,
	ChevronRight,
	Star,
	Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import { useRegisterWorkshopHeaderActions } from '../context/WorkshopHeaderActionsContext'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { formatRequestRegistration } from '../components/VehicleRequestCard'

import { offersAPI, bookingsAPI, reviewsAPI } from '../services/api'

function CustomerScheduleNotice({ t, isScheduled = false }) {
	return (
		<div className="bg-[#F8FAF9] rounded-2xl border border-[#1B8F3E]/10 p-3 flex gap-2.5 mt-4">
			<div className="shrink-0 pt-0.5">
				{isScheduled ? (
					<Calendar className="w-5 h-5 text-[#1B8F3E]" strokeWidth={2} />
				) : (
					<Phone className="w-5 h-5 text-[#1B8F3E]" strokeWidth={2} />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<h4 className="text-xs font-black text-[#05324f] leading-snug">
					{isScheduled
						? t('workshop.contracts.contact_customer_scheduled_title')
						: t('workshop.contracts.contact_customer_title')}
				</h4>
				<p className="text-[11px] text-[#05324f]/70 leading-snug font-medium mt-0.5">
					{isScheduled
						? t('workshop.contracts.contact_customer_scheduled_desc')
						: t('workshop.contracts.contact_customer_desc')}
				</p>
			</div>
		</div>
	)
}

function ChatBubbleIcon({ className = 'w-4 h-4' }) {
	return (
		<svg viewBox="0 0 40 32" fill="none" className={className} aria-hidden>
			<path
				d="M20 3C11.16 3 4 8.82 4 16c0 3.56 1.67 6.76 4.32 8.88L6 29l5.4-3.24C13.4 26.56 16.58 27.5 20 27.5c8.84 0 16-5.82 16-13S28.84 3 20 3z"
				stroke="#1B8F3E"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function getCustomerContact(customer, booking) {
	const source = customer || booking?.customerId || {}
	return {
		name: source.name || '',
		email: (source.email || '').trim(),
		phone: formatSwedishPhone((source.phone || '').trim()),
	}
}

const ACTIVE_REPAIR_STATUSES = ['CONFIRMED', 'RESCHEDULED', 'RECEIVED', 'IN_PROGRESS', 'READY_PICKUP']

function startOfDay(value) {
	const date = new Date(value)
	date.setHours(0, 0, 0, 0)
	return date
}

function dayOffset(value) {
	if (!value) return null
	const target = startOfDay(value)
	if (Number.isNaN(target.getTime())) return null
	const today = startOfDay(new Date())
	return Math.round((target - today) / 86400000)
}

function formatJobWhen(value, t) {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	const offset = dayOffset(date)
	if (offset === 0) return `${t('workshop.panel.filter_today')} ${time}`
	if (offset === 1) return `${t('workshop.panel.filter_tomorrow')} ${time}`
	if (offset === -1) return `${t('my_cases.flow.yesterday')} ${time}`
	return `${date.toLocaleDateString()} ${time}`
}

function jobVehicleTitle(request) {
	const vehicle = request?.vehicleId || request?.vehicle
	const name = [vehicle?.make, vehicle?.model].filter((part) => part && part !== '—').join(' ')
	const plate = formatRequestRegistration(request)
	if (name && plate && plate !== '—') return `${name} • ${plate}`
	return name || plate || '—'
}

function jobStatusView(booking, offer, request, t) {
	const status = booking?.status?.toUpperCase()
	const waitingParts = (booking?.extraApprovals || []).some((item) => item.status === 'PENDING')
	if (waitingParts) return { label: t('workshop.panel.job_status.parts'), className: 'bg-[#FFF6E8] text-[#E0A23A]' }
	if (status === 'DONE' || request?.status?.toUpperCase() === 'COMPLETED') {
		return { label: t('workshop.panel.job_status.done'), className: 'bg-[#E8F8EE] text-[#3DAA62]' }
	}
	if (status === 'CANCELLED' || offer?.status === 'CANCELLED') {
		return { label: t('workshop.panel.job_status.cancelled'), className: 'bg-[#FDECEC] text-[#E24B4B]' }
	}
	if (status === 'IN_PROGRESS') return { label: t('workshop.panel.job_status.ongoing'), className: 'bg-[#EEF2FF] text-[#5B6FD6]' }
	if (status === 'RECEIVED') return { label: t('workshop.panel.job_status.diagnosis'), className: 'bg-[#EEF2FF] text-[#6B7CDB]' }
	if (status === 'READY_PICKUP') return { label: t('workshop.panel.job_status.ready'), className: 'bg-[#E8F8EE] text-[#3DAA62]' }
	return { label: t('workshop.panel.job_status.booked'), className: 'bg-[#EEF2FF] text-[#5B6FD6]' }
}

const REPAIR_STATUS_ACTIONS = {
	CONFIRMED: { next: 'RECEIVED', labelKey: 'workshop.contracts.actions.mark_received', bodyKey: 'received_body' },
	RESCHEDULED: { next: 'RECEIVED', labelKey: 'workshop.contracts.actions.mark_received', bodyKey: 'received_body' },
	RECEIVED: { next: 'IN_PROGRESS', labelKey: 'workshop.contracts.actions.start_work', bodyKey: 'start_body' },
	IN_PROGRESS: { next: 'READY_PICKUP', labelKey: 'workshop.contracts.actions.ready_pickup', bodyKey: 'ready_body' },
	READY_PICKUP: { next: 'DONE', labelKey: 'workshop.contracts.actions.mark_done', bodyKey: 'complete_body' },
}

function getRepairStatusAction(status, booking) {
	const key = status?.toUpperCase()
	// Final amount already locked — waiting for customer to confirm pickup
	if (key === 'READY_PICKUP' && Number(booking?.finalAmount) > 0) return null
	return REPAIR_STATUS_ACTIONS[key] || null
}

function describeJob(offer, bookings, t) {
	const offerId = offer._id || offer.id
	const request = offer.requestId || offer.request
	const customer = request?.customerId || request?.customer
	const booking = bookings.find((item) => {
		const bookingOfferId = item.offerId?._id || item.offerId?.id || item.offerId
		return String(bookingOfferId) === String(offerId)
	})
	const bookingStatus = booking?.status?.toUpperCase()
	const isRequestCompleted = request?.status?.toUpperCase() === 'COMPLETED'
	const cardIsOpen = bookingStatus !== 'DONE' && !isRequestCompleted && bookingStatus !== 'CANCELLED' && offer.status !== 'CANCELLED'
	const when = formatJobWhen(booking?.scheduledAt || booking?.updatedAt, t)
	const whenLabel = !when
		? ''
		: (isRequestCompleted || bookingStatus === 'DONE')
			? t('workshop.panel.job_done_at', { when })
			: ['RECEIVED', 'IN_PROGRESS', 'READY_PICKUP'].includes(bookingStatus)
				? t('workshop.panel.job_started', { when })
				: t('workshop.panel.job_booked_at', { when })
	return {
		offerId,
		request,
		customer,
		booking,
		bookingStatus,
		cardIsOpen,
		repairAction: cardIsOpen ? getRepairStatusAction(bookingStatus, booking) : null,
		pendingExtraApprovals: (booking?.extraApprovals || []).filter((item) => item.status === 'PENDING'),
		approvedExtraApprovals: (booking?.extraApprovals || []).filter((item) => String(item.status).toUpperCase() === 'APPROVED'),
		// Hide once work is complete (ready for pickup / done)
		canRequestExtraApproval: ['RECEIVED', 'IN_PROGRESS'].includes(bookingStatus),
		statusView: jobStatusView(booking, offer, request, t),
		whenLabel,
	}
}

function flowStatusLabel(statusKey, t) {
	if (statusKey === 'repair') return t('my_cases.flow.status_ongoing')
	if (statusKey === 'pickup' || statusKey === 'ready') return t('my_cases.flow.status_ready')
	if (statusKey === 'closed') return t('my_cases.flow.status_done_short')
	return t(`my_cases.flow.status_${statusKey}`)
}

function JobTimeline({ t, timeline }) {
	const steps = [
		{ done: timeline.done.created, label: t('my_cases.flow.tl_created'), time: timeline.created },
		{ done: timeline.done.matching, label: t('my_cases.flow.tl_matching'), time: timeline.created },
		{ done: timeline.done.offers, label: t('my_cases.flow.tl_offers'), time: timeline.created },
		{ done: timeline.done.choose, label: t('my_cases.flow.tl_choose'), waiting: !timeline.done.choose, waitKey: 'waiting' },
		{ done: timeline.done.booking, label: t('my_cases.flow.tl_booking'), waiting: !timeline.done.booking, waitKey: 'waiting_booking' },
		{ done: timeline.done.work, label: t('my_cases.flow.tl_work'), waiting: !timeline.done.work, waitKey: 'waiting_work' },
		{ done: timeline.done.done, label: t('my_cases.flow.tl_done'), note: timeline.done.done ? null : t(`my_cases.flow.${timeline.progressKey}`) },
	]
	return (
		<ol>
			{steps.map((step, index, arr) => {
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
	)
}

function jobUpdatedLabel(job, t, language) {
	const raw = job.booking?.updatedAt || job.booking?.scheduledAt || job.request?.updatedAt || job.request?.createdAt
	if (!raw) return ''
	const date = new Date(raw)
	const now = new Date()
	const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
	const time = date.toLocaleTimeString(language === 'sv' ? 'sv-SE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
	if (isToday) return `${t('my_cases.flow.last_updated')}: ${t('my_cases.flow.today')} ${time}`
	return `${t('my_cases.flow.last_updated')}: ${formatDateTime(date, language)}`
}

function caseFiles(request) {
	const reports = []
	if (Array.isArray(request?.reportIds)) reports.push(...request.reportIds)
	if (request?.reportId) reports.push(request.reportId)
	return reports.filter((file) => file && typeof file === 'object')
}

function isImageFile(file) {
	const url = file?.fileUrl || file?.url || ''
	return String(file?.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|gif)$/i.test(url)
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

function WorkshopReview({ review, t }) {
	const { text, tags } = splitReview(review.comment)
	return (
		<div className="mt-5 border-t border-gray-100 pt-5">
			<h3 className="text-sm font-bold text-brand-dark mb-2">{t('workshop.contracts.customer_review')}</h3>
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

function approvedExtrasOf(booking) {
	return (booking?.extraApprovals || []).filter((item) => String(item.status).toUpperCase() === 'APPROVED')
}

function jobCost(offer, booking) {
	const extras = approvedExtrasOf(booking)
	const extrasSum = extras.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
	const quoted = Number(booking?.totalAmount || offer?.price || 0)
	const storedFinal = booking?.finalAmount != null ? Number(booking.finalAmount) : null
	const total = Number.isFinite(storedFinal) && storedFinal > 0 ? storedFinal : quoted + extrasSum
	const vatRate = Number(offer?.vatRate)
	const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 15
	const factor = 1 + rate / 100
	let labor = Number(offer?.laborCost) || 0
	let parts = Number(offer?.partsCost) || 0
	const quoteBase = quoted || (total - extrasSum)
	if (!labor && !parts && quoteBase) {
		const ex = Math.round(quoteBase / factor)
		labor = Math.round(ex * 0.4)
		parts = ex - labor
	}
	const base = labor + parts
	const vat = quoteBase > base ? quoteBase - base : Math.round(base * rate / 100)
	return { labor, parts, vat, extras, extrasSum, total }
}

function kr(value) {
	return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))} kr`
}

function CostSummary({ t, offer, booking }) {
	const costs = jobCost(offer, booking)
	if (!costs.total && !costs.extrasSum) return null
	return (
		<section className="max-w-xl">
			<h3 className="text-[1.35rem] font-bold text-[#0B2540] mb-1">{t('payment.flow.overview_title')}</h3>
			<p className="text-sm text-[#6B7280] mb-4">{t('payment.flow.overview_sub')}</p>
			<h4 className="text-[15px] font-bold text-[#0B2540] mb-3">{t('payment.flow.cost_title')}</h4>
			<div className="space-y-2.5 mb-3">
				{[
					[t('payment.flow.labor'), costs.labor],
					[t('payment.flow.parts'), costs.parts],
					[t('payment.flow.vat'), costs.vat],
				].map(([label, value]) => (
					<div key={label} className="flex justify-between gap-3 text-sm">
						<span className="text-[#6B7280]">{label}</span>
						<span className="font-semibold text-[#111827]">{kr(value)}</span>
					</div>
				))}
				{costs.extras.map((extra, index) => (
					<div key={`extra-${index}`} className="flex justify-between gap-3 text-sm">
						<span className="text-[#6B7280] min-w-0 truncate">
							{t('workshop.contracts.extra_approval.extra_line')}
							{extra.description ? ` — ${extra.description}` : ''}
						</span>
						<span className="font-semibold text-[#111827] shrink-0">{kr(extra.price)}</span>
					</div>
				))}
			</div>
			<div className="border-t border-gray-100 pt-3 flex justify-between items-center">
				<span className="text-sm font-bold text-[#0B2540]">{t('payment.flow.total')}</span>
				<span className="text-sm font-bold text-[#1B8F3E]">{kr(costs.total)}</span>
			</div>
		</section>
	)
}

function OngoingJobDetail({ t, offer, job, updating, onBack, onAdvance, onExtra, onReschedule, onSchedule, onCancel }) {
	const { i18n } = useTranslation()
	const [panel, setPanel] = useState('details')
	const [review, setReview] = useState(null)
	const {
		request,
		customer,
		booking,
		bookingStatus,
		cardIsOpen,
		repairAction,
		pendingExtraApprovals,
		approvedExtraApprovals = [],
		canRequestExtraApproval,
	} = job
	const bookingId = booking?._id || booking?.id
	useEffect(() => {
		if (!bookingId) {
			setReview(null)
			return undefined
		}
		let stop = false
		reviewsAPI.getByBooking(bookingId)
			.then((response) => { if (!stop) setReview(response.data) })
			.catch(() => { if (!stop) setReview(null) })
		return () => { stop = true }
	}, [bookingId])
	const caseNo = String(request._id || request.id || '').slice(-4).toUpperCase()
	const files = caseFiles(request)
	const images = files.filter(isImageFile)
	const documents = files.filter((file) => !isImageFile(file))
	const summaryArea = (request.description || '').split(/[.\n]/)[0]?.trim() || '—'
	const panels = ['details', 'status', 'photos', 'messages']
	const timeline = getCaseTimeline({
		...request,
		bookings: booking ? [booking] : [],
		offers: [{ status: offer?.status || 'ACCEPTED' }],
	})
	const statusText = flowStatusLabel(timeline.status, t)
	const statusAccent = timeline.status === 'closed' || timeline.status === 'ready' ? 'text-[#1B8F3E]' : timeline.status === 'new' || timeline.status === 'offers' ? 'text-[#E67E22]' : 'text-[#2563EB]'
	const statusPill = timeline.status === 'closed' || timeline.status === 'ready' || timeline.status === 'pickup'
		? 'bg-[#ECFDF5] text-[#1B8F3E] border-[#86EFAC]'
		: timeline.status === 'expired'
			? 'bg-gray-50 text-gray-500 border-gray-200'
			: timeline.status === 'new' || timeline.status === 'offers'
				? 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
				: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
	// After booking (CONFIRMED/RESCHEDULED) until "Mark car received" — then hide
	const statusUpper = String(bookingStatus || booking?.status || '').toUpperCase()
	const canManageBeforeReceived = Boolean(
		cardIsOpen && booking && ['CONFIRMED', 'RESCHEDULED'].includes(statusUpper)
	)
	const headerActions = canManageBeforeReceived
		? [
				{
					key: booking?.scheduledAt ? 'reschedule' : 'schedule',
					label: booking?.scheduledAt
						? (t('my_cases.reschedule_job') || 'Reschedule')
						: (t('workshop.contracts.schedule_button') || 'Schedule'),
					onClick: () => (booking?.scheduledAt ? onReschedule?.() : onSchedule?.()),
				},
				{
					key: 'cancel',
					label: t('my_cases.action_cancel') || t('common.cancel') || 'Cancel',
					danger: true,
					onClick: () => onCancel?.(),
				},
			]
		: []
	useRegisterMobileBack(onBack, Boolean(onBack))
	useRegisterWorkshopHeaderActions(headerActions, canManageBeforeReceived)

	const messagesOpen = panel === 'messages'

	return (
		<div className={`w-full ${messagesOpen ? 'case-detail-chat-lock max-lg:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px)-var(--bottom-nav-height)-env(safe-area-inset-bottom,0px))]' : ''}`}>
			<div className={messagesOpen ? 'shrink-0' : ''}>
			<div className="flex items-center justify-between gap-2 mb-3">
				<span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
					{t('my_cases.flow.case_no', { id: caseNo })}
				</span>
				<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPill}`}>
					{statusText}
				</span>
			</div>
			<h2 className="text-[1.35rem] font-bold text-brand-dark leading-tight mb-1.5">{getCaseTitle(request)}</h2>
			<p className="text-sm text-[#4B5563] mb-1">{getVehicleLine(request)}</p>
			<p className="text-xs text-gray-400 mb-5">
				{t('my_cases.flow.created')}: {request.createdAt ? formatDateTime(new Date(request.createdAt), i18n.language) : '—'}
			</p>
			<div className={`flex gap-2 overflow-x-auto ${messagesOpen ? 'mb-3' : 'mb-6'}`}>
				{panels.map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => setPanel(key)}
						className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${panel === key ? 'bg-brand-btn text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
					>
						{t(`my_cases.flow.panel_${key}`)}
					</button>
				))}
			</div>
			</div>

			{messagesOpen ? (
				<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
					<CaseChat
						requestId={request?._id || request?.id}
						workshopId={offer?.workshopId?._id || offer?.workshopId}
						title={customer?.name || t('workshop.panel.customer')}
						viewerRole="WORKSHOP"
						variant="workshop"
					/>
				</div>
			) : (
			<>

			{panel === 'details' && (
				<div className="space-y-6">
					<section>
						<h3 className="text-base font-bold text-brand-dark mb-2">{t('my_cases.flow.description')}</h3>
						<p className="text-sm text-[#4B5563] leading-relaxed">{request.description || '—'}</p>
					</section>
					{cardIsOpen && booking && repairAction && (
						<section className="rounded-2xl bg-[#F5F7F9] p-4">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
								<div className="min-w-0">
									<h2 className="text-base font-bold text-brand-dark mb-1.5">{t('my_cases.flow.next_step')}</h2>
									<p className="text-sm text-[#4B5563] leading-relaxed">{t(`workshop.contracts.actions.${repairAction.bodyKey}`)}</p>
								</div>
								<button
									type="button"
									onClick={onAdvance}
									disabled={updating}
									className="w-full lg:w-auto lg:shrink-0 px-6 lg:px-5 min-h-[52px] lg:min-h-[44px] lg:text-sm bg-brand-btn text-white rounded-xl font-semibold flex items-center justify-center disabled:opacity-60"
								>
									{updating ? '...' : t(repairAction.labelKey)}
								</button>
							</div>
						</section>
					)}
					<section>
						<h3 className="text-base font-bold text-brand-dark mb-1 border-t border-gray-100 pt-5">{t('my_cases.flow.summary')}</h3>
						<div className="divide-y divide-gray-100">
							<div className="py-3.5 flex justify-between gap-3 text-sm">
								<span className="text-brand-dark font-medium">{t('my_cases.flow.summary_status')}</span>
								<span className={`font-medium text-right ${statusAccent}`}>• {statusText}</span>
							</div>
							{[
								[t('my_cases.flow.summary_priority'), t('my_cases.flow.priority_normal')],
								[t('my_cases.flow.summary_area'), summaryArea],
								[t('my_cases.flow.summary_category'), t('my_cases.flow.category_repair')],
								...(booking?.scheduledAt ? [[t('my_cases.flow.summary_booking_date'), formatDateTime(new Date(booking.scheduledAt), i18n.language)]] : []),
							].map(([label, value]) => (
								<div key={label} className="py-3.5 flex justify-between gap-3 text-sm">
									<span className="text-brand-dark font-medium">{label}</span>
									<span className="font-medium text-right text-[#4B5563]">{value}</span>
								</div>
							))}
						</div>
						{review?.rating && <WorkshopReview review={review} t={t} />}
					</section>
					{approvedExtraApprovals.length > 0 && (
						<section>
							<h3 className="text-base font-bold text-brand-dark mb-3">
								{t('workshop.contracts.extra_approval.approved_title')}
							</h3>
							<div className="space-y-2.5">
								{approvedExtraApprovals.map((extra, index) => (
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
						</section>
					)}
					<CostSummary t={t} offer={offer} booking={booking} />
					<section>
						<h3 className="text-base font-bold text-brand-dark mb-2">{t('workshop.panel.customer')}</h3>
						<p className="flex items-center gap-2 text-sm text-[#6B7280]">
							<User className="w-3.5 h-3.5" /> {customer?.name || '—'}
						</p>
						{customer?.phone && (
							<p className="flex items-center gap-2 text-sm text-[#6B7280] mt-1.5">
								<Phone className="w-3.5 h-3.5" /> {customer.phone}
							</p>
						)}
						{customer?.email && (
							<p className="flex items-center gap-2 text-sm text-[#6B7280] mt-1">
								<Mail className="w-3.5 h-3.5" /> {customer.email}
							</p>
						)}
					</section>
				</div>
			)}

			{panel === 'status' && (
				<JobTimeline t={t} timeline={timeline} />
			)}

			{panel === 'photos' && (
				<div>
					<h3 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.uploaded_photos')}</h3>
					{images.length === 0 && documents.length === 0 ? (
						<p className="text-sm text-gray-500">{t('my_cases.flow.no_documents')}</p>
					) : (
						<div className="space-y-3">
							{images.length > 0 && (
								<div className="grid grid-cols-2 gap-3 lg:max-w-sm">
									{images.map((file, index) => (
										<img key={file._id || index} src={getFullUrl(file.fileUrl || file.url)} alt="" className="aspect-square w-full rounded-2xl object-cover bg-gray-100" />
									))}
								</div>
							)}
							{documents.map((file, index) => (
								<a key={file._id || index} href={getFullUrl(file.fileUrl || file.url)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-[#F3F4F6] px-3 py-3 text-sm">
									<span className="truncate">{file.fileName || t('my_cases.flow.documents')}</span>
									<span className="text-[#1B8F3E] font-semibold shrink-0">{t('workshop.panel.download')}</span>
								</a>
							))}
						</div>
					)}
				</div>
			)}

			{panel === 'details' && (
				<div className="mt-6">
			{cardIsOpen && !booking?.scheduledAt && <CustomerScheduleNotice t={t} />}
			{cardIsOpen && booking && pendingExtraApprovals.length > 0 && (
				<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
					<p className="text-xs font-semibold text-[#05324f] mb-1">{t('workshop.contracts.extra_approval.pending')}</p>
					{pendingExtraApprovals.map((extra, index) => (
						<p key={index} className="text-xs text-gray-600">{extra.description} — {formatPrice(extra.price)}</p>
					))}
				</div>
			)}
			{cardIsOpen && booking && canRequestExtraApproval && (
				<button type="button" onClick={onExtra} className="w-full mt-2.5 h-11 border border-dashed border-[#05324f]/20 rounded-xl text-[#05324f] font-semibold text-sm flex items-center justify-center gap-1.5">
					<Plus size={14} />
					{t('workshop.contracts.extra_approval.add_button')}
				</button>
			)}
			{/* Desktop fallback — mobile uses top ⋯ until Mark car received */}
			{canManageBeforeReceived && (
				<div className="hidden lg:flex gap-2 mt-2.5">
					{booking?.scheduledAt ? (
						<Button onClick={onReschedule} className="flex-1 h-11 bg-brand-btn text-white rounded-xl font-semibold text-sm">
							{t('my_cases.reschedule_job') || 'Reschedule'}
						</Button>
					) : (
						<Button onClick={onSchedule} className="flex-1 h-11 bg-brand-btn text-white rounded-xl font-semibold text-sm">
							{t('workshop.contracts.schedule_button') || 'Schedule'}
						</Button>
					)}
					<Button variant="secondary" onClick={onCancel} className="flex-1 h-11 rounded-xl font-semibold text-sm">
						{t('my_cases.action_cancel') || t('common.cancel') || 'Cancel'}
					</Button>
				</div>
			)}
				</div>
			)}
			</>
			)}
		</div>
	)
}

export default function WorkshopContractsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t, i18n } = useTranslation()
	const [contracts, setContracts] = useState([])
	const [bookings, setBookings] = useState([])
	const [loading, setLoading] = useState(true)
const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [contractToCancel, setContractToCancel] = useState(null)
	const [jobFilter, setJobFilter] = useState('all')
	const [showAllJobs, setShowAllJobs] = useState(false)
	const [expandedJobId, setExpandedJobId] = useState(null)
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
	const [scheduleDialogMode, setScheduleDialogMode] = useState('reschedule')
	const [bookingToReschedule, setBookingToReschedule] = useState(null)
	const [newScheduledDate, setNewScheduledDate] = useState('')
	const [newScheduledTime, setNewScheduledTime] = useState('')
	const [isRescheduling, setIsRescheduling] = useState(false)
	const [isCompleting, setIsCompleting] = useState(false)
const [cancellationReason, setCancellationReason] = useState('')
	const [contactModalOpen, setContactModalOpen] = useState(false)
	const [selectedCustomerContact, setSelectedCustomerContact] = useState(null)
	const [scheduleDialogContact, setScheduleDialogContact] = useState(null)
	const [updatingBookingId, setUpdatingBookingId] = useState(null)
	const [showExtraApprovalDialog, setShowExtraApprovalDialog] = useState(false)
	const [bookingForExtraApproval, setBookingForExtraApproval] = useState(null)
	const [extraApprovalDescription, setExtraApprovalDescription] = useState('')
	const [extraApprovalPrice, setExtraApprovalPrice] = useState('')
	const [isSubmittingExtraApproval, setIsSubmittingExtraApproval] = useState(false)

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/workshop/login', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/contract', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchContracts = async ({ silent = false } = {}) => {
		if (!user || user.role !== 'WORKSHOP') {
			setLoading(false)
			return
		}

		try {
			// Fetch accepted offers (contracts) - these are proposals that customer accepted
			const response = await offersAPI.getByWorkshop()
			
			if (response.data) {
				const allOffers = Array.isArray(response.data) ? response.data : []
				const contractOffers = allOffers.filter((offer) =>
					['ACCEPTED', 'CANCELLED'].includes(offer.status)
				)
				setContracts(contractOffers)
			}
			
			// Fetch bookings separately to check completion status
			try {
				const bookingsResponse = await bookingsAPI.getByWorkshopMe()
				if (bookingsResponse.data) {
					const allBookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []
					setBookings(allBookings)
				}
			} catch (bookingsError) {
				console.warn('Failed to fetch bookings:', bookingsError)
				setBookings([])
			}
		} catch (error) {
			console.error('Failed to fetch contracts:', error)
			if (!silent) {
				toast.error(t('workshop.contracts.fetch_error') || 'Failed to fetch contracts')
				setContracts([])
				setBookings([])
			}
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!user || user.role !== 'WORKSHOP') return undefined
		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') fetchContracts({ silent: true })
		}, 8000)
		return () => clearInterval(timer)
	}, [user])

	// Filter contracts based on active tab
	const getFilteredContracts = (tab) => {
		const targetTab = tab || 'all'
		return contracts.filter(offer => {
			const offerId = offer._id || offer.id
			if (!offerId) return false

			const booking = bookings.find(b => {
				let bookingOfferId = null
				if (b.offerId && typeof b.offerId === 'object' && b.offerId !== null) {
					bookingOfferId = b.offerId._id || b.offerId.id
				} else if (b.offerId) {
					bookingOfferId = b.offerId
				}
				if (!bookingOfferId) return false
				return String(bookingOfferId) === String(offerId)
			})

			const bookingStatus = booking?.status?.toUpperCase()
			const isBookingCancelled = bookingStatus === 'CANCELLED'
			const isBookingDone = bookingStatus === 'DONE'
			const request = offer.requestId || offer.request
			const isRequestCompleted = request?.status?.toUpperCase() === 'COMPLETED'

			if (targetTab === 'all') return true
			if (targetTab === 'booked') {
				return !isBookingDone && !isRequestCompleted && !isBookingCancelled && Boolean(booking?.scheduledAt)
			}
			if (targetTab === 'ongoing') {
				return ['RECEIVED', 'IN_PROGRESS', 'READY_PICKUP'].includes(bookingStatus)
			}
			if (targetTab === 'active') {
				return !isBookingDone && !isRequestCompleted && !isBookingCancelled
			}
			if (targetTab === 'completed') {
				return isBookingDone || isRequestCompleted
			}
			if (targetTab === 'cancelled') {
				return isBookingCancelled || offer.status === 'CANCELLED'
			}
			return false
		})
	}

	const findBookingForOffer = (offerId) =>
		bookings.find((b) => {
			const bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
			return String(bOfferId) === String(offerId)
		})

	// Only active jobs (exclude completed / cancelled)
	const allJobs = getFilteredContracts('active')
	const jobOffset = (offer) => dayOffset(findBookingForOffer(offer._id || offer.id)?.scheduledAt)
	const todayJobs = allJobs.filter((offer) => jobOffset(offer) === 0)
	const tomorrowJobs = allJobs.filter((offer) => jobOffset(offer) === 1)
	const jobPool = jobFilter === 'today' ? todayJobs : jobFilter === 'tomorrow' ? tomorrowJobs : allJobs
	const visibleJobs = showAllJobs ? jobPool : jobPool.slice(0, 4)
	const selectedOffer = jobPool.find((offer) => String(offer._id || offer.id) === String(expandedJobId))
	const selectedJob = selectedOffer ? describeJob(selectedOffer, bookings, t) : null

	const openScheduleDialog = (booking, mode, customer) => {
		setBookingToReschedule(booking)
		setScheduleDialogMode(mode)
		setScheduleDialogContact(getCustomerContact(customer, booking))
		if (booking.scheduledAt) {
			const scheduled = new Date(booking.scheduledAt)
			setNewScheduledDate(scheduled.toISOString().split('T')[0])
			setNewScheduledTime(scheduled.toTimeString().slice(0, 5))
		} else {
			setNewScheduledDate('')
			setNewScheduledTime('')
		}
		setShowRescheduleDialog(true)
	}

	const handleConfirmClick = (offer) => {
		const offerId = offer._id || offer.id
		const booking = findBookingForOffer(offerId)
		const request = offer.requestId || offer.request
		const customer = request?.customerId || request?.customer

		if (!booking) {
			toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			return
		}

		openScheduleDialog(booking, 'confirm', customer)
	}

	const handleRescheduleClick = (offer) => {
		const offerId = offer._id || offer.id
		const booking = findBookingForOffer(offerId)
		const request = offer.requestId || offer.request
		const customer = request?.customerId || request?.customer

		if (!booking) {
			toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			return
		}

		openScheduleDialog(booking, 'reschedule', customer)
	}

	const handleScheduleConfirm = async () => {
		if (!bookingToReschedule || !newScheduledDate || !newScheduledTime) {
			toast.error(t('my_cases.reschedule_date_required') || 'Please select both date and time')
			return
		}

		setIsRescheduling(true)
		try {
			const bookingId = bookingToReschedule._id || bookingToReschedule.id
			const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`)
			if (scheduleDialogMode === 'confirm') {
				await bookingsAPI.scheduleAppointment(bookingId, scheduledAt.toISOString())
				toast.success(t('my_cases.appointment_confirmed_success') || 'Appointment confirmed successfully.')
			} else {
				await bookingsAPI.reschedule(bookingId, scheduledAt.toISOString())
				toast.success(t('my_cases.job_rescheduled_success') || 'Job rescheduled successfully')
			}
			setShowRescheduleDialog(false)
			setBookingToReschedule(null)
			fetchContracts()
		} catch (error) {
			console.error('Failed to update booking schedule:', error)
			toast.error(
				scheduleDialogMode === 'confirm'
					? (t('workshop.contracts.confirm_error') || 'Failed to confirm appointment')
					: (t('my_cases.job_reschedule_error') || 'Failed to reschedule')
			)
		} finally {
			setIsRescheduling(false)
		}
	}

	const handleCancelDialogClose = () => {
		setShowCancelDialog(false)
		setContractToCancel(null)
		setCancellationReason('')
	}

	const handleCancelClick = (offerId) => {
		setContractToCancel(offerId)
		setCancellationReason('')
		setShowCancelDialog(true)
	}

	const handleStatusAdvance = async (booking, nextStatus, offerPrice = null) => {
		const bookingId = booking._id || booking.id
		setUpdatingBookingId(bookingId)
		try {
			if (nextStatus === 'DONE') {
				// Confirm final amount + ready for pickup — customer closes case after pickup
				const extrasSum = approvedExtrasOf(booking).reduce((sum, item) => sum + (Number(item.price) || 0), 0)
				const quoted = Number(booking.totalAmount || booking.offerId?.price || offerPrice || 0)
				const amount = Number(booking.finalAmount) > 0
					? Number(booking.finalAmount)
					: quoted + extrasSum
				if (!Number.isFinite(amount) || amount <= 0) {
					toast.error(t('workshop.contracts.final_amount_required'))
					return
				}
				await bookingsAPI.update(bookingId, { status: 'READY_PICKUP', finalAmount: Math.round(amount) })
			} else {
				await bookingsAPI.update(bookingId, { status: nextStatus })
			}
			toast.success(t('workshop.contracts.status_update_success') || 'Status updated')
			fetchContracts()
		} catch (error) {
			console.error('Failed to update booking status:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.status_update_error') || 'Failed to update status')
		} finally {
			setUpdatingBookingId(null)
		}
	}

	const openExtraApprovalDialog = (booking) => {
		setBookingForExtraApproval(booking)
		setExtraApprovalDescription('')
		setExtraApprovalPrice('')
		setShowExtraApprovalDialog(true)
	}

	const handleExtraApprovalSubmit = async () => {
		if (!bookingForExtraApproval) return
		if (!extraApprovalDescription.trim()) {
			toast.error(t('workshop.contracts.extra_approval.description_required') || 'Please describe the extra work')
			return
		}
		const price = Number(extraApprovalPrice)
		if (!price || price <= 0) {
			toast.error(t('workshop.contracts.extra_approval.price_required') || 'Please enter a valid price')
			return
		}

		setIsSubmittingExtraApproval(true)
		try {
			const bookingId = bookingForExtraApproval._id || bookingForExtraApproval.id
			const existing = Array.isArray(bookingForExtraApproval.extraApprovals)
				? bookingForExtraApproval.extraApprovals
				: []
			await bookingsAPI.update(bookingId, {
				extraApprovals: [
					...existing,
					{ description: extraApprovalDescription.trim(), price, status: 'PENDING' },
				],
			})
			toast.success(t('workshop.contracts.extra_approval.success') || 'Extra approval request sent')
			setShowExtraApprovalDialog(false)
			setBookingForExtraApproval(null)
			fetchContracts()
		} catch (error) {
			console.error('Failed to submit extra approval:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.extra_approval.error') || 'Failed to send request')
		} finally {
			setIsSubmittingExtraApproval(false)
		}
	}

	const handleCancelConfirm = async () => {
		if (!contractToCancel) return
		if (!cancellationReason.trim()) {
			toast.error(t('workshop.contracts.cancel_reason_required') || 'Please provide a reason for cancellation')
			return
		}
		
		setIsCompleting(true) // Reusing isCompleting state for the loading spinner
		try {
			// Find the booking ID associated with this offer
			const booking = bookings.find(b => {
				let bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
				return String(bOfferId) === String(contractToCancel)
			})
			
			if (booking) {
				await bookingsAPI.cancel(booking._id || booking.id, cancellationReason)
				toast.success(t('workshop.contracts.cancelled') || 'Contract cancelled successfully')
				handleCancelDialogClose()
				fetchContracts()
			} else {
				toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			}
		} catch (error) {
			console.error('Failed to cancel contract:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.cancel_error') || 'Failed to cancel contract')
		} finally {
			setIsCompleting(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchContracts()
		}
	}, [user])

	// Refresh data when page comes into focus (in case customer completed job while workshop had page open)
	useEffect(() => {
		const handleFocus = () => {
			if (user && user.role === 'WORKSHOP' && document.visibilityState === 'visible') {
				fetchContracts()
			}
		}
		
		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleFocus)
		
		return () => {
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleFocus)
		}
	}, [user])

	if (authLoading || loading) {
		return (
			<WorkshopShell>
			<div className="workshop-jobs-page list-page-shell bg-transparent flex flex-col">
				<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 flex flex-col overflow-hidden">
					<WorkshopJobsListSkeleton />
				</div>
			</div>
			</WorkshopShell>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<WorkshopShell>
		<div className="workshop-jobs-page list-page-shell bg-transparent flex flex-col">
			
			{/* Reschedule Dialog */}
			<Dialog
				open={showRescheduleDialog}
				onOpenChange={(open) => {
					setShowRescheduleDialog(open)
					if (!open) {
						setScheduleDialogContact(null)
					}
				}}
			>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{scheduleDialogMode === 'confirm'
								? (t('workshop.contracts.schedule_appointment_title') || 'Schedule appointment')
								: (t('my_cases.reschedule_job_title') || 'Reschedule Job')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{scheduleDialogMode === 'confirm'
								? (t('workshop.contracts.schedule_appointment_description') || "Choose a date and time for the customer's visit.")
								: (t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment')}
						</DialogDescription>
					</DialogHeader>

					<CustomerScheduleNotice t={t} isScheduled={scheduleDialogMode === 'reschedule'} />
					<button
						type="button"
						className="w-full mt-2.5 h-10 border border-[#1B8F3E] rounded-xl text-[#1B8F3E] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F9F4] transition-all active:scale-[0.98]"
						onClick={() => {
							if (!scheduleDialogContact) {
								toast.error(t('my_cases.contact_unavailable') || 'Contact details unavailable')
								return
							}
							setSelectedCustomerContact(scheduleDialogContact)
							setContactModalOpen(true)
						}}
					>
						<ChatBubbleIcon />
						{t('workshop.contracts.contact_customer')}
					</button>

					<div className="mt-4 space-y-3 w-full min-w-0">
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('my_cases.new_date') || 'New Date'}
							</Label>
							<Input
								type="date"
								value={newScheduledDate}
								onChange={(e) => setNewScheduledDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('my_cases.new_time') || 'New Time'}
							</Label>
							<Input
								type="time"
								value={newScheduledTime}
								onChange={(e) => setNewScheduledTime(e.target.value)}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
					</div>

					<DialogFooter className="mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setShowRescheduleDialog(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={isRescheduling}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={handleScheduleConfirm}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95"
							disabled={isRescheduling || !newScheduledDate || !newScheduledTime}
						>
							{isRescheduling ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : scheduleDialogMode === 'confirm' ? (
								t('workshop.contracts.schedule_button') || 'Schedule'
							) : (
								t('my_cases.reschedule_job') || 'Reschedule'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showCancelDialog} onOpenChange={(open) => { if (!open) handleCancelDialogClose() }}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('workshop.contracts.cancel_contract') || 'Cancel Contract'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center mb-0">
							{t('workshop.contracts.cancel_confirm') || 'Are you sure you want to cancel this contract? This action cannot be undone.'}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-2 w-full min-w-0">
						<label className="block text-sm font-semibold text-[#05324f]">
							{t('workshop.contracts.cancellation_reason_label') || 'Reason for cancellation'}{' '}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							value={cancellationReason}
							onChange={(e) => setCancellationReason(e.target.value)}
							placeholder={t('workshop.contracts.cancel_reason_placeholder') || 'Please explain why you need to cancel this contract.'}
							className="w-full min-w-0 min-h-[100px] p-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 focus:ring-2 focus:ring-[#1B8F3E] focus:border-transparent transition-all outline-none resize-none box-border"
							required
						/>
						<p className="text-xs text-gray-400 text-center leading-relaxed px-1">
							{t('workshop.contracts.cancel_policy_note') || 'By cancelling, you agree to our'}{' '}
							<a href="https://fixa2an.se/policy" target="_blank" rel="noopener noreferrer" className="text-[#1B8F3E] hover:underline font-semibold">
								{t('workshop.contracts.cancellation_policy') || 'Cancellation Policy'}
							</a>
						</p>
					</div>

					<DialogFooter className="mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={handleCancelDialogClose}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={isCompleting}
						>
							{t('workshop.contracts.no_keep') || 'No, Keep It'}
						</Button>
						<Button
							onClick={handleCancelConfirm}
							disabled={isCompleting || !cancellationReason.trim()}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isCompleting ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : (
								t('workshop.contracts.yes_cancel') || 'Yes, Cancel'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			
		<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 overflow-hidden flex flex-col">
		<div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 lg:items-stretch">
			<div className={`flex flex-col min-h-0 h-full overflow-hidden ${expandedJobId ? 'max-lg:hidden' : ''}`}>
			<div className="mb-5 shrink-0">
				<h1 className="page-title">
					{t('workshop.panel.jobs_title')}
				</h1>
			</div>

			<div className="shrink-0 flex w-full border-b border-gray-200 mb-2 pt-2">
				{[
					['all', t('workshop.panel.filter_all'), allJobs.length],
					['today', t('workshop.panel.filter_today'), todayJobs.length],
					['tomorrow', t('workshop.panel.filter_tomorrow'), tomorrowJobs.length],
				].map(([key, label, count]) => (
					<button
						key={key}
						type="button"
						onClick={() => {
							setJobFilter(key)
							setShowAllJobs(false)
							setExpandedJobId(null)
						}}
						className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${jobFilter === key ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}
					>
						<span className="block truncate">{label} ({count})</span>
					</button>
				))}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain mt-4 space-y-3 pb-2">
				{jobPool.length === 0 ? (
					<EmptyState
						title={t('common.empty.workshop_jobs_title')}
						description={t('common.empty.workshop_jobs_desc')}
					/>
				) : (
					visibleJobs.map((offer) => {
						const job = describeJob(offer, bookings, t)
						if (!job.request) return null
						const selected = expandedJobId === String(job.offerId)
						const cardTimeline = getCaseTimeline({
							...job.request,
							bookings: job.booking ? [job.booking] : [],
							offers: [{ status: offer?.status || 'ACCEPTED' }],
						})
						const cardStatus = {
							label: flowStatusLabel(cardTimeline.status, t),
							pill: cardTimeline.status === 'closed' || cardTimeline.status === 'ready' || cardTimeline.status === 'pickup'
								? 'bg-[#ECFDF5] text-[#1B8F3E] border-[#86EFAC]'
								: cardTimeline.status === 'expired'
									? 'bg-gray-50 text-gray-500 border-gray-200'
									: cardTimeline.status === 'new' || cardTimeline.status === 'offers'
										? 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
										: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
						}
						const shortId = String(job.request._id || job.request.id || '').slice(-4).toUpperCase()
						return (
							<button
								key={job.offerId}
								type="button"
								onClick={() => setExpandedJobId(String(job.offerId))}
								className={`w-full text-left rounded-2xl border bg-white p-4 flex items-center gap-3 transition-colors ${
									selected ? 'border-[#1B8F3E] bg-[#F0F7F2]' : 'border-gray-100 hover:border-gray-200'
								}`}
							>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] text-gray-400 mb-2">{t('my_cases.flow.case_no', { id: shortId })}</p>
									<p className="font-bold text-brand-dark text-[15px] leading-snug line-clamp-2">{getCaseTitle(job.request)}</p>
									<p className="text-sm text-[#374151] mt-1">{getVehicleLine(job.request)}</p>
									<p className="text-xs text-[#6B7280] mt-2">{jobUpdatedLabel(job, t, i18n.language)}</p>
								</div>
								<div className="shrink-0 self-stretch relative flex items-center pl-1 min-w-[5.5rem]">
									<span className={`absolute top-0 right-0 whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cardStatus.pill}`}>{cardStatus.label}</span>
									<ChevronRight className="w-5 h-5 text-brand-dark ml-auto" />
								</div>
							</button>
						)
					})
				)}
			</div>
			{!showAllJobs && jobPool.length > 4 && (
				<button
					type="button"
					onClick={() => setShowAllJobs(true)}
					className="shrink-0 w-full mt-4 min-h-[52px] rounded-xl border border-[#1B8F3E] bg-white text-sm font-semibold text-[#1B8F3E] hover:bg-[#F3FBF6]"
				>
					{t('workshop.panel.view_all')}
				</button>
			)}
			</div>

			<div className={expandedJobId ? 'min-w-0 min-h-0 h-full overflow-y-auto no-scrollbar overscroll-contain' : 'hidden lg:block min-w-0 h-full'}>
				{selectedJob?.request ? (
					<OngoingJobDetail
						t={t}
						offer={selectedOffer}
						job={selectedJob}
						updating={updatingBookingId === (selectedJob.booking?._id || selectedJob.booking?.id)}
						onBack={() => setExpandedJobId(null)}
						onAdvance={() => handleStatusAdvance(selectedJob.booking, selectedJob.repairAction.next, selectedOffer?.price)}
						onExtra={() => openExtraApprovalDialog(selectedJob.booking)}
						onReschedule={() => handleRescheduleClick(selectedOffer)}
						onSchedule={() => handleConfirmClick(selectedOffer)}
						onCancel={() => handleCancelClick(selectedJob.offerId)}
					/>
				) : (
					<div className="min-h-[280px] flex items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 text-center">
						<p className="text-sm text-[#9CA3AF]">{t('workshop.panel.select_case')}</p>
					</div>
				)}
			</div>
		</div>
		</div>

			{/* Extra Approval Dialog */}
			<Dialog
				open={showExtraApprovalDialog}
				onOpenChange={(open) => {
					setShowExtraApprovalDialog(open)
					if (!open) setBookingForExtraApproval(null)
				}}
			>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('workshop.contracts.extra_approval.title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('workshop.contracts.extra_approval.description')}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-3 w-full min-w-0">
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('workshop.contracts.extra_approval.description_label')}
							</Label>
							<textarea
								value={extraApprovalDescription}
								onChange={(e) => setExtraApprovalDescription(e.target.value)}
								placeholder={t('workshop.contracts.extra_approval.description_placeholder')}
								className="w-full min-h-[88px] p-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 focus:ring-2 focus:ring-[#1B8F3E] focus:border-transparent transition-all outline-none resize-none"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('workshop.contracts.extra_approval.price_label')}
							</Label>
							<Input
								type="number"
								min="1"
								step="1"
								value={extraApprovalPrice}
								onChange={(e) => setExtraApprovalPrice(e.target.value)}
								placeholder="0"
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
					</div>

					<DialogFooter className="mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setShowExtraApprovalDialog(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={isSubmittingExtraApproval}
						>
							{t('common.cancel')}
						</Button>
						<Button
							onClick={handleExtraApprovalSubmit}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95"
							disabled={isSubmittingExtraApproval || !extraApprovalDescription.trim() || !extraApprovalPrice}
						>
							{isSubmittingExtraApproval ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : (
								t('workshop.contracts.extra_approval.submit')
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Contact Customer Modal */}
			<Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
				<DialogContent
					onClose={() => setContactModalOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					{selectedCustomerContact && (
						<>
							<DialogHeader className="text-center items-center sm:text-center">
								<DialogTitle className="text-xl sm:text-2xl font-bold text-[#05324f] leading-tight text-center w-full">
									{selectedCustomerContact.name || t('common.customer')}
								</DialogTitle>
							</DialogHeader>

							<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
								<Button
									variant="outline"
									disabled={!selectedCustomerContact.email}
									onClick={() => {
										if (!selectedCustomerContact.email) {
											toast.error(t('my_cases.contact_unavailable'))
											return
										}
										window.location.href = `mailto:${selectedCustomerContact.email}`
										setContactModalOpen(false)
									}}
									className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm disabled:opacity-40"
								>
									{t('my_cases.contact_via_mail')}
								</Button>
								<Button
									disabled={!selectedCustomerContact.phone}
									onClick={() => {
										if (!selectedCustomerContact.phone) {
											toast.error(t('my_cases.contact_unavailable'))
											return
										}
										window.location.href = `tel:${stripSwedishPhoneForTel(selectedCustomerContact.phone)}`
										setContactModalOpen(false)
									}}
									className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
								>
									{t('my_cases.contact_via_call')}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

		</div>
		</WorkshopShell>
	)
}
