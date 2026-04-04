import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
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
	Mail,
	Phone as PhoneIcon,
	FileText,
	User,
	UserCircle,
	CreditCard,
	ShieldOff,
	TrendingUp,
	ExternalLink,
	Package,
	FileX,
	Smartphone,
	Mail as MailIcon,
	MapPin,
	Wrench,
	Menu,
	Search,
	Settings,
	LogOut,
	User as UserIcon,
	History,
	Heart,
	AlertTriangle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, bookingsAPI, reviewsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function MyCasesPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my_cases')
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
	const [cancellationReason, setCancellationReason] = useState('')
	const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
	const [completeRating, setCompleteRating] = useState(0)
	const [completeReviewText, setCompleteReviewText] = useState('')
	const [detailsModalOpen, setDetailsModalOpen] = useState(false)
	const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null)

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			const userRole = user?.role?.toUpperCase()
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (userRole === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
				return
			}
			if (userRole === 'ADMIN') {
				navigate('/admin', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	const fetchRequests = async () => {
		if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return

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
		if (user && user.role?.toUpperCase() === 'CUSTOMER') {
			fetchRequests()
		}
	}, [user])

	// Update active tab if search params change
	useEffect(() => {
		const tab = searchParams.get('tab')
		if (tab && ['my_cases', 'booked_cases', 'completed_cases', 'cancelled_cases', 'rescheduled_cases'].includes(tab)) {
			setActiveTab(tab)
		}
	}, [searchParams])

	// Define all possible tabs (moved here to avoid Rules of Hooks violation)
	const allTabs = [
		{ key: 'my_cases', label: t('my_cases.my_cases_tab') || 'My Cases' },
		{ key: 'booked_cases', label: t('my_cases.booked_cases_tab') || 'Booked' },
		{ key: 'completed_cases', label: t('my_cases.completed_cases_tab') || 'Completed' },
		{ key: 'cancelled_cases', label: t('my_cases.cancelled_cases_tab') || 'Cancelled' },
		{ key: 'rescheduled_cases', label: t('my_cases.rescheduled_cases_tab') || 'Rescheduled' },
	]

	// Calculate counts for each category (moved here to avoid Rules of Hooks violation)
	const categoryCounts = {
		my_cases: requests.filter(r => ['NEW', 'IN_BIDDING', 'BIDDING_CLOSED'].includes(r.status)).length,
		booked_cases: requests.filter(r => r.status === 'BOOKED' && !(r.bookings || []).some(b => b.status === 'RESCHEDULED' || b.status === 'CANCELLED')).length,
		completed_cases: requests.filter(r => r.status === 'COMPLETED' && (r.bookings || []).some(b => b.status === 'DONE')).length,
		cancelled_cases: requests.filter(r => r.status === 'CANCELLED' || (r.bookings || []).some(b => b.status === 'CANCELLED')).length,
		rescheduled_cases: requests.filter(r => (r.bookings || []).some(b => b.status === 'RESCHEDULED')).length,
	}

	// Filter tabs where count > 0
	const visibleTabs = allTabs.filter(tab => categoryCounts[tab.key] > 0)

	// Effect to switch active tab if current one becomes hidden
	useEffect(() => {
		if (visibleTabs.length > 0 && !visibleTabs.find(t => t.key === activeTab)) {
			setActiveTab(visibleTabs[0].key)
		}
	}, [visibleTabs, activeTab])

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
		if (!cancellationReason.trim()) {
			toast.error(t('my_cases.cancel_reason_required') || 'Please provide a reason for cancellation')
			return
		}

		setIsCancelling(true)
		try {
			const bookingId = bookingToCancel._id || bookingToCancel.id
			await bookingsAPI.cancel(bookingId, cancellationReason)
			toast.success(t('my_cases.job_cancelled_success') || 'Job cancelled successfully')
			setCancelConfirmOpen(false)
			setBookingToCancel(null)
			setCancellationReason('')
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
		setCancellationReason('')
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
	if (!user || user.role?.toUpperCase() !== 'CUSTOMER') {
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
			return ['NEW', 'IN_BIDDING', 'BIDDING_CLOSED'].includes(request.status)
		} else if (activeTab === 'booked_cases') {
			return request.status === 'BOOKED' && 
				!bookings.some(b => b.status === 'RESCHEDULED' || b.status === 'CANCELLED')
		} else if (activeTab === 'completed_cases') {
			return request.status === 'COMPLETED' && 
				bookings.some(b => b.status === 'DONE')
		} else if (activeTab === 'cancelled_cases') {
			return request.status === 'CANCELLED' || 
				bookings.some(b => b.status === 'CANCELLED')
		} else if (activeTab === 'rescheduled_cases') {
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
						<h1 className="text-xl font-bold mb-1.5 text-[#05324f] max-md:text-xl whitespace-nowrap">
							{t('my_cases.title')}
						</h1>
						<p className="text-base text-gray-500 max-md:text-sm">
							{t('my_cases.subtitle')}
						</p>
					</div>
					{requests.length > 0 && (
						<Link to="/upload" className="self-start sm:self-auto shrink-0">
							<Button size="sm">
								<span className="md:hidden">{t('my_cases.upload_case')}</span>
								<span className="hidden md:inline">{t('my_cases.upload_new_protocol')}</span>
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Navigation Tabs - Hidden if no requests */}
			{requests.length > 0 && (
				<div className="flex flex-col mb-6 animate-fade-in-up">
					<div className={`grid gap-2 ${visibleTabs.length === 5 ? 'grid-cols-3 md:grid-cols-5' : visibleTabs.length === 4 ? 'grid-cols-2 md:grid-cols-4' : visibleTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2 max-w-sm'}`}>
						{visibleTabs.map(({ key, label }) => (
							<button
								key={key}
								onClick={() => setActiveTab(key)}
								className={`px-2 py-2 md:py-3.5 rounded-btn text-xs sm:text-sm font-semibold transition-all duration-200 text-center ${
									activeTab === key
										? 'bg-[#34C759] text-white shadow-sm scale-[1.02]'
										: 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-[#05324f]'
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>
			)}

				{filteredRequests.length === 0 ? (
					<Card className="border-0 shadow-xl overflow-hidden rounded-3xl animate-fade-in-up">
						<CardContent className="text-center py-16 sm:py-24 px-6 bg-white relative">
							{/* Background Decoration */}
							<div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -z-0"></div>
							
							<div className="relative z-10 flex flex-col items-center">
								<div className="w-24 h-24 bg-[#34C759]/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
									<Camera className="w-12 h-12 text-[#34C759]" />
								</div>
								
								<h3 className="text-2xl sm:text-3xl font-bold text-[#05324f] mb-4">
									{activeTab === 'my_cases' 
										? (t('my_cases.no_cases.title') || 'Start your first repair journey')
										: (t(`my_cases.no_${activeTab}.title`) || `No ${activeTab.split('_')[0]} cases yet`)
									}
								</h3>
								
								<p className="text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
									{activeTab === 'my_cases'
										? "Upload your repair protocol or vehicle photos to receive competitive offers from our network of verified workshops."
										: (t(`my_cases.no_${activeTab}.description`) || `You don't have any items in this category currently.`)
									}
								</p>

								{activeTab === 'my_cases' && (
									<div className="flex flex-col items-center gap-6">
										<Link to="/upload">
											<Button 
												className="px-8 py-7 h-auto text-xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-all bg-[#34C759] text-white"
											>
												<Camera className="w-6 h-6 mr-3" />
												{t('my_cases.no_cases.button') || 'Upload Repair Request'}
											</Button>
										</Link>
										
										<div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
											<Shield className="w-4 h-4 text-[#34C759]" />
											<span>Only verified workshops can view your request details</span>
										</div>
									</div>
								)}

								{/* Step Progress visualization */}
								{activeTab === 'my_cases' && (
									<div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl border-t border-gray-100 pt-12">
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-full bg-[#05324f] text-white flex items-center justify-center font-bold mb-3">1</div>
											<p className="text-sm font-bold text-[#05324f]">Upload Details</p>
										</div>
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold mb-3">2</div>
											<p className="text-sm font-bold text-gray-400">Receive Bids</p>
										</div>
										<div className="flex flex-col items-center">
											<div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold mb-3">3</div>
											<p className="text-sm font-bold text-gray-400">Book Workshop</p>
										</div>
									</div>
								)}
							</div>
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
									className={`grid grid-cols-1 md:grid-cols-3 items-start py-3 px-3 sm:px-6 gap-2 sm:gap-4 relative max-md:bg-white max-md:rounded-xl max-md:border max-md:border-gray-200 max-md:p-3 max-md:shadow-none ${index !== filteredRequests.length - 1 ? 'border-b border-gray-200 md:border-b' : ''} max-md:border-b-0`}
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
														className="px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all bg-[#34C759] text-white hover:bg-[#2eb34f]"
													>
														{t('my_cases.show_offer_list') || 'Show offer list'}
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
													className="px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all bg-[#34C759] text-white hover:bg-[#2eb34f]"
												>
													{t('my_cases.show_offer_list') || 'Show offer list'}
												</Button>
											</Link>
										)}
										
										{/* Booked Cases - Show Complete, Reschedule, Cancel buttons */}
										{activeTab === 'booked_cases' && request.status === 'BOOKED' && bookings.length > 0 && (
											<div className="grid grid-cols-2 md:flex md:flex-row md:flex-wrap md:justify-end gap-1.5 md:gap-2 w-full mt-4 md:mt-0">
												<Button 
													onClick={() => {
														setSelectedBookingForDetails(bookings[0])
														setDetailsModalOpen(true)
													}}
													size="sm" 
													className="w-full md:w-auto md:min-w-[120px] h-8 md:h-9 px-1 md:px-4 text-[9px] md:text-xs font-bold rounded-lg whitespace-nowrap shadow-sm hover:shadow-md transition-all bg-[#05324f] text-white hover:bg-[#0a4a75]"
												>
													{t('my_cases.view_details') || 'View Details'}
												</Button>

												<Button 
													onClick={() => openCompleteConfirm(bookings[0])}
													size="sm" 
													className="w-full md:w-auto md:min-w-[120px] h-8 md:h-9 px-1 md:px-4 text-[9px] md:text-xs font-bold rounded-lg whitespace-nowrap shadow-sm hover:shadow-md transition-all bg-[#34C759] text-white hover:bg-[#2eb34f]"
												>
													<CheckCircle className="w-3 h-3 mr-0.5 md:mr-1" />
													{t('my_cases.complete_job') || 'Complete'}
												</Button>

												<Button 
													onClick={() => openRescheduleModal(bookings[0])}
													size="sm" 
													variant="outline"
													className="w-full md:w-auto md:min-w-[120px] h-8 md:h-9 px-1 md:px-4 text-[9px] md:text-xs font-bold rounded-lg whitespace-nowrap border-[1.5px] border-[#05324f] text-[#05324f] hover:bg-[#05324f]/5 transition-all"
												>
													<RotateCcw className="w-3 h-3 mr-0.5 md:mr-1" />
													{t('my_cases.reschedule_job') || 'Reschedule'}
												</Button>

												<Button 
													onClick={() => openCancelConfirm(bookings[0])}
													size="sm" 
													variant="destructive"
													className="w-full md:w-auto md:min-w-[120px] h-8 md:h-9 px-1 md:px-4 text-[9px] md:text-xs font-bold rounded-lg whitespace-nowrap shadow-sm hover:shadow-md transition-all"
												>
													<XCircle className="w-3 h-3 mr-0.5 md:mr-1" />
													{t('my_cases.cancel_job') || 'Cancel'}
												</Button>
											</div>
										)}

										{/* Rescheduled Cases - Show View Details button */}
										{activeTab === 'rescheduled_cases' && bookings.length > 0 && bookings.some(b => b.status === 'RESCHEDULED') && (
											<div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
												{bookings.filter(b => b.status === 'RESCHEDULED').map((booking, idx) => (
													<div key={idx} className="flex flex-col gap-2 w-full md:w-auto md:items-end">
														<Button 
															onClick={() => {
																setSelectedBookingForDetails(booking)
																setDetailsModalOpen(true)
															}}
															size="sm" 
															variant="outline"
															className="w-full md:w-auto px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap border-2 border-[#05324f] text-[#05324f] hover:bg-[#05324f]/5 transition-all"
														>
															{t('my_cases.view_details') || 'View Details'}
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
											className="w-full md:w-auto px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap shadow-sm hover:shadow-md transition-all bg-[#34C759] text-white hover:bg-[#2eb34f]"
										>
											<Star className="w-3 h-3 mr-1" />
											{t('my_cases.leave_review') || 'Write Review'}
										</Button>
									)}

									{/* Cancelled Cases - Show View Details button */}
									{activeTab === 'cancelled_cases' && (
											<div className="w-full md:w-auto">
												<Button 
													onClick={() => {
														const cancelledBooking = bookings.find(b => b.status === 'CANCELLED') || bookings[0];
														setSelectedBookingForDetails(cancelledBooking)
														setDetailsModalOpen(true)
													}}
													size="sm" 
													variant="outline"
													className="w-full md:w-auto px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap border-2 border-[#05324f] text-[#05324f] hover:bg-[#05324f]/5 transition-all"
												>
													{t('my_cases.view_details') || 'View Details'}
												</Button>
											</div>
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
					<DialogContent onClose={() => setCompleteConfirmOpen(false)} className="max-w-md px-4 w-[90vw]">
						<div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
							<div className="bg-green-50 px-8 py-10 flex flex-col items-center text-center">
								<div className="w-16 h-16 bg-[#34C759]/10 rounded-full flex items-center justify-center mb-6">
									<CheckCircle className="w-10 h-10 text-[#34C759]" />
								</div>
								<DialogTitle className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
									{t('my_cases.complete_job_confirm_title') || 'Complete Job'}
								</DialogTitle>
								<DialogDescription className="text-gray-600 font-medium whitespace-pre-line">
									{t('my_cases.complete_job_confirm_description') || 'Please rate and review the service before completing the job.'}
								</DialogDescription>
							</div>
							
							<div className="px-8 py-8 bg-white">
								{/* Workshop Name */}
								{bookingToComplete && (() => {
									const bookingId = bookingToComplete._id || bookingToComplete.id
									const request = requests.find(r => r.bookings?.some(b => (b._id || b.id) === bookingId))
									const booking = request?.bookings?.find(b => (b._id || b.id) === bookingId) || bookingToComplete
									const workshopName = booking?.workshopId?.companyName || bookingToComplete?.workshopId?.companyName || 'Workshop'
									
									return workshopName !== 'Workshop' || booking?.workshopId || bookingToComplete?.workshopId ? (
										<div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-green-200/50 flex items-center gap-3">
											<div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center">
												<Building2 className="w-5 h-5 text-[#05324f]" />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{t('my_cases.contract_with')}</p>
												<p className="text-sm font-black text-[#05324f] truncate">
													{workshopName}
												</p>
											</div>
										</div>
									) : null
								})()}
								
								<div className="space-y-6">
									{/* Rating Section */}
									<div>
										<Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
											{t('my_cases.rating') || 'Service Rating'} *
										</Label>
										<div className="flex items-center gap-2 bg-gray-50 p-4 rounded-2xl shadow-inner">
											{[1, 2, 3, 4, 5].map((star) => (
												<button
													key={star}
													type="button"
													onClick={() => setCompleteRating(star)}
													className="focus:outline-none transition-transform hover:scale-125"
													disabled={isCompleting}
												>
													<Star
														className={`w-9 h-9 ${
															star <= completeRating
																? 'fill-[#34C759] text-[#34C759]'
																: 'text-gray-200'
														}`}
													/>
												</button>
											))}
										</div>
									</div>

									{/* Review Text Section */}
									<div>
										<Label htmlFor="completeReviewText" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
											{t('my_cases.review') || 'Detailed Experience'} *
										</Label>
										<Textarea
											id="completeReviewText"
											value={completeReviewText}
											onChange={(e) => setCompleteReviewText(e.target.value)}
											placeholder={t('my_cases.review_placeholder') || 'Share your experience with this service...'}
											className="min-h-[120px] bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-[#34C759] outline-none shadow-inner"
											disabled={isCompleting}
										/>
									</div>

									<div className="flex flex-col gap-3 pt-2">
										<Button
											onClick={handleCompleteJob}
											size="lg"
											disabled={isCompleting || !completeRating || !completeReviewText.trim()}
											className="w-full h-14 bg-[#34C759] hover:bg-[#2eb34f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#34C759]/20 transition-all active:scale-95"
										>
											{isCompleting ? (
												<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											) : (
												<>
													<CheckCircle className="w-4 h-4 mr-2" />
													{t('my_cases.confirm_complete') || 'Confirm Finality'}
												</>
											)}
										</Button>

										<Button
											variant="ghost"
											onClick={() => {
												setCompleteConfirmOpen(false)
												setBookingToComplete(null)
												setCompleteRating(0)
												setCompleteReviewText('')
											}}
											className="w-full h-12 text-gray-400 font-bold rounded-2xl hover:bg-gray-50"
											disabled={isCompleting}
										>
											{t('common.cancel') || 'Cancel'}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Cancel Booking Confirmation Modal */}
				<Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
					<DialogContent onClose={() => setCancelConfirmOpen(false)} className="max-w-md px-4 w-[90vw]">
						<div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
							<div className="bg-red-50 px-8 py-10 flex flex-col items-center text-center">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
									<XCircle className="w-10 h-10 text-red-600" />
								</div>
								<DialogTitle className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
									{t('my_cases.cancel_booking_title') || 'Cancel Booking?'}
								</DialogTitle>
								<DialogDescription className="text-red-700 font-black text-[10px] uppercase tracking-widest opacity-80">
									{t('my_cases.cancel_warning') || 'This action is final and cannot be undone.'}
								</DialogDescription>
							</div>
							
							<div className="px-8 py-8 bg-white">
								<p className="text-sm text-gray-500 mb-8 text-center leading-relaxed font-semibold">
									{t('my_cases.cancel_explanation') || 'Are you sure you want to cancel your appointment? Repeated cancellations may affect your platform trust score.'}
									<Link to="/policy/cancellation" className="text-[#05324f] font-black underline ml-1.5 inline-block text-[10px] uppercase tracking-tight">
										{t('common.read_cancellation_policy') || 'Read Policy'}
									</Link>
								</p>

								<div className="space-y-4 mb-8">
									<Label htmlFor="cancelReason" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
										<FileText className="w-4 h-4 text-red-500 opacity-50" />
										{t('my_cases.cancellation_reason_label') || 'Reason for cancellation'} <span className="text-red-500">*</span>
									</Label>
									<Textarea
										id="cancelReason"
										value={cancellationReason}
										onChange={(e) => setCancellationReason(e.target.value)}
										placeholder={t('my_cases.cancel_reason_placeholder') || 'Please explain why you need to cancel this booking...'}
										className="min-h-[100px] text-sm font-semibold bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none resize-none shadow-inner"
										required
									/>
								</div>
								
								<div className="flex flex-col gap-3">
									<Button
										size="lg"
										onClick={() => {
											setCancelConfirmOpen(false)
											setBookingToCancel(null)
											setCancellationReason('')
										}}
										className="w-full h-14 bg-[#05324f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#05324f]/20 active:scale-95 transition-all"
										disabled={isCancelling}
									>
										{t('my_cases.keep_booking') || 'No, Keep My Booking'}
									</Button>
									
									<Button
										variant="ghost"
										size="lg"
										onClick={handleCancelJob}
										disabled={isCancelling || !cancellationReason.trim()}
										className={`w-full h-12 font-black uppercase tracking-widest text-xs transition-all ${!cancellationReason.trim() ? 'text-gray-200' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
									>
										{isCancelling ? (
											<div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
										) : (t('my_cases.confirm_cancel') || 'Confirm Cancellation')}
									</Button>
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Reschedule Modal */}
				<Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
					<DialogContent onClose={() => setRescheduleModalOpen(false)} className="max-w-md px-4 w-[90vw]">
						<div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
							<div className="mb-8">
								<DialogTitle className="text-2xl font-black text-[#05324f] uppercase tracking-tight mb-2">
									{t('my_cases.reschedule_job_title') || 'Reschedule Job'}
								</DialogTitle>
								<DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
									{t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment'}
								</DialogDescription>
							</div>

							{selectedBookingForReschedule && (
								<div className="space-y-6">
									{/* Current Booking Info */}
									<div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
											<Clock className="w-4 h-4 text-[#34C759]" />
											{t('my_cases.current_appointment') || 'Current Slot'}
										</p>
										<p className="text-sm font-black text-[#05324f]">
											{formatDateTime(new Date(selectedBookingForReschedule.scheduledAt))}
										</p>
									</div>

									{/* New Date */}
									<div className="space-y-4">
										<div>
											<Label htmlFor="newDate" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
												{t('my_cases.new_date') || 'Proposed Date'} *
											</Label>
											<Input
												id="newDate"
												type="date"
												value={newScheduledDate}
												onChange={(e) => setNewScheduledDate(e.target.value)}
												min={new Date().toISOString().split('T')[0]}
												className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl font-bold text-[#05324f] px-4 focus:ring-2 focus:ring-[#34C759] outline-none"
											/>
										</div>

										{/* New Time */}
										<div>
											<Label htmlFor="newTime" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
												{t('my_cases.new_time') || 'Proposed Time'} *
											</Label>
											<Input
												id="newTime"
												type="time"
												value={newScheduledTime}
												onChange={(e) => setNewScheduledTime(e.target.value)}
												className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl font-bold text-[#05324f] px-4 focus:ring-2 focus:ring-[#34C759] outline-none"
											/>
										</div>
									</div>

									{/* Buttons */}
									<div className="flex flex-col gap-3 pt-4">
										<Button
											onClick={handleRescheduleJob}
											disabled={!newScheduledDate || !newScheduledTime || isRescheduling}
											className="w-full h-14 bg-[#34C759] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#34C759]/20 transition-all active:scale-95"
										>
											{isRescheduling ? (
												<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											) : (
												<>
													<RotateCcw className="w-4 h-4 mr-2" />
													{t('my_cases.confirm_reschedule') || 'Confirm New Slot'}
												</>
											)}
										</Button>

										<Button
											variant="ghost"
											onClick={() => {
												setRescheduleModalOpen(false)
												setSelectedBookingForReschedule(null)
												setNewScheduledDate('')
												setNewScheduledTime('')
											}}
											className="w-full h-12 text-gray-400 font-bold rounded-2xl hover:bg-gray-50"
											disabled={isRescheduling}
										>
											{t('common.cancel') || 'Cancel'}
										</Button>
									</div>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>

				{/* Review Modal */}
				<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
					<DialogContent onClose={() => setReviewModalOpen(false)} className="max-w-md px-4 w-[90vw]">
						<div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
							<div className="mb-8">
								<DialogTitle className="text-2xl font-black text-[#05324f] uppercase tracking-tight mb-2">
									{t('my_cases.review_title') || 'Rate Your Experience'}
								</DialogTitle>
								<DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
									{t('my_cases.review_description') || 'Please share your experience with this workshop'}
								</DialogDescription>
							</div>

							{selectedRequestForReview && (
								<div className="space-y-6">
									{/* Workshop Info */}
									<div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
										<div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center">
											<Building2 className="w-5 h-5 text-[#05324f]" />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Service Entity</p>
											<p className="text-sm font-black text-[#05324f] truncate">
												{selectedRequestForReview.bookings?.[0]?.workshopId?.companyName || 
												 selectedRequestForReview.bookings?.[0]?.workshop?.companyName || 
												 'Workshop'}
											</p>
										</div>
									</div>

									{/* Star Rating */}
									<div>
										<Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
											{t('my_cases.rating') || 'Performance Rating'} *
										</Label>
										<div className="flex items-center gap-2 bg-gray-50 p-4 rounded-2xl shadow-inner">
											{[1, 2, 3, 4, 5].map((star) => (
												<button
													key={star}
													type="button"
													onClick={() => setRating(star)}
													className="focus:outline-none transition-transform hover:scale-125"
												>
													<Star
														className={`w-9 h-9 ${
															star <= rating
																? 'fill-[#34C759] text-[#34C759]'
																: 'text-gray-200'
														}`}
													/>
												</button>
											))}
										</div>
										{rating > 0 && (
											<p className="text-[10px] text-[#34C759] mt-2 font-black uppercase tracking-widest text-center">
												{rating === 1 && (t('my_cases.rating_1') || 'Poor Performance')}
												{rating === 2 && (t('my_cases.rating_2') || 'Fair Performance')}
												{rating === 3 && (t('my_cases.rating_3') || 'Good Performance')}
												{rating === 4 && (t('my_cases.rating_4') || 'High Standard')}
												{rating === 5 && (t('my_cases.rating_5') || 'Elite Standard')}
											</p>
										)}
									</div>

									{/* Review Text */}
									<div>
										<Label htmlFor="reviewText" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
											{t('my_cases.review_text') || 'Review Narrative'} *
										</Label>
										<Textarea
											id="reviewText"
											value={reviewText}
											onChange={(e) => setReviewText(e.target.value)}
											placeholder={t('my_cases.review_placeholder') || 'Share your experience...'}
											className="min-h-[120px] bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-[#34C759] outline-none shadow-inner"
											rows={4}
										/>
									</div>

									{/* Buttons */}
									<div className="flex flex-col gap-3 pt-4">
										<Button
											onClick={handleSubmitReview}
											disabled={!rating || !reviewText.trim() || isSubmittingReview}
											className="w-full h-14 bg-[#34C759] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#34C759]/20 transition-all active:scale-95"
										>
											{isSubmittingReview ? (
												<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											) : (
												<>
													<CheckCircle className="w-4 h-4 mr-2" />
													{t('my_cases.confirm_review') || 'Submit Record'}
												</>
											)}
										</Button>

										<Button
											variant="ghost"
											onClick={() => {
												setReviewModalOpen(false)
												setSelectedRequestForReview(null)
												setRating(0)
												setReviewText('')
											}}
											className="w-full h-12 text-gray-400 font-bold rounded-2xl hover:bg-gray-50"
										>
											{t('common.cancel') || 'Cancel'}
										</Button>
									</div>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>

				{/* View Details Modal */}
				<Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
					<DialogContent onClose={() => setDetailsModalOpen(false)} className="max-w-[50rem] px-4 w-[90vw]">
						<div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
							<div className="mb-8">
								<DialogTitle className="text-3xl font-black text-[#05324f] uppercase tracking-tight mb-2">
									{t('my_cases.workshop_details') || 'Service Identity'}
								</DialogTitle>
								<DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
									{t('my_cases.workshop_details_desc') || 'Full administrative and contact data package'}
								</DialogDescription>
							</div>
							
							{selectedBookingForDetails && (
								<div className="space-y-8 pr-1">
									{/* Cancellation Status Banner */}
									{selectedBookingForDetails.status === 'CANCELLED' && (
										<div className="p-6 bg-red-50/50 rounded-[2rem] border-l-4 border-red-500 animate-in fade-in slide-in-from-left-4 duration-500">
											<div className="flex items-center gap-5">
												<div className="p-3 bg-red-100 rounded-2xl shadow-sm shrink-0">
													<XCircle className="w-6 h-6 text-red-600" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1.5 leading-none">
														{selectedBookingForDetails.cancelledBy === 'CUSTOMER' 
															? 'Audit: Revoked by You' 
															: selectedBookingForDetails.cancelledBy === 'WORKSHOP' 
																? 'Audit: Revoked by Workshop' 
																: 'Record Terminated'}
													</p>
													<p className="text-sm text-red-900 font-bold italic leading-relaxed bg-white/40 p-3 rounded-xl border border-red-100">
														"{selectedBookingForDetails.cancellationReason || 'No formal reason provided'}"
													</p>
													{selectedBookingForDetails.cancelledAt && (
														<p className="text-[9px] text-red-400 mt-2.5 font-black uppercase tracking-widest">
															Timestamp: {formatDate(new Date(selectedBookingForDetails.cancelledAt))}
														</p>
													)}
												</div>
											</div>
										</div>
									)}

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* Workshop Name */}
										<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner flex items-center gap-4">
											<div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center">
												<Building2 className="w-6 h-6 text-[#34C759]" />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 leading-none">
													Legal Entity
												</p>
												<p className="text-base font-black text-[#05324f] truncate">
													{selectedBookingForDetails.workshopId?.companyName || 'N/A'}
												</p>
											</div>
										</div>

										{/* Account Manager */}
										<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner flex items-center gap-4">
											<div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center">
												<User className="w-6 h-6 text-[#007AFF]" />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 leading-none">
													Account Holder
												</p>
												<p className="text-base font-black text-[#05324f] truncate">
													{selectedBookingForDetails.workshopId?.name || 'N/A'}
												</p>
											</div>
										</div>

										{/* Email */}
										<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner flex items-center gap-4">
											<div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center">
												<Mail className="w-6 h-6 text-[#05324f] opacity-50" />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 leading-none">
													Electronic Mail
												</p>
												<p className="text-sm font-bold text-[#05324f] truncate">
													{selectedBookingForDetails.workshopId?.email || 'N/A'}
												</p>
											</div>
										</div>

										{/* Phone */}
										<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner flex items-center gap-4">
											<div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center">
												<PhoneIcon className="w-6 h-6 text-[#05324f] opacity-50" />
											</div>
											<div className="min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 leading-none">
													Direct Voice
												</p>
												<p className="text-sm font-bold text-[#05324f] truncate">
													{selectedBookingForDetails.workshopId?.phone || 'N/A'}
												</p>
											</div>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
										{selectedBookingForDetails.status === 'BOOKED' && (
											<Button 
												onClick={() => {
													setDetailsModalOpen(false)
													openCompleteConfirm(selectedBookingForDetails)
												}}
												className="w-full h-14 bg-[#34C759] hover:bg-[#2eb34f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#34C759]/20 transition-all active:scale-95"
											>
												<CheckCircle className="w-4 h-4 mr-2" />
												{t('my_cases.complete_job') || 'Confirm Final Completion'}
											</Button>
										)}
										
										{(selectedBookingForDetails.status === 'BOOKED' || selectedBookingForDetails.status === 'RESCHEDULED') && (
											<Button 
												onClick={() => {
													setDetailsModalOpen(false)
													openRescheduleModal(selectedBookingForDetails)
												}}
												variant="outline"
												className="w-full h-14 border-[1.5px] border-[#05324f] text-[#05324f] font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#05324f]/5 transition-all"
											>
												<RotateCcw className="w-4 h-4 mr-2" />
												{selectedBookingForDetails.status === 'RESCHEDULED' 
													? (t('my_cases.reschedule_again') || 'Modify Existing Slot')
													: (t('my_cases.reschedule_job') || 'Request Rescheduling')
												}
											</Button>
										)}

										{(selectedBookingForDetails.status === 'BOOKED' || selectedBookingForDetails.status === 'RESCHEDULED') && (
											<Button 
												onClick={() => {
													setDetailsModalOpen(false)
													openCancelConfirm(selectedBookingForDetails)
												}}
												variant="ghost"
												className="w-full h-12 text-gray-400 hover:text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
											>
												<XCircle className="w-4 h-4 mr-2" />
												{t('my_cases.cancel_job') || 'Revoke Service Request'}
											</Button>
										)}
										
										<Button 
											onClick={() => setDetailsModalOpen(false)}
											className="w-full h-12 bg-white text-gray-400 font-bold rounded-2xl border border-gray-100"
										>
											Dismiss Record
										</Button>
									</div>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>

			<Footer />
		</div>
	)
}

