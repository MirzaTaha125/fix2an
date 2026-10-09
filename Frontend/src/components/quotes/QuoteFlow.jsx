import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
	ArrowLeft,
	Check,
	Star,
	MapPin,
	Clock,
	Lock,
	Car,
	Shield,
	Info,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRegisterMobileBack } from '../../context/MobileBackContext'
import { formatPrice } from '../../utils/cn'
import EmptyState from '../ui/EmptyState'
import WorkshopImage from '../WorkshopImage'
import CustomerWorkshopProfile from '../workshop/CustomerWorkshopProfile'
import CaseChat from '../cases/CaseChat'
import quotesReceivedIcon from '../../assets/quotes-received.png'

function offerRequestId(offer) {
	const raw = offer?.requestId
	if (!raw) return null
	if (typeof raw === 'string') return raw
	return raw._id || raw.id || null
}

function offerWorkshopId(offer) {
	const raw = offer?.workshop || offer?.workshopId
	if (!raw) return null
	if (typeof raw === 'string') return raw
	return raw._id || raw.id || null
}

function hasLoaner(offer) {
	if (typeof offer?.loanerCar === 'boolean') return offer.loanerCar
	const text = `${offer?.inclusions || ''} ${offer?.note || ''} ${offer?.warranty || ''}`.toLowerCase()
	return /lånebil|loaner|loan car|replacement car|courtesy/.test(text)
}

function hasOriginalParts(offer) {
	if (typeof offer?.originalParts === 'boolean') return offer.originalParts
	const text = `${offer?.inclusions || ''} ${offer?.note || ''}`.toLowerCase()
	return /original|oem|genuine/.test(text)
}

function durationLabel(offer, t) {
	const raw = Number(offer?.estimatedDuration)
	if (!raw) return '—'
	// Workshops enter minutes (e.g. 120). Small values are already hours.
	const hours = raw >= 15 ? raw / 60 : raw
	if (hours <= 2) return `1–2 ${t('quotes.flow.hours')}`
	if (hours <= 3) return `2–3 ${t('quotes.flow.hours')}`
	if (hours <= 4) return `3–4 ${t('quotes.flow.hours')}`
	if (hours <= 5) return `4–5 ${t('quotes.flow.hours')}`
	const rounded = Math.max(1, Math.round(hours))
	return `${rounded} ${t('quotes.flow.hours')}`
}

function parseInclusions(offer) {
	const raw = (offer?.inclusions || '').trim()
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw)
		if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
	} catch {
		/* plain text */
	}
	return raw
		.split(/[\n|;]+/)
		.map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim())
		.filter(Boolean)
}

function workshopOf(offer) {
	return offer?.workshop || offer?.workshopId || {}
}

function ratingOf(offer) {
	const w = workshopOf(offer)
	return Number(w.rating ?? w.averageRating ?? 0)
}

function reviewCountOf(offer) {
	const w = workshopOf(offer)
	return Number(w.reviewCount ?? w.reviewsCount ?? 0)
}

function openHoursLabel(workshop, t) {
	if (workshop?.openUntil) return t('quotes.flow.open_until', { time: workshop.openUntil })
	const raw = workshop?.openingHours
	if (!raw) return t('quotes.flow.open_default')
	try {
		const hours = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!hours || typeof hours !== 'object' || Array.isArray(hours)) {
			return typeof raw === 'string' && !raw.trim().startsWith('{') ? raw : t('quotes.flow.open_default')
		}
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
		const today = hours[days[new Date().getDay()]]
		const close = today?.close || today?.closes
		if (close) return t('quotes.flow.open_until', { time: close })
		const first = days.map((day) => hours[day]?.close || hours[day]?.closes).find(Boolean)
		if (first) return t('quotes.flow.open_until', { time: first })
	} catch {
		if (typeof raw === 'string' && !raw.trim().startsWith('{')) return raw
	}
	return t('quotes.flow.open_default')
}

function YesNo({ yes }) {
	const { t } = useTranslation()
	return yes ? (
		<span className="text-[#1B8F3E] font-semibold text-sm">{t('common.yes')}</span>
	) : (
		<span className="text-[#05324f] font-semibold text-sm">{t('common.no')}</span>
	)
}

const btnPrimary =
	'w-full min-h-[52px] bg-brand-btn text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60'
const btnSecondary =
	'w-full min-h-[52px] border-[1.5px] border-[#1B8F3E] text-[#1B8F3E] rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors'

export default function QuoteFlow({
	offers = [],
	requestId: requestIdProp = null,
	onConfirm,
	onContact,
	onOpenReviews,
	onExit,
	confirming = false,
}) {
	const { t } = useTranslation()
	const [step, setStep] = useState('list')
	const [selected, setSelected] = useState(null)
	const [highlightId, setHighlightId] = useState(null)

	const sorted = useMemo(
		() =>
			[...offers]
				.filter((o) => o.status !== 'CANCELLED')
				.sort((a, b) => (a.price || 0) - (b.price || 0)),
		[offers]
	)

	const cheapestId = sorted[0]?._id || sorted[0]?.id
	const activeId = highlightId || cheapestId
	const active = selected || sorted.find((o) => (o._id || o.id) === activeId) || sorted[0] || null
	const activeRequestId = requestIdProp || offerRequestId(active)
	const activeWorkshopId = offerWorkshopId(active)
	const activeWorkshop = workshopOf(active)

	const goDetail = (offer) => {
		setSelected(offer)
		setHighlightId(offer._id || offer.id)
		setStep('detail')
	}

	const goConfirm = (offer) => {
		setSelected(offer)
		setStep('confirm')
	}

	const goChat = (offer) => {
		setSelected(offer)
		const workshopId = offerWorkshopId(offer)
		const requestId = requestIdProp || offerRequestId(offer)
		if (workshopId && requestId) {
			setStep('chat')
			return
		}
		onContact?.(offer)
	}

	const mobileBack =
		step === 'list'
			? onExit || null
			: step === 'workshop' || step === 'confirm' || step === 'chat'
				? () => setStep('detail')
				: () => setStep('list')
	useRegisterMobileBack(
		mobileBack,
		Boolean(mobileBack),
		step === 'chat' && activeWorkshop
			? { title: activeWorkshop.companyName || t('offers_page.workshop'), avatar: activeWorkshop.logo || null }
			: null
	)

	const exitButton = onExit ? (
		<button
			type="button"
			onClick={onExit}
			className="mb-2 -ml-1 p-1 text-[#12244C] hover:opacity-70 max-lg:hidden"
			aria-label={t('common.back')}
		>
			<ArrowLeft className="w-5 h-5" strokeWidth={2} />
		</button>
	) : null

	if (sorted.length === 0) {
		return (
			<div>
				{exitButton}
				<EmptyState
					title={t('common.empty.offers_title')}
					description={t('common.empty.offers_desc')}
					actionLabel={t('navigation.create_case')}
					actionTo="/upload"
				/>
			</div>
		)
	}

	if (step === 'compare') {
		return (
			<CompareStep
				offers={sorted.slice(0, 3)}
				cheapestId={cheapestId}
				onBack={() => setStep('list')}
				onShowDetails={() => goDetail(active || sorted[0])}
			/>
		)
	}

	if (step === 'detail' && active) {
		return (
			<DetailStep
				offer={active}
				onBack={() => setStep('list')}
				onChoose={() => goConfirm(active)}
				onContact={() => goChat(active)}
				onWorkshop={() => setStep('workshop')}
			/>
		)
	}

	if (step === 'chat' && active && activeRequestId && activeWorkshopId) {
		return (
			<div className="case-chat-root w-full min-h-[420px] h-[min(70dvh,560px)] max-lg:h-[calc(100dvh-8.5rem-var(--bottom-nav-height)-env(safe-area-inset-bottom,0px))]">
				<CaseChat
					requestId={activeRequestId}
					workshopId={activeWorkshopId}
					title={activeWorkshop.companyName || t('offers_page.workshop')}
					logo={activeWorkshop.logo}
					viewerRole="CUSTOMER"
					onBack={() => setStep('detail')}
				/>
			</div>
		)
	}

	if (step === 'workshop' && active) {
		return (
			<WorkshopStep
				offer={active}
				onBack={() => setStep('detail')}
				onShowQuote={() => setStep('detail')}
				onOpenReviews={() => onOpenReviews?.(workshopOf(active))}
			/>
		)
	}

	if (step === 'confirm' && active) {
		return (
			<ConfirmStep
				offer={active}
				confirming={confirming}
				onConfirm={() => onConfirm?.(active)}
				onBack={() => setStep('detail')}
			/>
		)
	}

	return (
		<div className="w-full">
			{exitButton}
			<div className="pb-[9.5rem] lg:pb-0">
				<div className="text-center mb-5 pt-1 max-w-[360px] mx-auto lg:max-w-none">
					<img
						src={quotesReceivedIcon}
						alt=""
						className="w-[108px] h-[108px] mx-auto mb-0.5 object-contain"
					/>
					<h1 className="text-[1.55rem] font-bold leading-[1.2] tracking-tight mb-2">
						<span className="block text-[#12244C] lg:inline">{t('quotes.flow.received_lead')}</span>
						<span className="block text-[#1B8F3E] lg:inline lg:ml-2">
							{sorted.length === 1
								? t('quotes.flow.received_count_one')
								: t('quotes.flow.received_count', { count: sorted.length })}
						</span>
					</h1>
					<p className="text-sm text-[#6B7280] leading-snug max-w-[220px] mx-auto lg:max-w-none lg:whitespace-nowrap">
						{t('quotes.flow.received_subtitle')}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-3 mb-5 lg:grid-cols-2 lg:gap-4">
					{sorted.map((offer) => {
						const id = offer._id || offer.id
						const workshop = workshopOf(offer)
						const isSelected = activeId === id
						const rating = ratingOf(offer)
						const reviews = reviewCountOf(offer)
						const rawWarranty = (offer.warranty || t('quotes.flow.warranty_default')).trim()
						const warranty = /garanti|warranty/i.test(rawWarranty)
							? rawWarranty
							: t('quotes.flow.warranty_line', { value: rawWarranty })
						const meta = `${hasLoaner(offer) ? t('quotes.flow.compare_loaner') : t('quotes.flow.no_loaner')} · ${warranty}`

						return (
							<button
								key={id}
								type="button"
								onClick={() => {
									if (isSelected) {
										goDetail(offer)
									} else {
										setHighlightId(id)
										setSelected(offer)
									}
								}}
							className={`w-full text-left rounded-xl px-3 py-2.5 bg-white transition-colors ${
								isSelected
									? 'border-2 border-[#1B8F3E]'
									: 'border border-[#E5E7EB] hover:border-gray-300'
							}`}
						>
							<div className="flex gap-2.5 items-start">
								<div className="w-9 h-9 rounded-full overflow-hidden bg-[#F3F4F6] shrink-0">
									<WorkshopImage workshop={workshop} className="w-full h-full" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm font-bold text-[#05324f] leading-snug truncate">
											{workshop.companyName || t('offers_page.workshop')}
										</p>
										<p className="text-sm font-bold text-[#05324f] whitespace-nowrap tabular-nums">
											{formatPrice(offer.price)}
										</p>
									</div>

									<div className="flex items-center justify-between gap-2 mt-0.5">
										<span className="inline-flex items-center gap-1 text-xs text-[#6B7280] min-w-0">
											<Star className="w-3 h-3 text-[#FFB800] fill-[#FFB800] shrink-0" />
											<span className="font-semibold text-[#05324f]">{rating.toFixed(1)}</span>
											{reviews > 0 && (
												<span className="truncate">
													({reviews} {t('quotes.flow.review_word')})
												</span>
											)}
										</span>
										{offer.distance != null && (
											<span className="inline-flex items-center gap-1 text-xs text-[#6B7280] shrink-0">
												<MapPin className="w-3 h-3 text-[#1B8F3E]" />
												{Number(offer.distance).toFixed(1).replace('.', ',')} km
											</span>
										)}
									</div>

									<p className="mt-1 text-xs text-[#6B7280] leading-snug">{meta}</p>
								</div>
							</div>
						</button>
						)
					})}
				</div>
			</div>

			<div className="fixed inset-x-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-2 max-lg:bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:static lg:border-0 lg:px-0 lg:pt-2 lg:pb-0">
				<div className="max-w-md mx-auto lg:max-w-none">
					<button type="button" onClick={() => setStep('compare')} className={`${btnPrimary} !rounded-xl px-2 text-center w-full`}>
						{t('quotes.flow.compare_button')}
					</button>
					<Link
						to="/how-it-works"
						className="mt-2 w-full flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#1B8F3E] py-1.5"
					>
						<span className="w-4 h-4 rounded-full border border-[#1B8F3E] flex items-center justify-center shrink-0">
							<Info className="w-2.5 h-2.5" strokeWidth={2.5} />
						</span>
						{t('quotes.flow.how_it_works')}
					</Link>
				</div>
			</div>
		</div>
	)
}

function CompareStep({ offers, cheapestId, onBack, onShowDetails }) {
	const { t } = useTranslation()
	const rows = [
		{
			label: t('quotes.flow.compare_price'),
			render: (o) => {
				const isCheapest = (o._id || o.id) === cheapestId
				return (
					<span className={`font-bold text-[13px] ${isCheapest ? 'text-[#1B8F3E]' : 'text-[#05324f]'}`}>
						{formatPrice(o.price)}
					</span>
				)
			},
		},
		{
			label: t('quotes.flow.compare_time'),
			render: (o) => <span className="text-[13px] font-medium text-[#05324f]">{durationLabel(o, t)}</span>,
		},
		{
			label: t('quotes.flow.compare_warranty'),
			render: (o) => (
				<span className="text-[13px] font-medium text-[#05324f]">{o.warranty || t('quotes.flow.warranty_default')}</span>
			),
		},
		{
			label: t('quotes.flow.compare_loaner'),
			render: (o) => <YesNo yes={hasLoaner(o)} />,
		},
		{
			label: t('quotes.flow.compare_parts'),
			render: (o) => <YesNo yes={hasOriginalParts(o)} />,
		},
		{
			label: t('quotes.flow.compare_rating'),
			render: (o) => {
				const reviews = reviewCountOf(o)
				return (
					<span className="text-[13px] font-semibold text-[#05324f]">
						{ratingOf(o).toFixed(1)}
						{reviews > 0 ? ` (${reviews})` : ''}
					</span>
				)
			},
		},
		{
			label: t('quotes.flow.compare_distance'),
			render: (o) => (
				<span className="text-[13px] font-medium text-[#05324f]">
					{o.distance != null ? `${Number(o.distance).toFixed(1).replace('.', ',')} km` : '—'}
				</span>
			),
		},
	]

	return (
		<div className="w-full max-w-md mx-auto lg:max-w-6xl">
			<button type="button" onClick={onBack} className="mb-5 -ml-1 p-1 text-[#05324f] hover:opacity-70 max-lg:hidden" aria-label={t('common.back')}>
				<ArrowLeft className="w-5 h-5" strokeWidth={2} />
			</button>
			<h1 className="page-title">{t('quotes.flow.compare_title')}</h1>
			<p className="text-sm text-[#6B7280] mb-5">{t('quotes.flow.compare_subtitle')}</p>

			<div className="overflow-x-auto no-scrollbar">
				<table className="border-collapse rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white table-auto">
					<thead>
						<tr>
							<th className="border-b border-[#EEF0F4] bg-white p-0 w-px whitespace-nowrap" />
							{offers.map((o) => (
								<th
									key={o._id || o.id}
									className="border-b border-l border-[#EEF0F4] bg-white px-3 pt-3 pb-2.5 text-center whitespace-nowrap"
								>
									<div className="w-10 h-10 mx-auto rounded-full overflow-hidden bg-[#F3F4F6] mb-1.5">
										<WorkshopImage workshop={workshopOf(o)} className="w-full h-full" />
									</div>
									<p className="text-[12px] font-bold text-[#05324f] leading-tight">
										{workshopOf(o).companyName || t('offers_page.workshop')}
									</p>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, rowIndex) => {
							const isLast = rowIndex === rows.length - 1
							return (
								<tr key={row.label}>
									<td
										className={`pl-3 pr-2 py-0 h-11 align-middle text-left whitespace-nowrap ${
											isLast ? '' : 'border-b border-[#EEF0F4]'
										}`}
									>
										<span className="text-[12px] font-medium text-[#05324f] leading-snug">
											{row.label}
										</span>
									</td>
									{offers.map((o) => (
										<td
											key={`${row.label}-${o._id || o.id}`}
											className={`px-3 py-0 h-11 align-middle text-center whitespace-nowrap border-l border-[#EEF0F4] ${
												isLast ? '' : 'border-b border-[#EEF0F4]'
											}`}
										>
											{row.render(o)}
										</td>
									))}
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			<button type="button" onClick={onShowDetails} className={`${btnPrimary} !rounded-xl mt-8`}>
				{t('quotes.flow.show_details')}
			</button>
		</div>
	)
}

function DetailStep({ offer, onBack, onChoose, onContact, onWorkshop }) {
	const { t } = useTranslation()
	const workshop = workshopOf(offer)
	const inclusions = parseInclusions(offer)
	const gallery = Array.isArray(workshop.images) ? workshop.images : []
	const photos = gallery.slice(0, 3)
	const extraPhotos = Math.max(0, gallery.length - 3)
	const rating = ratingOf(offer)
	const reviews = reviewCountOf(offer)
	const priceNumber = new Intl.NumberFormat('sv-SE', {
		maximumFractionDigits: 0,
	}).format(Number(offer.price) || 0)

	return (
		<div className="w-full">
			<div className="pb-[9.5rem] lg:pb-0">
			<button type="button" onClick={onBack} className="mb-4 -ml-1 p-1 text-[#05324f] hover:opacity-70 max-lg:hidden" aria-label={t('common.back')}>
				<ArrowLeft className="w-5 h-5" />
			</button>

			<div className="flex items-start gap-3 mb-5">
				<div className="w-14 h-14 rounded-full overflow-hidden bg-[#12244C] shrink-0">
					<WorkshopImage workshop={workshop} className="w-full h-full" />
				</div>
				<div className="min-w-0 flex-1 pt-0.5">
					<p className="text-[15px] font-bold text-[#05324f] truncate">
						{workshop.companyName || t('offers_page.workshop')}
					</p>
					<p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1.5 flex-wrap">
						<span className="font-semibold text-[#05324f]">{rating.toFixed(1)}</span>
						<Star className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800] shrink-0" />
						{reviews > 0 && (
							<span>({reviews} {t('offers_page.reviews')})</span>
						)}
					</p>
					<p className="text-[13px] text-[#6B7280] mt-1 leading-snug">
						{offer.distance != null && (
							<>{t('quotes.flow.km_away', { km: Number(offer.distance).toFixed(1).replace('.', ',') })} · </>
						)}
						{openHoursLabel(workshop, t)}
					</p>
					<button
						type="button"
						onClick={onWorkshop}
						className="mt-1.5 text-[13px] font-semibold text-[#1B8F3E]"
					>
						{t('quotes.flow.view_profile')}
					</button>
				</div>
			</div>

			<div className="rounded-2xl bg-[#F3F5F7] px-4 py-4 mb-6 flex items-center justify-between gap-4">
				<div className="min-w-0">
					<p className="text-[1.75rem] font-bold text-[#05324f] leading-none tabular-nums">{priceNumber}</p>
					<p className="text-sm text-[#6B7280] mt-1.5">{t('quotes.flow.price_amount_label')}</p>
				</div>
				<div className="text-right shrink-0">
					<p className="text-sm text-[#6B7280]">{t('quotes.flow.compare_time')}</p>
					<p className="text-base font-bold text-[#05324f] mt-1">{durationLabel(offer, t)}</p>
				</div>
			</div>

			<section className="mb-6">
				<h2 className="text-base font-bold text-[#05324f] mb-3">{t('quotes.flow.whats_included')}</h2>
				{inclusions.length === 0 ? (
					<p className="text-sm text-[#6B7280]">—</p>
				) : (
					<ul className="space-y-3">
						{inclusions.map((item) => (
							<li key={item} className="flex items-start gap-3 text-sm text-[#05324f]">
								<span className="w-5 h-5 rounded-full border-[1.5px] border-[#1B8F3E] text-[#1B8F3E] flex items-center justify-center shrink-0 mt-0.5">
									<Check className="w-3 h-3" strokeWidth={3} />
								</span>
								<span className="leading-snug">{item}</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="mb-5">
				<h2 className="text-base font-semibold text-[#05324f] mb-2">{t('quotes.flow.about_workshop')}</h2>
				<p className="text-sm text-[#4B5563] leading-relaxed">
					{offer.note || workshop.description || workshop.about || t('quotes.flow.about_fallback')}
				</p>
			</section>

			{photos.length > 0 && (
				<section className="mb-6">
					<div className="grid grid-cols-4 gap-2">
						{photos.map((src, i) => (
							<div key={src || i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
								<img src={src} alt="" className="w-full h-full object-cover" />
							</div>
						))}
						{extraPhotos > 0 && (
							<div className="aspect-square rounded-xl bg-[#E8F0F8] flex items-center justify-center text-center text-xs font-bold text-[#05324f] px-1">
								{t('quotes.flow.more_photos', { count: extraPhotos })}
							</div>
						)}
					</div>
				</section>
			)}
			</div>

			<div className="fixed inset-x-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-2 max-lg:bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:static lg:border-0 lg:px-0 lg:pt-2 lg:pb-0">
				<div className="max-w-md mx-auto lg:max-w-none grid grid-cols-1 gap-3">
					<button type="button" onClick={onChoose} className={`${btnPrimary} !rounded-xl`}>
						{t('quotes.flow.choose_quote')}
					</button>
					<button
						type="button"
						onClick={onContact}
						className="w-full min-h-[52px] border-[1.5px] border-[#1B8F3E] text-[#1B8F3E] rounded-xl font-semibold flex items-center justify-center gap-2"
					>
						{t('quotes.flow.contact_workshop')}
					</button>
				</div>
			</div>
		</div>
	)
}

function WorkshopStep({ offer, onBack, onShowQuote, onOpenReviews }) {
	const { t } = useTranslation()
	const workshop = workshopOf(offer)

	return (
		<CustomerWorkshopProfile
			workshop={workshop}
			distance={offer.distance}
			onBack={onBack}
			onOpenReviews={onOpenReviews}
			footer={(
				<div className="fixed inset-x-0 z-30 bg-white border-t border-gray-100 px-4 pt-3 pb-2 max-lg:bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:static lg:border-0 lg:px-0 lg:pt-4 lg:pb-0">
					<div className="max-w-md mx-auto lg:max-w-none">
						<button type="button" onClick={onShowQuote} className={`${btnPrimary} !rounded-xl`}>
							{t('quotes.flow.show_quote')}
						</button>
					</div>
				</div>
			)}
		/>
	)
}

function ConfirmStep({ offer, onConfirm, onBack, confirming }) {
	const { t } = useTranslation()
	const workshop = workshopOf(offer)
	const name = workshop.companyName || t('offers_page.workshop')

	return (
		<div className="w-full">
			<button
				type="button"
				onClick={onBack}
				className="-ml-1 p-1 text-[#05324f] hover:opacity-70 max-lg:hidden"
				aria-label={t('common.back')}
			>
				<ArrowLeft className="w-5 h-5" strokeWidth={2} />
			</button>
			<div className="w-full text-center pt-4">
			<div>
			<div className="w-[88px] h-[88px] rounded-full bg-[#F3FBF6] ring-8 ring-[#E7F6EC] flex items-center justify-center mx-auto mb-5">
				<Check className="w-9 h-9 text-[#1B8F3E]" strokeWidth={2.75} />
			</div>
			<h1 className="page-title !mb-2 px-2">
				{t('quotes.flow.confirm_title', { name, price: formatPrice(offer.price) })}
			</h1>
			<p className="text-sm text-[#6B7280] mb-6 px-4 lg:px-0">{t('quotes.flow.continue_note')}</p>
			</div>

			<div>
			<div className="rounded-2xl border border-gray-200 bg-white p-4 text-left mb-4">
				<div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
					<div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3F4F6] shrink-0">
						<WorkshopImage workshop={workshop} className="w-full h-full" />
					</div>
					<p className="text-sm font-bold text-[#05324f] truncate flex-1">{name}</p>
					<p className="text-sm font-bold text-[#05324f] whitespace-nowrap">{formatPrice(offer.price)}</p>
				</div>
				<ul className="space-y-3">
					<li className="flex items-center gap-3 text-sm">
						<Clock className="w-4 h-4 text-[#6B7280] shrink-0" />
						<span className="text-[#4B5563] flex-1">{t('quotes.flow.compare_time')}</span>
						<span className="font-semibold text-[#05324f]">{durationLabel(offer, t)}</span>
					</li>
					<li className="flex items-center gap-3 text-sm">
						<Car className="w-4 h-4 text-[#6B7280] shrink-0" />
						<span className="text-[#4B5563] flex-1">{t('quotes.flow.compare_loaner')}</span>
						<span className="font-semibold text-[#05324f]">{hasLoaner(offer) ? t('common.yes') : t('common.no')}</span>
					</li>
					<li className="flex items-center gap-3 text-sm">
						<Shield className="w-4 h-4 text-[#6B7280] shrink-0" />
						<span className="text-[#4B5563] flex-1">{t('quotes.flow.compare_warranty')}</span>
						<span className="font-semibold text-[#05324f]">{offer.warranty || t('quotes.flow.warranty_default')}</span>
					</li>
					<li className="flex items-center gap-3 text-sm">
						<MapPin className="w-4 h-4 text-[#6B7280] shrink-0" />
						<span className="text-[#4B5563] flex-1">{t('quotes.flow.compare_distance')}</span>
						<span className="font-semibold text-[#05324f]">{offer.distance != null ? `${Number(offer.distance).toFixed(1).replace('.', ',')} km` : '—'}</span>
					</li>
				</ul>
			</div>

			<div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 mb-6 flex items-start gap-2.5 text-left">
				<Lock className="w-4 h-4 text-[#1B8F3E] shrink-0 mt-0.5" />
				<p className="text-[13px] text-[#4B5563] leading-snug">{t('quotes.flow.can_change')}</p>
			</div>

			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<button type="button" disabled={confirming} onClick={onConfirm} className={btnPrimary}>
					{t('quotes.flow.confirm_continue')}
				</button>
				<button type="button" onClick={onBack} className={btnSecondary}>
					{t('quotes.flow.back_to_quotes')}
				</button>
			</div>
			</div>
			</div>
		</div>
	)
}
