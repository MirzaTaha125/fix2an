import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { VerifiedBadge, RatingBadge, WarrantyBadge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-14 h-14 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-500 font-medium">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') return null

	const sortedOffers = [...offers].sort((a, b) => {
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
				<div className="mb-8 text-center">
					<h1 className="text-h1 font-bold text-[#05324f] mb-2">
						{sortedOffers.length === 1
							? t('offers_page.found_workshops_near_you', { count: 1 })
							: t('offers_page.found_workshops_near_you_plural', { count: sortedOffers.length })}
					</h1>
					<p className="text-gray-500 text-base mb-7">
						{t('offers_page.compare_and_choose')}
					</p>

					{/* Sort Tabs */}
					<div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1">
						{SORT_OPTIONS.map(({ key, labelKey }) => (
							<button
								key={key}
								onClick={() => handleSort(key)}
								className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
									sortBy === key
										? 'bg-[#34C759] text-white shadow-sm'
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
							<div className="text-center py-12">
								<div className="w-8 h-8 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-2"></div>
								<p className="text-small text-gray-400">{t('common.loading')}</p>
							</div>
						) : (
							sortedOffers.map((offer) => {
								const offerId = offer._id || offer.id
								const workshop = offer.workshopId || offer.workshop
								const workshopRating = workshop?.rating || null
								const reviewCount = workshop?.reviewCount || null
								const distance = offer.distance != null ? offer.distance : null
								const estimatedDuration = offer.estimatedDuration || null
								const warranty = offer.warranty || null

								return (
									<div
										key={offerId}
										className="bg-white rounded-card border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
									>
										<div className="p-6">
											{/* Top row: name + verified badge */}
											<div className="flex flex-wrap items-center gap-2 mb-3">
												<h3 className="text-lg font-bold text-[#05324f]">
													{workshop?.companyName || 'Workshop'}
												</h3>
												{workshop?.isVerified && <VerifiedBadge />}
											</div>

											{/* Meta row: rating, distance, duration, warranty */}
											<div className="flex flex-wrap items-center gap-2 mb-5">
												{workshopRating != null && (
													<RatingBadge
														rating={workshopRating.toFixed(1)}
														count={reviewCount}
													/>
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
														{estimatedDuration >= 60
															? `${Math.round(estimatedDuration / 60)} ${t('offers_page.hours_fix')}`
															: `${estimatedDuration} ${t('offers_page.minutes')}`}
													</span>
												)}
												{warranty && <WarrantyBadge text={warranty} />}
											</div>

											{/* Note */}
											{offer.note && (
												<p className="text-small text-gray-500 italic mb-5 leading-relaxed border-l-2 border-gray-100 pl-3">
													{offer.note}
												</p>
											)}

											{/* Price + CTA row */}
											<div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
												<div>
													<p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
														{t('offers_page.price') || 'Price'}
													</p>
													<p className="text-3xl font-bold text-[#34C759] leading-none">
														{formatPrice(offer.price)}
													</p>
												</div>

												{offer.status !== 'ACCEPTED' ? (
													<Button
														onClick={() => handleAcceptOffer(offer)}
														className="flex items-center gap-2 shrink-0"
													>
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
