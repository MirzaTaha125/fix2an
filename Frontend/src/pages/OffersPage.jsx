import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { VerifiedBadge, RatingBadge, WarrantyBadge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
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
	Car,
	RefreshCw,
	Building2,
	ShieldCheck,
	MessageCircle,
} from 'lucide-react'
import { getFullUrl } from '../config/api.js'

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
	const [detailsOffer, setDetailsOffer] = useState(null)
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
				<div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 w-full">
					{/* Mobile-only skeleton — matches new UI */}
					<div className="md:hidden">
						{/* Header */}
						<div className="mb-5">
							<div className="flex items-center justify-between mb-2">
								<Skeleton className="h-8 w-40" />
								<Skeleton className="h-5 w-20" />
							</div>
							<Skeleton className="h-4 w-72 max-w-full" />
						</div>

						{/* Vehicle card */}
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
							<div className="flex items-start gap-3 mb-3">
								<Skeleton className="w-16 h-12 rounded-lg" />
								<div className="flex-1 space-y-2 pt-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-20" />
								</div>
							</div>
							<div className="space-y-1.5 pl-1">
								<Skeleton className="h-3 w-44" />
								<Skeleton className="h-3 w-56 max-w-full" />
							</div>
						</div>

						{/* Status row */}
						<div className="flex items-start gap-2 mb-4 px-1">
							<Skeleton className="w-4 h-4 rounded-full mt-0.5" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-4 w-48 max-w-full" />
								<Skeleton className="h-3 w-60 max-w-full" />
							</div>
						</div>

						{/* Offer cards */}
						<div className="space-y-3">
							{[1, 2, 3].map(i => (
								<div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
									<div className="flex gap-3 mb-3">
										<Skeleton className="w-14 h-14 rounded-xl" />
										<div className="flex-1 space-y-1.5 pt-1">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-40 max-w-full" />
											<Skeleton className="h-3 w-24" />
										</div>
										<div className="text-right space-y-1">
											<Skeleton className="h-5 w-16" />
											<Skeleton className="h-3 w-12" />
										</div>
									</div>
									<Skeleton className="h-3 w-28 mb-3" />
									<div className="flex gap-2">
										<Skeleton className="h-11 w-24 rounded-xl" />
										<Skeleton className="h-11 flex-1 rounded-xl" />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Desktop skeleton (existing) */}
					<div className="hidden md:block space-y-6">
						<div className="mb-8 text-center">
							<Skeleton className="h-10 w-3/4 mx-auto mb-4" />
							<Skeleton className="h-5 w-1/2 mx-auto mb-8" />
							<div className="inline-flex gap-2">
								<Skeleton className="h-10 w-24 rounded-lg" />
								<Skeleton className="h-10 w-24 rounded-lg" />
								<Skeleton className="h-10 w-24 rounded-lg" />
							</div>
						</div>
						<div className="space-y-4">
							{[1, 2, 3].map(i => (
								<div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
									<div className="flex items-center gap-4 mb-4">
										<div className="flex-1">
											<Skeleton className="h-6 w-1/3 mb-2" />
											<Skeleton className="h-8 w-1/4" />
										</div>
									</div>
									<div className="flex gap-4 mb-4 mt-2">
										<Skeleton className="h-6 w-20 rounded-full" />
										<Skeleton className="h-6 w-24 rounded-full" />
										<Skeleton className="h-6 w-32 rounded-full" />
									</div>
									<div className="flex justify-between items-end border-t border-gray-100 pt-4">
										<div>
											<Skeleton className="h-4 w-12 mb-2" />
											<Skeleton className="h-8 w-24" />
										</div>
										<Skeleton className="h-10 w-32 rounded-lg" />
									</div>
								</div>
							))}
						</div>
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

	const vehicle = requestDetails?.vehicleId || requestDetails?.vehicle
	const offerCount = sortedOffers.length

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			<div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 w-full">

				{/* Mobile Header - matches image 4 */}
				<div className="md:hidden mb-5">
					<div className="flex items-center justify-between mb-1">
						<h1 className="text-2xl font-black text-[#05324f]">
							{t('offers_page.your_offers') || 'Your offers'} <span className="text-[#38BC54]">({offerCount})</span>
						</h1>
						<button
							onClick={fetchOffers}
							className="flex items-center gap-1 text-[#38BC54] font-bold text-sm active:opacity-70"
						>
							<RefreshCw size={14} />
							{t('offers_page.refresh') || 'Refresh'}
						</button>
					</div>
					<p className="text-gray-500 text-sm leading-snug">
						{t('offers_page.compare_and_choose_short') || 'Compare and choose the workshop that suits you best.'}
					</p>
				</div>

				{/* Mobile Vehicle Card */}
				{vehicle && (
					<div className="md:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
						<div className="flex items-start gap-3 mb-3">
							<div className="w-16 h-12 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
								{vehicle.image ? (
									<img src={getFullUrl(vehicle.image)} alt={vehicle.make} className="w-full h-full object-cover" />
								) : (
									<Car className="text-gray-300 w-6 h-6" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="text-base font-black text-[#05324f]">
										{vehicle.make} {vehicle.model} {vehicle.year}
									</h3>
									{requestDetails?.registrationNumber && (
										<span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md tracking-wider">
											{requestDetails.registrationNumber}
										</span>
									)}
								</div>
							</div>
						</div>
						<div className="space-y-1.5 pl-1">
							{requestDetails?.postalCode && (
								<div className="flex gap-2 text-xs">
									<span className="text-gray-400 font-bold">{t('offers_page.vehicle_card_postnr') || 'Postal code'}:</span>
									<span className="text-[#05324f] font-semibold">{requestDetails.postalCode}</span>
								</div>
							)}
							{requestDetails?.description && (
								<div className="flex gap-2 text-xs">
									<span className="text-gray-400 font-bold whitespace-nowrap">{t('offers_page.vehicle_card_description') || 'Description'}:</span>
									<span className="text-[#05324f] font-semibold line-clamp-2">{requestDetails.description}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Mobile Status Row */}
				{offerCount > 0 && (
					<div className="md:hidden flex items-start gap-2 mb-4 px-1">
						<CheckCircle size={16} className="text-[#38BC54] mt-0.5 shrink-0" />
						<div className="flex-1">
							<p className="text-sm font-bold text-[#05324f]">
								{offerCount === 1
									? t('offers_page.offers_received_one', { count: 1 })
									: t('offers_page.offers_received', { count: offerCount })}
							</p>
							<p className="text-xs text-gray-400 mt-0.5">
								{t('offers_page.more_offers_coming') || "You'll get more offers if more come in."}
							</p>
						</div>
					</div>
				)}

				{/* Desktop Page Header */}
				<div className="mb-8 text-center hidden md:block">
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
								{/* Mobile skeleton — matches new UI */}
								<div className="md:hidden space-y-3">
									{[1, 2, 3].map(i => (
										<div key={`m-${i}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
											<div className="flex gap-3 mb-3">
												<Skeleton className="w-14 h-14 rounded-xl" />
												<div className="flex-1 space-y-1.5 pt-1">
													<Skeleton className="h-4 w-32" />
													<Skeleton className="h-3 w-40 max-w-full" />
													<Skeleton className="h-3 w-24" />
												</div>
												<div className="text-right space-y-1">
													<Skeleton className="h-5 w-16" />
													<Skeleton className="h-3 w-12" />
												</div>
											</div>
											<Skeleton className="h-3 w-28 mb-3" />
											<div className="flex gap-2">
												<Skeleton className="h-11 w-24 rounded-xl" />
												<Skeleton className="h-11 flex-1 rounded-xl" />
											</div>
										</div>
									))}
								</div>

								{/* Desktop skeleton */}
								<div className="hidden md:block space-y-4">
									{[1, 2, 3].map(i => (
										<div key={`d-${i}`} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
											<div className="flex items-center gap-4 mb-4">
												<div className="flex-1">
													<Skeleton className="h-6 w-1/3 mb-2" />
													<Skeleton className="h-8 w-1/4" />
												</div>
											</div>
											<div className="flex gap-4 mb-4 mt-2">
												<Skeleton className="h-6 w-20 rounded-full" />
												<Skeleton className="h-6 w-24 rounded-full" />
												<Skeleton className="h-6 w-32 rounded-full" />
											</div>
											<div className="flex justify-between items-end border-t border-gray-100 pt-4">
												<div>
													<Skeleton className="h-4 w-12 mb-2" />
													<Skeleton className="h-8 w-24" />
												</div>
												<Skeleton className="h-10 w-32 rounded-lg" />
											</div>
										</div>
									))}
								</div>
							</>
						) : (
							sortedOffers.map((offer, idx) => {
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
								const isBestMatch = idx === 0 && sortBy === 'price' && sortedOffers.length > 1

								return (
									<div
										key={offerId}
										className="bg-white rounded-card border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden max-md:rounded-2xl max-md:border-gray-100 max-md:shadow-sm max-md:border"
									>
										{/* Mobile: Best match badge */}
										{isBestMatch && (
											<div className="md:hidden bg-[#38BC54] text-white text-[10px] font-black tracking-widest text-center py-1.5">
												{t('offers_page.best_match') || 'BEST MATCH'}
											</div>
										)}

										<div className="p-6 max-md:p-4">
											{/* Mobile only: image 4 layout */}
											<div className="flex flex-col md:hidden">
												<div className="flex gap-3 mb-4">
													{/* Black logo box */}
													<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
														{workshop?.image && workshop.image.trim() !== '' ? (
															<img
																src={getFullUrl(workshop.image)}
																alt={workshop?.companyName || 'Workshop'}
																className="w-full h-full object-cover"
																onError={(e) => {
																	e.target.style.display = 'none'
																	e.target.nextElementSibling.style.display = 'flex'
																}}
															/>
														) : null}
														<div className={`w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white font-black text-xs tracking-widest ${workshop?.image && workshop.image.trim() !== '' ? 'hidden' : ''}`}>
															{initials}
														</div>
													</div>

													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-1.5 mb-0.5">
															<h3 className="text-[0.95rem] font-black text-[#05324f] truncate">
																{workshop?.companyName || 'Workshop'}
															</h3>
															{workshop?.isVerified && <ShieldCheck size={14} className="text-[#38BC54] shrink-0" fill="#38BC54" fillOpacity={0.15} />}
														</div>
														{workshopRating != null ? (
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation()
																	const wid = workshop?._id || workshop?.id
																	if (wid) navigate(`/workshop/${wid}/reviews`, { state: { workshopName: workshop.companyName } })
																}}
																className="flex items-center gap-1 -mx-0.5 px-0.5 rounded hover:bg-gray-50 active:opacity-70 transition-colors"
															>
																<div className="flex gap-0.5">
																	{[...Array(5)].map((_, i) => (
																		<Star
																			key={i}
																			size={11}
																			fill={i < Math.floor(workshopRating) ? '#FFB800' : 'none'}
																			className={i < Math.floor(workshopRating) ? 'text-[#FFB800]' : 'text-gray-200'}
																		/>
																	))}
																</div>
																<span className="text-[11px] font-bold text-[#05324f] ml-0.5">{workshopRating.toFixed(1)}</span>
																{reviewCount != null && (
																	<span className="text-[11px] text-[#38BC54] font-bold underline-offset-2 hover:underline">({reviewCount} {t('offers_page.reviews') || 'reviews'})</span>
																)}
															</button>
														) : (
															<div className="flex gap-0.5">
																{[...Array(5)].map((_, i) => (
																	<Star key={i} size={11} className="text-gray-200" />
																))}
															</div>
														)}
													</div>

													{/* Price top right */}
													<div className="text-right shrink-0">
														<div className="text-base font-black text-[#05324f] leading-none">
															{formatPrice(offer.price)}
														</div>
														<div className="text-[10px] text-gray-400 font-bold mt-0.5">{t('offers_page.incl_vat') || 'incl. VAT'}</div>
													</div>
												</div>

												{distance != null && (
													<div className="text-[11px] text-gray-500 font-semibold mb-3 flex items-center gap-1">
														<MapPin size={11} className="text-gray-400" />
														{distance.toFixed(1)} km {t('offers_page.from_you')}
													</div>
												)}

												{offer.status !== 'ACCEPTED' ? (
													<div className="flex gap-2">
														<button
															onClick={() => setDetailsOffer(offer)}
															className="shrink-0 px-4 h-11 border-2 border-[#38BC54] text-[#38BC54] rounded-xl font-black text-sm hover:bg-[#F2F9F4] active:scale-[0.98] transition-all"
														>
															{t('offers_page.show_details') || 'Show details'}
														</button>
														<Button
															onClick={() => handleAcceptOffer(offer)}
															className="flex-1 h-11 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm"
														>
															{t('offers_page.choose_workshop') || 'Choose workshop'}
															<ArrowRight size={16} />
														</Button>
													</div>
												) : (
													<span className="inline-flex w-full justify-center items-center gap-1.5 bg-green-50 text-green-700 font-bold text-xs px-4 py-3 rounded-xl border border-green-200">
														<CheckCircle size={14} />
														{t('offers_page.accepted')}
													</span>
												)}
											</div>

											<div className="md:block hidden">
												<div className="flex items-center gap-4 mb-5">
													<div className="relative shrink-0">
														{workshop?.image && workshop.image.trim() !== '' ? (
															<img
																src={getFullUrl(workshop.image)}
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

				{/* Mobile Help Footer */}
				{sortedOffers.length > 0 && (
					<div className="md:hidden mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<MessageCircle className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-black text-[#05324f]">{t('offers_page.need_help') || 'Need help?'}</p>
							<p className="text-[11px] text-gray-400 font-semibold leading-tight">{t('offers_page.need_help_subtitle') || "We're here if you have any questions."}</p>
						</div>
						<a
							href="mailto:info@fixa2an.se"
							className="px-3 py-2 border border-[#38BC54] rounded-lg text-[#38BC54] text-xs font-black active:scale-95 transition-transform"
						>
							{t('offers_page.contact_us') || 'Contact us'}
						</a>
					</div>
				)}
			</div>
			<Footer />

			{/* Offer Details Modal */}
			<Dialog open={!!detailsOffer} onOpenChange={(o) => !o && setDetailsOffer(null)}>
				<DialogContent
					onClose={() => setDetailsOffer(null)}
					className="w-[92vw] max-w-md p-0 overflow-y-auto max-h-[90vh] bg-white rounded-2xl shadow-2xl"
				>
					{detailsOffer && (() => {
						const ws = detailsOffer.workshopId || detailsOffer.workshop || {}
						const initials = (ws.companyName || 'W').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
						const inclusionItems = (detailsOffer.inclusions || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
						return (
							<>
								<div className="px-6 pt-6 pb-4 border-b border-gray-100">
									<DialogTitle>{t('offers_page.offer_details') || 'Offer Details'}</DialogTitle>
								</div>

								<div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100">
									<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
										{ws.image ? (
											<img src={getFullUrl(ws.image)} alt={ws.companyName} className="w-full h-full object-cover" />
										) : (
											<span className="text-white/70 font-black text-xs tracking-widest">{initials}</span>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-base font-black text-[#05324f] truncate">{ws.companyName || 'Workshop'}</h3>
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
												<span className="font-bold text-[#05324f]">{Number(ws.rating).toFixed(1)}</span>
												{ws.reviewCount != null && <span className="text-[#38BC54] font-bold underline-offset-2 hover:underline">({ws.reviewCount})</span>}
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
									<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{t('offers_page.price_breakdown') || 'Price breakdown'}</p>
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
										<span className="font-black text-[#05324f]">{t('offers_page.total') || 'Total'}</span>
										<div className="text-right">
											<div className="text-lg font-black text-[#38BC54] leading-none">{formatPrice(detailsOffer.price)}</div>
											<div className="text-[10px] text-gray-400 font-bold mt-0.5">{t('offers_page.incl_vat') || 'incl. VAT'}</div>
										</div>
									</div>
								</div>

								{inclusionItems.length > 0 && (
									<div className="px-6 py-4 border-b border-gray-100">
										<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">{t('offers_page.included_services') || "What's included"}</p>
										<div className="space-y-1.5">
											{inclusionItems.map((item, i) => (
												<div key={i} className="flex items-start gap-2">
													<CheckCircle size={12} className="text-[#38BC54] mt-0.5 shrink-0" />
													<span className="text-xs text-[#05324f] font-semibold leading-snug">{item}</span>
												</div>
											))}
										</div>
									</div>
								)}

								{detailsOffer.note && (
									<div className="px-6 py-4 border-b border-gray-100">
										<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">{t('offers_page.notes') || 'Notes'}</p>
										<p className="text-xs text-[#05324f]/80 font-semibold leading-snug italic">{detailsOffer.note}</p>
									</div>
								)}

								<div className="p-5">
									<Button
										onClick={() => { setDetailsOffer(null); handleAcceptOffer(detailsOffer) }}
										className="w-full h-12 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm"
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
		</div>
	)
}
