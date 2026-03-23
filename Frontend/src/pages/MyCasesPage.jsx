import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import {
	Car,
	Clock,
	Star,
	Eye,
	MessageSquare,
	Calendar,
	CheckCircle,
	XCircle,
	AlertCircle,
	X,
	RotateCcw,
	Building2,
	Camera,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, bookingsAPI, reviewsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function MyCasesPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('my_cases')
	const [reviewModalOpen, setReviewModalOpen] = useState(false)
	const [selectedRequestForReview, setSelectedRequestForReview] = useState(null)
	const [rating, setRating] = useState(0)
	const [reviewText, setReviewText] = useState('')
	const [isSubmittingReview, setIsSubmittingReview] = useState(false)
	const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
	const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null)
	const [newScheduledDate, setNewScheduledDate] = useState('')
	const [newScheduledTime, setNewScheduledTime] = useState('')
	const [isRescheduling, setIsRescheduling] = useState(false)
	const [isCancelling, setIsCancelling] = useState(false)
	const [isCompleting, setIsCompleting] = useState(false)
	const [bookingToCancel, setBookingToCancel] = useState(null)
	const [bookingToComplete, setBookingToComplete] = useState(null)
	const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
	const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
	const [completeRating, setCompleteRating] = useState(0)
	const [completeReviewText, setCompleteReviewText] = useState('')

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
				return
			}
			if (user.role === 'ADMIN') {
				navigate('/admin', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	const fetchRequests = async () => {
		if (!user || user.role !== 'CUSTOMER') return

		try {
			const response = await requestsAPI.getByCustomer(user.id || user._id)
			if (response.data) {
				setRequests(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			toast.error(t('my_cases.fetch_error'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'CUSTOMER') {
			fetchRequests()
		}
	}, [user])

	const handleSubmitReview = async () => {
		if (!rating || !reviewText.trim() || !selectedRequestForReview) {
			toast.error(t('my_cases.review_required') || 'Please provide both rating and review text')
			return
		}

		const doneBooking = selectedRequestForReview.bookings?.find(b => b.status === 'DONE')
		if (!doneBooking) {
			toast.error(t('my_cases.review_no_booking') || 'No completed booking found for this request')
			return
		}

		setIsSubmittingReview(true)
		try {
			await reviewsAPI.create({
				bookingId: doneBooking._id || doneBooking.id,
				rating,
				comment: reviewText.trim(),
			})
			toast.success(t('my_cases.review_submitted') || 'Review submitted successfully!')
			setReviewModalOpen(false)
			setSelectedRequestForReview(null)
			setRating(0)
			setReviewText('')
			fetchRequests()
		} catch (error) {
			const msg = error.response?.data?.message || t('my_cases.review_error') || 'Failed to submit review'
			toast.error(msg)
		} finally {
			setIsSubmittingReview(false)
		}
	}

	const handleCancelJob = async () => {
		if (!bookingToCancel) return

		setIsCancelling(true)
		try {
			const bookingId = bookingToCancel._id || bookingToCancel.id
			await bookingsAPI.cancel(bookingId)
			toast.success(t('my_cases.job_cancelled_success') || 'Job cancelled successfully')
			setCancelConfirmOpen(false)
			setBookingToCancel(null)
			fetchRequests() // Refresh the requests
		} catch (error) {
			console.error('Failed to cancel job:', error)
			toast.error(t('my_cases.job_cancel_error') || 'Failed to cancel job')
		} finally {
			setIsCancelling(false)
		}
	}

	const handleRescheduleJob = async () => {
		if (!selectedBookingForReschedule || !newScheduledDate || !newScheduledTime) {
			toast.error(t('my_cases.reschedule_date_required') || 'Please select both date and time')
			return
		}

		setIsRescheduling(true)
		try {
			const bookingId = selectedBookingForReschedule._id || selectedBookingForReschedule.id
			const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`)
			
			await bookingsAPI.reschedule(bookingId, scheduledAt.toISOString())
			toast.success(t('my_cases.job_rescheduled_success') || 'Job rescheduled successfully')
			setRescheduleModalOpen(false)
			setSelectedBookingForReschedule(null)
			setNewScheduledDate('')
			setNewScheduledTime('')
			fetchRequests() // Refresh the requests
		} catch (error) {
			console.error('Failed to reschedule job:', error)
			toast.error(t('my_cases.job_reschedule_error') || 'Failed to reschedule job')
		} finally {
			setIsRescheduling(false)
		}
	}

	const openRescheduleModal = (booking) => {
		setSelectedBookingForReschedule(booking)
		if (booking.scheduledAt) {
			const date = new Date(booking.scheduledAt)
			setNewScheduledDate(date.toISOString().split('T')[0])
			setNewScheduledTime(date.toTimeString().slice(0, 5))
		}
		setRescheduleModalOpen(true)
	}

	const openCancelConfirm = (booking) => {
		setBookingToCancel(booking)
		setCancelConfirmOpen(true)
	}

	const handleCompleteJob = async () => {
		if (!bookingToComplete) return

		// Validate rating and review
		if (!completeRating || completeRating < 1 || completeRating > 5) {
			toast.error(t('my_cases.rating_required') || 'Please provide a rating (1-5 stars)')
			return
		}

		if (!completeReviewText.trim()) {
			toast.error(t('my_cases.review_text_required') || 'Please provide a review')
			return
		}

	setIsCompleting(true)
	try {
		const bookingId = bookingToComplete._id || bookingToComplete.id

		// Mark the booking as DONE first — review endpoint requires status DONE
		await bookingsAPI.complete(bookingId)

		// Then submit the review (workshopId is derived from the booking on the server)
		try {
			await reviewsAPI.create({
				bookingId,
				rating: completeRating,
				comment: completeReviewText.trim(),
			})
		} catch (reviewError) {
			console.error('Failed to submit review:', reviewError)
			// Job is already completed — continue and show partial success
		}

		toast.success(t('my_cases.job_completed_success') || 'Job marked as completed successfully')
		setCompleteConfirmOpen(false)
		setBookingToComplete(null)
		setCompleteRating(0)
		setCompleteReviewText('')
		fetchRequests()
	} catch (error) {
		console.error('Failed to complete job:', error)
		toast.error(t('my_cases.job_complete_error') || 'Failed to complete job')
	} finally {
		setIsCompleting(false)
	}
	}

	const openCompleteConfirm = (booking) => {
		setBookingToComplete(booking)
		setCompleteRating(0)
		setCompleteReviewText('')
		setCompleteConfirmOpen(true)
	}

	// Show loading state while checking auth
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				{t('common.loading')}
			</div>
		)
	}

	// If not authenticated or wrong role, redirect will happen
	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	const getStatusBadge = (status) => {
		const statusMap = {
			NEW: { label: t('my_cases.status.new'), variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
			IN_BIDDING: { label: t('my_cases.status.in_bidding'), variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
			BIDDING_CLOSED: { label: t('my_cases.status.bidding_closed'), variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
			BOOKED: { label: t('my_cases.status.booked'), variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
			COMPLETED: { label: t('my_cases.status.completed'), variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
			CANCELLED: { label: t('my_cases.status.cancelled'), variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
		EXPIRED: { label: 'Expired', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
		}

		const statusInfo = statusMap[status] || {
			label: status,
			variant: 'default',
			className: 'bg-gray-100 text-gray-800 border-gray-200',
		}

		return (
			<Badge variant={statusInfo.variant} className={`${statusInfo.className} text-xs sm:text-sm`}>
				{statusInfo.label}
			</Badge>
		)
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'NEW':
			case 'IN_BIDDING':
				return <Clock className="w-4 h-4" />
			case 'BIDDING_CLOSED':
				return <AlertCircle className="w-4 h-4" />
			case 'BOOKED':
				return <Calendar className="w-4 h-4" />
			case 'COMPLETED':
				return <CheckCircle className="w-4 h-4" />
			case 'CANCELLED':
				return <XCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-28 flex-1 w-full">
					<div className="mb-8">
						<h1 className="text-xl font-bold text-gray-900 mb-2">{t('my_cases.title') || 'My Cases'}</h1>
						<p className="text-gray-500">{t('my_cases.subtitle')}</p>
					</div>
					
					{/* Skeleton Tabs */}
					<div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={`tab-${i}`} className="h-10 w-24 sm:w-32 rounded-full flex-shrink-0" />
						))}
					</div>

					{/* Skeleton List */}
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={`case-skel-${i}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-4">
								<div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
									<div className="space-y-3 flex-1 w-full">
										<div className="flex justify-between sm:justify-start items-center gap-3">
											<Skeleton className="h-6 w-3/4 max-w-[200px]" />
											<Skeleton className="h-6 w-20 rounded-full sm:hidden" />
										</div>
										<Skeleton className="h-4 w-1/2 max-w-[150px]" />
										<Skeleton className="h-4 w-[90%] sm:w-[80%] max-w-[400px]" />
										<Skeleton className="h-4 w-[70%] max-w-[300px] mt-1" />
									</div>
									<div className="hidden sm:flex flex-col items-end gap-3 shrink-0">
										<Skeleton className="h-6 w-24 rounded-full" />
										<Skeleton className="h-10 w-28 rounded-md" />
									</div>
								</div>
								<div className="border-t border-gray-100 pt-4 flex gap-3 mt-4">
									<Skeleton className="h-10 w-full sm:w-1/4 rounded-md" />
									<Skeleton className="h-10 w-full sm:w-1/4 rounded-md hidden sm:block" />
								</div>
							</div>
						))}
					</div>
				</div>
				
				<Footer />
			</div>
		)
	}

	// Filter requests based on active tab
	const filteredRequests = requests.filter((request) => {
		const bookings = request.bookings || []
		
		if (activeTab === 'my_cases') {
			// Show active requests (NEW, IN_BIDDING, BIDDING_CLOSED) - exclude CANCELLED
			return ['NEW', 'IN_BIDDING', 'BIDDING_CLOSED'].includes(request.status)
		} else if (activeTab === 'booked_cases') {
			// Show only booked requests (not rescheduled or cancelled)
			return request.status === 'BOOKED' && 
				!bookings.some(b => b.status === 'RESCHEDULED' || b.status === 'CANCELLED')
		} else if (activeTab === 'completed_cases') {
			// Show only completed requests where booking status is DONE (job actually completed from booked cases)
			return request.status === 'COMPLETED' && 
				bookings.some(b => b.status === 'DONE')
		} else if (activeTab === 'cancelled_cases') {
			// Show cancelled requests or requests with cancelled bookings
			return request.status === 'CANCELLED' || 
				bookings.some(b => b.status === 'CANCELLED')
		} else if (activeTab === 'rescheduled_cases') {
			// Show requests with rescheduled bookings
			return bookings.some(b => b.status === 'RESCHEDULED')
		}
		return false
	})

	return (
	<div className="min-h-screen bg-gray-50 flex flex-col">
		<Navbar />
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-28 flex-1 w-full">
			{/* Header */}
			<div className="mb-8">
				<div className="flex flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex-1 max-md:flex-1">
						<h1 className="text-xl font-bold mb-1.5 text-[#05324f] max-md:text-xl">
							{t('my_cases.title')}
						</h1>
						<p className="text-base text-gray-500 max-md:text-sm">
							{t('my_cases.subtitle')}
						</p>
					</div>
					<Link to="/upload" className="self-start sm:self-auto shrink-0">
						<Button>
							<span className="md:hidden">{t('my_cases.upload_case')}</span>
							<span className="hidden md:inline">{t('my_cases.upload_new_protocol')}</span>
						</Button>
					</Link>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="flex flex-col gap-2 mb-6">
				<div className="grid grid-cols-3 gap-2">
					{[
						{ key: 'my_cases', label: t('my_cases.my_cases_tab') || 'My Cases' },
						{ key: 'booked_cases', label: t('my_cases.booked_cases_tab') || 'Booked' },
						{ key: 'completed_cases', label: t('my_cases.completed_cases_tab') || 'Completed' },
					].map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`px-2 py-2 rounded-btn text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
								activeTab === key
									? 'bg-[#34C759] text-white shadow-sm'
									: 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-[#05324f]'
							}`}
						>
							{label}
						</button>
					))}
				</div>
				<div className="grid grid-cols-2 gap-2">
					{[
						{ key: 'cancelled_cases', label: t('my_cases.cancelled_cases_tab') || 'Cancelled' },
						{ key: 'rescheduled_cases', label: t('my_cases.rescheduled_cases_tab') || 'Rescheduled' },
					].map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`px-2 py-2 rounded-btn text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
								activeTab === key
									? 'bg-[#34C759] text-white shadow-sm'
									: 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-[#05324f]'
							}`}
						>
							{label}
						</button>
					))}
				</div>
			</div>

				{filteredRequests.length === 0 ? (
					<Card className="border-0 shadow-xl overflow-hidden">
						<CardContent className="text-center py-12 sm:py-16 px-4 bg-white">
							<div className="relative inline-block mb-2">
								{/* Removed the animated glowing background and large icon */}
							</div>
							<h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
									{activeTab === 'completed_cases' 
									? (t('my_cases.no_completed_cases.title') || 'No Completed Cases')
									: activeTab === 'booked_cases'
									? (t('my_cases.no_booked_cases.title') || 'No Booked Cases')
									: activeTab === 'cancelled_cases'
									? (t('my_cases.no_cancelled_cases.title') || 'No Cancelled Cases')
									: activeTab === 'rescheduled_cases'
									? (t('my_cases.no_rescheduled_cases.title') || 'No Rescheduled Cases')
									: t('my_cases.no_cases.title')
								}
							</h3>
							<p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
								{activeTab === 'completed_cases'
									? (t('my_cases.no_completed_cases.description') || 'You haven\'t completed any jobs yet.')
									: activeTab === 'booked_cases'
									? (t('my_cases.no_booked_cases.description') || 'You don\'t have any booked appointments yet.')
									: activeTab === 'cancelled_cases'
									? (t('my_cases.no_cancelled_cases.description') || 'You don\'t have any cancelled cases.')
									: activeTab === 'rescheduled_cases'
									? (t('my_cases.no_rescheduled_cases.description') || 'You don\'t have any rescheduled appointments.')
									: t('my_cases.no_cases.description')
								}
							</p>
							{activeTab === 'my_cases' && (
								<Link to="/upload" className="inline-block">
									<Button 
										size="default" 
										className="shadow-md hover:shadow-lg transition-all text-sm sm:text-base font-semibold"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										<Car className="w-4 h-4 mr-2" />
										{t('my_cases.no_cases.button')}
									</Button>
								</Link>
							)}
						</CardContent>
					</Card>
				) : (
					<div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-md:rounded-xl max-md:shadow-none max-md:space-y-3 max-md:border-0 max-md:bg-transparent">
						{filteredRequests.map((request, index) => {
							// Handle both MongoDB _id and id formats
							const requestId = request._id || request.id
							const vehicle = request.vehicleId || request.vehicle
							const offers = request.offers || []
							const bookings = request.bookings || []
							const requestDate = request.createdAt ? new Date(request.createdAt).toLocaleString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
								hour: 'numeric',
								minute: '2-digit',
								hour12: true
							}) : ''

							return (
								<div
									key={requestId}
									className={`grid grid-cols-1 md:grid-cols-3 items-start py-3 px-3 sm:px-6 gap-4 relative max-md:bg-white max-md:rounded-xl max-md:border max-md:border-gray-200 max-md:p-4 max-md:shadow-none ${index !== filteredRequests.length - 1 ? 'border-b border-gray-200 md:border-b' : ''} max-md:border-b-0`}
								>
									{/* Badge in Top Right Corner - Mobile Only */}
									<div className="absolute top-3 right-3 md:hidden">
										{getStatusBadge(request.status)}
									</div>

									{/* Left: Title, Date, Description */}
									<div className="min-w-0 pr-20 md:pr-0">
										{/* Title (Vehicle Name) */}
										<h3 className="text-xl font-bold mb-1" style={{ color: '#05324f' }}>
											{vehicle?.make} {vehicle?.model}-{vehicle?.year}
										</h3>
										{/* Date */}
										{requestDate && (
											<p className="text-xs mb-1" style={{ color: '#05324f' }}>{requestDate}</p>
										)}
										{/* Description */}
										<p className="text-xs sm:text-sm" style={{ color: '#05324f' }}>
											{request.description || t('my_cases.no_description') || 'No description provided'}
										</p>
									</div>

									{/* Center: Case Details (Offers Count, Workshop Info, etc.) */}
									<div className="min-w-0">
										{/* Mobile: Flex layout with button opposite to offer count */}
										<div className="flex flex-row items-center justify-between gap-2 md:hidden">
											{/* Ongoing Requests - Show Offers Count */}
											{activeTab !== 'booked_cases' && activeTab !== 'completed_cases' && activeTab !== 'cancelled_cases' && activeTab !== 'rescheduled_cases' && (
												<p className="text-xs" style={{ color: '#05324f' }}>
													{offers.length === 0 
														? t('my_cases.no_offers')
														: `${offers.length} available offer${offers.length !== 1 ? 's' : ''}`
													}
												</p>
											)}
											
											{/* Show Offer List Button - Opposite to Offer Count (Mobile Only) */}
											{(request.status === 'IN_BIDDING' || request.status === 'BIDDING_CLOSED' || request.status === 'NEW') && (
												<Link to={`/offers?requestId=${requestId}`} className="w-auto">
													<Button 
														size="sm" 
														className="px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
														style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
													>
														Show offer list
													</Button>
												</Link>
											)}
										</div>
										
										{/* Desktop: Original layout */}
										<div className="hidden md:block">
											{/* Ongoing Requests - Show Offers Count */}
											{activeTab !== 'booked_cases' && activeTab !== 'completed_cases' && activeTab !== 'cancelled_cases' && activeTab !== 'rescheduled_cases' && (
												<p className="text-sm" style={{ color: '#05324f' }}>
													{offers.length === 0 
														? t('my_cases.no_offers')
														: `${offers.length} available offer${offers.length !== 1 ? 's' : ''}`
													}
												</p>
											)}
										</div>

										{/* Booked Cases - Show Workshop Info */}
										{activeTab === 'booked_cases' && request.status === 'BOOKED' && bookings.length > 0 && bookings[0].workshopId && (
											<div>
												<p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: '#05324f' }}>
													{bookings[0].workshopId?.companyName || 'Workshop'}
												</p>
												{bookings[0].scheduledAt && (
													<p className="text-xs" style={{ color: '#05324f' }}>
														{formatDate(new Date(bookings[0].scheduledAt))}
													</p>
												)}
											</div>
										)}

										{/* Completed Cases - Show Workshop Name */}
										{activeTab === 'completed_cases' && request.status === 'COMPLETED' && bookings.length > 0 && bookings.some(b => b.status === 'DONE') && (
											<div>
												{(() => {
													const completedBooking = bookings.find(b => b.status === 'DONE') || bookings[0]
													const workshop = completedBooking?.workshopId || bookings[0]?.workshopId
													
													return (
														<p className="text-xs sm:text-sm font-semibold" style={{ color: '#05324f' }}>
															{workshop?.companyName || 'Workshop'}
														</p>
													)
												})()}
											</div>
										)}

										{/* Rescheduled Cases - Show Workshop and Date */}
										{activeTab === 'rescheduled_cases' && bookings.length > 0 && bookings.some(b => b.status === 'RESCHEDULED') && (
											<div>
												{bookings.filter(b => b.status === 'RESCHEDULED').map((booking, idx) => (
													<div key={idx}>
														{booking.workshopId && (
															<p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: '#05324f' }}>
																{booking.workshopId?.companyName || 'Workshop'}
															</p>
														)}
														{booking.scheduledAt && (
															<p className="text-xs" style={{ color: '#05324f' }}>
																{formatDate(new Date(booking.scheduledAt))}
															</p>
														)}
													</div>
												))}
											</div>
										)}
									</div>

									{/* Right: Status Badge (Desktop) and Action Buttons */}
									<div className="flex flex-col justify-start items-start md:items-end gap-3">
										{/* Badge - Desktop Only */}
										<div className="hidden md:block">
											{getStatusBadge(request.status)}
										</div>
										
										{/* Desktop: Show Offer List Button */}
										{(request.status === 'IN_BIDDING' || request.status === 'BIDDING_CLOSED' || request.status === 'NEW') && (
											<Link to={`/offers?requestId=${requestId}`} className="hidden md:block w-auto">
												<Button 
													size="sm" 
													className="px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
													style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
												>
													Show offer list
												</Button>
											</Link>
										)}
										
										{/* Booked Cases - Show Complete, Reschedule, Cancel buttons */}
										{activeTab === 'booked_cases' && request.status === 'BOOKED' && bookings.length > 0 && (
											<div className="flex flex-row gap-2 w-full md:w-auto md:justify-end">
												<Button 
													onClick={() => openCompleteConfirm(bookings[0])}
													size="sm" 
													className="flex-1 md:flex-none md:w-auto px-2 md:px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
													style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
												>
													{t('my_cases.complete_job') || 'Complete'}
												</Button>
												<Button 
													onClick={() => openRescheduleModal(bookings[0])}
													size="sm" 
													variant="outline"
													className="flex-1 md:flex-none md:w-auto px-2 md:px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
													style={{ borderColor: '#05324f', color: '#05324f' }}
												>
													{t('my_cases.reschedule_job') || 'Reschedule'}
												</Button>
												<Button 
													onClick={() => openCancelConfirm(bookings[0])}
													size="sm" 
													variant="destructive"
													className="flex-1 md:flex-none md:w-auto px-2 md:px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
												>
													{t('my_cases.cancel_job') || 'Cancel'}
												</Button>
											</div>
										)}

										{/* Rescheduled Cases - Show buttons */}
										{activeTab === 'rescheduled_cases' && bookings.length > 0 && bookings.some(b => b.status === 'RESCHEDULED') && (
											<div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
												{bookings.filter(b => b.status === 'RESCHEDULED').map((booking, idx) => (
													<div key={idx} className="flex flex-col gap-2 w-full md:w-auto md:items-end">
														<Button 
															onClick={() => openRescheduleModal(booking)}
															size="sm" 
															variant="outline"
															className="w-full md:w-auto px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
															style={{ borderColor: '#05324f', color: '#05324f' }}
														>
															{t('my_cases.reschedule_again') || 'Reschedule'}
														</Button>
														<Button 
															onClick={() => openCancelConfirm(booking)}
															size="sm" 
															variant="destructive"
															className="w-full md:w-auto px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
														>
															{t('my_cases.cancel_job') || 'Cancel'}
														</Button>
													</div>
												))}
											</div>
										)}

									{/* Completed Cases - Write Review button */}
									{activeTab === 'completed_cases' && request.status === 'COMPLETED' && bookings.some(b => b.status === 'DONE') && (
										<Button
											size="sm"
											onClick={() => {
												setSelectedRequestForReview(request)
												setRating(0)
												setReviewText('')
												setReviewModalOpen(true)
											}}
											className="w-full md:w-auto px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
											style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
										>
											<Star className="w-3 h-3 mr-1" />
											{t('my_cases.leave_review') || 'Write Review'}
										</Button>
									)}

									{/* Cancelled Cases - Show View Details button */}
									{activeTab === 'cancelled_cases' && (
											<Link to={`/offers?requestId=${requestId}`} className="w-full md:w-auto">
												<Button 
													size="sm" 
													variant="outline"
													className="w-full md:w-auto px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
													style={{ borderColor: '#05324f', color: '#05324f' }}
												>
													{t('my_cases.view_details') || 'View Details'}
												</Button>
											</Link>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* Complete Job Confirmation Modal with Rating and Review */}
				<Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
					<DialogContent onClose={() => setCompleteConfirmOpen(false)}>
						<DialogTitle>{t('my_cases.complete_job_confirm_title') || 'Complete Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.complete_job_confirm_description') || 'Please rate and review the service before completing the job.'}
						</DialogDescription>
						
						{/* Workshop Name */}
						{bookingToComplete && (() => {
							const bookingId = bookingToComplete._id || bookingToComplete.id
							const request = requests.find(r => r.bookings?.some(b => (b._id || b.id) === bookingId))
							const booking = request?.bookings?.find(b => (b._id || b.id) === bookingId) || bookingToComplete
							const workshopName = booking?.workshopId?.companyName || bookingToComplete?.workshopId?.companyName || 'Workshop'
							
							return workshopName !== 'Workshop' || booking?.workshopId || bookingToComplete?.workshopId ? (
								<div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
									<div className="flex items-center gap-2">
										<Building2 className="w-5 h-5" style={{ color: '#34C759' }} />
										<div>
											<p className="text-xs text-gray-600 mb-0.5">{t('my_cases.contract_with')}</p>
											<p className="font-bold text-sm text-gray-900">
												{workshopName}
											</p>
										</div>
									</div>
								</div>
							) : null
						})()}
						
						<div className="space-y-4 pt-4">
							{/* Rating Section */}
							<div>
								<Label className="text-sm font-semibold mb-2 block">
									{t('my_cases.rating') || 'Rating'} *
								</Label>
								<div className="flex items-center gap-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type="button"
											onClick={() => setCompleteRating(star)}
											className="focus:outline-none transition-transform hover:scale-110"
											disabled={isCompleting}
										>
											<Star
												className={`w-8 h-8 ${
													star <= completeRating
														? 'fill-green-400 text-green-400'
														: 'text-gray-300'
												}`}
											/>
										</button>
									))}
									{completeRating > 0 && (
										<span className="text-sm text-gray-600 ml-2">
											{completeRating} {completeRating === 1 ? t('my_cases.star') : t('my_cases.stars')}
										</span>
									)}
								</div>
							</div>

							{/* Review Text Section */}
							<div>
								<Label htmlFor="completeReviewText" className="text-sm font-semibold mb-2 block">
									{t('my_cases.review') || 'Review'} *
								</Label>
								<Textarea
									id="completeReviewText"
									value={completeReviewText}
									onChange={(e) => setCompleteReviewText(e.target.value)}
									placeholder={t('my_cases.review_placeholder') || 'Share your experience with this service...'}
									className="min-h-[100px]"
									disabled={isCompleting}
								/>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setCompleteConfirmOpen(false)
										setBookingToComplete(null)
										setCompleteRating(0)
										setCompleteReviewText('')
									}}
									className="flex-1"
									disabled={isCompleting}
								>
									{t('common.cancel') || 'Cancel'}
								</Button>
								<Button
									onClick={handleCompleteJob}
									disabled={isCompleting}
									className="flex-1 font-semibold"
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									{isCompleting ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
											{t('my_cases.completing') || 'Completing...'}
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4 mr-2" />
											{t('my_cases.confirm_complete') || 'Confirm Complete'}
										</>
									)}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Cancel Confirmation Modal */}
				<Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
					<DialogContent onClose={() => setCancelConfirmOpen(false)}>
						<DialogTitle>{t('my_cases.cancel_job_confirm_title') || 'Cancel Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.cancel_job_confirm_description') || 'Are you sure you want to cancel this job? This action cannot be undone.'}
						</DialogDescription>
						<div className="flex gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => {
									setCancelConfirmOpen(false)
									setBookingToCancel(null)
								}}
								className="flex-1"
								disabled={isCancelling}
							>
								{t('common.cancel') || 'Cancel'}
							</Button>
							<Button
								onClick={handleCancelJob}
								disabled={isCancelling}
								variant="destructive"
								className="flex-1 font-semibold"
							>
								{isCancelling ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
										{t('my_cases.cancelling') || 'Cancelling...'}
									</>
								) : (
									<>
										<XCircle className="w-4 h-4 mr-2" />
										{t('my_cases.confirm_cancel') || 'Confirm Cancel'}
									</>
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Reschedule Modal */}
				<Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
					<DialogContent onClose={() => setRescheduleModalOpen(false)}>
						<DialogTitle>{t('my_cases.reschedule_job_title') || 'Reschedule Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment'}
						</DialogDescription>
						{selectedBookingForReschedule && (
							<div className="space-y-4">
								{/* Current Booking Info */}
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs font-semibold text-gray-600 mb-1">
										{t('my_cases.current_appointment') || 'Current Appointment'}
									</p>
									<p className="text-sm font-semibold text-gray-900">
										{formatDateTime(new Date(selectedBookingForReschedule.scheduledAt))}
									</p>
								</div>

								{/* New Date */}
								<div>
									<Label htmlFor="newDate" className="text-sm font-semibold mb-2 block">
										{t('my_cases.new_date') || 'New Date'} *
									</Label>
									<Input
										id="newDate"
										type="date"
										value={newScheduledDate}
										onChange={(e) => setNewScheduledDate(e.target.value)}
										min={new Date().toISOString().split('T')[0]}
										className="w-full"
									/>
								</div>

								{/* New Time */}
								<div>
									<Label htmlFor="newTime" className="text-sm font-semibold mb-2 block">
										{t('my_cases.new_time') || 'New Time'} *
									</Label>
									<Input
										id="newTime"
										type="time"
										value={newScheduledTime}
										onChange={(e) => setNewScheduledTime(e.target.value)}
										className="w-full"
									/>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 pt-2">
									<Button
										variant="outline"
										onClick={() => {
											setRescheduleModalOpen(false)
											setSelectedBookingForReschedule(null)
											setNewScheduledDate('')
											setNewScheduledTime('')
										}}
										className="flex-1"
										disabled={isRescheduling}
									>
										{t('common.cancel') || 'Cancel'}
									</Button>
									<Button
										onClick={handleRescheduleJob}
										disabled={!newScheduledDate || !newScheduledTime || isRescheduling}
										className="flex-1 font-semibold"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{isRescheduling ? (
											<>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
												{t('my_cases.rescheduling') || 'Rescheduling...'}
											</>
										) : (
											<>
												<RotateCcw className="w-4 h-4 mr-2" />
												{t('my_cases.confirm_reschedule') || 'Confirm Reschedule'}
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Review Modal */}
				<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
					<DialogContent onClose={() => setReviewModalOpen(false)}>
						<DialogTitle>{t('my_cases.review_title') || 'Rate Your Experience'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.review_description') || 'Please share your experience with this workshop'}
						</DialogDescription>
						{selectedRequestForReview && (
							<div className="space-y-4">
								{/* Workshop Info */}
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-sm font-semibold text-gray-900">
										{selectedRequestForReview.bookings?.[0]?.workshopId?.companyName || 
										 selectedRequestForReview.bookings?.[0]?.workshop?.companyName || 
										 'Workshop'}
									</p>
								</div>

								{/* Star Rating */}
								<div>
									<Label className="text-sm font-semibold mb-2 block">
										{t('my_cases.rating') || 'Rating'} *
									</Label>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((star) => (
											<button
												key={star}
												type="button"
												onClick={() => setRating(star)}
												className="focus:outline-none transition-transform hover:scale-110"
											>
												<Star
													className={`w-8 h-8 ${
														star <= rating
															? 'fill-green-400 text-green-400'
															: 'fill-gray-300 text-gray-300'
													}`}
												/>
											</button>
										))}
									</div>
									{rating > 0 && (
										<p className="text-xs text-gray-600 mt-1">
											{rating === 1 && (t('my_cases.rating_1') || 'Poor')}
											{rating === 2 && (t('my_cases.rating_2') || 'Fair')}
											{rating === 3 && (t('my_cases.rating_3') || 'Good')}
											{rating === 4 && (t('my_cases.rating_4') || 'Very Good')}
											{rating === 5 && (t('my_cases.rating_5') || 'Excellent')}
										</p>
									)}
								</div>

								{/* Review Text */}
								<div>
									<Label htmlFor="reviewText" className="text-sm font-semibold mb-2 block">
										{t('my_cases.review_text') || 'Your Review'} *
									</Label>
									<Textarea
										id="reviewText"
										value={reviewText}
										onChange={(e) => setReviewText(e.target.value)}
										placeholder={t('my_cases.review_placeholder') || 'Share your experience...'}
										rows={4}
										className="w-full"
									/>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 pt-2">
									<Button
										variant="outline"
										onClick={() => {
											setReviewModalOpen(false)
											setSelectedRequestForReview(null)
											setRating(0)
											setReviewText('')
										}}
										className="flex-1"
									>
										{t('common.cancel') || 'Cancel'}
									</Button>
									<Button
										onClick={handleSubmitReview}
										disabled={!rating || !reviewText.trim() || isSubmittingReview}
										className="flex-1 font-semibold"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{isSubmittingReview ? (
											<>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
												{t('my_cases.submitting') || 'Submitting...'}
											</>
										) : (
											<>
												<CheckCircle className="w-4 h-4 mr-2" />
												{t('my_cases.confirm_review') || 'Confirm'}
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

			
			<Footer />
		</div>
	)
}

