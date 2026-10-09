import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { CaseDetailSkeleton, MyCasesListSkeleton } from '../components/ui/Skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '../components/ui/Dialog'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice, formatDateTime } from '../utils/cn'
import { formatSwedishPhone, stripSwedishPhoneForTel } from '../utils/swedishPhone'
import {
	Star,
	ShieldCheck,
	Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import WorkshopImage from '../components/WorkshopImage'

import { requestsAPI, bookingsAPI, reviewsAPI } from '../services/api'
import CaseListView from '../components/cases/CaseListView'
import CaseDetailView from '../components/cases/CaseDetailView'
import CaseQuotesPanel from '../components/cases/CaseQuotesPanel'
import PaymentReviewPage from './PaymentReviewPage'
import BookAppointmentPage from './BookAppointmentPage'
import CaseMessagesInbox from '../components/cases/CaseMessagesInbox'
import { getCaseId, getActiveBooking, isClosedCase } from '../components/cases/caseHelpers'

function getActiveBookingId(request) {
	const booking = getActiveBooking(request)
	return booking?._id || booking?.id || null
}

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
	`${confirmDialogBtnClass} bg-brand-btn text-white transition-all shadow-md active:scale-95`

const confirmDialogDangerBtnClass =
	`${confirmDialogBtnClass} bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95`

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

function WorkshopDetailsInfoRow({ label, value }) {
	if (value == null || value === '') return null
	return (
		<div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-100 last:border-0">
			<span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
			<span className="text-sm font-semibold text-[#05324f] text-right break-words">{value}</span>
		</div>
	)
}

/** Keep list across /upload round-trips so back doesn’t flash a full reload. */
let myCasesListCache = { userId: null, data: [] }

export default function MyCasesPage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const userId = user?.id || user?._id || null
	const cachedList =
		userId && myCasesListCache.userId === String(userId) ? myCasesListCache.data : null
	
	const [requests, setRequests] = useState(() => cachedList || [])
	const [loading, setLoading] = useState(() => !cachedList)
	const [activeTab, setActiveTab] = useState(() => {
		const tabParam = searchParams.get('tab')
		if (tabParam === 'closed' || tabParam === 'previous' || tabParam === 'tidigare' || tabParam === 'completed') {
			return 'closed'
		}
		return 'current'
	})
	const selectedCaseId = searchParams.get('case')
	const showQuotes = searchParams.get('panel') === 'quotes' && !!selectedCaseId
	const showPayment = searchParams.get('panel') === 'payment' && !!selectedCaseId && !!searchParams.get('bookingId')
	const showBooking = searchParams.get('panel') === 'booking' && !!selectedCaseId && !!searchParams.get('offerId')
	const selectedPanel = ['details', 'status', 'photos', 'messages'].includes(searchParams.get('panel'))
		? searchParams.get('panel')
		: 'details'
	const showMessagesInbox = searchParams.get('view') === 'messages' && !selectedCaseId
	
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

	/** Customer confirms pickup → close case (READY_PICKUP → DONE) → review flow */
	const confirmPickedUp = async (booking) => {
		if (!booking) return
		const bookingId = booking._id || booking.id
		if (!bookingId) return
		const requestRef = booking.requestId
		const caseId =
			(requestRef && typeof requestRef === 'object' ? requestRef._id || requestRef.id : requestRef) ||
			selectedCaseId
		try {
			await bookingsAPI.complete(bookingId)
			toast.success(t('my_cases.job_completed_success') || 'Job completed')
			await fetchRequests({ silent: true })
			if (caseId) {
				const params = new URLSearchParams(searchParams)
				params.set('case', String(caseId))
				params.set('panel', 'payment')
				params.set('bookingId', String(bookingId))
				params.set('step', 'rate')
				params.delete('offerId')
				setSearchParams(params)
			}
		} catch (error) {
			console.error('Pickup complete error:', error)
			toast.error(error.response?.data?.message || t('my_cases.job_complete_error') || 'Failed to complete')
			throw error
		}
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

	const handleExtraDecision = async (booking, index, status) => {
		try {
			await bookingsAPI.update(booking._id || booking.id, {
				extraApprovalIndex: index,
				extraApprovalStatus: status,
			})
			toast.success(status === 'APPROVED' ? (t('my_cases.flow.extra_approved') || 'Approved') : (t('my_cases.flow.extra_declined') || 'Declined'))
			fetchRequests()
		} catch (error) {
			toast.error(error.response?.data?.message || t('errors.fetch_failed') || 'Failed')
		}
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

	const fetchRequests = async ({ silent = false } = {}) => {
		if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return

		try {
			const response = await requestsAPI.getByCustomer(user.id || user._id)
			if (response.data) {
				setRequests(response.data)
				myCasesListCache = { userId: String(user.id || user._id), data: response.data }
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			if (!silent) toast.error(t('my_cases.fetch_error') || 'Failed to fetch requests')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role?.toUpperCase() === 'CUSTOMER') {
			const uid = String(user.id || user._id)
			if (myCasesListCache.userId === uid) {
				setRequests(myCasesListCache.data)
				setLoading(false)
				fetchRequests({ silent: true })
			} else {
				fetchRequests()
			}
		}
	}, [user])

	useEffect(() => {
		if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return undefined
		const refresh = () => {
			if (document.visibilityState === 'visible') fetchRequests({ silent: true })
		}
		const timer = setInterval(refresh, 4000)
		window.addEventListener('focus', refresh)
		document.addEventListener('visibilitychange', refresh)
		return () => {
			clearInterval(timer)
			window.removeEventListener('focus', refresh)
			document.removeEventListener('visibilitychange', refresh)
		}
	}, [user])

	useEffect(() => {
		const tab = searchParams.get('tab')
		const caseId = searchParams.get('case')
		const selected = requests.find((r) => String(getCaseId(r)) === String(caseId))
		if (selected && !isClosedCase(selected)) {
			setActiveTab('current')
			return
		}
		if (tab === 'closed' || tab === 'previous' || tab === 'tidigare' || tab === 'completed') {
			setActiveTab('closed')
		} else {
			setActiveTab('current')
		}
	}, [searchParams, requests])

	const updateParams = (next) => {
		const params = new URLSearchParams(searchParams)
		Object.entries(next).forEach(([key, value]) => {
			if (value == null || value === '') params.delete(key)
			else params.set(key, value)
		})
		setSearchParams(params)
	}

	const handleTabChange = (tab) => {
		setActiveTab(tab)
		updateParams({ tab, case: null, panel: null, view: null })
	}

	const handleOpenCase = (id, panel = 'details') => {
		updateParams({ case: id, panel, tab: activeTab, bookingId: null, offerId: null, step: null })
	}

	const handleCloseCase = () => {
		updateParams({ case: null, panel: null, bookingId: null, offerId: null, step: null })
	}

	const backToDetails = () => updateParams({ panel: 'details', bookingId: null, offerId: null, step: null })

	const currentRequests = requests.filter((r) => !isClosedCase(r))
	const closedRequests = requests.filter((r) => isClosedCase(r))
	const selectedRequest = requests.find((r) => String(getCaseId(r)) === String(selectedCaseId)) || null

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

	// Messages has its own conversation shimmer — don't flash the cases skeleton first
	if ((authLoading || loading) && !showMessagesInbox) {
		const detailLoading = Boolean(selectedCaseId)
		return (
			<div className="list-page-shell bg-white font-sans customer-cases-page">
				<Navbar />
				<div className="list-page-content flex-1 flex flex-col !pb-1 !max-w-none !min-h-0 overflow-hidden">
					<div className="flex-1 min-h-0 overflow-hidden w-full">
						<div className="flex flex-col min-h-0 h-full overflow-hidden">
							{detailLoading ? <CaseDetailSkeleton /> : <MyCasesListSkeleton rows={4} />}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={`list-page-shell bg-white font-sans ${showMessagesInbox ? 'customer-messages-page' : 'customer-cases-page'}`}>
			<Navbar />
			
			<div className="list-page-content flex-1 flex flex-col !max-w-none !min-h-0 overflow-hidden max-lg:!pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:!pb-1">
				<div className={showMessagesInbox ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'flex-1 min-h-0 overflow-hidden w-full lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 lg:items-stretch'}>
					{showMessagesInbox ? (
						<CaseMessagesInbox requests={requests} onOpenCase={handleOpenCase} onExtraDecision={handleExtraDecision} />
					) : (
					<>
					<div className={`flex flex-col min-h-0 h-full overflow-hidden ${selectedRequest ? 'max-lg:hidden' : ''}`}>
						<CaseListView
							currentRequests={currentRequests}
							closedRequests={closedRequests}
							activeTab={activeTab}
							onTabChange={handleTabChange}
							onOpenCase={handleOpenCase}
							selectedId={selectedCaseId}
						/>
					</div>
					<div className={selectedRequest ? 'min-w-0 min-h-0 h-full max-lg:flex-1 no-scrollbar overflow-y-auto' : 'hidden lg:flex lg:min-h-0 lg:h-full lg:items-center lg:justify-center lg:rounded-3xl lg:border lg:border-dashed lg:border-gray-200 lg:bg-[#F7FBF8] lg:px-8'}>
					{selectedRequest ? (
						<>
							{/* Keep case detail mounted under overlays so back does not rebuild it */}
							<div className={showQuotes || showPayment || showBooking ? 'hidden' : 'contents'} aria-hidden={showQuotes || showPayment || showBooking}>
								<CaseDetailView
									request={selectedRequest}
									onBack={handleCloseCase}
									suspendBack={showQuotes || showPayment || showBooking}
									panel={selectedPanel}
									initialWorkshopId={searchParams.get('workshopId')}
									onPanelChange={(panel) => updateParams({ panel, workshopId: panel === 'messages' ? searchParams.get('workshopId') : null })}
									onSeeQuotes={() => updateParams({ panel: 'quotes', bookingId: null, offerId: null, step: null, workshopId: null })}
									onRequestUpdated={(updated) => {
										if (!updated) return
										setRequests((prev) => prev.map((item) => (
											String(getCaseId(item)) === String(getCaseId(updated))
												? { ...item, ...updated, offers: item.offers, bookings: item.bookings }
												: item
										)))
									}}
									onGoPayment={(booking, step = 'payment') => {
										const id = booking?._id || booking?.id
										if (!id) return
										updateParams({ panel: 'payment', bookingId: id, step })
									}}
									onComplete={confirmPickedUp}
									onReschedule={openRescheduleFromBooking}
									onCancel={openCancelFromBooking}
									onExtraDecision={handleExtraDecision}
									onContact={(booking) => {
										setSelectedBookingForContact(booking)
										setContactModalOpen(true)
									}}
									menuOpen={activeMenuId === (getActiveBookingId(selectedRequest))}
									onToggleMenu={() => {
										const id = getActiveBookingId(selectedRequest)
										setActiveMenuId(activeMenuId === id ? null : id)
									}}
								/>
							</div>
							{(showQuotes || showBooking) ? (
								<div className={showQuotes ? 'contents' : 'hidden'}>
									<CaseQuotesPanel
										requestId={selectedCaseId}
										onBack={backToDetails}
										onBook={(offerId) => updateParams({ panel: 'booking', offerId })}
										onContactWorkshop={({ workshopId }) => {
											if (!workshopId) return
											updateParams({ panel: 'messages', workshopId, offerId: null, bookingId: null, step: null })
										}}
									/>
								</div>
							) : null}
							{showPayment ? (
								<PaymentReviewPage
									embedded
									bookingId={searchParams.get('bookingId')}
									initialStep={searchParams.get('step') || 'payment'}
									onDone={backToDetails}
								/>
							) : null}
							{showBooking ? (
								<BookAppointmentPage
									embedded
									offerId={searchParams.get('offerId')}
									requestId={selectedCaseId}
									onDone={backToDetails}
									onBackToQuotes={() => updateParams({ panel: 'quotes', offerId: null })}
								/>
							) : null}
						</>
					) : (
						<p className="text-sm text-[#6B7280] text-center max-w-xs">{t('my_cases.flow.list_subtitle')}</p>
					)}
					</div>
					</>
					)}
				</div>
			</div>

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
						<Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="flex-1 h-14 rounded-xl font-semibold text-gray-400">
							{t('common.cancel')}
						</Button>
						<Button onClick={handleDeleteRequest} disabled={isDeleting} className="flex-1 h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
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
									<Star className={`w-8 h-8 sm:w-9 sm:h-9 ${star <= completeRating ? 'fill-[#1B8F3E] text-[#1B8F3E]' : 'text-gray-200'}`} />
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
					<div className="bg-[#1B8F3E]/5 p-8 text-center">
						<DialogTitle className="text-2xl font-black text-[#05324f]">Rate Service</DialogTitle>
						<DialogDescription>How was your experience?</DialogDescription>
					</div>
					<div className="p-8 bg-white space-y-6">
						<div className="flex justify-center gap-2">
							{[1, 2, 3, 4, 5].map(star => (
								<button key={star} onClick={() => setRating(star)} className="focus:outline-none">
									<Star className={`w-10 h-10 ${star <= rating ? 'fill-[#1B8F3E] text-[#1B8F3E]' : 'text-gray-200'}`} />
								</button>
							))}
						</div>
						<Textarea 
							placeholder="Your thoughts..."
							value={reviewText}
							onChange={e => setReviewText(e.target.value)}
							className="rounded-2xl border-gray-100 min-h-[100px]"
						/>
						<Button onClick={handleSubmitReview} disabled={isSubmittingReview || !rating} className="w-full h-14 bg-brand-btn text-white rounded-xl font-semibold">
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
										<div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-[5.25rem] md:h-[5.25rem] rounded-2xl bg-[#1B8F3E] overflow-hidden flex items-start justify-center shrink-0 border border-[#1B8F3E]/20">
											<WorkshopImage workshop={ws} alt={ws.companyName} className="w-full h-full" fallbackClassName="bg-[#1B8F3E]" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2 mb-1.5">
												<div className="flex-1 min-w-0">
													<h3 className="text-sm sm:text-base font-black text-[#05324f] leading-snug line-clamp-2">
														{ws.companyName || 'N/A'}
													</h3>
													{ws.isVerified && (
														<ShieldCheck size={14} className="inline-block mt-1 text-[#1B8F3E] shrink-0" fill="#1B8F3E" fillOpacity={0.15} />
													)}
												</div>
												{selectedBookingForDetails.totalAmount != null && (
													<p className="text-base font-black text-[#1B8F3E] shrink-0 leading-tight">
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
												className="flex-1 min-w-0 h-10 px-2 sm:px-3 rounded-xl bg-brand-btn text-white font-semibold text-[11px] sm:text-xs leading-tight transition-all shadow-md active:scale-95"
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
												className="flex-1 min-w-0 h-10 px-2 sm:px-3 rounded-xl bg-brand-btn text-white font-semibold text-[11px] sm:text-xs leading-tight transition-all shadow-md active:scale-95"
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
										className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
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
