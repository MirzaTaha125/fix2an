import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Star, ArrowLeft, MessageSquare, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { workshopAPI } from '../services/api'

export default function WorkshopReviewsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [reviews, setReviews] = useState([])
	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState({ rating: 0, reviewCount: 0 })

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') navigate('/admin', { replace: true })
				else navigate('/my-cases', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchReviews()
			fetchStats()
		}
	}, [user])

	const fetchReviews = async () => {
		try {
			const response = await workshopAPI.getReviews()
			if (response.data) {
				setReviews(Array.isArray(response.data) ? response.data : [])
			}
		} catch (error) {
			console.error('Failed to fetch reviews:', error)
			toast.error(t('workshop.reviews.fetch_error') || 'Failed to load reviews')
			setReviews([])
		} finally {
			setLoading(false)
		}
	}

	const fetchStats = async () => {
		try {
			const response = await workshopAPI.getStats()
			if (response.data) {
				setStats({
					rating: response.data.rating || 0,
					reviewCount: response.data.reviewCount || 0,
				})
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error)
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center">
					<div className="w-14 h-14 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
				{/* Header */}
				<div className="mb-8">
					<Link
						to="/workshop/profile"
						className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="w-4 h-4" />
						{t('workshop.reviews.back_to_profile') || 'Back to Profile'}
					</Link>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
						{t('workshop.reviews.title') || 'Your Reviews'}
					</h1>
					<p className="text-gray-600 mt-1">
						{t('workshop.reviews.subtitle') || 'All customer reviews for your workshop'}
					</p>
					{/* Summary */}
					<div className="flex items-center gap-6 mt-6">
						<div className="flex items-center gap-2">
							<div className="flex">
								{[1, 2, 3, 4, 5].map((star) => (
									<Star
										key={star}
										className={`w-5 h-5 ${
											star <= Math.round(stats.rating)
												? 'text-green-500 fill-green-500'
												: 'text-gray-300'
										}`}
									/>
								))}
							</div>
							<span className="text-lg font-bold text-gray-900">
								{stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
							</span>
						</div>
						<span className="text-gray-500">
							{stats.reviewCount} {stats.reviewCount === 1
								? (t('workshop.reviews.review') || 'review')
								: (t('workshop.reviews.reviews') || 'reviews')}
						</span>
					</div>
				</div>

				{/* Reviews List */}
				{reviews.length === 0 ? (
					<Card className="border border-gray-200 bg-white">
						<CardContent className="py-16 text-center">
							<MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{t('workshop.reviews.no_reviews') || 'No reviews yet'}
							</h3>
							<p className="text-gray-500 max-w-sm mx-auto">
								{t('workshop.reviews.no_reviews_desc') || 'Complete jobs and get feedback from customers to see reviews here.'}
							</p>
							<Link to="/workshop/profile" className="inline-block mt-6">
								<Button variant="outline">{t('workshop.reviews.back_to_profile') || 'Back to Profile'}</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{reviews.map((review) => {
							const customerName = review.customerId?.name || 'Customer'
							const createdAt = review.createdAt
								? new Date(review.createdAt).toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
								  })
								: ''
							return (
								<Card key={review._id || review.id} className="border border-gray-200 bg-white shadow-sm">
									<CardContent className="p-6">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
														<User className="w-4 h-4 text-green-600" />
													</div>
													<div>
														<p className="font-semibold text-gray-900">{customerName}</p>
														{createdAt && (
															<p className="text-xs text-gray-500">{createdAt}</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 mb-3">
													{[1, 2, 3, 4, 5].map((star) => (
														<Star
															key={star}
															className={`w-4 h-4 ${
																star <= (review.rating || 0)
																	? 'text-green-500 fill-green-500'
																	: 'text-gray-300'
															}`}
														/>
													))}
													<span className="ml-2 text-sm font-medium text-gray-700">
														{review.rating}/5
													</span>
												</div>
												{review.comment && (
													<p className="text-gray-700 text-sm leading-relaxed">
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
