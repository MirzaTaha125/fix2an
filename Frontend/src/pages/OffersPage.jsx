import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { OfferRequestListCardSkeleton, PageHeaderSkeleton, Skeleton } from '../components/ui/Skeleton'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
import toast from 'react-hot-toast'
import { formatDateTime } from '../utils/cn'
import { getFullUrl } from '../config/api.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRefreshCustomerOfferCount } from '../context/CustomerOfferCountContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VehicleRequestCard from '../components/VehicleRequestCard'
import { offersAPI, requestsAPI, reviewsAPI } from '../services/api'
import QuoteFlow from '../components/quotes/QuoteFlow'
import { Star, ChevronRight } from 'lucide-react'

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

export default function OffersPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const refreshOfferCount = useRefreshCustomerOfferCount()
	const { t, i18n } = useTranslation()

	const requestId = searchParams.get('requestId')
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [offerRequests, setOfferRequests] = useState([])
	const [reviewsModal, setReviewsModal] = useState(null)
	const [workshopReviews, setWorkshopReviews] = useState([])
	const [reviewsLoading, setReviewsLoading] = useState(false)
	const [selectedReport, setSelectedReport] = useState(null)
	const [showReportDialog, setShowReportDialog] = useState(false)
	const [confirming, setConfirming] = useState(false)

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

	const proceedToBooking = (offer) => {
		if (!offer) return
		setConfirming(true)
		const id = offer._id || offer.id
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

	if (authLoading || (!requestId && loading)) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<div className="mb-6 md:mb-7 flex items-start justify-between gap-3">
						<PageHeaderSkeleton titleClassName="h-8 w-48 max-w-full" descClassName="h-4 w-64 max-w-full" />
						<Skeleton className="h-10 w-20 shrink-0 rounded-xl mt-1" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<OfferRequestListCardSkeleton key={i} />
						))}
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') return null

	if (!requestId) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
				<div className="mb-6 md:mb-7">
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 min-w-0">
							<h1 className="page-title lg:text-3xl">
								{t('offers_page.your_offers') || 'Your offers'}
							</h1>
							<p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
								{t('offers_page.compare_and_choose_short') || 'Compare and choose the workshop that suits you best.'}
							</p>
						</div>
						<Link
							to="/upload"
							className="shrink-0 mt-0.5 bg-brand-btn text-white rounded-xl px-3.5 py-2.5 md:px-5 md:py-3 font-semibold text-xs md:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
						>
							<span className="text-base leading-none font-bold">+</span>
							<span className="hidden sm:inline">{t('my_cases.create_new') || 'Create new case'}</span>
							<span className="sm:hidden">{t('my_cases.create_new_short') || 'New'}</span>
						</Link>
					</div>
				</div>

					{offerRequests.length === 0 ? (
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
							<EmptyState
								title={t('common.empty.offers_title')}
								description={t('common.empty.offers_desc')}
								actionLabel={t('navigation.create_case')}
								actionTo="/upload"
							/>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 w-full">
							{offerRequests.map((request) => {
								const sentCount = (request.offers || []).filter((o) => o.status === 'SENT').length
								const reports = getRequestReports(request)

								return (
									<div
										key={request._id}
										className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col h-full"
									>
										<VehicleRequestCard
											request={request}
											footer={
												<div className="mt-auto pt-4 flex items-center gap-3 shrink-0">
													<Button
														onClick={() => navigate(`/offers?requestId=${request._id}`)}
														className="flex-1 min-w-0 min-h-[44px] bg-brand-btn text-white !rounded-xl font-semibold text-sm flex items-center justify-center"
													>
														{t('my_cases.view_offer') || 'View offer'} ({sentCount})
													</Button>
													<ChevronRight className="w-5 h-5 text-gray-300 shrink-0" strokeWidth={2} />
												</div>
											}
										>
											{request.createdAt && (
												<p className="text-[12px] text-[#6B7280]">
													<span className="font-bold text-brand-dark">{t('offers_page.submitted_at') || 'Submitted'}:</span>
													{' '}
													{formatDateTime(new Date(request.createdAt), i18n.language)}
												</p>
											)}
											{reports.length > 0 && (
												<p className="text-[12px] text-[#6B7280] leading-snug">
													<span className="font-bold text-brand-dark">{t('offers_page.reports_label') || 'Reports'}:</span>{' '}
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
																	className="text-[#1B8F3E] hover:underline font-semibold"
																>
																	{t('workshop.requests.view_report') || 'View report'}
																</button>
															</span>
														)
													})}
												</p>
											)}
										</VehicleRequestCard>
									</div>
								)
							})}
						</div>
					)}
				</div>
				<Footer />

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
			<div className="list-page-shell bg-white">
				<Navbar />
				<div className="list-page-content max-w-md lg:max-w-6xl mx-auto px-4 pb-8 !pt-32 md:!pt-40">
					<PageHeaderSkeleton descClassName="h-4 w-72 max-w-full" />
					<div className="space-y-3 mt-6">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-24 w-full rounded-2xl" />
						))}
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') return null

	const filteredAvailableOffers = offers.filter((offer) => offer.status !== 'CANCELLED')

	return (
		<div className="list-page-shell bg-white">
			<Navbar />
			<div className="list-page-content max-w-md lg:max-w-6xl mx-auto px-4 pb-8 !pt-32 md:!pt-40">
				<QuoteFlow
					offers={filteredAvailableOffers}
					requestId={requestId}
					confirming={confirming}
					onConfirm={proceedToBooking}
					onContact={(offer) => {
						const caseId =
							offer.requestId?._id ||
							offer.requestId?.id ||
							(typeof offer.requestId === 'string' ? offer.requestId : null) ||
							requestId
						const raw = offer.workshop || offer.workshopId
						const workshopId = typeof raw === 'string' ? raw : raw?._id || raw?.id || null
						if (caseId && workshopId) {
							navigate(`/contract?case=${caseId}&panel=messages&workshopId=${workshopId}`)
							return
						}
						const phone = typeof raw === 'object' ? raw?.phone : null
						if (phone) window.location.href = `tel:${phone}`
						else toast(t('quotes.flow.contact_soon') || 'Contact coming soon')
					}}
					onOpenReviews={(workshop) => openReviewsModal(workshop)}
				/>
			</div>
			<Footer />

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
