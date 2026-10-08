import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Check, MapPin, MessageCircle, ShieldCheck, ChevronRight } from 'lucide-react'
import carReadyIcon from '../../assets/car-ready.png'
import { useTranslation } from 'react-i18next'
import { useRegisterMobileBack } from '../../context/MobileBackContext'
import WorkshopImage from '../WorkshopImage'
import CustomerWorkshopProfile from '../workshop/CustomerWorkshopProfile'
import ExtraActionCard, { approvedBookingExtras, pendingBookingExtras } from './ExtraActionCard'
import { formatPrice } from '../../utils/cn'
import { getCaseId, getCaseTitle, getVehicleLine } from './caseHelpers'

function viewFromStatus(statusKey) {
	if (statusKey === 'pickup') return 'pickup'
	if (statusKey === 'ready') return 'ready'
	if (statusKey === 'repair') return 'progress'
	return 'received'
}

function todayHours(workshop) {
	const raw = workshop?.openingHours
	if (!raw) return null
	try {
		const hours = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!hours || typeof hours !== 'object') return null
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
		const today = hours[days[new Date().getDay()]]
		if (!today) return null
		const open = today.open || today.opens || ''
		const close = today.close || today.closes || ''
		if (!open && !close) return null
		return { open, close }
	} catch {
		return null
	}
}

function formatReadyWhen(value, locale) {
	const date = value ? new Date(value) : new Date()
	if (Number.isNaN(date.getTime())) return { day: '', time: '' }
	const now = new Date()
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diff = Math.round((startToday - start) / 86400000)
	const day =
		diff === 0
			? `${locale === 'sv' ? 'Idag' : 'Today'}, ${date.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
			: date.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
	const time = date.toLocaleTimeString(locale === 'sv' ? 'sv-SE' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
	return { day, time }
}

function mapsUrl(address, name) {
	const query = [name, address].filter(Boolean).join(', ')
	if (!query) return null
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function workshopOf(booking) {
	const mapped = booking?.workshop && typeof booking.workshop === 'object' ? booking.workshop : {}
	const populated = booking?.workshopId && typeof booking.workshopId === 'object' ? booking.workshopId : {}
	const rawId = booking?.workshopId && typeof booking.workshopId !== 'object' ? booking.workshopId : null
	const id = mapped._id || mapped.id || populated._id || populated.id || rawId || null
	return { ...populated, ...mapped, _id: id, id }
}

function addressLine(workshop) {
	const street = typeof workshop?.address === 'string' ? workshop.address.trim() : ''
	const rest = [workshop?.postalCode, workshop?.city].filter(Boolean).join(' ')
	return [street, rest].filter(Boolean).join(', ')
}

const btn = 'w-full min-h-[52px] bg-brand-btn text-white rounded-lg font-semibold flex items-center justify-center'

export default function RepairFlow({ request, booking, statusKey, onBack, onComplete, onContact, onExtraDecision, onShowDetails, suspendBack = false }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const [view, setView] = useState(() => viewFromStatus(statusKey))
	const workshop = workshopOf(booking)
	const name = workshop.companyName || t('offers_page.workshop')
	const address = addressLine(workshop)
	const title = getCaseTitle(request)
	const vehicle = getVehicleLine(request)
	const shortId = String(getCaseId(request)).slice(-4).toUpperCase()
	const pending = (booking?.extraApprovals || []).filter((e) => e.status === 'PENDING')
	const workshopId = workshop._id || workshop.id
	const statusView = viewFromStatus(statusKey)

	// Sync when workshop advances READY → completed (pickup confirm)
	useEffect(() => {
		setView((current) => {
			if (current === 'workshop' || current === 'messages') return current
			return statusView
		})
	}, [statusView])

	const backToStatus = () => setView(statusView)

	const mobileBack =
		view === 'workshop' || view === 'messages'
			? backToStatus
			: onBack || null
	useRegisterMobileBack(mobileBack, Boolean(mobileBack) && !suspendBack)

	if (view === 'workshop') {
		return (
			<CustomerWorkshopProfile
				workshop={workshop}
				onBack={backToStatus}
				onOpenReviews={() => {
					if (!workshopId) return
					navigate(`/workshop/${workshopId}/reviews`, { state: { workshopName: name } })
				}}
			/>
		)
	}

	if (view === 'messages') {
		return (
			<MessagesScreen
				t={t}
				workshop={workshop}
				name={name}
				pending={pending}
				booking={booking}
				onExtraDecision={onExtraDecision}
				onBack={backToStatus}
			/>
		)
	}

	// 1) Workshop marked ready for pickup (before mark completed)
	if (statusKey === 'ready') {
		return (
			<ReadyForPickupScreen
				t={t}
				locale={i18n.language}
				workshop={workshop}
				name={name}
				address={address}
				booking={booking}
				onContact={() => onContact?.(booking)}
				onShowDetails={() => onShowDetails?.()}
			/>
		)
	}

	// 2) Workshop marked completed → customer confirms "I have picked up the car"
	if (statusKey === 'pickup') {
		return (
			<PickupScreen
				t={t}
				workshop={workshop}
				name={name}
				address={address}
				title={title}
				vehicle={vehicle}
				onDone={() => onComplete?.(booking)}
				onCall={() => onContact?.(booking)}
				onShowDetails={() => onShowDetails?.()}
				onWorkshop={() => setView('workshop')}
			/>
		)
	}

	if (view === 'progress' || statusKey === 'repair') {
		return (
			<ProgressScreen
				t={t}
				shortId={shortId}
				title={title}
				vehicle={vehicle}
				booking={booking}
				statusKey={statusKey}
				pendingExtras={pendingBookingExtras(booking)}
				approvedExtras={approvedBookingExtras(booking)}
				onExtraDecision={onExtraDecision}
				onMessages={() => setView('messages')}
				onShowDetails={() => onShowDetails?.()}
			/>
		)
	}

	return (
		<ReceivedScreen
			t={t}
			workshop={workshop}
			name={name}
			address={address}
			pendingExtras={pendingBookingExtras(booking)}
			onExtraDecision={onExtraDecision}
			onCases={onBack}
			onWorkshop={() => setView('workshop')}
		/>
	)
}

function ReceivedScreen({ t, workshop, name, address, pendingExtras, onExtraDecision, onCases, onWorkshop }) {
	return (
		<div className="w-full max-w-md mx-auto">
			<div className="text-center pt-2 mb-6">
				<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E8F5EC] flex items-center justify-center">
					<Check className="w-8 h-8 text-[#008037]" strokeWidth={2.5} />
				</div>
				<h1 className="page-title !mb-2 text-center">{t('my_cases.flow.repair_received_title')}</h1>
				<p className="text-sm text-[#6B7280] leading-relaxed text-center max-w-[300px] mx-auto">
					{t('my_cases.flow.repair_received_body')}
				</p>
			</div>
			<button
				type="button"
				onClick={onWorkshop}
				className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3 text-left mb-4"
			>
				<div className="w-11 h-11 rounded-full overflow-hidden bg-[#0B2540] shrink-0">
					<WorkshopImage workshop={workshop} className="w-full h-full" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold text-[#05324f]">{name}</p>
					{address ? <p className="text-xs text-[#6B7280] mt-0.5 truncate">{address}</p> : null}
					<p className="text-sm font-semibold text-[#008037] mt-1">{t('my_cases.flow.repair_show_workshop')}</p>
				</div>
				<ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
			</button>
			{pendingExtras?.length > 0 && (
				<div className="space-y-3 mb-4">
					{pendingExtras.map((extra) => (
						<ExtraActionCard key={extra.index} extra={extra} onDecide={onExtraDecision} />
					))}
				</div>
			)}
			<div className="rounded-2xl bg-[#F3FBF6] px-4 py-3.5 mb-6">
				<p className="text-sm font-bold text-[#05324f] mb-1">{t('my_cases.flow.repair_next')}</p>
				<p className="text-sm text-[#05324f] leading-relaxed">{t('my_cases.flow.repair_next_body')}</p>
				<p className="text-sm text-[#6B7280] mt-2">{t('my_cases.flow.repair_updates')}</p>
			</div>
			<button type="button" onClick={onCases} className={btn}>
				{t('my_cases.flow.repair_to_cases')}
			</button>
		</div>
	)
}

function ProgressScreen({ t, shortId, title, vehicle, booking, statusKey, pendingExtras, approvedExtras, onExtraDecision, onMessages, onShowDetails }) {
	const steps = [
		{ key: 'received', label: t('my_cases.flow.repair_step_received'), done: true },
		{ key: 'work', label: t('my_cases.flow.repair_step_work'), done: true },
		{ key: 'quality', label: t('my_cases.flow.repair_step_quality'), done: false },
		{ key: 'ready', label: t('my_cases.flow.repair_step_ready'), done: statusKey === 'ready' || statusKey === 'pickup' || statusKey === 'closed' },
		{ key: 'closed', label: t('my_cases.flow.repair_step_closed'), done: statusKey === 'closed' },
	]
	const doneCount = steps.filter((s) => s.done).length

	return (
		<div className="w-full max-w-md mx-auto">
			<h1 className="page-title">{t('my_cases.flow.repair_work_title')}</h1>
			<p className="text-sm text-[#6B7280] mb-5">{t('my_cases.flow.repair_work_body')}</p>

			<button
				type="button"
				onClick={onShowDetails}
				className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3 text-left mb-4"
			>
				<MessageCircle className="w-5 h-5 text-[#008037] shrink-0" strokeWidth={2} />
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-[#008037]">#{shortId}</p>
					<p className="text-sm font-bold text-[#05324f] leading-snug">{title}</p>
					<p className="text-xs text-[#6B7280] mt-0.5">{vehicle}</p>
				</div>
				<ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
			</button>

			{pendingExtras?.length > 0 && (
				<div className="space-y-3 mb-4">
					{pendingExtras.map((extra) => (
						<ExtraActionCard key={extra.index} extra={extra} onDecide={onExtraDecision} />
					))}
				</div>
			)}
			{approvedExtras?.length > 0 && (
				<div className="rounded-2xl border border-[#E5E7EB] p-4 mb-4 space-y-2">
					<p className="text-sm font-bold text-[#05324f]">{t('my_cases.flow.repair_extra')}</p>
					{approvedExtras.map((extra, index) => (
						<p key={extra._id || index} className="text-sm text-[#6B7280] flex justify-between gap-2">
							<span className="truncate">{extra.description}</span>
							<span className="font-semibold text-[#05324f] shrink-0">{formatPrice(extra.price)}</span>
						</p>
					))}
				</div>
			)}

			<p className="text-sm font-semibold text-[#05324f] mb-3">
				{t('my_cases.flow.repair_steps', { done: doneCount, total: steps.length })}
			</p>
			<div className="space-y-3 mb-5">
				{steps.map((step) => (
					<div key={step.key} className="flex items-center gap-3">
						<span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-[#008037]' : 'bg-[#E5E7EB]'}`}>
							{step.done ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : null}
						</span>
						<p className={`text-sm ${step.done ? 'text-[#05324f] font-medium' : 'text-[#9CA3AF]'}`}>{step.label}</p>
					</div>
				))}
			</div>

			<button type="button" onClick={onMessages} className="w-full rounded-xl bg-[#F3FBF6] px-4 py-3.5 flex items-start gap-3 text-left">
				<MessageCircle className="w-5 h-5 text-[#008037] shrink-0 mt-0.5" />
				<p className="text-sm text-[#05324f]">{t('my_cases.flow.repair_chat_note')}</p>
			</button>
		</div>
	)
}

function ReadyForPickupScreen({ t, locale, workshop, name, address, booking, onContact, onShowDetails }) {
	const hours = todayHours(workshop)
	const when = formatReadyWhen(booking?.updatedAt || booking?.scheduledAt || booking?.createdAt, locale)
	const directions = mapsUrl(address, name)
	const btnOutline =
		'w-full min-h-[52px] rounded-lg font-semibold flex items-center justify-center border border-[#9AD4B0] text-[#008037] bg-white'

	return (
		<div className="w-full max-w-md mx-auto px-4 sm:px-5">
			<div className="text-center pt-2 mb-6">
				<img src={carReadyIcon} alt="" className="w-[140px] h-[140px] mx-auto mb-4 object-contain" />
				<h1 className="page-title !mb-2 text-center">{t('my_cases.flow.repair_ready_title')}</h1>
				<p className="text-sm text-[#6B7280] leading-relaxed text-center max-w-[280px] mx-auto">
					{t('my_cases.flow.repair_ready_body')}
				</p>
			</div>

			<div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden mb-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
				<div className="px-4 pt-4 pb-1">
					<p className="text-sm font-bold text-[#05324f]">{t('my_cases.flow.repair_at_workshop')}</p>
				</div>
				<div className="px-4 py-3 flex items-start gap-3">
					<Calendar className="w-5 h-5 text-[#008037] shrink-0 mt-0.5" strokeWidth={1.75} />
					<div className="min-w-0">
						<p className="text-sm font-semibold text-[#05324f] leading-snug">{when.day}</p>
						{when.time ? <p className="text-sm text-[#6B7280] mt-0.5">{when.time}</p> : null}
					</div>
				</div>
				<div className="px-4 py-3 flex items-start gap-3 border-t border-[#F3F4F6]">
					<MapPin className="w-5 h-5 text-[#008037] shrink-0 mt-0.5" strokeWidth={1.75} />
					<div className="min-w-0">
						<p className="text-sm font-bold text-[#05324f] leading-snug">{name}</p>
						{address ? <p className="text-sm text-[#6B7280] mt-0.5 leading-snug">{address}</p> : null}
						{directions ? (
							<a
								href={directions}
								target="_blank"
								rel="noreferrer"
								className="inline-block text-sm font-semibold text-[#008037] mt-1.5"
							>
								{t('my_cases.flow.repair_directions')}
							</a>
						) : null}
					</div>
				</div>
				{hours ? (
					<div className="mx-4 mb-4 mt-1 rounded-xl bg-[#E8F5EC] px-3.5 py-3">
						<p className="text-sm font-bold text-[#05324f]">{t('my_cases.flow.repair_open_today')}</p>
						<p className="text-sm text-[#05324f] mt-0.5">
							{[hours.open, hours.close].filter(Boolean).join(' – ')}
						</p>
					</div>
				) : null}
			</div>

			<div className="space-y-3">
				<button type="button" onClick={onShowDetails} className={btn}>
					{t('my_cases.flow.repair_view_case')}
				</button>
				<button type="button" onClick={onContact} className={btnOutline}>
					{t('my_cases.flow.repair_contact')}
				</button>
			</div>
		</div>
	)
}

function PickupScreen({ t, workshop, name, address, title, vehicle, onDone, onCall, onShowDetails, onWorkshop }) {
	const [closing, setClosing] = useState(false)
	const checks = [t('my_cases.flow.repair_pay'), t('my_cases.flow.repair_id'), t('my_cases.flow.repair_check')]
	const city = workshop?.city || workshop?.address?.city || ''
	const place = city || address
	const carLine = String(vehicle || '').replace(' · ', ' - ')

	const handleDone = async () => {
		if (closing) return
		setClosing(true)
		try {
			await onDone?.()
		} finally {
			setClosing(false)
		}
	}

	return (
		<div className="w-full max-w-md">
			<h1 className="page-title">{t('my_cases.flow.repair_pickup_title')}</h1>
			<p className="text-sm text-[#6B7280] mb-5">{t('my_cases.flow.repair_before')}</p>
			<ul className="space-y-3 mb-5">
				{checks.map((item) => (
					<li key={item} className="flex items-start gap-2.5 text-sm text-[#05324f]">
						<span className="w-5 h-5 rounded-full bg-[#008037] flex items-center justify-center shrink-0 mt-0.5">
							<Check className="w-3 h-3 text-white" strokeWidth={3} />
						</span>
						{item}
					</li>
				))}
			</ul>
			<div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden mb-4">
				<button
					type="button"
					onClick={onShowDetails}
					className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
				>
					<MessageCircle className="w-5 h-5 text-[#008037] shrink-0" strokeWidth={2} />
					<div className="min-w-0 flex-1">
						<p className="text-sm font-bold text-[#05324f] leading-snug">{title}</p>
						<p className="text-xs text-[#6B7280] mt-0.5">{carLine}</p>
					</div>
					<ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
				</button>
				<div className="border-t border-[#E5E7EB]" />
				<div className="w-full px-4 py-3.5 flex items-center gap-3">
					<button type="button" onClick={onWorkshop} className="w-11 h-11 rounded-full overflow-hidden bg-[#0B2540] shrink-0">
						<WorkshopImage workshop={workshop} className="w-full h-full" />
					</button>
					<div className="min-w-0 flex-1 text-left">
						<button type="button" onClick={onWorkshop} className="text-left w-full">
							<p className="text-sm font-bold text-[#05324f] leading-snug">{name}</p>
							{place && <p className="text-xs text-[#6B7280] mt-0.5">{place}</p>}
						</button>
						<button type="button" onClick={onCall} className="text-sm font-semibold text-[#008037] mt-1">
							{t('my_cases.flow.repair_call')}
						</button>
					</div>
					<button type="button" onClick={onWorkshop} aria-label={name} className="shrink-0 p-1">
						<ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
					</button>
				</div>
			</div>
			<div className="rounded-2xl bg-[#F3FBF6] px-4 py-3.5 flex items-start gap-3 mb-6">
				<ShieldCheck className="w-5 h-5 text-[#008037] shrink-0 mt-0.5" />
				<p className="text-sm text-[#05324f] leading-relaxed">{t('my_cases.flow.repair_thanks')}</p>
			</div>
			<button type="button" onClick={handleDone} disabled={closing} className={`${btn} disabled:opacity-60`}>
				{closing ? (t('common.loading') || '…') : t('my_cases.flow.repair_picked')}
			</button>
		</div>
	)
}

function MessagesScreen({ t, workshop, name, pending, booking, onExtraDecision, onBack }) {
	return (
		<div className="w-full">
			<button type="button" onClick={onBack} className="hidden lg:inline-flex text-sm font-semibold text-[#008037] mb-4">{t('common.back')}</button>
			<div className="flex items-center gap-3 mb-4">
				<div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3F4F6]">
					<WorkshopImage workshop={workshop} className="w-full h-full" />
				</div>
				<p className="text-sm font-bold text-[#05324f]">{name}</p>
			</div>
			{pending.length === 0 ? (
				<p className="text-sm text-[#6B7280]">{t('my_cases.flow.repair_chat_note')}</p>
			) : (
				<div className="space-y-3">
					<h2 className="text-base font-bold text-[#05324f]">{t('my_cases.flow.repair_extra')}</h2>
					{pending.map((extra, index) => (
						<div key={extra._id || index} className="rounded-2xl border border-gray-100 p-4">
							<p className="text-sm text-[#05324f] mb-1">{extra.description}</p>
							<p className="text-sm font-bold text-[#05324f] mb-3">{extra.price} kr</p>
							<div className="flex gap-2">
								<button type="button" onClick={() => onExtraDecision?.(booking, index, 'DECLINED')} className="flex-1 h-10 border border-[#008037] text-[#008037] rounded-lg text-sm font-semibold">
									{t('my_cases.flow.repair_decline')}
								</button>
								<button type="button" onClick={() => onExtraDecision?.(booking, index, 'APPROVED')} className="flex-1 h-10 bg-brand-btn text-white rounded-lg text-sm font-semibold">
									{t('my_cases.flow.repair_approve')}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
