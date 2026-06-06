import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { OfferRequestListCardSkeleton, PageHeaderSkeleton, Skeleton } from '../components/ui/Skeleton'
import { VerifiedBadge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
import toast from 'react-hot-toast'
import { formatPrice, formatDateTime, formatSwedishRegistrationNumber } from '../utils/cn'
import { getFullUrl } from '../config/api.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRefreshCustomerOfferCount } from '../context/CustomerOfferCountContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VehicleImage from '../components/VehicleImage'
import WorkshopImage from '../components/WorkshopImage'
import { offersAPI, requestsAPI, reviewsAPI } from '../services/api'
import {
	Star,
	Clock,
	MapPin,
	AlertCircle,
	ArrowRight,
	CheckCircle,
	Trash2,
	AlertTriangle,
	Car,
	RefreshCw,
	RotateCw,
	MessageCircle,
	ChevronDown,
	ChevronRight,
	User,
	MessageSquare,
} from 'lucide-react'

function getRequestReports(request) {
	const byId = new Map()
	const addReport = (report) => {
		if (!report || typeof report !== 'object' || !report.fileUrl) return
		const id = String(report._id || report.id || report.fileUrl)
		if (!byId.has(id)) byId.set(id, report)
	}
	if (Array.isArray(request?.reportIds)) request.reportIds.forEach(addReport)
	addReport(request?.reportId)
	return [...byId.values()]
}

const SORT_OPTIONS = [
	{ key: 'price', labelKey: 'offers_page.sort.price' },
	{ key: 'distance', labelKey: 'offers_page.sort.distance' },
	{ key: 'rating', labelKey: 'offers_page.sort.rating' },
]

function OfferStarRating({ rating, reviewCount, reviewsLabel, onReviewsClick }) {
	const value = Number(rating) || 0
	const filledStars = Math.max(0, Math.min(5, Math.round(value)))
	const canOpenReviews = reviewCount > 0 && onReviewsClick

	return (
		<div className="flex flex-col items-start gap-0.5">
			<div className="flex items-center gap-1.5 flex-wrap">
				<div className="flex items-center gap-0.5">
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							size={14}
							className={
								star <= filledStars
									? 'text-[#FFB800] fill-[#FFB800]'
									: 'text-gray-200 fill-gray-200'
							}
						/>
					))}
				</div>
				<span className="text-sm font-medium text-[#05324f]">{value.toFixed(1)}</span>
			</div>
			{reviewCount != null && (
				canOpenReviews ? (
					<button
						type="button"
						onClick={onReviewsClick}
						className="text-xs text-gray-500 hover:text-[#38BC54] transition-colors underline-offset-2 hover:underline"
					>
						({reviewCount} {reviewsLabel})
					</button>
				) : (
					<span className="text-xs text-gray-500">
						({reviewCount} {reviewsLabel})
					</span>
				)
			)}
		</div>
	)
}

export default function OffersPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const refreshOfferCount = useRefreshCustomerOfferCount()
	const { t, i18n } = useTranslation()

	const requestId = searchParams.get('requestId')
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [listLoading, setListLoading] = useState(false)
	const [sortBy, setSortBy] = useState('price')
	const [detailsOffer, setDetailsOffer] = useState(null)
	const [requestDetails, setRequestDetails] = useState(null)
	const [offerRequests, setOfferRequests] = useState([])
	const [reviewsModal, setReviewsModal] = useState(null)
	const [workshopReviews, setWorkshopReviews] = useState([])
	const [reviewsLoading, setReviewsLoading] = useState(false)
	const [selectedReport, setSelectedReport] = useState(null)
	const [showReportDialog, setShowReportDialog] = useState(false)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				if (user.role === 'ADMIN') navigate('/admin', { replace: true })
				else if (user.role === 'WORKSHOP') navigate('/workshop/requests', { replace: true })
				else navigate('/contract', { replace: true })
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (!user || user.role !== 'CUSTOMER') return
		if (requestId) {
			fetchRequestDetails()
			fetchOffers()
		} else {
			fetchOfferRequests()
		}
	}, [requestId, user])

	useEffect(() => {
		if (requestId) {
			setShowReportDialog(false)
			setSelectedReport(null)
		}
	}, [requestId])

	const fetchOfferRequests = async () => {
		if (!user) return
		setLoading(true)
		try {
			const response = await requestsAPI.getByCustomer(user.id || user._id)
			const requests = Array.isArray(response.data) ? response.data : []
			const filtered = requests.filter((r) => {
				const bookings = r.bookings || []
				const hasBooking = bookings.some((b) =>
					['CONFIRMED', 'RESCHEDULED'].includes(b.status)
				)
				if (hasBooking) return false
				if (bookings.some((b) => b.status === 'DONE' || b.status === 'CANCELLED')) return false
				if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status)) return false
				return true
			})
			setOfferRequests(filtered)
			refreshOfferCount()
		} catch (error) {
			console.error('Failed to fetch offer requests:', error)
			toast.error(t('errors.fetch_failed') || 'Failed to fetch offers')
		} finally {
			setLoading(false)
		}
	}

	const fetchRequestDetails = async () => {
		if (!requestId) return
		try {
			const response = await requestsAPI.getById(requestId)
			if (response.data) setRequestDetails(response.data)
		} catch (error) {
			console.error('Failed to fetch request details:', error)
		}
	}

	const fetchOffers = async () => {
		if (!requestId) return
		setLoading(true)
		try {
			const response = await offersAPI.getByRequest(requestId)
			if (response.data) setOffers(response.data)
		} catch (error) {
			console.error('Failed to fetch offers:', error)
			toast.error(t('errors.fetch_failed') || 'Failed to fetch offers')
		} finally {
			setLoading(false)
		}
	}

	const handleAcceptOffer = (offer) => {
		const offerId = offer._id || offer.id
		navigate(`/book-appointment?offerId=${offerId}&requestId=${requestId}`)
	}

	const handleSort = (key) => {
		setSortBy(key)
		setListLoading(true)
		setTimeout(() => setListLoading(false), 300)
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

	const handleDeleteOffer = async (offerId) => {
		if (!window.confirm(t('offers_page.confirm_delete_offer') || 'Are you sure you want to delete this offer?')) return

		try {
			await offersAPI.delete(offerId)
			toast.success(t('offers_page.offer_deleted') || 'Offer deleted successfully')
			setOffers(prev => prev.filter(o => (o._id || o.id) !== offerId))
		} catch (error) {
			console.error('Failed to delete offer:', error)
			toast.error(t('errors.delete_failed') || 'Failed to delete offer')
		}
	}

	if (authLoading || (!requestId && loading)) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<PageHeaderSkeleton />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<OfferRequestListCardSkeleton key={i} />
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') return null

	if (!requestId) {
		const totalOfferCount = offerRequests.reduce((total, request) => {
			return total + (request.offers || []).filter((o) => o.status === 'SENT').length
		}, 0)

		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<div className="mb-6 md:mb-7">
						<div className="flex items-center gap-2 mb-2">
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#05324f] leading-tight">
								{t('offers_page.your_offers') || 'Your offers'}
							</h1>
							{totalOfferCount > 0 && (
								<span className="flex items-center justify-center bg-[#38BC54] text-white text-xs font-black w-6 h-6 rounded-full shrink-0">
									{totalOfferCount}
								</span>
							)}
						</div>
						<p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
							{t('offers_page.compare_and_choose_short') || 'Compare and choose the workshop that suits you best.'}
						</p>
					</div>

					{offerRequests.length === 0 ? (
						<div className="text-center py-20 bg-white rounded-card border border-gray-100 shadow-card">
							<Star className="w-14 h-14 mx-auto text-gray-200 mb-4" />
							<h3 className="text-xl font-bold text-[#05324f] mb-2">
								{t('offers_page.no_offers')}
							</h3>
							<p className="text-gray-500 mb-6 px-4">
								{t('offers_page.no_offers_description')}
							</p>
							<Link to="/upload">
								<Button>{t('my_cases.create_new') || 'Create new case'}</Button>
							</Link>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 w-full">
							{offerRequests.map((request) => {
								const vehicle = request.vehicleId || request.vehicle
								const sentCount = (request.offers || []).filter((o) => o.status === 'SENT').length
								const reports = getRequestReports(request)

								return (
									<div
										key={request._id}
										className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full"
									>
										<div className="flex gap-3 md:gap-4 flex-1 items-stretch min-h-0">
											<div className="w-28 md:w-32 shrink-0 rounded-xl overflow-hidden flex items-start justify-center">
												<VehicleImage
													make={vehicle?.make}
													model={vehicle?.model}
													year={vehicle?.year}
													width={400}
													className="w-full max-h-32 md:max-h-[8rem]"
													fallbackClassName="w-full h-24 md:h-[7rem]"
													alt={`${vehicle?.make} ${vehicle?.model}`}
												/>
											</div>
											<div className="flex-1 min-w-0 flex flex-col">
												<h3 className="text-sm font-black text-[#05324f] leading-snug line-clamp-2 mb-1.5">
													{vehicle?.make} {vehicle?.model} {vehicle?.year}
												</h3>
												<div className="space-y-1">
													<p className="text-[11px] text-[#05324f]/80 leading-snug line-clamp-2">
														<span className="font-bold">{t('workshop.requests.problem_label') || 'Problem'}:</span>
														{request.description?.trim() ? ` ${request.description.trim()}` : ' —'}
													</p>
													{request.createdAt && (
														<p className="text-[11px] text-[#05324f]/80">
															<span className="font-bold">{t('offers_page.submitted_at') || 'Submitted'}:</span>
															{' '}
															{formatDateTime(new Date(request.createdAt), i18n.language)}
														</p>
													)}
													{reports.length > 0 && (
														<p className="text-[11px] text-[#05324f]/80 leading-snug">
															<span className="font-bold">{t('offers_page.reports_label') || 'Reports'}:</span>{' '}
															{reports.map((report, index) => {
																const reportId = report._id || report.id || report.fileUrl
																return (
																	<span key={reportId}>
																		{index > 0 && <span className="text-gray-400"> · </span>}
																		<button
																			type="button"
																			onClick={() => {
																				setSelectedReport(report)
																				setShowReportDialog(true)
																			}}
																			className="text-[#38BC54] hover:underline font-medium"
																		>
																			{t('workshop.requests.view_report') || 'View report'}
																		</button>
																	</span>
																)
															})}
														</p>
													)}
												</div>
												<div className="mt-auto pt-4 flex items-center gap-3.5 shrink-0">
													<Button
														onClick={() => navigate(`/offers?requestId=${request._id}`)}
														className="flex-1 min-w-0 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs flex items-center justify-center shadow-sm"
													>
														{t('my_cases.view_offer') || 'View offer'} ({sentCount})
													</Button>
													<ChevronRight className="w-5 h-5 text-black shrink-0" strokeWidth={2} />
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
				<Footer className="max-lg:hidden" />

				<Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
					<DialogContent
						onClose={() => setShowReportDialog(false)}
						className="w-[92vw] max-w-2xl p-0 overflow-hidden max-h-[90vh] bg-white rounded-xl shadow-2xl"
					>
						<div className="px-6 pt-6 pb-4 border-b border-gray-100">
							<DialogTitle className="text-lg font-bold text-[#05324f]">
								{t('workshop.requests.inspection_report') || 'Inspection report'}
							</DialogTitle>
						</div>
						{selectedReport && (
							<div className="p-6 overflow-y-auto max-h-[70vh]">
								{selectedReport.mimeType?.startsWith('image/') ? (
									<img
										src={getFullUrl(selectedReport.fileUrl)}
										alt={selectedReport.fileName || 'Inspection report'}
										className="w-full max-h-[60vh] object-contain rounded-lg border border-gray-100"
									/>
								) : (
									<iframe
										src={getFullUrl(selectedReport.fileUrl)}
										title={selectedReport.fileName || 'Inspection report'}
										className="w-full h-[60vh] rounded-lg border border-gray-100 bg-gray-50"
									/>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<PageHeaderSkeleton descClassName="h-4 w-72 max-w-full" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<OfferRequestListCardSkeleton key={i} />
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') return null

	const filteredAvailableOffers = offers.filter(offer => offer.status !== 'CANCELLED')

	const sortedOffers = [...filteredAvailableOffers].sort((a, b) => {
		switch (sortBy) {
			case 'price': return a.price - b.price
			case 'rating': return (b.workshopId?.rating || 0) - (a.workshopId?.rating || 0)
			case 'distance': return (a.distance || 0) - (b.distance || 0)
			default: return 0
		}
	})

	const vehicle = requestDetails?.vehicleId || requestDetails?.vehicle
	const offerCount = sortedOffers.length

	return (
		<div className="list-page-shell bg-gray-50">
			<Navbar />
			<div className="list-page-content">

				{/* Mobile + tablet header */}
				<div className="lg:hidden mb-5">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight">
								{t('offers_page.your_offers') || 'Your offers'}
							</h1>
							<span className="flex items-center justify-center bg-[#38BC54] text-white text-xs font-semibold w-6 h-6 rounded-full shrink-0">
								{offerCount}
							</span>
						</div>
						<button
							onClick={fetchOffers}
							className="flex items-center gap-1 text-[#38BC54] font-semibold text-sm active:opacity-70"
						>
							<RotateCw size={14} className="stroke-[2.5]" />
							{t('offers_page.refresh') || 'Refresh'}
						</button>
					</div>
					<p className="text-xs sm:text-sm text-gray-500 leading-snug">
						{t('offers_page.compare_and_choose_short') || 'Compare and choose the workshop that suits you best.'}
					</p>
					<div className="list-tabs-row mt-4 !mb-0 gap-2 flex-wrap max-md:flex-wrap">
						{SORT_OPTIONS.map(({ key, labelKey }) => (
							<button
								key={key}
								onClick={() => handleSort(key)}
								className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap shrink-0 ${
									sortBy === key
										? 'bg-[#34C759] text-white shadow-sm'
										: 'text-gray-500 bg-white border border-gray-200 hover:text-[#05324f]'
								}`}
							>
								{t(labelKey)}
							</button>
						))}
					</div>
				</div>

				{/* Mobile Vehicle Card */}
				{vehicle && (
					<div className="md:hidden bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
						<div className="flex items-start gap-3 mb-3">
							<div className="w-20 md:w-24 shrink-0 self-start rounded-xl overflow-hidden flex items-start justify-center">
								<VehicleImage
									make={vehicle.make}
									model={vehicle.model}
									year={vehicle.year}
									width={400}
									className="w-full max-h-20"
									fallbackClassName="w-full h-16"
									alt={vehicle.make}
								/>
							</div>
							<div className="flex-1 min-w-0 self-start">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="text-base font-medium text-[#05324f]">
										{vehicle.make} {vehicle.model} {vehicle.year}
									</h3>
									{requestDetails?.registrationNumber && (
										<span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md tracking-wider">
											{formatSwedishRegistrationNumber(requestDetails.registrationNumber)}
										</span>
									)}
								</div>
							</div>
						</div>
						<div className="space-y-1.5 pl-1">
							{requestDetails?.postalCode && (
								<div className="flex gap-2 text-xs">
									<span className="text-gray-400 font-medium">{t('offers_page.vehicle_card_postnr') || 'Postal code'}:</span>
									<span className="text-[#05324f] font-medium">{requestDetails.postalCode}</span>
								</div>
							)}
							{requestDetails?.description && (
								<div className="flex gap-2 text-xs">
									<span className="text-gray-400 font-medium whitespace-nowrap">{t('offers_page.vehicle_card_description') || 'Description'}:</span>
									<span className="text-[#05324f] font-normal line-clamp-2">{requestDetails.description}</span>
								</div>
							)}
							{requestDetails?.createdAt && (
								<div className="flex gap-2 text-xs items-center">
									<span className="text-gray-400 font-medium whitespace-nowrap">{t('offers_page.submitted_at') || 'Submitted'}:</span>
									<span className="text-[#05324f] font-normal">{formatDateTime(new Date(requestDetails.createdAt), i18n.language)}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Desktop Page Header */}
				<div className="mb-8 text-center hidden lg:block">
					<h1 className="text-xl font-bold text-[#05324f] mb-2">
						{sortedOffers.length === 1
							? t('offers_page.found_workshops_near_you', { count: 1 })
							: t('offers_page.found_workshops_near_you_plural', { count: sortedOffers.length })}
					</h1>
					<p className="text-gray-500 text-base mb-7">
						{t('offers_page.compare_and_choose')}
					</p>

					<div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1">
						{SORT_OPTIONS.map(({ key, labelKey }) => (
							<button
								key={key}
								onClick={() => handleSort(key)}
								className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap min-w-[80px] sm:min-w-[100px] shadow-sm border border-transparent ${
									sortBy === key
										? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
										: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50'
								}`}
							>
								{t(labelKey)}
							</button>
						))}
					</div>
				</div>

				{/* Offers List */}
				<div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
				{sortedOffers.length === 0 ? (
					<div className="col-span-full text-center py-20 bg-white rounded-card border border-gray-100 shadow-card">
						<Star className="w-14 h-14 mx-auto text-gray-200 mb-4" />
						<h3 className="text-xl font-bold text-[#05324f] mb-2">
							{t('offers_page.no_offers')}
						</h3>
						<p className="text-gray-500 text-small max-w-sm mx-auto">
							{t('offers_page.no_offers_description')}
						</p>
					</div>
				) : listLoading ? (
					<>
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<OfferRequestListCardSkeleton key={`skel-${i}`} />
						))}
					</>
				) : (
					sortedOffers.map((offer, idx) => {
								const offerId = offer._id || offer.id
								const workshop = offer.workshopId || offer.workshop
								const workshopRating = workshop?.rating ?? null
								const reviewCount = workshop?.reviewCount ?? null
								const isBestMatch = idx === 0 && sortBy === 'price' && sortedOffers.length > 1

								return (
									<div
										key={offerId}
										className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${
											isBestMatch ? 'border-2 border-[#38BC54]' : 'border border-gray-100'
										}`}
									>
										<div className="p-4">
											{isBestMatch && (
												<div className="inline-flex items-center gap-1.5 bg-[#E8F8EE] text-[#38BC54] text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-3">
													<Star size={12} className="fill-[#38BC54] text-[#38BC54]" />
													<span>{t('offers_page.best_match') || 'BEST MATCH'}</span>
												</div>
											)}

											<div className="flex gap-3 items-start">
												<div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a] border border-gray-100">
													<WorkshopImage
														workshop={workshop}
														alt={workshop?.companyName || 'Workshop'}
														className="w-full h-full"
													/>
												</div>

												<div className="flex-1 min-w-0 flex flex-col">
													<div className="flex items-start justify-between gap-3">
														<div className="min-w-0 flex-1">
															<div className="mb-1.5 min-w-0">
																<h3 className="text-base font-semibold text-[#05324f] truncate">
																	{workshop?.companyName || 'Workshop'}
																</h3>
																{workshop?.isVerified && (
																	<VerifiedBadge className="mt-1" />
																)}
															</div>
														{workshopRating != null && (
															<OfferStarRating
																rating={workshopRating}
																reviewCount={reviewCount}
																reviewsLabel={t('offers_page.reviews') || 'reviews'}
																onReviewsClick={() => openReviewsModal(workshop)}
															/>
														)}
														</div>

														<div className="text-right shrink-0">
															<p className="text-lg sm:text-xl font-semibold text-[#05324f] leading-none whitespace-nowrap">
																{formatPrice(offer.price)}
															</p>
															<p className="text-[11px] text-gray-400 mt-1">
																{t('offers_page.incl_vat') || 'incl. VAT'}
															</p>
														</div>
													</div>

													{offer.status !== 'ACCEPTED' ? (
														<div className="mt-3 space-y-2 w-full">
															<Button
																onClick={() => handleAcceptOffer(offer)}
																className="relative w-full h-9 sm:h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-medium text-sm text-center justify-center shadow-sm"
															>
																<span>{t('offers_page.choose_workshop') || 'Choose workshop'}</span>
																<ArrowRight size={16} strokeWidth={2.5} className="absolute right-3.5 top-1/2 -translate-y-1/2" />
															</Button>
															<button
																type="button"
																onClick={() => setDetailsOffer(offer)}
																className="w-full flex items-center justify-center gap-1 text-sm font-medium text-[#05324f] hover:text-[#38BC54] transition-colors py-1.5"
															>
																{t('offers_page.show_details') || 'Show details'}
																<ChevronDown size={16} strokeWidth={2.5} />
															</button>
														</div>
													) : (
														<span className="inline-flex w-full justify-center items-center gap-1.5 bg-green-50 text-green-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-green-200 mt-3">
															<CheckCircle size={14} />
															{t('offers_page.accepted')}
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								)
							})
				)}
				</div>

				{/* Mobile Help Footer */}
				{sortedOffers.length > 0 && (
					<div className="md:hidden mt-6 bg-[#F5F7F8] rounded-xl border border-gray-100 p-4 flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[#E8F8EE] flex items-center justify-center shrink-0">
							<MessageCircle className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-[#05324f]">{t('offers_page.need_help') || 'Need help?'}</p>
							<p className="text-[11px] text-gray-400 font-semibold leading-tight">{t('offers_page.need_help_subtitle') || "We're here if you have any questions."}</p>
						</div>
						<a
							href="mailto:info@fixa2an.se"
							className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-[#05324f] text-xs font-semibold shadow-sm active:scale-95 transition-transform hover:bg-gray-50 shrink-0"
						>
							{t('offers_page.contact_us') || 'Contact us'}
						</a>
					</div>
				)}
			</div>
			<Footer className="max-lg:hidden" />

			{/* Offer Details Modal */}
			<Dialog open={!!detailsOffer} onOpenChange={(o) => !o && setDetailsOffer(null)}>
				<DialogContent
					onClose={() => setDetailsOffer(null)}
					className="w-[92vw] max-w-md p-0 overflow-y-auto max-h-[90vh] bg-white rounded-xl shadow-2xl"
				>
					{detailsOffer && (() => {
						const ws = detailsOffer.workshopId || detailsOffer.workshop || {}
						return (
							<>
								<div className="px-6 pt-6 pb-4 border-b border-gray-100">
									<DialogTitle>{t('offers_page.offer_details') || 'Offer Details'}</DialogTitle>
								</div>

								<div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
									<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
										<WorkshopImage workshop={ws} alt={ws.companyName} />
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-base font-semibold text-[#05324f] truncate">{ws.companyName || 'Workshop'}</h3>
										{ws.rating != null && (
											<button
												type="button"
												onClick={() => {
													const wid = ws._id || ws.id
													if (wid) {
														setDetailsOffer(null)
														navigate(`/workshop/${wid}/reviews`, { state: { workshopName: ws.companyName } })
													}
												}}
												className="flex items-center gap-1 text-[11px] mt-0.5 -mx-0.5 px-0.5 rounded hover:bg-gray-50"
											>
												<Star size={11} className="text-[#FFB800]" fill="#FFB800" />
												<span className="font-semibold text-[#05324f]">{Number(ws.rating).toFixed(1)}</span>
												{ws.reviewCount != null && <span className="text-[#38BC54] font-semibold underline-offset-2 hover:underline">({ws.reviewCount})</span>}
											</button>
										)}
										{detailsOffer.distance != null && (
											<div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-0.5">
												<MapPin size={11} className="text-gray-400" />
												{detailsOffer.distance.toFixed(1)} {t('offers_page.km_from_you') || 'km from you'}
											</div>
										)}
									</div>
								</div>

								<div className="px-6 py-4 border-b border-gray-100">
									<p className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest mb-1">{t('offers_page.price_breakdown') || 'Price breakdown'}</p>
									{detailsOffer.laborCost != null && (
										<div className="flex justify-between text-xs text-gray-600 py-1">
											<span>{t('offers_page.labor_cost') || 'Labor'}</span>
											<span className="font-semibold text-[#05324f]">{formatPrice(detailsOffer.laborCost)}</span>
										</div>
									)}
									{detailsOffer.partsCost != null && (
										<div className="flex justify-between text-xs text-gray-600 py-1">
											<span>{t('offers_page.material_cost') || 'Materials'}</span>
											<span className="font-semibold text-[#05324f]">{formatPrice(detailsOffer.partsCost)}</span>
										</div>
									)}
									<div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-gray-100">
										<span className="font-semibold text-[#05324f]">{t('offers_page.total') || 'Total'}</span>
										<div className="text-right">
											<div className="text-lg font-semibold text-[#38BC54] leading-none">{formatPrice(detailsOffer.price)}</div>
											<div className="text-[10px] text-gray-400 font-medium mt-0.5">{t('offers_page.incl_vat') || 'incl. VAT'}</div>
										</div>
									</div>
								</div>

								{detailsOffer.note && (
									<div className="px-6 py-4 border-b border-gray-100">
										<p className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest mb-2">{t('offers_page.notes') || 'Notes'}</p>
										<p className="text-xs text-[#05324f]/80 font-semibold leading-snug italic">{detailsOffer.note}</p>
									</div>
								)}

								<div className="p-5">
									<Button
										onClick={() => { setDetailsOffer(null); handleAcceptOffer(detailsOffer) }}
										className="w-full h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl !font-normal text-sm flex items-center justify-center gap-2 shadow-sm"
									>
										{t('offers_page.choose_workshop') || 'Choose workshop'}
										<ArrowRight size={16} />
									</Button>
								</div>
							</>
						)
					})()}
				</DialogContent>
			</Dialog>

			{/* Workshop Reviews Modal */}
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
							<div className="text-center py-10">
								<MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
								<p className="text-sm font-medium text-[#05324f]">
									{t('customer_reviews.no_reviews') || 'No reviews yet'}
								</p>
								<p className="text-xs text-gray-500 mt-1">
									{t('customer_reviews.no_reviews_desc') || 'This workshop has not received any reviews yet.'}
								</p>
							</div>
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
												<div className="flex items-center gap-2 min-w-0">
													<div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0">
														<User className="w-4 h-4 text-gray-500" />
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium text-[#05324f] truncate">{customerName}</p>
														{createdAt && <p className="text-[11px] text-gray-500">{createdAt}</p>}
													</div>
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
