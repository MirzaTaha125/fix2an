import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { VerifiedBadge, RatingBadge, WarrantyBadge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { offersAPI, requestsAPI } from '../services/api'
import {
	Star,
	Clock,
	MapPin,
	AlertCircle,
	ArrowRight,
	CheckCircle,
	Trash2,
	AlertTriangle,
	User,
} from 'lucide-react'

const SORT_OPTIONS = [
	{ key: 'price', labelKey: 'offers_page.sort.price' },
	{ key: 'distance', labelKey: 'offers_page.sort.distance' },
	{ key: 'rating', labelKey: 'offers_page.sort.rating' },
]

export default function OffersPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()

	const requestId = searchParams.get('requestId')
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [listLoading, setListLoading] = useState(false)
	const [sortBy, setSortBy] = useState('price')
	const [requestDetails, setRequestDetails] = useState(null)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				if (user.role === 'ADMIN') navigate('/admin', { replace: true })
				else if (user.role === 'WORKSHOP') navigate('/workshop/requests', { replace: true })
				else navigate('/my-cases', { replace: true })
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (requestId && user && user.role === 'CUSTOMER') {
			fetchRequestDetails()
			fetchOffers()
		}
	}, [requestId, user])

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

	if (!requestId) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20 w-full">
					<div className="text-center py-20">
						<AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
						<h3 className="text-xl font-bold text-[#05324f] mb-2">{t('offers_page.no_request_id')}</h3>
						<p className="text-gray-500 mb-6">{t('offers_page.no_request_id_description')}</p>
						<Link to="/my-cases">
							<Button>{t('offers_page.back_to_cases')}</Button>
						</Link>
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 w-full space-y-6">
					<div className="mb-8 text-center max-md:text-left">
						<Skeleton className="h-10 w-3/4 mx-auto mb-4 max-md:mx-0 max-md:w-full" />
						<Skeleton className="h-5 w-1/2 mx-auto mb-8 max-md:mx-0 max-md:w-3/4" />
						<div className="inline-flex gap-2 max-md:w-full">
							<Skeleton className="h-10 w-24 rounded-lg max-md:flex-1 max-md:rounded-full" />
							<Skeleton className="h-10 w-24 rounded-lg max-md:flex-1 max-md:rounded-full" />
							<Skeleton className="h-10 w-24 rounded-lg max-md:flex-1 max-md:rounded-full" />
						</div>
					</div>
					<div className="space-y-4">
						{[1, 2, 3].map(i => (
							<div key={i} className="bg-white rounded-xl border border-gray-100 p-6 max-md:p-4 shadow-sm">
								<div className="flex items-center gap-4 mb-4">
									<Skeleton className="w-12 h-12 rounded-full hidden max-md:block" />
									<div className="flex-1">
										<Skeleton className="h-6 w-1/3 mb-2" />
										<Skeleton className="h-8 w-1/4" />
									</div>
								</div>
								<div className="hidden md:flex gap-4 mb-4 mt-2">
									<Skeleton className="h-6 w-20 rounded-full" />
									<Skeleton className="h-6 w-24 rounded-full" />
									<Skeleton className="h-6 w-32 rounded-full" />
								</div>
								<div className="flex justify-between items-end md:border-t border-gray-100 md:pt-4">
									<div className="hidden md:block">
										<Skeleton className="h-4 w-12 mb-2" />
										<Skeleton className="h-8 w-24" />
									</div>
									<Skeleton className="h-10 w-full md:w-32 rounded-lg" />
								</div>
							</div>
						))}
					</div>
				</div>
				<Footer />
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

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			<div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 w-full">

				{/* Page Header */}
				<div className="mb-8 text-center max-md:mb-6 max-md:text-left">
					<h1 className="text-xl font-bold text-[#05324f] mb-2 max-md:text-xl max-md:mb-1">
						{sortedOffers.length === 1
							? t('offers_page.found_workshops_near_you', { count: 1 })
							: t('offers_page.found_workshops_near_you_plural', { count: sortedOffers.length })}
					</h1>
					<p className="text-gray-500 text-base mb-7 max-md:mb-4 max-md:text-sm">
						{t('offers_page.compare_and_choose')}
					</p>

					{/* Sort Tabs - reference: pill style, active green */}
					<div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1 max-md:w-full max-md:bg-gray-100 max-md:border-0 max-md:shadow-none max-md:p-0 max-md:gap-2 max-md:rounded-xl">
						{SORT_OPTIONS.map(({ key, labelKey }) => (
							<button
								key={key}
								onClick={() => handleSort(key)}
								className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap min-w-[80px] sm:min-w-[100px] max-md:flex-1 max-md:py-2 max-md:rounded-lg max-md:text-[11px] shadow-sm border border-transparent ${
									sortBy === key
										? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
										: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 max-md:bg-gray-200 max-md:text-gray-600'
								}`}
							>
								{t(labelKey)}
							</button>
						))}
					</div>
				</div>

				{/* Offers List */}
				{sortedOffers.length === 0 ? (
					<div className="text-center py-20 bg-white rounded-card border border-gray-100 shadow-card">
						<Star className="w-14 h-14 mx-auto text-gray-200 mb-4" />
						<h3 className="text-xl font-bold text-[#05324f] mb-2">
							{t('offers_page.no_offers')}
						</h3>
						<p className="text-gray-500 text-small max-w-sm mx-auto">
							{t('offers_page.no_offers_description')}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{listLoading ? (
							<>
								{[1, 2, 3].map(i => (
									<div key={i} className="bg-white rounded-xl border border-gray-100 p-6 max-md:p-4 shadow-sm">
										<div className="flex items-center gap-4 mb-4">
											<Skeleton className="w-12 h-12 rounded-full hidden max-md:block" />
											<div className="flex-1">
												<Skeleton className="h-6 w-1/3 mb-2" />
												<Skeleton className="h-8 w-1/4" />
											</div>
										</div>
										<div className="hidden md:flex gap-4 mb-4 mt-2">
											<Skeleton className="h-6 w-20 rounded-full" />
											<Skeleton className="h-6 w-24 rounded-full" />
											<Skeleton className="h-6 w-32 rounded-full" />
										</div>
										<div className="flex justify-between items-end md:border-t border-gray-100 md:pt-4">
											<div className="hidden md:block">
												<Skeleton className="h-4 w-12 mb-2" />
												<Skeleton className="h-8 w-24" />
											</div>
											<Skeleton className="h-10 w-full md:w-32 rounded-lg" />
										</div>
									</div>
								))}
							</>
						) : (
							sortedOffers.map((offer) => {
								const offerId = offer._id || offer.id
								const workshop = offer.workshopId || offer.workshop
								const workshopRating = workshop?.rating || null
								const reviewCount = workshop?.reviewCount || null
								const distance = offer.distance != null ? offer.distance : null
								const estimatedDuration = offer.estimatedDuration || null
								const warranty = offer.warranty || null
								const laborCost = offer.laborCost || 0
								const partsCost = offer.partsCost || 0
								const inclusions = offer.inclusions || null
								const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null
								const initials = (workshop?.companyName || 'W')
									.split(/\s+/)
									.map((w) => w[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)

								return (
									<div
										key={offerId}
										className="bg-white rounded-card border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:border"
									>
										<div className="p-6 max-md:p-4">
											{/* Mobile only: Vertical layout with avatar at top */}
											<div className="flex flex-col md:hidden">
												<div className="flex items-center gap-4 mb-4">
													{/* Avatar at top-left of the info block */}
													<div className="relative shrink-0">
														{workshop?.image && workshop.image.trim() !== '' ? (
															<img 
																src={workshop.image} 
																alt={workshop?.companyName || 'Workshop'} 
																className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
																onError={(e) => {
																	e.target.style.display = 'none'
																	e.target.nextElementSibling.style.display = 'flex'
																}}
															/>
														) : null}
														<div className={`w-12 h-12 rounded-full bg-[#F0F2F5] flex items-center justify-center border border-white shadow-sm ${workshop?.image && workshop.image.trim() !== '' ? 'hidden' : ''}`}>
															<User className="w-6 h-6 text-[#ACB0B4]" />
														</div>
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="text-base font-bold text-[#05324f]">
																{workshop?.companyName || 'Workshop'}
															</h3>
															{workshop?.isVerified && <VerifiedBadge />}
														</div>
														{workshopRating != null && (
															<div className="flex items-center gap-1 mt-0.5">
																<Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
																<span className="text-xs font-bold text-gray-700">{workshopRating.toFixed(1)}</span>
															</div>
														)}
													</div>
												</div>

												<div className="flex items-end justify-between gap-4">
													<div className="flex-1 min-w-0">
														<p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{t('offers_page.price') || 'Price'}</p>
														<p className="text-2xl font-bold text-[#34C759] leading-none">
															{formatPrice(offer.price)}
														</p>
														{distance != null && (
															<p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
																<MapPin size={12} />
																{distance.toFixed(1)} km {t('offers_page.from_you')}
															</p>
														)}
														{expiresAt && (
															<p className="text-[10px] text-red-500 mt-1 font-medium italic">
																{t('offers_page.offer_expires') || 'Expires'}: {formatDate(expiresAt)}
															</p>
														)}
													</div>
													
													<div className="shrink-0 flex flex-col gap-2">
														{offer.status !== 'ACCEPTED' ? (
															<>
																<Button
																	onClick={() => handleAcceptOffer(offer)}
																	className="!bg-[#34C759] !text-white rounded-xl px-5 py-2.5 font-semibold shadow-sm"
																>
																	{t('offers_page.choose')}
																</Button>
																{expiresAt && expiresAt < new Date() && (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => handleDeleteOffer(offerId)}
																		className="text-red-500 hover:bg-red-50 rounded-xl"
																	>
																		<Trash2 className="w-4 h-4 mr-1" />
																		{t('common.delete')}
																	</Button>
																)}
															</>
														) : (
															<span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 font-bold text-xs px-4 py-2 rounded-full border border-green-200">
																<CheckCircle size={14} />
																{t('offers_page.accepted')}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="md:block hidden">
												<div className="flex items-center gap-4 mb-5">
													<div className="relative shrink-0">
														{workshop?.image && workshop.image.trim() !== '' ? (
															<img 
																src={workshop.image} 
																alt={workshop?.companyName || 'Workshop'} 
																className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
																onError={(e) => {
																	e.target.style.display = 'none'
																	e.target.nextElementSibling.style.display = 'flex'
																}}
															/>
														) : null}
														<div className={`w-14 h-14 rounded-full bg-[#F0F2F5] flex items-center justify-center border-2 border-white shadow-md ${workshop?.image && workshop.image.trim() !== '' ? 'hidden' : ''}`}>
															<User className="w-8 h-8 text-[#ACB0B4]" />
														</div>
													</div>
													<div>
														<div className="flex items-center gap-3 mb-1">
															<h3 className="text-xl font-bold text-[#05324f]">
																{workshop?.companyName || 'Workshop'}
															</h3>
															{workshop?.isVerified && <VerifiedBadge />}
														</div>
														{workshopRating != null && (
															<div className="flex items-center gap-1">
																<Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
																<span className="text-sm font-bold text-gray-700">{workshopRating.toFixed(1)}</span>
															</div>
														)}
													</div>
												</div>
												{/* Meta row */}
												<div className="flex flex-wrap items-center gap-2 mb-5">
													{workshopRating != null && (
														<RatingBadge rating={workshopRating.toFixed(1)} count={reviewCount} />
													)}
													{distance != null && (
														<span className="inline-flex items-center gap-1 text-small text-gray-500">
															<MapPin size={13} className="text-gray-400" />
															{distance.toFixed(1)} km
														</span>
													)}
													{estimatedDuration && (
														<span className="inline-flex items-center gap-1 text-small text-gray-500">
															<Clock size={13} className="text-gray-400" />
															{estimatedDuration >= 60 ? `${Math.round(estimatedDuration / 60)} ${t('offers_page.hours_fix')}` : `${estimatedDuration} ${t('offers_page.minutes')}`}
														</span>
													)}
													{warranty && <WarrantyBadge text={warranty} />}
												</div>
												{offer.note && (
													<p className="text-small text-gray-500 italic mb-4 leading-relaxed border-l-2 border-gray-100 pl-3">{offer.note}</p>
												)}

												<div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
													<div className="flex flex-col">
														<div className="flex items-center gap-1.5 mb-0.5">
															<p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('offers_page.total_price') || t('offers_page.price')}</p>
															<span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
																{t('offers_page.incl_vat') || 'Incl. VAT'}
															</span>
														</div>
														<p className="text-3xl font-bold text-[#34C759] leading-none">{formatPrice(offer.price)}</p>
														{expiresAt && (
															<p className={`text-[10px] mt-2 font-medium italic ${expiresAt < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
																{expiresAt < new Date() ? (t('offers_page.offer_expired') || 'Offer Expired') : (t('offers_page.offer_expires') || 'Offer Valid Until')}: {formatDate(expiresAt)}
															</p>
														)}
													</div>
													<div className="flex items-center gap-3">
														{expiresAt && expiresAt < new Date() && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleDeleteOffer(offerId)}
																className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
																title={t('common.delete')}
															>
																<Trash2 className="w-5 h-5" />
															</Button>
														)}
														{offer.status !== 'ACCEPTED' ? (
															<Button onClick={() => handleAcceptOffer(offer)} className={`flex items-center gap-2 shrink-0 h-12 px-8 ${expiresAt && expiresAt < new Date() ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
																{t('offers_page.choose')}
																<ArrowRight size={16} />
															</Button>
														) : (
															<span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 font-semibold text-sm px-4 py-2.5 rounded-btn border border-green-200">
																{t('offers_page.accepted')}
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
									</div>
								)
							})
						)}
					</div>
				)}
			</div>
			<Footer />
		</div>
	)
}
