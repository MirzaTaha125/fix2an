import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import { formatDateTime } from '../../utils/cn'
import { offersAPI, reviewsAPI } from '../../services/api'
import QuoteFlow from '../quotes/QuoteFlow'

function workshopIdOf(offer) {
	const raw = offer?.workshop || offer?.workshopId
	if (!raw) return null
	if (typeof raw === 'string') return raw
	return raw._id || raw.id || null
}

export default function CaseQuotesPanel({ requestId, onBack, onBook, onContactWorkshop }) {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [confirming, setConfirming] = useState(false)
	const [reviewsModal, setReviewsModal] = useState(null)
	const [workshopReviews, setWorkshopReviews] = useState([])
	const [reviewsLoading, setReviewsLoading] = useState(false)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			if (!requestId) return
			setLoading(true)
			try {
				const response = await offersAPI.getByRequest(requestId)
				if (!cancelled) setOffers(Array.isArray(response.data) ? response.data : [])
			} catch (error) {
				console.error('Failed to fetch offers:', error)
				if (!cancelled) {
					setOffers([])
					toast.error(t('errors.fetch_failed') || 'Failed to fetch offers')
				}
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [requestId, t])

	const proceedToBooking = (offer) => {
		if (!offer) return
		const id = offer._id || offer.id
		if (onBook) {
			onBook(id)
			return
		}
		setConfirming(true)
		navigate(`/book-appointment?offerId=${id}&requestId=${requestId}`)
	}

	const openReviewsModal = async (workshop) => {
		const workshopId = workshop?._id || workshop?.id
		if (!workshopId) return
		setReviewsModal({
			id: workshopId,
			name: workshop?.companyName || t('offers_page.workshop') || 'Workshop',
		})
		setReviewsLoading(true)
		setWorkshopReviews([])
		try {
			const response = await reviewsAPI.getByWorkshop(workshopId)
			setWorkshopReviews(Array.isArray(response.data) ? response.data : [])
		} catch (error) {
			console.error('Failed to fetch workshop reviews:', error)
			toast.error(t('customer_reviews.fetch_error') || 'Failed to load reviews')
		} finally {
			setReviewsLoading(false)
		}
	}

	const available = offers.filter((offer) => offer.status !== 'CANCELLED')

	return (
		<div className="w-full">
			{loading ? (
				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-24 w-full rounded-2xl" />
					))}
				</div>
			) : (
				<QuoteFlow
					offers={available}
					requestId={requestId}
					onExit={onBack}
					confirming={confirming}
					onConfirm={proceedToBooking}
					onContact={(offer) => {
						const workshopId = workshopIdOf(offer)
						const ws = offer.workshop && typeof offer.workshop === 'object' ? offer.workshop : null
						if (onContactWorkshop && workshopId) {
							onContactWorkshop({
								workshopId,
								name: ws?.companyName || t('offers_page.workshop'),
								logo: ws?.logo,
								offer,
							})
							return
						}
						const phone = ws?.phone || (typeof offer.workshopId === 'object' ? offer.workshopId?.phone : null)
						if (phone) window.location.href = `tel:${phone}`
						else toast(t('quotes.flow.contact_soon') || 'Contact coming soon')
					}}
					onOpenReviews={openReviewsModal}
				/>
			)}

			<Dialog open={!!reviewsModal} onOpenChange={(open) => !open && setReviewsModal(null)}>
				<DialogContent
					onClose={() => setReviewsModal(null)}
					className="w-[92vw] max-w-md p-0 overflow-hidden max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col"
				>
					<div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
						<DialogTitle className="text-lg font-bold text-[#05324f]">
							{reviewsModal?.name} {t('customer_reviews.title') || 'Reviews'}
						</DialogTitle>
						<p className="text-sm text-gray-500 mt-1">
							{t('customer_reviews.subtitle') || 'Read what other customers have to say'}
						</p>
					</div>
					<div className="overflow-y-auto flex-1 px-6 py-4">
						{reviewsLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-24 w-full rounded-xl" />
								))}
							</div>
						) : workshopReviews.length === 0 ? (
							<EmptyState
								compact
								title={t('common.empty.reviews_title')}
								description={t('common.empty.reviews_desc')}
							/>
						) : (
							<div className="space-y-3">
								{workshopReviews.map((review) => {
									const customerName =
										review.customerId?.name ||
										t('customer_reviews.anonymous_customer') ||
										'Customer'
									const createdAt = review.createdAt
										? formatDateTime(new Date(review.createdAt), i18n.language)
										: ''
									return (
										<div
											key={review._id || review.id}
											className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
										>
											<div className="flex items-start justify-between gap-3 mb-2">
												<div className="min-w-0">
													<p className="text-sm font-medium text-[#05324f] truncate">{customerName}</p>
													{createdAt && <p className="text-[11px] text-gray-500">{createdAt}</p>}
												</div>
												<div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100 shrink-0">
													<Star size={12} className="text-[#FFB800] fill-[#FFB800]" />
													<span className="text-xs font-medium text-[#05324f]">
														{Number(review.rating || 0).toFixed(1)}
													</span>
												</div>
											</div>
											{review.comment && (
												<p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
											)}
										</div>
									)
								})}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
