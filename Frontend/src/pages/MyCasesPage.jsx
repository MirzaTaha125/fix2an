import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
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
	Building2,
	FileText,
	Phone as PhoneIcon,
	Mail as MailIcon,
	MapPin,
	ArrowRight,
	ShieldCheck,
	RotateCcw,
	ChevronRight,
	MoreVertical,
	Trash2,
	AlertTriangle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, bookingsAPI, reviewsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function MyCasesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()

	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState(() => {
		const t = searchParams.get('tab')
		const valid = ['requested', 'booked', 'completed', 'drafts']
		if (t === 'current' || t === 'aktuella') return 'requested'
		if (t === 'previous' || t === 'tidigare') return 'completed'
		if (t === 'utkast') return 'drafts'
		if (t === 'rescheduled') return 'booked'
		return valid.includes(t) ? t : 'requested'
	})

	// Modals state
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

	const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
	const [bookingToCancel, setBookingToCancel] = useState(null)
	const [cancellationReason, setCancellationReason] = useState('')
	const [isCancelling, setIsCancelling] = useState(false)

	const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
	const [bookingToComplete, setBookingToComplete] = useState(null)
	const [completeRating, setCompleteRating] = useState(0)
	const [completeReviewText, setCompleteReviewText] = useState('')
	const [isCompleting, setIsCompleting] = useState(false)

	const [detailsModalOpen, setDetailsModalOpen] = useState(false)
	const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null)

	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [requestToDelete, setRequestToDelete] = useState(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const [activeMenuId, setActiveMenuId] = useState(null)

	// Close menu when clicking elsewhere
	useEffect(() => {
		const handleClickOutside = () => setActiveMenuId(null)
		if (activeMenuId) {
			document.addEventListener('click', handleClickOutside)
		}
		return () => document.removeEventListener('click', handleClickOutside)
	}, [activeMenuId])

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			const userRole = user?.role?.toUpperCase()
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
			toast.error(t('my_cases.fetch_error') || 'Failed to fetch requests')
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
		const valid = ['requested', 'booked', 'completed', 'drafts']
		if (tab === 'current' || tab === 'aktuella') setActiveTab('requested')
		else if (tab === 'previous' || tab === 'tidigare') setActiveTab('completed')
		else if (tab === 'utkast') setActiveTab('drafts')
		else if (tab === 'rescheduled') setActiveTab('booked')
		else if (tab && valid.includes(tab)) setActiveTab(tab)
	}, [searchParams])

	const handleTabChange = (tab) => {
		setActiveTab(tab)
		setSearchParams({ tab })
	}

	// Categorize each request based on request + latest booking status
	const getRequestCategory = (r) => {
		const bookings = r.bookings || []
		if (bookings.some(b => b.status === 'DONE')) return 'completed'
		if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status)) return 'completed'
		if (bookings.some(b => b.status === 'CANCELLED')) return 'completed'
		if (bookings.some(b => b.status === 'RESCHEDULED')) return 'rescheduled'
		if (bookings.some(b => b.status === 'CONFIRMED')) return 'booked'
		return 'requested'
	}

	const requestedRequests = requests.filter(r => getRequestCategory(r) === 'requested')
	const bookedRequests = requests.filter(r => getRequestCategory(r) === 'booked')
	const completedRequests = requests.filter(r => getRequestCategory(r) === 'completed')
	const rescheduledRequests = requests.filter(r => getRequestCategory(r) === 'rescheduled')

	const currentRequests = [...requestedRequests, ...bookedRequests, ...rescheduledRequests]
	const previousRequests = completedRequests
	const draftRequests = []

	const categoryCounts = {
		current: currentRequests.length,
		requested: requestedRequests.length,
		booked: [...bookedRequests, ...rescheduledRequests].length,
		previous: previousRequests.length,
		completed: completedRequests.length,
		drafts: draftRequests.length,
	}

	const allTabs = [
		{ key: 'requested', label: t('my_cases.tabs.requested') || 'Requested' },
		{ key: 'booked', label: t('my_cases.tabs.booked') || 'Booked' },
		{ key: 'completed', label: t('my_cases.tabs.completed') || 'Completed' },
		{ key: 'drafts', label: t('my_cases.tabs.drafts') || 'Drafts' },
	]

	const activeList =
		activeTab === 'current' ? currentRequests :
			activeTab === 'requested' ? requestedRequests :
				activeTab === 'booked' ? [...bookedRequests, ...rescheduledRequests] :
					activeTab === 'previous' ? previousRequests :
						activeTab === 'completed' ? completedRequests :
							activeTab === 'drafts' ? draftRequests :
								currentRequests

	// Action Handlers
	const handleCancelJob = async () => {
		if (!bookingToCancel) return
		if (!cancellationReason.trim()) {
			toast.error(t('my_cases.cancel_reason_required') || 'Please provide a reason')
			return
		}

		setIsCancelling(true)
		try {
			const bookingId = bookingToCancel._id || bookingToCancel.id
			await bookingsAPI.cancel(bookingId, cancellationReason)
			toast.success(t('my_cases.job_cancelled_success') || 'Job cancelled')
			setCancelConfirmOpen(false)
			setBookingToCancel(null)
			setCancellationReason('')
			fetchRequests()
		} catch (error) {
			console.error('Cancel error:', error)
			toast.error(t('my_cases.job_cancel_error') || 'Failed to cancel')
		} finally {
			setIsCancelling(false)
		}
	}

	const handleRescheduleJob = async () => {
		if (!selectedBookingForReschedule || !newScheduledDate || !newScheduledTime) {
			toast.error(t('my_cases.reschedule_date_required') || 'Date and time required')
			return
		}

		setIsRescheduling(true)
		try {
			const bookingId = selectedBookingForReschedule._id || selectedBookingForReschedule.id
			const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`)
			await bookingsAPI.reschedule(bookingId, scheduledAt.toISOString())
			toast.success(t('my_cases.job_rescheduled_success') || 'Job rescheduled')
			setRescheduleModalOpen(false)
			setSelectedBookingForReschedule(null)
			fetchRequests()
		} catch (error) {
			console.error('Reschedule error:', error)
			toast.error(t('my_cases.job_reschedule_error') || 'Failed to reschedule')
		} finally {
			setIsRescheduling(false)
		}
	}

	const handleCompleteJob = async () => {
		if (!bookingToComplete) return
		if (!completeRating) {
			toast.error(t('my_cases.rating_required') || 'Rating required')
			return
		}

		setIsCompleting(true)
		try {
			const bookingId = bookingToComplete._id || bookingToComplete.id
			await bookingsAPI.complete(bookingId)

			// Optional review submission
			if (completeReviewText.trim()) {
				try {
					await reviewsAPI.create({
						bookingId,
						rating: completeRating,
						comment: completeReviewText.trim()
					})
				} catch (e) {
					console.error('Review submission failed', e)
				}
			}

			toast.success(t('my_cases.job_completed_success') || 'Job completed')
			setCompleteConfirmOpen(false)
			setBookingToComplete(null)
			fetchRequests()
		} catch (error) {
			console.error('Complete error:', error)
			toast.error(t('my_cases.job_complete_error') || 'Failed to complete')
		} finally {
			setIsCompleting(false)
		}
	}

	const handleDeleteRequest = async () => {
		if (!requestToDelete) return
		setIsDeleting(true)
		try {
			await requestsAPI.update(requestToDelete._id || requestToDelete.id, { status: 'CANCELLED' })
			toast.success(t('my_cases.cancel_success') || 'Request deleted')
			setDeleteConfirmOpen(false)
			setRequestToDelete(null)
			fetchRequests()
		} catch (error) {
			console.error('Delete error:', error)
			toast.error(t('my_cases.cancel_error') || 'Failed to delete')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleSubmitReview = async () => {
		if (!rating || !reviewText.trim() || !selectedRequestForReview) return
		setIsSubmittingReview(true)
		try {
			const booking = selectedRequestForReview.bookings?.find(b => b.status === 'DONE' || b.status === 'COMPLETED')
			if (!booking) throw new Error('No completed booking found')

			await reviewsAPI.create({
				bookingId: booking._id || booking.id,
				rating,
				comment: reviewText.trim()
			})
			toast.success(t('my_cases.review_submitted') || 'Review submitted')
			setReviewModalOpen(false)
			setSelectedRequestForReview(null)
			setRating(0)
			setReviewText('')
			fetchRequests()
		} catch (error) {
			console.error('Review error:', error)
			toast.error(t('my_cases.review_error') || 'Failed to submit review')
		} finally {
			setIsSubmittingReview(false)
		}
	}

	// Loading state
	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-white flex flex-col">
				<Navbar />
				<div className="max-w-3xl mx-auto px-4 pt-28 pb-12 w-full">
					<div className="animate-pulse space-y-8">
						<div className="h-10 w-48 bg-gray-100 rounded-lg"></div>
						<div className="h-12 w-full bg-gray-50 rounded-xl"></div>
						<div className="space-y-6">
							{[1, 2, 3].map(i => (
								<div key={i} className="h-48 bg-gray-50 rounded-[2rem]"></div>
							))}
						</div>
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white flex flex-col font-sans">
			<Navbar />

			<div className="max-w-3xl mx-auto px-4 pt-20 md:pt-28 pb-12 w-full">
				{/* Top badge */}
				<div className="flex justify-end mb-4">
					<div className="flex items-center gap-1.5 text-[#38BC54] bg-[#F2F9F4] px-3 py-1.5 rounded-full border border-[#38BC54]/10">
						<ShieldCheck size={16} fill="#38BC54" fillOpacity={0.1} />
						<span className="text-[11px] font-bold tracking-tight">Only verified workshops</span>
					</div>
				</div>

				<div className="mb-8 flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<h1 className="text-3xl md:text-[2.6rem] font-bold text-[#05324f] leading-tight mb-2 tracking-tight">
							{t('my_cases.title')}
						</h1>
						<p className="text-[#05324f]/60 text-[0.95rem] md:text-[1.1rem] leading-snug">
							{t('my_cases.subtitle_short') || t('my_cases.mobile_subtitle')}
						</p>
					</div>
					<Link
						to="/upload"
						className="shrink-0 mt-1 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl px-3 py-2.5 md:px-5 md:py-3 font-black text-xs md:text-sm flex items-center gap-1.5 shadow-md shadow-green-100 active:scale-95 transition-all"
					>
						<span className="text-base leading-none">+</span>
						<span className="hidden sm:inline">{t('my_cases.create_new') || 'Create new case'}</span>
						<span className="sm:hidden">{t('my_cases.create_new_short') || 'New'}</span>
					</Link>
				</div>

				{/* Tabs */}
				<div className="flex p-0.5 md:p-1 bg-white rounded-lg md:rounded-xl mb-8 border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
					{allTabs.map((tab) => (
						<button
							key={tab.key}
							onClick={() => handleTabChange(tab.key)}
							className={`shrink-0 md:flex-1 py-1.5 px-2.5 md:py-3 md:px-4 rounded-md md:rounded-lg font-bold text-[0.65rem] md:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === tab.key
									? 'bg-[#F2F9F4] text-[#38BC54]'
									: 'text-gray-400 hover:text-gray-600'
								}`}
						>
							{tab.label}{categoryCounts[tab.key] > 0 ? ` (${categoryCounts[tab.key]})` : ''}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className="min-h-[400px]">
					{(activeTab === 'requested' || activeTab === 'booked') && (
						<div className="space-y-10">
							<div>
								<h2 className="text-[0.75rem] font-black text-gray-400 tracking-wider mb-5 uppercase">
									{allTabs.find(tab => tab.key === activeTab)?.label}
								</h2>

								{activeList.length === 0 ? (
									<div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
										<div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
											<FileText size={40} className="text-gray-200" />
										</div>
										<h3 className="text-xl font-black text-[#05324f] mb-2">{t('my_cases.no_cases.title')}</h3>
										<p className="text-gray-400 text-sm max-w-[240px] mx-auto mb-8">{t('my_cases.no_cases.description')}</p>
										<Button asChild className="bg-[#38BC54] hover:bg-[#2fa348] text-white rounded-xl px-8 h-12 font-bold transition-all active:scale-95 shadow-lg shadow-green-100">
											<Link to="/">{t('my_cases.no_cases.button')}</Link>
										</Button>
									</div>
								) : (
									<div className="space-y-6">
										{activeList.map((request) => {
											const booking = activeTab === 'booked'
												? (request.bookings || []).find(b => b.status === 'CONFIRMED')
												: activeTab === 'rescheduled'
													? (request.bookings || []).find(b => b.status === 'RESCHEDULED')
													: (request.bookings || []).find(b => ['CONFIRMED', 'RESCHEDULED'].includes(b.status))
											const workshop = booking?.workshopId || booking?.workshop
											const vehicle = request.vehicleId || request.vehicle

											const offerCount = (request.offers || []).filter(o => o.status === 'SENT' || o.status === 'ACCEPTED').length

											return (
												<div key={request._id} className="bg-white rounded-[1.25rem] border border-gray-100 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.1)] overflow-hidden mb-5">
													<div className="p-4 md:p-7">
														{/* Status Badge */}
														<div className="flex mb-4 md:mb-6">
															<div className="bg-[#F2F9F4] text-[#38BC54] px-3 py-1 md:px-3.5 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[0.65rem] md:text-[0.8rem] font-bold">
																<Clock size={14} className="text-[#38BC54] md:w-4 md:h-4" />
																{activeTab === 'booked'
																	? t('my_cases.booking_confirmed')
																	: activeTab === 'rescheduled'
																		? (t('my_cases.tabs.rescheduled') || 'Rescheduled')
																		: offerCount > 0
																			? `${offerCount} ${offerCount === 1 ? 'offer' : 'offers'} received`
																			: t('my_cases.status.awaiting_contact')}
															</div>
														</div>

														{/* Workshop & Price Row */}
														<div className="flex gap-3 md:gap-4 mb-5 md:mb-7 relative">
															{/* Workshop Logo */}
															<div className="w-14 h-14 md:w-[5.2rem] md:h-[5.2rem] bg-[#1a1a1a] rounded-xl md:rounded-[1.2rem] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
																{workshop?.logo ? (
																	<img src={getFullUrl(workshop.logo)} alt={workshop.companyName} className="w-full h-full object-cover" />
																) : (
																	<Building2 className="text-white/20" size={24} />
																)}
															</div>

															{/* Workshop Details */}
															<div className="flex-1 min-w-0 pr-2">
																<h3 className="text-sm md:text-[1.15rem] font-black text-[#05324f] flex items-center gap-1 mb-0.5 md:mb-1 truncate">
																	{workshop?.companyName || t('my_cases.status.awaiting_quotes')}
																	{workshop && <ShieldCheck size={14} fill="#38BC54" fillOpacity={0.1} className="text-[#38BC54] shrink-0 md:w-4 md:h-4" />}
																</h3>

																<div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-2">
																	<div className="flex gap-0.5">
																		{[...Array(5)].map((_, i) => (
																			<Star
																				key={i}
																				size={10}
																				fill={workshop && i < Math.floor(workshop.averageRating || 5) ? "#FFD700" : "none"}
																				className={workshop && i < Math.floor(workshop.averageRating || 5) ? "text-[#FFD700] md:w-3.5 md:h-3.5" : "text-gray-200 md:w-3.5 md:h-3.5"}
																			/>
																		))}
																	</div>
																	<span className="text-[0.65rem] md:text-[0.8rem] font-bold text-gray-400">
																		{workshop?.averageRating?.toFixed(1) || '0.0'} ({workshop?.reviewCount || 0})
																	</span>
																</div>

																<div className="flex items-center gap-1 text-gray-400 text-[0.7rem] md:text-[0.85rem] font-bold">
																	<MapPin size={12} className="md:w-3.5 md:h-3.5" />
																	<span>{workshop?.address?.city || 'Workshop city'}</span>
																</div>
															</div>

															{/* Price - Top Right */}
															<div className="text-right shrink-0">
																{booking?.totalAmount ? (
																	<>
																		<div className="text-base md:text-[1.4rem] font-black text-[#05324f] leading-none mb-0.5 md:mb-1">
																			{formatPrice(booking.totalAmount)}
																		</div>
																		<div className="text-[0.6rem] md:text-[0.75rem] font-bold text-gray-400">incl. VAT</div>
																	</>
																) : null}
															</div>
														</div>

														<div className="h-[1px] bg-gray-50 mb-5 md:mb-7"></div>

														{/* Vehicle Row */}
														<button
															type="button"
															onClick={() => navigate(`/offers?requestId=${request._id}`)}
															className="w-full text-left flex items-center gap-3 md:gap-4 mb-5 md:mb-7 group cursor-pointer active:scale-[0.99] transition-transform"
														>
															<div className="w-14 h-[2.5rem] md:w-20 md:h-[3.2rem] bg-gray-100 rounded-lg md:rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
																{vehicle?.image ? (
																	<img src={getFullUrl(vehicle.image)} alt={vehicle.make} className="w-full h-full object-cover" />
																) : (
																	<Car className="text-gray-200" size={20} />
																)}
															</div>
															<div className="flex-1 min-w-0">
																<div className="text-[0.85rem] md:text-[1.05rem] font-black text-[#05324f] leading-tight">
																	{vehicle?.make} {vehicle?.model} {vehicle?.year}
																</div>
																<div className="text-[0.75rem] md:text-[0.9rem] text-gray-400 font-bold truncate">
																	{request.description || 'No description provided.'}
																</div>
															</div>
															<ChevronRight className="text-gray-300 group-hover:text-[#38BC54] transition-colors shrink-0" size={20} />
														</button>

														{/* Info Box */}
														<div className="bg-[#F8FAF9] rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#38BC54]/10 flex gap-4 md:gap-5 mb-5 md:mb-7">
															<div className="shrink-0">
																<div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
																	<MessageSquare className="text-[#38BC54] w-6 h-6 md:w-8 md:h-8" />
																</div>
															</div>
															<div>
																<h4 className="text-[0.85rem] md:text-[1.05rem] font-black text-[#05324f] mb-1 md:mb-1.5">
																	{booking?.status === 'CONFIRMED' || booking?.status === 'RESCHEDULED' ? t('my_cases.booking_confirmed') : t('my_cases.workshop_contact_soon')}
																</h4>
																<p className="text-[0.75rem] md:text-[0.9rem] text-[#05324f]/70 font-bold leading-snug">
																	{booking?.scheduledAt
																		? `${formatDateTime(new Date(booking.scheduledAt))} at ${workshop?.companyName}`
																		: t('my_cases.receive_call_sms')
																	}
																</p>
															</div>
														</div>

														{/* Contact Button */}
														<button
															className="w-full py-3 md:py-4 border-2 border-[#38BC54] rounded-xl md:rounded-2xl text-[#38BC54] font-black text-sm md:text-[1rem] flex items-center justify-center gap-2 hover:bg-[#F2F9F4] transition-all active:scale-[0.98]"
															onClick={() => {
																if (booking && workshop) {
																	setSelectedBookingForDetails(booking)
																	setDetailsModalOpen(true)
																} else {
																	navigate(`/offers?requestId=${request._id}`)
																}
															}}
														>
															<MessageSquare size={18} className="text-[#38BC54]" />
															{workshop ? t('my_cases.contact_workshop') : t('my_cases.view_details')}
														</button>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>

						</div>
					)}

					{activeTab === 'completed' && (
						<div className="space-y-6">
							<h2 className="text-[0.75rem] font-black text-gray-400 tracking-wider uppercase">
								{t('my_cases.past_cases_label') || 'Past cases'}
							</h2>
							{completedRequests.length === 0 ? (
								<div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
									<div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
										<FileText size={40} className="text-gray-200" />
									</div>
									<h3 className="text-xl font-black text-[#05324f] mb-2">{t('my_cases.tabs.completed') || 'Completed'}</h3>
									<p className="text-gray-400 text-sm max-w-[260px] mx-auto">No completed cases yet.</p>
								</div>
							) : (
								<div className="space-y-4">
									{completedRequests.map((request) => {
										const booking = (request.bookings || []).find(b => b.status === 'DONE' || b.status === 'CANCELLED')
										const workshop = booking?.workshopId || booking?.workshop
										const vehicle = request.vehicleId || request.vehicle
										const isCancelled = request.status === 'CANCELLED' || booking?.status === 'CANCELLED'

										return (
											<div key={request._id} className="bg-white rounded-[1rem] border border-gray-100 p-4 md:p-5 shadow-sm overflow-hidden mb-4">
												<div className="flex mb-3 md:mb-4">
													<div className={`px-2.5 py-1 rounded-full flex items-center gap-1 text-[0.6rem] md:text-[0.65rem] font-bold ${isCancelled ? 'bg-red-50 text-red-600' : 'bg-[#F2F9F4] text-[#38BC54]'}`}>
														{isCancelled ? <XCircle size={10} className="md:w-3 md:h-3" /> : <CheckCircle size={10} className="md:w-3 md:h-3" />}
														{isCancelled ? (t('my_cases.status.cancelled') || 'Cancelled') : t('my_cases.status.case_closed')}
													</div>
												</div>

												<div className="flex gap-3 md:gap-4 relative">
													<div className="w-12 h-12 md:w-[4rem] md:h-[4rem] bg-[#05324f] rounded-lg md:rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
														{workshop?.logo ? (
															<img src={getFullUrl(workshop.logo)} alt={workshop.companyName} className="w-full h-full object-cover" />
														) : (
															<Building2 className="text-white/20" size={20} />
														)}
													</div>

													<div className="flex-1 min-w-0 pr-16 md:pr-20">
														<h3 className="text-sm md:text-base font-bold text-[#05324f] mb-0.5 md:mb-1 truncate">
															{workshop?.companyName || 'Workshop name'}
														</h3>
														<div className="flex items-center gap-1 text-gray-400 text-[0.65rem] md:text-[0.7rem] font-bold uppercase tracking-tight">
															<Car size={10} className="md:w-3 md:h-3" />
															<span className="truncate">{vehicle?.make} {vehicle?.model} {vehicle?.year}</span>
														</div>
														<div className="text-gray-400 text-[0.65rem] md:text-[0.7rem] font-bold mt-0.5 md:mt-1">
															{formatDate(new Date(request.createdAt))}
														</div>
													</div>

													<div className="absolute right-0 top-0 text-right">
														{booking?.totalAmount ? (
															<>
																<div className="text-[0.9rem] md:text-lg font-black text-[#05324f]">
																	{formatPrice(booking.totalAmount)}
																</div>
																<div className="text-[0.55rem] md:text-[0.6rem] font-bold text-gray-400">incl. VAT</div>
															</>
														) : null}
													</div>
												</div>
											</div>
										)
									})}
								</div>
							)}

							{/* Drafts CTA at bottom of Past tab */}
							<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 mt-4">
								<div className="w-11 h-11 rounded-xl bg-[#F2F9F4] flex items-center justify-center shrink-0">
									<FileText className="w-5 h-5 text-[#38BC54]" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-black text-[#05324f]">{t('my_cases.drafts_prompt') || 'Have a case in progress?'}</p>
									<p className="text-[11px] text-gray-400 font-semibold leading-tight">{t('my_cases.drafts_subtitle') || 'Find your saved drafts'}</p>
								</div>
								<button
									onClick={() => handleTabChange('drafts')}
									className="px-3 py-2 border border-[#38BC54] rounded-lg text-[#38BC54] text-xs font-black active:scale-95 transition-transform"
								>
									{t('my_cases.show_drafts') || 'Show drafts'}
								</button>
							</div>
						</div>
					)}

					{activeTab === 'drafts' && (
						<div className="space-y-6">
							<h2 className="text-[0.75rem] font-black text-gray-400 tracking-wider uppercase">
								{t('my_cases.tabs.drafts') || 'Drafts'}
							</h2>
							<div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
								<div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
									<FileText size={40} className="text-gray-200" />
								</div>
								<h3 className="text-xl font-black text-[#05324f] mb-2">{t('my_cases.no_drafts_title') || 'No drafts'}</h3>
								<p className="text-gray-400 text-sm max-w-[260px] mx-auto mb-8">{t('my_cases.no_drafts_desc') || 'Cases you start but don\'t complete will appear here.'}</p>
								<Button asChild className="bg-[#38BC54] hover:bg-[#2fa348] text-white rounded-xl px-8 h-12 font-bold transition-all active:scale-95 shadow-lg shadow-green-100">
									<Link to="/upload">{t('my_cases.start_new_case') || 'Start new case'}</Link>
								</Button>
							</div>
						</div>
					)}

				</div>
			</div>

			<Footer />

			{/* Modals */}
			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem]">
					<div className="bg-red-50 p-8 text-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<Trash2 className="w-8 h-8 text-red-600" />
						</div>
						<DialogTitle className="text-2xl font-black text-gray-900 mb-2">{t('my_cases.delete_request_title')}</DialogTitle>
						<DialogDescription className="text-gray-600 font-medium">{t('my_cases.delete_request_description')}</DialogDescription>
					</div>
					<div className="p-8 bg-white flex gap-3">
						<Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="flex-1 h-14 rounded-2xl font-bold text-gray-400">
							{t('common.cancel')}
						</Button>
						<Button onClick={handleDeleteRequest} disabled={isDeleting} className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black">
							{isDeleting ? '...' : t('common.confirm_delete')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Complete Modal */}
			<Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
				<DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem]">
					<div className="bg-green-50 p-8 text-center">
						<div className="w-16 h-16 bg-[#38BC54]/10 rounded-full flex items-center justify-center mx-auto mb-6">
							<CheckCircle className="w-8 h-8 text-[#38BC54]" />
						</div>
						<DialogTitle className="text-2xl font-black text-gray-900 mb-2">Complete Job</DialogTitle>
						<DialogDescription className="text-gray-600 font-medium">Please rate the service before completing.</DialogDescription>
					</div>
					<div className="p-8 bg-white space-y-6">
						<div className="flex justify-center gap-2">
							{[1, 2, 3, 4, 5].map(star => (
								<button key={star} onClick={() => setCompleteRating(star)} className="focus:outline-none">
									<Star className={`w-10 h-10 ${star <= completeRating ? 'fill-[#38BC54] text-[#38BC54]' : 'text-gray-200'}`} />
								</button>
							))}
						</div>
						<Textarea
							placeholder="Write your review here..."
							value={completeReviewText}
							onChange={e => setCompleteReviewText(e.target.value)}
							className="rounded-2xl border-gray-100 min-h-[100px]"
						/>
						<Button onClick={handleCompleteJob} disabled={isCompleting || !completeRating} className="w-full h-14 bg-[#38BC54] text-white rounded-2xl font-black">
							{isCompleting ? '...' : 'Complete & Submit'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Review Modal (from list) */}
			<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
				<DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem]">
					<div className="bg-[#38BC54]/5 p-8 text-center">
						<DialogTitle className="text-2xl font-black text-[#05324f]">Rate Service</DialogTitle>
						<DialogDescription>How was your experience?</DialogDescription>
					</div>
					<div className="p-8 bg-white space-y-6">
						<div className="flex justify-center gap-2">
							{[1, 2, 3, 4, 5].map(star => (
								<button key={star} onClick={() => setRating(star)} className="focus:outline-none">
									<Star className={`w-10 h-10 ${star <= rating ? 'fill-[#38BC54] text-[#38BC54]' : 'text-gray-200'}`} />
								</button>
							))}
						</div>
						<Textarea
							placeholder="Your thoughts..."
							value={reviewText}
							onChange={e => setReviewText(e.target.value)}
							className="rounded-2xl border-gray-100 min-h-[100px]"
						/>
						<Button onClick={handleSubmitReview} disabled={isSubmittingReview || !rating} className="w-full h-14 bg-[#38BC54] text-white rounded-2xl font-black">
							{isSubmittingReview ? '...' : 'Submit Review'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Cancel Job Modal */}
			<Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
				<DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem]">
					<div className="bg-red-50 p-8 text-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<XCircle className="w-8 h-8 text-red-600" />
						</div>
						<DialogTitle className="text-2xl font-black text-gray-900 mb-2">{t('my_cases.cancel_job_confirm_title') || 'Cancel Job'}</DialogTitle>
						<DialogDescription className="text-gray-600 font-medium">{t('my_cases.cancel_job_confirm_description') || 'Are you sure you want to cancel this job? This action cannot be undone.'}</DialogDescription>
					</div>
					<div className="p-8 bg-white space-y-4">
						<div className="space-y-2">
							<Label>{t('my_cases.cancel_reason') || 'Reason'}</Label>
							<Textarea value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} placeholder={t('my_cases.cancel_reason_placeholder') || 'Please provide a reason'} className="rounded-2xl border-gray-100 min-h-[100px]" />
						</div>
						<div className="flex gap-3">
							<Button variant="ghost" onClick={() => setCancelConfirmOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-gray-400">
								{t('common.cancel')}
							</Button>
							<Button variant="destructive" onClick={handleCancelJob} disabled={isCancelling} className="flex-1 h-12 rounded-2xl font-black">
								{isCancelling ? '...' : (t('my_cases.confirm_cancel') || 'Confirm Cancel')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Reschedule Modal */}
			<Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
				<DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem]">
					<div className="bg-blue-50 p-8 text-center">
						<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
							<RotateCcw className="w-8 h-8 text-blue-600" />
						</div>
						<DialogTitle className="text-2xl font-black text-gray-900 mb-2">Reschedule</DialogTitle>
						<DialogDescription>Pick a new date and time.</DialogDescription>
					</div>
					<div className="p-8 bg-white space-y-4">
						<div className="space-y-2">
							<Label>New Date</Label>
							<Input type="date" value={newScheduledDate} onChange={e => setNewScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="rounded-xl h-12" />
						</div>
						<div className="space-y-2">
							<Label>New Time</Label>
							<Input type="time" value={newScheduledTime} onChange={e => setNewScheduledTime(e.target.value)} className="rounded-xl h-12" />
						</div>
						<Button onClick={handleRescheduleJob} disabled={isRescheduling || !newScheduledDate || !newScheduledTime} className="w-full h-14 bg-[#38BC54] text-white rounded-2xl font-black mt-4">
							{isRescheduling ? '...' : 'Confirm Reschedule'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Workshop Details Modal */}
			<Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
				<DialogContent
					onClose={() => setDetailsModalOpen(false)}
					className="w-[92vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 rounded-2xl shadow-2xl"
				>
					{selectedBookingForDetails && (() => {
						const ws = selectedBookingForDetails.workshopId || selectedBookingForDetails.workshop || {}
						const status = selectedBookingForDetails.status
						return (
							<>
								{/* Header */}
								<div className="px-6 md:px-8 pt-6 pb-5 border-b border-gray-100">
									<h2 className="text-xl md:text-2xl font-black text-[#05324f]">
										{t('my_cases.workshop_details') || 'Workshop Details'}
									</h2>
									<p className="text-sm text-gray-500 mt-1">
										{t('my_cases.workshop_details_desc') || 'Contact information for your booked workshop.'}
									</p>
								</div>

								{/* Workshop hero */}
								<div className="px-6 md:px-8 py-5 flex items-center gap-4 border-b border-gray-100">
									<div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
										{ws.logo ? (
											<img src={getFullUrl(ws.logo)} alt={ws.companyName} className="w-full h-full object-cover" />
										) : (
											<Building2 className="text-white/30 w-7 h-7" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<h3 className="text-base md:text-lg font-black text-[#05324f] truncate">
												{ws.companyName || 'N/A'}
											</h3>
											{ws.isVerified && <ShieldCheck size={16} className="text-[#38BC54] shrink-0" />}
										</div>
										{ws.address?.city && (
											<div className="flex items-center gap-1 text-gray-500 text-xs md:text-sm font-semibold mt-0.5">
												<MapPin size={12} />
												<span className="truncate">{ws.address.city}</span>
											</div>
										)}
									</div>
									{selectedBookingForDetails.scheduledAt && (
										<div className="text-right shrink-0 hidden sm:block">
											<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">
												{t('my_cases.scheduled') || 'Scheduled'}
											</p>
											<p className="text-sm font-bold text-[#05324f]">
												{formatDateTime(new Date(selectedBookingForDetails.scheduledAt))}
											</p>
										</div>
									)}
								</div>

								{/* Contact grid */}
								<div className="px-6 md:px-8 py-6">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
											<div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
												<MailIcon className="w-4 h-4 text-[#05324f]" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
													{t('my_cases.email') || 'Email'}
												</p>
												<p className="text-sm font-semibold text-[#05324f] break-all">
													{ws.email || 'N/A'}
												</p>
											</div>
										</div>

										<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
											<div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
												<PhoneIcon className="w-4 h-4 text-[#05324f]" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
													{t('my_cases.phone') || 'Phone'}
												</p>
												<p className="text-sm font-semibold text-[#05324f] break-all">
													{ws.phone || 'N/A'}
												</p>
											</div>
										</div>

										{selectedBookingForDetails.scheduledAt && (
											<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 sm:hidden">
												<div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
													<Calendar className="w-4 h-4 text-[#05324f]" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
														{t('my_cases.scheduled') || 'Scheduled'}
													</p>
													<p className="text-sm font-semibold text-[#05324f]">
														{formatDateTime(new Date(selectedBookingForDetails.scheduledAt))}
													</p>
												</div>
											</div>
										)}

										{selectedBookingForDetails.totalAmount != null && (
											<div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
												<div className="p-2 bg-white rounded-lg border border-gray-100 shrink-0">
													<FileText className="w-4 h-4 text-[#05324f]" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
														{t('my_cases.total_amount') || 'Total Amount'}
													</p>
													<p className="text-sm font-bold text-[#05324f]">
														{formatPrice(selectedBookingForDetails.totalAmount)} <span className="text-[10px] text-gray-400 font-bold ml-1">incl. VAT</span>
													</p>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Action footer */}
								{(status === 'CONFIRMED' || status === 'RESCHEDULED') && (
									<div className="px-6 md:px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
										{status === 'CONFIRMED' && (
											<Button
												onClick={() => {
													setDetailsModalOpen(false)
													setBookingToComplete(selectedBookingForDetails)
													setCompleteRating(0)
													setCompleteReviewText('')
													setCompleteConfirmOpen(true)
												}}
												className="flex-1 h-11 bg-[#38BC54] hover:bg-[#2eb34f] text-white font-bold rounded-xl shadow-sm"
											>
												<CheckCircle className="w-4 h-4 mr-2" />
												{t('my_cases.complete_job') || 'Complete Job'}
											</Button>
										)}

										<Button
											onClick={() => {
												setDetailsModalOpen(false)
												setSelectedBookingForReschedule(selectedBookingForDetails)
												setNewScheduledDate('')
												setNewScheduledTime('')
												setRescheduleModalOpen(true)
											}}
											variant="outline"
											className="flex-1 h-11 border border-[#05324f]/20 text-[#05324f] font-bold rounded-xl hover:bg-white"
										>
											<RotateCcw className="w-4 h-4 mr-2" />
											{status === 'RESCHEDULED'
												? (t('my_cases.reschedule_again') || 'Reschedule Again')
												: (t('my_cases.reschedule_job') || 'Reschedule Job')}
										</Button>

										<Button
											onClick={() => {
												setDetailsModalOpen(false)
												setBookingToCancel(selectedBookingForDetails)
												setCancellationReason('')
												setCancelConfirmOpen(true)
											}}
											variant="destructive"
											className="flex-1 h-11 font-bold rounded-xl"
										>
											<XCircle className="w-4 h-4 mr-2" />
											{t('my_cases.cancel_job') || 'Cancel Job'}
										</Button>
									</div>
								)}
							</>
						)
					})()}
				</DialogContent>
			</Dialog>
		</div>
	)
}
