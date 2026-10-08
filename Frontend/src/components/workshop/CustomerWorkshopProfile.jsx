import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Star, MapPin, Clock, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import WorkshopImage from '../WorkshopImage'
import { reviewsAPI } from '../../services/api'

function todayHours(workshop) {
	const raw = workshop?.openingHours
	if (!raw) return null
	try {
		const hours = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return null
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
		const today = hours[days[new Date().getDay()]]
		const open = today?.open || today?.opens
		const close = today?.close || today?.closes
		if (open && close) return `${open}–${close}`
		if (close) return close
	} catch {
		return null
	}
	return null
}

function formatReviewComment(raw, t) {
	const value = String(raw || '').trim()
	if (!value) return ''

	const match = value.match(/^(.*?)\s*\[([^\]]+)\]\s*$/s)
	const body = (match ? match[1] : value).trim()
	const tagsRaw = match ? match[2] : ''
	const tags = tagsRaw
		.split(/[,|]/)
		.map((tag) => tag.trim())
		.filter(Boolean)
		.map((tag) => {
			const key = `payment.flow.tag_${tag}`
			const label = t(key)
			return label === key ? tag.replace(/_/g, ' ') : label
		})

	if (body && tags.length) return `${body} · ${tags.join(', ')}`
	if (body) return body
	return tags.join(', ')
}

/**
 * Read-only workshop profile (same as quote "View profile").
 * Pass `footer` to show a bottom action bar (e.g. Show quote); omit for profile-only.
 */
export default function CustomerWorkshopProfile({
	workshop,
	distance = null,
	onBack,
	onOpenReviews,
	footer = null,
}) {
	const { t } = useTranslation()
	const rating = Number(workshop?.rating ?? workshop?.averageRating ?? 0)
	const reviewCount = Number(workshop?.reviewCount ?? workshop?.reviewsCount ?? 0)
	const hours = todayHours(workshop)
	const badges = [
		t('quotes.flow.badge_authorized'),
		t('quotes.flow.badge_certified'),
		t('quotes.flow.badge_original'),
		t('quotes.flow.badge_satisfaction'),
	]
	const distanceKm = distance != null && distance !== ''
		? `${Number(distance).toFixed(1).replace('.', ',')} km`
		: null
	const ratingLabel = rating.toFixed(1).replace('.', ',')
	const workshopId = workshop?._id || workshop?.id
	const name = workshop?.companyName || t('offers_page.workshop')

	const sampleReviews = useMemo(() => ([
		{
			id: 'sample-1',
			name: 'Johan S.',
			initial: 'J',
			ago: t('quotes.flow.review_ago'),
			rating: 5,
			text: t('quotes.flow.sample_review'),
		},
		{
			id: 'sample-2',
			name: 'Anna L.',
			initial: 'A',
			ago: t('quotes.flow.review_ago'),
			rating: 5,
			text: t('quotes.flow.sample_review_2'),
		},
	]), [t])

	const [liveReviews, setLiveReviews] = useState([])
	const [reviewIndex, setReviewIndex] = useState(0)
	const scrollerRef = useRef(null)

	useEffect(() => {
		if (!workshopId) return undefined
		let stop = false
		reviewsAPI.getByWorkshop(workshopId)
			.then((response) => {
				if (stop) return
				const rows = Array.isArray(response.data) ? response.data : []
				setLiveReviews(rows.map((row, index) => {
					const customerName = row.customerId?.name || row.customerName || t('customer_reviews.anonymous_customer')
					const stars = Number(row.rating) || 5
					const text = formatReviewComment(row.comment || row.text || '', t)
					return {
						id: row._id || row.id || `live-${index}`,
						name: customerName,
						initial: String(customerName).trim().charAt(0).toUpperCase() || 'C',
						ago: row.createdAt
							? new Date(row.createdAt).toLocaleDateString()
							: t('quotes.flow.review_ago'),
						rating: stars,
						text,
					}
				}).filter((row) => row.text))
			})
			.catch(() => {
				if (!stop) setLiveReviews([])
			})
		return () => { stop = true }
	}, [workshopId, t])

	const reviewSlides = liveReviews.length > 0 ? liveReviews : sampleReviews
	const sliderReviews = reviewSlides.slice(0, 5)

	const onReviewScroll = () => {
		const el = scrollerRef.current
		if (!el) return
		const width = el.clientWidth || 1
		setReviewIndex(Math.round(el.scrollLeft / width))
	}

	useEffect(() => {
		if (sliderReviews.length <= 1) return undefined
		const timer = setInterval(() => {
			const el = scrollerRef.current
			if (!el) return
			const width = el.clientWidth || 1
			const current = Math.round(el.scrollLeft / width)
			const next = (current + 1) % sliderReviews.length
			el.scrollTo({ left: next * width, behavior: 'smooth' })
			setReviewIndex(next)
		}, 4000)
		return () => clearInterval(timer)
	}, [sliderReviews.length])

	return (
		<div className="w-full max-w-full overflow-x-hidden">
			<div className={`${footer ? 'pb-[5.5rem] lg:pb-0' : ''} max-w-full overflow-x-hidden`}>
				{onBack ? (
					<button type="button" onClick={onBack} className="mb-4 -ml-1 p-1 text-[#05324f] hover:opacity-70 max-lg:hidden" aria-label={t('common.back')}>
						<ArrowLeft className="w-5 h-5" />
					</button>
				) : null}

				<div className="rounded-xl bg-[#12244C] text-white px-5 pt-5 pb-12 flex items-center gap-4">
					<div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-white ring-2 ring-white/40 shrink-0">
						<WorkshopImage workshop={workshop} className="w-full h-full" />
					</div>
					<div className="min-w-0">
						<p className="text-lg font-semibold truncate">{name}</p>
						<p className="text-sm text-white/90 mt-1 inline-flex items-center gap-1 flex-wrap">
							<span className="font-semibold">{ratingLabel}</span>
							<Star className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800]" />
							{reviewCount > 0 && (
								<span className="text-white/75">({reviewCount} {t('offers_page.reviews')})</span>
							)}
						</p>
					</div>
				</div>

				<div className="rounded-xl bg-white border border-gray-100 shadow-sm -mt-7 mx-1 mb-6 flex items-stretch min-w-0">
					<div className="flex-1 min-w-0 px-1.5 py-3.5 flex flex-col items-center text-center justify-center">
						<MapPin className="w-4 h-4 text-[#05324f] mb-1.5" />
						<p className="text-[12px] font-medium text-[#05324f] leading-tight">
							{distanceKm || workshop?.city || '—'}
						</p>
						{distanceKm ? (
							<p className="text-[11px] font-medium text-[#05324f] leading-tight mt-0.5">
								{t('quotes.flow.away_short')}
							</p>
						) : null}
					</div>
					<div className="w-px self-center h-10 bg-gray-200 shrink-0" aria-hidden />
					<div className="flex-1 min-w-0 px-1.5 py-3.5 flex flex-col items-center text-center justify-center">
						<Clock className="w-4 h-4 text-[#05324f] mb-1.5" />
						<p className="text-[11px] font-medium text-[#05324f] leading-tight">{t('quotes.flow.open_default')}</p>
						{hours ? (
							<p className="text-[11px] font-medium text-[#05324f] leading-tight mt-0.5">
								{hours.replace('–', ' - ')}
							</p>
						) : null}
					</div>
					<div className="w-px self-center h-10 bg-gray-200 shrink-0" aria-hidden />
					<div className="flex-1 min-w-0 px-1.5 py-3.5 flex flex-col items-center text-center justify-center">
						<Zap className="w-4 h-4 text-[#05324f] mb-1.5" />
						<p className="text-[11px] font-medium text-[#05324f] leading-tight">{t('quotes.flow.fast_reply')}</p>
						<p className="text-[11px] font-medium text-[#05324f] leading-tight mt-0.5">{t('quotes.flow.reply_mins')}</p>
					</div>
				</div>

				<section className="mb-5">
					<h2 className="text-base font-semibold text-[#05324f] mb-2">{t('quotes.flow.about_workshop')}</h2>
					<p className="text-sm text-[#4B5563] leading-relaxed mb-4">
						{workshop?.description || workshop?.about || t('quotes.flow.about_fallback')}
					</p>
					<ul className="space-y-3">
						{badges.map((badge) => (
							<li key={badge} className="flex items-center gap-3 text-sm text-[#05324f]">
								<span className="w-5 h-5 rounded-full bg-[#008037] text-white flex items-center justify-center shrink-0">
									<Check className="w-3 h-3" strokeWidth={3} />
								</span>
								<span className="leading-snug font-medium">{badge}</span>
							</li>
						))}
					</ul>
				</section>

				<section className="mb-2 min-w-0">
					<h2 className="text-base font-semibold text-[#05324f] mb-2">{t('quotes.flow.customer_reviews')}</h2>
					<div className="flex items-center justify-between gap-3 mb-3">
						<div className="flex items-center gap-1.5 min-w-0">
							<span className="text-sm font-semibold text-[#05324f]">{ratingLabel}</span>
							<div className="flex items-center gap-0.5">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-[#FFB800] fill-[#FFB800]' : 'text-gray-200 fill-gray-200'}`}
									/>
								))}
							</div>
							{reviewCount > 0 && (
								<span className="text-sm text-[#6B7280]">({reviewCount})</span>
							)}
						</div>
						{onOpenReviews ? (
							<button type="button" onClick={onOpenReviews} className="text-sm font-semibold text-[#008037] shrink-0">
								{t('quotes.flow.show_all')}
							</button>
						) : null}
					</div>

					<div className="w-full max-w-full overflow-hidden">
						<div
							ref={scrollerRef}
							onScroll={onReviewScroll}
							className="review-slider-track no-scrollbar w-full"
						>
							{sliderReviews.map((review) => (
								<div key={review.id} className="min-w-full w-full max-w-full shrink-0 snap-center px-0.5 box-border">
									<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
										<div className="flex items-start gap-3 mb-2">
											<div className="w-10 h-10 rounded-full bg-[#E8F5EC] text-[#008037] text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
												{review.initial}
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-bold text-[#05324f] truncate">{review.name}</p>
												<p className="text-xs text-[#6B7280]">{review.ago}</p>
											</div>
											<div className="flex items-center gap-0.5 shrink-0">
												{[1, 2, 3, 4, 5].map((star) => (
													<Star
														key={star}
														className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-[#008037] fill-[#008037]' : 'text-gray-200 fill-gray-200'}`}
													/>
												))}
											</div>
										</div>
										<p className="text-sm text-[#4B5563] leading-relaxed line-clamp-4">{review.text}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{sliderReviews.length > 1 && (
						<div className="flex items-center justify-center gap-1.5 mt-3">
							{sliderReviews.map((review, index) => (
								<button
									key={review.id}
									type="button"
									aria-label={`Review ${index + 1}`}
									onClick={() => {
										const el = scrollerRef.current
										if (!el) return
										el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
										setReviewIndex(index)
									}}
									className={`h-1.5 rounded-full transition-all ${
										index === reviewIndex ? 'w-4 bg-[#008037]' : 'w-1.5 bg-[#D1D5DB]'
									}`}
								/>
							))}
						</div>
					)}
				</section>
			</div>

			{footer}
		</div>
	)
}
