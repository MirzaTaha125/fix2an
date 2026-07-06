import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { MyCaseCurrentCardSkeleton, PageHeaderSkeleton, Skeleton } from '../components/ui/Skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '../components/ui/Dialog'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import { formatSwedishPhone, stripSwedishPhoneForTel } from '../utils/swedishPhone'
import {
	Clock,
	Star,
	Eye,
	Calendar,
	CheckCircle,
	XCircle,
	AlertCircle,
	FileText,
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
import VehicleRequestCard from '../components/VehicleRequestCard'
import WorkshopImage from '../components/WorkshopImage'

import { requestsAPI, bookingsAPI, reviewsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

const confirmDialogContentClass =
	'w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto'

const confirmDialogTitleClass =
	'text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full'

const confirmDialogDescClass =
	'text-gray-500 text-sm sm:text-base leading-relaxed text-center'

const confirmDialogFooterClass =
	'mt-5 sm:mt-6 !flex-row gap-2.5 sm:gap-3 items-stretch w-full'

const confirmDialogBtnClass =
	'flex-1 min-w-0 min-h-[44px] px-3 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm leading-snug whitespace-normal text-center'

const confirmDialogCancelBtnClass =
	`${confirmDialogBtnClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`

const confirmDialogPrimaryBtnClass =
	`${confirmDialogBtnClass} bg-[#34C759] hover:bg-[#2eb34f] text-white transition-all shadow-md active:scale-95`

const confirmDialogDangerBtnClass =
	`${confirmDialogBtnClass} bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95`

function ChatBubbleIcon({ className = 'w-6 h-6' }) {
	return (
		<svg viewBox="0 0 40 32" fill="none" className={className} aria-hidden>
			<path
				d="M20 3C11.16 3 4 8.82 4 16c0 3.56 1.67 6.76 4.32 8.88L6 29l5.4-3.24C13.4 26.56 16.58 27.5 20 27.5c8.84 0 16-5.82 16-13S28.84 3 20 3z"
				stroke="#38BC54"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function mergeBookingWorkshop(booking) {
	const ws = booking?.workshopId
	const nested = booking?.workshop
	if (!ws && !nested) return null

	const uploadedImage =
		nested?.logo ||
		nested?.image ||
		ws?.logo ||
		ws?.image ||
		(typeof ws?.userId === 'object' ? ws?.userId?.image : null)

	return {
		...(typeof ws === 'object' ? ws : {}),
		companyName: ws?.companyName || nested?.companyName,
		rating: ws?.rating ?? nested?.rating,
		reviewCount: ws?.reviewCount ?? nested?.reviewCount,
		isVerified: ws?.isVerified,
		email: ws?.email || nested?.email,
		phone: ws?.phone || nested?.phone,
		city: ws?.city || nested?.address?.city,
		logo: uploadedImage || undefined,
		image: uploadedImage || undefined,
	}
}

function getWorkshopCity(workshop) {
	if (!workshop) return null
	if (workshop.city) return workshop.city
	if (typeof workshop.address === 'object' && workshop.address?.city) return workshop.address.city
	return null
}

function getWorkshopLocationLabel(workshop, request, t) {
	const acceptedOffer = (request?.offers || []).find((o) => o.status === 'ACCEPTED')
	if (acceptedOffer?.distance != null) {
		return `${acceptedOffer.distance.toFixed(1)} ${t('offers_page.km_from_you') || 'km from you'}`
	}
	return getWorkshopCity(workshop) || request?.postalCode || '—'
}

function WorkshopContactNotice({ t }) {
	return (
		<div className="bg-[#F8FAF9] rounded-xl border border-[#38BC54]/10 p-3 flex gap-2.5 mt-3">
			<div className="shrink-0 pt-0.5">
				<ChatBubbleIcon className="w-6 h-6" />
			</div>
			<div className="flex-1 min-w-0">
				<h4 className="text-xs font-black text-[#05324f] leading-snug">
					{t('my_cases.workshop_contact_soon')}
				</h4>
				<p className="text-[11px] text-[#05324f]/70 leading-snug font-medium mt-0.5">
					{t('my_cases.receive_call_sms')}
				</p>
			</div>
		</div>
	)
}

function WorkshopDetailsInfoRow({ label, value }) {
	if (value == null || value === '') return null
	return (
		<div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-100 last:border-0">
			<span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
			<span className="text-sm font-semibold text-[#05324f] text-right break-words">{value}</span>
		</div>
	)
}

export default function MyCasesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t, i18n } = useTranslation()
	
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState(() => {
		const tabParam = searchParams.get('tab')
		if (tabParam === 'current' || tabParam === 'aktuella' || tabParam === 'requested' || tabParam === 'booked' || tabParam === 'rescheduled') {
			return 'current'
		}
		if (tabParam === 'previous' || tabParam === 'tidigare' || tabParam === 'completed') return 'previous'
		if (tabParam === 'drafts' || tabParam === 'utkast') return 'drafts'
		if (['current', 'previous', 'drafts'].includes(tabParam)) return tabParam
		return 'current'
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

	const [contactModalOpen, setContactModalOpen] = useState(false)
	const [selectedBookingForContact, setSelectedBookingForContact] = useState(null)
	
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
	const [requestToDelete, setRequestToDelete] = useState(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const [activeMenuId, setActiveMenuId] = useState(null)

	const openCompleteFromBooking = (booking) => {
		setActiveMenuId(null)
		setBookingToComplete(booking)
		setCompleteRating(0)
		setCompleteReviewText('')
		setCompleteConfirmOpen(true)
	}

	const openRescheduleFromBooking = (booking) => {
		setActiveMenuId(null)
		setSelectedBookingForReschedule(booking)
		if (booking.scheduledAt) {
			const scheduled = new Date(booking.scheduledAt)
			setNewScheduledDate(scheduled.toISOString().split('T')[0])
			setNewScheduledTime(scheduled.toTimeString().slice(0, 5))
		} else {
			setNewScheduledDate('')
			setNewScheduledTime('')
		}
		setRescheduleModalOpen(true)
	}

	const openCancelFromBooking = (booking) => {
		setActiveMenuId(null)
		setBookingToCancel(booking)
		setCancellationReason('')
		setCancelConfirmOpen(true)
	}

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
		if (tab === 'current' || tab === 'aktuella' || tab === 'requested' || tab === 'booked' || tab === 'rescheduled') {
			setActiveTab('current')
		} else if (tab === 'previous' || tab === 'tidigare' || tab === 'completed') {
			setActiveTab('previous')
		} else if (tab === 'drafts' || tab === 'utkast') {
			setActiveTab('drafts')
		} else if (tab && ['current', 'previous', 'drafts'].includes(tab)) {
			setActiveTab(tab)
		}
	}, [searchParams])

	const handleTabChange = (tab) => {
		setActiveTab(tab)
		setSearchParams({ tab })
	}

	const getBookingPrice = (request, booking) => {
		if (booking?.totalAmount != null && booking.totalAmount > 0) return booking.totalAmount
		const acceptedOffer = (request.offers || []).find((o) => o.status === 'ACCEPTED')
		if (acceptedOffer?.price != null) return acceptedOffer.price
		return null
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

	const bookedRequests = requests.filter(r => getRequestCategory(r) === 'booked')
	const completedRequests = requests.filter(r => getRequestCategory(r) === 'completed')
	const rescheduledRequests = requests.filter(r => getRequestCategory(r) === 'rescheduled')

	const currentRequests = [...bookedRequests, ...rescheduledRequests]
	const previousRequests = completedRequests
	const draftRequests = []

	const categoryCounts = {
		current: currentRequests.length,
		previous: previousRequests.length,
		drafts: draftRequests.length,
	}

	const allTabs = [
		{ key: 'current', label: t('my_cases.tabs.current') || 'Current' },
		{ key: 'previous', label: t('my_cases.tabs.previous') || 'Previous' },
		{ key: 'drafts', label: t('my_cases.tabs.drafts') || 'Drafts' },
	]

	const activeList =
		activeTab === 'current' ? currentRequests :
		activeTab === 'previous' ? previousRequests :
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
			<div className="list-page-shell bg-white">
				<Navbar />
				<div className="list-page-content">
					<div className="mb-6 md:mb-7">
						<PageHeaderSkeleton titleClassName="h-8 w-48 max-w-full" descClassName="h-4 w-64 max-w-full" />
					</div>
					<Skeleton className="h-11 w-full rounded-[10px] mb-5 lg:mb-8" />
					<Skeleton className="h-3 w-24 rounded mb-5" />
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<MyCaseCurrentCardSkeleton key={i} />
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	return (
		<div className="list-page-shell bg-white font-sans">
			<Navbar />
			
			<div className="list-page-content">
				<div className="mb-6 md:mb-7">
					<div className="flex-1 min-w-0">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#05324f] leading-tight mb-1.5 lg:mb-2">
							{t('navigation.contract') || t('my_cases.title') || 'Contract'}
						</h1>
						<p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
							{t('my_cases.subtitle_short') || t('my_cases.mobile_subtitle')}
						</p>
					</div>
				</div>

				{/* Tabs — segmented control */}
				<div className="flex mb-5 lg:mb-8 rounded-[10px] overflow-hidden border border-[#E0E0E0] bg-white shadow-sm">
					{allTabs.map((tab, index) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => handleTabChange(tab.key)}
							className={`flex-1 py-2 sm:py-2.5 lg:py-3 px-1.5 sm:px-2 text-xs sm:text-[13px] lg:text-sm font-medium text-center transition-colors duration-200 ${
								index > 0 ? 'border-l border-[#E0E0E0]' : ''
							} ${
								activeTab === tab.key
									? 'bg-[#38BC54] text-white font-semibold'
									: 'bg-white text-[#1A202C] hover:bg-gray-50'
							}`}
						>
							{tab.label}{categoryCounts[tab.key] > 0 ? ` (${categoryCounts[tab.key]})` : ''}
						</button>
					))}
				</div>

				{/* Tab Content */}
				<div className="min-h-[400px]">
					{activeTab === 'current' && (
						<div className="space-y-10">
							<div>
								<h2 className="text-[0.75rem] font-black text-gray-400 tracking-wider mb-5 uppercase">
									{t('my_cases.current_case_label') || t('my_cases.tabs.current')}
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
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
										{activeList.map((request) => {
											const rescheduledBooking = (request.bookings || []).find(b => b.status === 'RESCHEDULED')
											const confirmedBooking = (request.bookings || []).find(b => b.status === 'CONFIRMED')
											const booking = rescheduledBooking || confirmedBooking
											const workshop = mergeBookingWorkshop(booking)
											const casePrice = getBookingPrice(request, booking)
											const bookingId = booking?._id || booking?.id
											const hasScheduledAppointment = Boolean(booking?.scheduledAt)

										return (
											<div key={request._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full">
												{/* Status badge + actions */}
												<div className="mb-3 flex items-center justify-between gap-2">
													{booking?.status === 'RESCHEDULED' ? (
														<div className="inline-flex items-center gap-1.5 bg-[#F2F9F4] text-[#38BC54] px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#38BC54]/15">
															<Clock size={12} className="shrink-0" />
															{t('my_cases.tabs.rescheduled') || 'Rescheduled'}
														</div>
													) : hasScheduledAppointment ? (
														<div className="inline-flex items-center gap-1.5 bg-[#F2F9F4] text-[#38BC54] px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#38BC54]/15">
															<Clock size={12} className="shrink-0" />
															{t('my_cases.booking_confirmed')}
														</div>
													) : (
														<div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-amber-200">
															<Clock size={12} className="shrink-0" />
															{t('workshop.contracts.not_scheduled') || 'Not scheduled'}
														</div>
													)}
													{hasScheduledAppointment && booking && (
														<div className="relative shrink-0">
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation()
																	setActiveMenuId(activeMenuId === bookingId ? null : bookingId)
																}}
																className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
																aria-label={t('common.actions') || 'Actions'}
															>
																<MoreVertical size={16} />
															</button>
															{activeMenuId === bookingId && (
																<div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 overflow-hidden">
																	<button
																		type="button"
																		onClick={() => openCompleteFromBooking(booking)}
																		className="w-full px-3 py-2.5 text-left text-xs font-semibold text-[#05324f] hover:bg-gray-50 flex items-center gap-2"
																	>
																		<CheckCircle size={14} className="text-[#05324f]" />
																		{t('my_cases.action_confirm')}
																	</button>
																	<button
																		type="button"
																		onClick={() => openRescheduleFromBooking(booking)}
																		className="w-full px-3 py-2.5 text-left text-xs font-semibold text-[#05324f] hover:bg-gray-50 flex items-center gap-2"
																	>
																		<Calendar size={14} className="text-[#05324f]" />
																		{t('my_cases.action_reschedule')}
																	</button>
																	<button
																		type="button"
																		onClick={() => openCancelFromBooking(booking)}
																		className="w-full px-3 py-2.5 text-left text-xs font-semibold text-[#05324f] hover:bg-gray-50 flex items-center gap-2"
																	>
																		<XCircle size={14} className="text-[#05324f]" />
																		{t('my_cases.action_cancel')}
																	</button>
																</div>
															)}
														</div>
													)}
												</div>

												{/* Workshop row */}
												<div className="flex gap-3 relative">
													<div className="w-14 h-14 md:w-[3.25rem] md:h-[3.25rem] bg-[#38BC54] rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-[#38BC54]/20">
														<WorkshopImage
															workshop={workshop}
															alt={workshop?.companyName}
															className="w-full h-full"
															fallbackClassName="bg-[#38BC54]"
														/>
													</div>
													<div className="flex-1 min-w-0 pr-2">
														<h3 className="text-sm font-semibold text-[#05324f] mb-0.5 line-clamp-1">
															{workshop?.companyName || t('my_cases.status.awaiting_quotes')}
														</h3>
														{workshop && (
															<ShieldCheck size={14} fill="#38BC54" fillOpacity={0.1} className="text-[#38BC54] shrink-0 mb-0.5" />
														)}
														{workshop && (
															<div className="flex items-center gap-1 mb-0.5">
																<div className="flex gap-0.5">
																	{[...Array(5)].map((_, i) => (
																		<Star
																			key={i}
																			size={10}
																			fill={i < Math.floor(workshop.averageRating || workshop.rating || 0) ? '#FFD700' : 'none'}
																			className={i < Math.floor(workshop.averageRating || workshop.rating || 0) ? 'text-[#FFD700]' : 'text-gray-200'}
																		/>
																	))}
																</div>
																<span className="text-[10px] font-semibold text-gray-400">
																	{(workshop.averageRating || workshop.rating || 0).toFixed(1)} ({workshop.reviewCount || 0}{' '}
																	{(workshop.reviewCount || 0) === 1
																		? (t('my_cases.review_singular') || 'review')
																		: (t('offers_page.reviews') || 'reviews')})
																</span>
															</div>
														)}
														<div className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold">
															<MapPin size={11} className="shrink-0" />
															<span className="truncate">
																{getWorkshopLocationLabel(workshop, request, t)}
															</span>
														</div>
													</div>
													{casePrice != null && (
														<div className="text-right shrink-0">
															<div className="text-base font-semibold text-[#05324f] leading-none">
																{formatPrice(casePrice)}
															</div>
															<div className="text-[9px] font-semibold text-gray-400 mt-0.5">
																{t('offers_page.incl_vat') || 'incl. VAT'}
															</div>
														</div>
													)}
												</div>

												<div className="h-px bg-gray-100 my-3" />

												<VehicleRequestCard
													request={request}
													titleWeight="semibold"
													imageContainerClassName="w-[4.5rem] md:w-20"
													imageClassName="w-full h-14 md:h-full"
													imageFallbackClassName="w-full h-full"
													className="items-start"
													headerEnd={<ChevronRight className="text-gray-300 shrink-0" size={18} />}
												/>

												{hasScheduledAppointment && (
													<div className="mt-1.5 flex items-center gap-2 text-xs text-[#05324f] bg-[#F8FAF9] border border-[#38BC54]/10 rounded-xl px-3 py-2">
														<Calendar size={14} className="text-[#38BC54] shrink-0" />
														<div className="min-w-0">
															<p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
																{t('my_cases.appointment_date')}
															</p>
															<p className="font-semibold leading-snug">
																{formatDateTime(new Date(booking.scheduledAt), i18n.language)}
															</p>
														</div>
													</div>
												)}

												{!hasScheduledAppointment && (
													<WorkshopContactNotice t={t} />
												)}

												{workshop && (
													<button
														type="button"
														className="w-full mt-2.5 h-10 border border-[#38BC54] rounded-xl text-[#38BC54] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F9F4] transition-all active:scale-[0.98]"
														onClick={() => {
															setSelectedBookingForContact(booking)
															setContactModalOpen(true)
														}}
													>
														<ChatBubbleIcon className="w-4 h-4" />
														{t('my_cases.contact_workshop')}
													</button>
												)}
											</div>
										)
										})}
									</div>
								)}
							</div>

						</div>
					)}

					{activeTab === 'previous' && (
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
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
									{completedRequests.map((request) => {
										const booking = (request.bookings || []).find(b => b.status === 'DONE' || b.status === 'CANCELLED')
										const workshop = mergeBookingWorkshop(booking)
										const isCancelled = request.status === 'CANCELLED' || booking?.status === 'CANCELLED'
										const casePrice = getBookingPrice(request, booking)
										const statusLabel = isCancelled
											? (t('my_cases.status.cancelled') || 'Cancelled')
											: (t('my_cases.status.case_closed') || 'Case closed')

										return (
											<div key={request._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full">
												<VehicleRequestCard
													request={request}
													titleWeight="semibold"
													className="items-start"
													headerEnd={
														<span
															className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${
																isCancelled
																	? 'bg-red-50 text-red-600 border border-red-100'
																	: 'bg-[#F2F9F4] text-[#38BC54] border border-[#38BC54]/20'
															}`}
														>
															{statusLabel}
														</span>
													}
												>
													{casePrice != null && (
														<p className="text-[11px] text-[#05324f]/80 leading-snug">
															<span className="font-semibold">{t('offers_page.price') || 'Price'}:</span>{' '}
															<span className="font-medium text-[#38BC54]">{formatPrice(casePrice)}</span>
														</p>
													)}
													{workshop?.companyName && (
														<p className="text-[11px] text-[#05324f]/80 leading-snug line-clamp-1">
															<span className="font-semibold">{t('offers_page.workshop') || 'Workshop'}:</span> {workshop.companyName}
														</p>
													)}
													<p className="text-[11px] text-[#05324f]/80">
														<span className="font-semibold">{t('workshop.contracts.scheduled') || 'Scheduled'}:</span>{' '}
														{booking?.scheduledAt
															? formatDateTime(new Date(booking.scheduledAt))
															: formatDate(new Date(request.createdAt))}
													</p>
												</VehicleRequestCard>
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
			
			<Footer className="max-lg:hidden" />

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
				<DialogContent className={confirmDialogContentClass}>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className={confirmDialogTitleClass}>
							{t('my_cases.complete_job_confirm_title') || 'Complete Job'}
						</DialogTitle>
						<DialogDescription className={confirmDialogDescClass}>
							{t('my_cases.complete_job_confirm_description') || 'Please rate and review the service before completing the job.'}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 sm:mt-5 space-y-4">
						<div className="flex justify-center gap-1.5 sm:gap-2">
							{[1, 2, 3, 4, 5].map(star => (
								<button key={star} type="button" onClick={() => setCompleteRating(star)} className="focus:outline-none">
									<Star className={`w-8 h-8 sm:w-9 sm:h-9 ${star <= completeRating ? 'fill-[#38BC54] text-[#38BC54]' : 'text-gray-200'}`} />
								</button>
							))}
						</div>
						<Textarea
							placeholder={t('my_cases.review_placeholder') || 'Write your review here...'}
							value={completeReviewText}
							onChange={e => setCompleteReviewText(e.target.value)}
							className="rounded-xl border-gray-200 min-h-[88px] text-sm"
						/>
					</div>

					<DialogFooter className={confirmDialogFooterClass}>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCompleteConfirmOpen(false)}
							className={confirmDialogCancelBtnClass}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							size="sm"
							onClick={handleCompleteJob}
							disabled={isCompleting || !completeRating}
							className={confirmDialogPrimaryBtnClass}
						>
							{isCompleting ? (t('profile.saving') || '...') : (t('my_cases.confirm_complete') || 'Confirm Complete')}
						</Button>
					</DialogFooter>
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
				<DialogContent className={confirmDialogContentClass}>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className={confirmDialogTitleClass}>
							{t('my_cases.cancel_job_confirm_title') || 'Cancel Job'}
						</DialogTitle>
						<DialogDescription className={confirmDialogDescClass}>
							{t('my_cases.cancel_job_confirm_description') || 'Are you sure you want to cancel this job? This action cannot be undone.'}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 sm:mt-5 space-y-2">
						<Label className="text-sm font-medium text-gray-700">
							{t('my_cases.cancellation_reason_label') || 'Reason for cancellation'}
						</Label>
						<Textarea
							value={cancellationReason}
							onChange={e => setCancellationReason(e.target.value)}
							placeholder={t('my_cases.cancel_reason_placeholder') || 'Please provide a reason'}
							className="rounded-xl border-gray-200 min-h-[88px] text-sm"
						/>
					</div>

					<DialogFooter className={confirmDialogFooterClass}>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setCancelConfirmOpen(false)}
							className={confirmDialogCancelBtnClass}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							size="sm"
							onClick={handleCancelJob}
							disabled={isCancelling}
							className={confirmDialogPrimaryBtnClass}
						>
							{isCancelling ? (t('profile.saving') || '...') : (t('my_cases.cancel_job') || 'Cancel')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reschedule Modal */}
			<Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
				<DialogContent className={confirmDialogContentClass}>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className={confirmDialogTitleClass}>
							{t('my_cases.reschedule_job_title') || 'Reschedule Job'}
						</DialogTitle>
						<DialogDescription className={confirmDialogDescClass}>
							{t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment'}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 sm:mt-5 space-y-3">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-gray-700">
								{t('my_cases.new_date') || 'New Date'}
							</Label>
							<Input
								type="date"
								value={newScheduledDate}
								onChange={e => setNewScheduledDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-gray-700">
								{t('my_cases.new_time') || 'New Time'}
							</Label>
							<Input
								type="time"
								value={newScheduledTime}
								onChange={e => setNewScheduledTime(e.target.value)}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
					</div>

					<DialogFooter className={confirmDialogFooterClass}>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setRescheduleModalOpen(false)}
							className={confirmDialogCancelBtnClass}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							size="sm"
							onClick={handleRescheduleJob}
							disabled={isRescheduling || !newScheduledDate || !newScheduledTime}
							className={confirmDialogPrimaryBtnClass}
						>
							{isRescheduling ? (t('profile.saving') || '...') : (t('my_cases.reschedule_job') || 'Reschedule')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Workshop Details Modal */}
			<Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
				<DialogContent
					onClose={() => setDetailsModalOpen(false)}
					className="relative w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),400px)] md:w-[min(calc(100vw-2rem),480px)] lg:w-[min(calc(100vw-2rem),540px)] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-0 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[88vh] flex flex-col"
				>
					{selectedBookingForDetails && (() => {
						const ws = mergeBookingWorkshop(selectedBookingForDetails) || {}
						const status = selectedBookingForDetails.status
						const city = getWorkshopCity(ws)
						const hasActions = status === 'CONFIRMED' || status === 'RESCHEDULED'

						return (
							<div className="flex-1 overflow-y-auto min-h-0">
								<div className="px-4 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6 md:px-8 md:pt-8 md:pb-8">
									<DialogHeader className="text-center items-center sm:text-center pr-7 sm:pr-8">
										<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-0 text-center w-full">
											{t('my_cases.workshop_details') || 'Workshop Details'}
										</DialogTitle>
										<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center mt-2">
											{t('my_cases.workshop_details_desc') || 'Contact information for your booked workshop.'}
										</DialogDescription>
									</DialogHeader>

									<div className="mt-4 sm:mt-5 flex gap-2.5 sm:gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
										<div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-[5.25rem] md:h-[5.25rem] rounded-xl bg-[#38BC54] overflow-hidden flex items-start justify-center shrink-0 border border-[#38BC54]/20">
											<WorkshopImage workshop={ws} alt={ws.companyName} className="w-full h-full" fallbackClassName="bg-[#38BC54]" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2 mb-1.5">
												<div className="flex-1 min-w-0">
													<h3 className="text-sm sm:text-base font-black text-[#05324f] leading-snug line-clamp-2">
														{ws.companyName || 'N/A'}
													</h3>
													{ws.isVerified && (
														<ShieldCheck size={14} className="inline-block mt-1 text-[#38BC54] shrink-0" fill="#38BC54" fillOpacity={0.15} />
													)}
												</div>
												{selectedBookingForDetails.totalAmount != null && (
													<p className="text-base font-black text-[#38BC54] shrink-0 leading-tight">
														{formatPrice(selectedBookingForDetails.totalAmount)}
													</p>
												)}
											</div>
											{city && (
												<p className="text-[11px] sm:text-xs text-[#05324f]/80 leading-snug line-clamp-1">
													<span className="font-bold">{t('workshop.requests.location_label') || 'Location'}:</span> {city}
												</p>
											)}
										</div>
									</div>

									<div className="mt-3 sm:mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
										<WorkshopDetailsInfoRow label={t('my_cases.email') || 'Email'} value={ws.email || 'N/A'} />
										<WorkshopDetailsInfoRow label={t('my_cases.phone') || 'Phone'} value={formatSwedishPhone(ws.phone) || 'N/A'} />
										<WorkshopDetailsInfoRow
											label={t('my_cases.scheduled') || 'Scheduled'}
											value={selectedBookingForDetails.scheduledAt ? formatDateTime(new Date(selectedBookingForDetails.scheduledAt)) : null}
										/>
										<WorkshopDetailsInfoRow
											label={t('workshop.requests.status') || 'Status'}
											value={status === 'CONFIRMED' ? t('my_cases.booking_confirmed') : status === 'RESCHEDULED' ? (t('my_cases.tabs.rescheduled') || 'Rescheduled') : status}
										/>
									</div>

									{hasActions && (
									<DialogFooter className="mt-5 sm:mt-6 !flex-row flex-wrap gap-2 sm:gap-3 items-stretch">
										{status === 'CONFIRMED' && (
											<Button
												onClick={() => {
													setDetailsModalOpen(false)
													setBookingToComplete(selectedBookingForDetails)
													setCompleteRating(0)
													setCompleteReviewText('')
													setCompleteConfirmOpen(true)
												}}
												className="flex-1 min-w-0 h-10 px-2 sm:px-3 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-[11px] sm:text-xs leading-tight transition-all shadow-md active:scale-95"
											>
												{t('my_cases.complete_job') || 'Complete'}
											</Button>
										)}

										{hasActions && (
											<Button
												onClick={() => {
													setDetailsModalOpen(false)
													setSelectedBookingForReschedule(selectedBookingForDetails)
													setNewScheduledDate('')
													setNewScheduledTime('')
													setRescheduleModalOpen(true)
												}}
												variant="outline"
												className="flex-1 min-w-0 h-10 px-2 sm:px-3 rounded-xl border-gray-200 text-[#05324f] hover:bg-gray-50 font-semibold text-[11px] sm:text-xs leading-tight"
											>
												{status === 'RESCHEDULED'
													? (t('my_cases.reschedule_again') || 'Reschedule Again')
													: (t('my_cases.reschedule_job') || 'Reschedule')}
											</Button>
										)}

										{hasActions && (
											<Button
												onClick={() => {
													setDetailsModalOpen(false)
													setBookingToCancel(selectedBookingForDetails)
													setCancellationReason('')
													setCancelConfirmOpen(true)
												}}
												variant="outline"
												className="flex-1 min-w-0 h-10 px-2 sm:px-3 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-[11px] sm:text-xs leading-tight transition-all shadow-md active:scale-95"
											>
												{t('my_cases.cancel_job') || 'Cancel'}
											</Button>
										)}
									</DialogFooter>
									)}
								</div>
							</div>
						)
					})()}
				</DialogContent>
			</Dialog>

			{/* Contact Workshop Modal */}
			<Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
				<DialogContent
					onClose={() => setContactModalOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					{selectedBookingForContact && (() => {
						const ws = mergeBookingWorkshop(selectedBookingForContact) || {}
						const email = ws.email?.trim()
						const phone = ws.phone?.trim()

						return (
							<>
								<DialogHeader className="text-center items-center sm:text-center">
									<DialogTitle className="text-xl sm:text-2xl font-bold text-[#05324f] leading-tight text-center w-full">
										{ws.companyName || t('offers_page.workshop') || 'Workshop'}
									</DialogTitle>
								</DialogHeader>

								<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
									<Button
										variant="outline"
										disabled={!email}
										onClick={() => {
											if (!email) {
												toast.error(t('my_cases.contact_unavailable'))
												return
											}
											window.location.href = `mailto:${email}`
											setContactModalOpen(false)
										}}
										className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm disabled:opacity-40"
									>
										{t('my_cases.contact_via_mail')}
									</Button>
									<Button
										disabled={!phone}
										onClick={() => {
											if (!phone) {
												toast.error(t('my_cases.contact_unavailable'))
												return
											}
											window.location.href = `tel:${stripSwedishPhoneForTel(phone)}`
											setContactModalOpen(false)
										}}
										className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
									>
										{t('my_cases.contact_via_call')}
									</Button>
								</DialogFooter>
							</>
						)
					})()}
				</DialogContent>
			</Dialog>
		</div>
	)
}
