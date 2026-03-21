import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Star, ArrowLeft, MessageSquare, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { reviewsAPI } from '../services/api'

export default function CustomerWorkshopReviewsPage() {
	const navigate = useNavigate()
	const { id } = useParams()
	const location = useLocation()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [reviews, setReviews] = useState([])
	const [loading, setLoading] = useState(true)

	// Extract workshop details passed natively through router state
	const workshopName = location.state?.workshopName || t('customer_reviews.generic_workshop') || 'Workshop'

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				if (user.role === 'ADMIN') navigate('/admin', { replace: true })
				else navigate('/my-cases', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (user && user.role === 'CUSTOMER' && id) {
			fetchReviews()
		}
	}, [user, id])

	const fetchReviews = async () => {
		try {
			const response = await reviewsAPI.getByWorkshop(id)
			if (response.data) {
				setReviews(Array.isArray(response.data) ? response.data : [])
			}
		} catch (error) {
			console.error('Failed to fetch reviews:', error)
			toast.error(t('customer_reviews.fetch_error') || 'Failed to load reviews')
			setReviews([])
		} finally {
			setLoading(false)
		}
	}

	// Calculate active stats
	const averageRating = reviews.length > 0 
		? (reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length) 
		: 0

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full space-y-6">
					<div className="mb-8">
						<Skeleton className="h-4 w-28 mb-4 rounded-lg" />
						<Skeleton className="h-8 w-64 mb-2 rounded-lg" />
						<Skeleton className="h-5 w-48 mb-6 rounded-lg" />

						<div className="flex items-center gap-6 mt-6">
							<Skeleton className="h-8 w-32 rounded-lg" />
							<Skeleton className="h-5 w-24 rounded-lg" />
						</div>
					</div>

					<div className="space-y-4">
						{[1, 2, 3].map(i => (
							<div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<Skeleton className="w-10 h-10 rounded-full" />
												<div>
													<Skeleton className="h-5 w-32 mb-1 rounded-lg" />
													<Skeleton className="h-3 w-20 rounded-lg" />
												</div>
											</div>
											<Skeleton className="w-16 h-6 rounded-md" />
										</div>
										<div className="mt-3">
											<Skeleton className="h-4 w-full mb-1.5 rounded-lg" />
											<Skeleton className="h-4 w-5/6 mb-1.5 rounded-lg" />
											<Skeleton className="h-4 w-2/3 rounded-lg" />
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						{t('customer_reviews.back_to_booking') || 'Back to Details'}
					</button>
					<h1 className="text-2xl sm:text-3xl font-bold text-[#05324f]">
						{workshopName} {t('customer_reviews.title') || 'Reviews'}
					</h1>
					<p className="text-gray-600 mt-1">
						{t('customer_reviews.subtitle') || 'Read what other customers have to say'}
					</p>

					{/* Summary */}
					<div className="flex items-center gap-6 mt-6">
						<div className="flex items-center gap-2">
							<div className="flex">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className={`w-5 h-5 ${
											star <= Math.round(averageRating)
												? 'text-yellow-400 fill-yellow-400'
												: 'text-gray-300'
										}`}
									/>
								))}
							</div>
							<span className="text-lg font-bold text-[#05324f]">
								{averageRating > 0 ? averageRating.toFixed(1).replace('.', ',') : '—'}
							</span>
						</div>
						<span className="text-gray-500">
							{reviews.length} {reviews.length === 1
								? (t('customer_reviews.review') || 'review')
								: (t('customer_reviews.reviews') || 'reviews')}
						</span>
					</div>
				</div>

				{/* Reviews List */}
				{reviews.length === 0 ? (
					<Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
						<CardContent className="py-16 text-center">
							<MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
							<h3 className="text-xl font-bold text-[#05324f] mb-2">
								{t('customer_reviews.no_reviews') || 'No reviews yet'}
							</h3>
							<p className="text-gray-500 max-w-sm mx-auto">
								{t('customer_reviews.no_reviews_desc') || 'This workshop has not received any reviews yet.'}
							</p>
							<Button onClick={() => navigate(-1)} className="mt-6 bg-[#34C759] hover:bg-[#2eaa4e] text-white">
								{t('customer_reviews.back_to_booking') || 'Back to Details'}
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{reviews.map((review) => {
							const customerName = review.customerId?.name || t('customer_reviews.anonymous_customer') || 'Customer'
							const createdAt = review.createdAt
								? new Date(review.createdAt).toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
								  })
								: ''
							return (
								<Card key={review._id || review.id} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
									<CardContent className="p-6">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
															<User className="w-5 h-5 text-gray-500" />
														</div>
														<div>
															<p className="font-semibold text-[#05324f]">{customerName}</p>
															{createdAt && (
																<p className="text-xs text-gray-500">{createdAt}</p>
															)}
														</div>
													</div>
													<div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
														<Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
														<span className="text-sm font-semibold text-[#05324f]">
															{review.rating ? review.rating.toFixed(1).replace('.', ',') : '0,0'}
														</span>
													</div>
												</div>
												{review.comment && (
													<p className="text-gray-700 text-sm leading-relaxed mt-2 p-3 bg-gray-50/80 rounded-lg border border-gray-100">
														{review.comment}
													</p>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}
			</div>
			<Footer />
		</div>
	)
}
