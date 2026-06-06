import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '../components/ui/Dialog'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime, formatTime } from '../utils/cn'
import { formatSwedishPhone, stripSwedishPhoneForTel } from '../utils/swedishPhone'
import { useTranslation } from 'react-i18next'
import {
	Car,
	Phone,
	Calendar,
	Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VehicleImage from '../components/VehicleImage'

import { offersAPI, bookingsAPI } from '../services/api'

function CustomerScheduleNotice({ t }) {
	return (
		<div className="bg-[#F8FAF9] rounded-xl border border-[#38BC54]/10 p-3 flex gap-2.5 mt-4">
			<div className="shrink-0 pt-0.5">
				<Phone className="w-5 h-5 text-[#38BC54]" strokeWidth={2} />
			</div>
			<div className="flex-1 min-w-0">
				<h4 className="text-xs font-black text-[#05324f] leading-snug">
					{t('workshop.contracts.contact_customer_title')}
				</h4>
				<p className="text-[11px] text-[#05324f]/70 leading-snug font-medium mt-0.5">
					{t('workshop.contracts.contact_customer_desc')}
				</p>
			</div>
		</div>
	)
}

function ChatBubbleIcon({ className = 'w-4 h-4' }) {
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

function getCustomerContact(customer, booking) {
	const source = customer || booking?.customerId || {}
	return {
		name: source.name || '',
		email: (source.email || '').trim(),
		phone: formatSwedishPhone((source.phone || '').trim()),
	}
}

export default function WorkshopContractsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [contracts, setContracts] = useState([])
	const [bookings, setBookings] = useState([])
	const [loading, setLoading] = useState(true)
const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [contractToCancel, setContractToCancel] = useState(null)
	const [activeTab, setActiveTab] = useState('active')
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
	const [scheduleDialogMode, setScheduleDialogMode] = useState('reschedule')
	const [bookingToReschedule, setBookingToReschedule] = useState(null)
	const [newScheduledDate, setNewScheduledDate] = useState('')
	const [newScheduledTime, setNewScheduledTime] = useState('')
	const [isRescheduling, setIsRescheduling] = useState(false)
	const [isCompleting, setIsCompleting] = useState(false)
const [cancellationReason, setCancellationReason] = useState('')
	const [contactModalOpen, setContactModalOpen] = useState(false)
	const [selectedCustomerContact, setSelectedCustomerContact] = useState(null)

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/contract', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchContracts = async () => {
		if (!user || user.role !== 'WORKSHOP') {
			setLoading(false)
			return
		}

		try {
			// Fetch accepted offers (contracts) - these are proposals that customer accepted
			const response = await offersAPI.getByWorkshop()
			
			if (response.data) {
				const allOffers = Array.isArray(response.data) ? response.data : []
				const contractOffers = allOffers.filter((offer) =>
					['ACCEPTED', 'CANCELLED'].includes(offer.status)
				)
				setContracts(contractOffers)
			}
			
			// Fetch bookings separately to check completion status
			try {
				const bookingsResponse = await bookingsAPI.getByWorkshopMe()
				if (bookingsResponse.data) {
					const allBookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []
					setBookings(allBookings)
				}
			} catch (bookingsError) {
				console.warn('Failed to fetch bookings:', bookingsError)
				setBookings([])
			}
		} catch (error) {
			console.error('Failed to fetch contracts:', error)
			toast.error(t('workshop.contracts.fetch_error') || 'Failed to fetch contracts')
			setContracts([])
			setBookings([])
		} finally {
			setLoading(false)
		}
	}

	// Filter contracts based on active tab
	const getFilteredContracts = (tab) => {
		const targetTab = tab || activeTab
		return contracts.filter(offer => {
			const offerId = offer._id || offer.id
			if (!offerId) return false

			const booking = bookings.find(b => {
				let bookingOfferId = null
				if (b.offerId && typeof b.offerId === 'object' && b.offerId !== null) {
					bookingOfferId = b.offerId._id || b.offerId.id
				} else if (b.offerId) {
					bookingOfferId = b.offerId
				}
				if (!bookingOfferId) return false
				return String(bookingOfferId) === String(offerId)
			})

			const bookingStatus = booking?.status?.toUpperCase()
			const isBookingCancelled = bookingStatus === 'CANCELLED'
			const isBookingDone = bookingStatus === 'DONE'
			const request = offer.requestId || offer.request
			const isRequestCompleted = request?.status?.toUpperCase() === 'COMPLETED'

			if (targetTab === 'active') {
				return !isBookingDone && !isRequestCompleted && !isBookingCancelled
			}
			if (targetTab === 'completed') {
				return isBookingDone || isRequestCompleted
			}
			if (targetTab === 'cancelled') {
				return isBookingCancelled || offer.status === 'CANCELLED'
			}
			return false
		})
	}

	const filteredContracts = getFilteredContracts()
	const activeCount = getFilteredContracts('active').length
	const completedCount = getFilteredContracts('completed').length
	const cancelledCount = getFilteredContracts('cancelled').length

	const findBookingForOffer = (offerId) =>
		bookings.find((b) => {
			const bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
			return String(bOfferId) === String(offerId)
		})

	const openScheduleDialog = (booking, mode) => {
		setBookingToReschedule(booking)
		setScheduleDialogMode(mode)
		if (booking.scheduledAt) {
			const scheduled = new Date(booking.scheduledAt)
			setNewScheduledDate(scheduled.toISOString().split('T')[0])
			setNewScheduledTime(scheduled.toTimeString().slice(0, 5))
		} else {
			setNewScheduledDate('')
			setNewScheduledTime('')
		}
		setShowRescheduleDialog(true)
	}

	const handleConfirmClick = (offer) => {
		const offerId = offer._id || offer.id
		const booking = findBookingForOffer(offerId)

		if (!booking) {
			toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			return
		}

		openScheduleDialog(booking, 'confirm')
	}

	const handleRescheduleClick = (offer) => {
		const offerId = offer._id || offer.id
		const booking = findBookingForOffer(offerId)

		if (!booking) {
			toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			return
		}

		openScheduleDialog(booking, 'reschedule')
	}

	const handleScheduleConfirm = async () => {
		if (!bookingToReschedule || !newScheduledDate || !newScheduledTime) {
			toast.error(t('my_cases.reschedule_date_required') || 'Please select both date and time')
			return
		}

		setIsRescheduling(true)
		try {
			const bookingId = bookingToReschedule._id || bookingToReschedule.id
			const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`)
			if (scheduleDialogMode === 'confirm') {
				await bookingsAPI.scheduleAppointment(bookingId, scheduledAt.toISOString())
				toast.success(t('my_cases.appointment_confirmed_success') || 'Appointment confirmed successfully.')
			} else {
				await bookingsAPI.reschedule(bookingId, scheduledAt.toISOString())
				toast.success(t('my_cases.job_rescheduled_success') || 'Job rescheduled successfully')
			}
			setShowRescheduleDialog(false)
			setBookingToReschedule(null)
			fetchContracts()
		} catch (error) {
			console.error('Failed to update booking schedule:', error)
			toast.error(
				scheduleDialogMode === 'confirm'
					? (t('workshop.contracts.confirm_error') || 'Failed to confirm appointment')
					: (t('my_cases.job_reschedule_error') || 'Failed to reschedule')
			)
		} finally {
			setIsRescheduling(false)
		}
	}

	const handleCancelDialogClose = () => {
		setShowCancelDialog(false)
		setContractToCancel(null)
		setCancellationReason('')
	}

	const handleCancelClick = (offerId) => {
		setContractToCancel(offerId)
		setCancellationReason('')
		setShowCancelDialog(true)
	}

	const handleCancelConfirm = async () => {
		if (!contractToCancel) return
		if (!cancellationReason.trim()) {
			toast.error(t('workshop.contracts.cancel_reason_required') || 'Please provide a reason for cancellation')
			return
		}
		
		setIsCompleting(true) // Reusing isCompleting state for the loading spinner
		try {
			// Find the booking ID associated with this offer
			const booking = bookings.find(b => {
				let bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
				return String(bOfferId) === String(contractToCancel)
			})
			
			if (booking) {
				await bookingsAPI.cancel(booking._id || booking.id, cancellationReason)
				toast.success(t('workshop.contracts.cancelled') || 'Contract cancelled successfully')
				handleCancelDialogClose()
				fetchContracts()
			} else {
				toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			}
		} catch (error) {
			console.error('Failed to cancel contract:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.cancel_error') || 'Failed to cancel contract')
		} finally {
			setIsCompleting(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchContracts()
		}
	}, [user])

	// Refresh data when tab changes to get latest booking status
	useEffect(() => {
		if (user && user.role === 'WORKSHOP' && !loading) {
			fetchContracts()
		}
	}, [activeTab])

	// Refresh data when page comes into focus (in case customer completed job while workshop had page open)
	useEffect(() => {
		const handleFocus = () => {
			if (user && user.role === 'WORKSHOP' && document.visibilityState === 'visible') {
				fetchContracts()
			}
		}
		
		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleFocus)
		
		return () => {
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleFocus)
		}
	}, [user])

	if (authLoading || loading) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<div className="mb-6 md:mb-7">
						<Skeleton className="h-9 w-40 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
					<div className="list-tabs-row">
						<div className="workshop-pill-tabs-skeleton">
							<Skeleton className="h-10 flex-1 rounded-lg" />
							<Skeleton className="h-10 flex-1 rounded-lg" />
							<Skeleton className="h-10 flex-1 rounded-lg" />
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-comp-${i}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4">
								<div className="flex gap-3 md:gap-4">
									<Skeleton className="w-28 h-16 md:w-32 md:h-20 rounded-xl shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-2/3" />
									</div>
								</div>
								<div className="flex gap-2 mt-4">
									<Skeleton className="h-10 flex-1 rounded-xl" />
									<Skeleton className="h-10 flex-1 rounded-xl" />
								</div>
							</div>
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="list-page-shell bg-gray-50">
			<Navbar />
			
			{/* Reschedule Dialog */}
			<Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{scheduleDialogMode === 'confirm'
								? (t('workshop.contracts.schedule_appointment_title') || 'Schedule appointment')
								: (t('my_cases.reschedule_job_title') || 'Reschedule Job')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{scheduleDialogMode === 'confirm'
								? (t('workshop.contracts.schedule_appointment_description') || "Choose a date and time for the customer's visit.")
								: (t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment')}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-3 w-full min-w-0">
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('my_cases.new_date') || 'New Date'}
							</Label>
							<Input
								type="date"
								value={newScheduledDate}
								onChange={(e) => setNewScheduledDate(e.target.value)}
								min={new Date().toISOString().split('T')[0]}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold text-[#05324f]">
								{t('my_cases.new_time') || 'New Time'}
							</Label>
							<Input
								type="time"
								value={newScheduledTime}
								onChange={(e) => setNewScheduledTime(e.target.value)}
								className="rounded-xl h-11 border-gray-200 text-sm"
							/>
						</div>
					</div>

					<DialogFooter className="mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setShowRescheduleDialog(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={isRescheduling}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={handleScheduleConfirm}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95"
							disabled={isRescheduling || !newScheduledDate || !newScheduledTime}
						>
							{isRescheduling ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : scheduleDialogMode === 'confirm' ? (
								t('workshop.contracts.schedule_appointment') || 'Schedule appointment'
							) : (
								t('my_cases.reschedule_job') || 'Reschedule'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Confirmation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={(open) => { if (!open) handleCancelDialogClose() }}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('workshop.contracts.cancel_contract') || 'Cancel Contract'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center mb-0">
							{t('workshop.contracts.cancel_confirm') || 'Are you sure you want to cancel this contract? This action cannot be undone.'}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-2 w-full min-w-0">
						<label className="block text-sm font-semibold text-[#05324f]">
							{t('workshop.contracts.cancellation_reason_label') || 'Reason for cancellation'}{' '}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							value={cancellationReason}
							onChange={(e) => setCancellationReason(e.target.value)}
							placeholder={t('workshop.contracts.cancel_reason_placeholder') || 'Please explain why you need to cancel this contract.'}
							className="w-full min-w-0 min-h-[100px] p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#34C759] focus:border-transparent transition-all outline-none resize-none box-border"
							required
						/>
						<p className="text-xs text-gray-400 text-center leading-relaxed px-1">
							{t('workshop.contracts.cancel_policy_note') || 'By cancelling, you agree to our'}{' '}
							<a href="https://fixa2an.se/policy" target="_blank" rel="noopener noreferrer" className="text-[#34C759] hover:underline font-semibold">
								{t('workshop.contracts.cancellation_policy') || 'Cancellation Policy'}
							</a>
						</p>
					</div>

					<DialogFooter className="mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={handleCancelDialogClose}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={isCompleting}
						>
							{t('workshop.contracts.no_keep') || 'No, Keep It'}
						</Button>
						<Button
							onClick={handleCancelConfirm}
							disabled={isCompleting || !cancellationReason.trim()}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isCompleting ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : (
								t('workshop.contracts.yes_cancel') || 'Yes, Cancel'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			
		<div className="list-page-content">
			<div className="mb-6 md:mb-7">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#05324f] leading-tight mb-1.5 lg:mb-2">
					{t('workshop.contracts.title') || 'Contracts'}
				</h1>
				<p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
					{t('workshop.contracts.subtitle') || 'Manage your active and completed jobs'}
				</p>
			</div>

			<div className="list-tabs-row">
				<div className="workshop-pill-tabs">
					<button
						type="button"
						onClick={() => setActiveTab('active')}
						className={`workshop-pill-tab ${activeTab === 'active' ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
					>
						{t('workshop.contracts.status.active') || 'Active'} ({activeCount})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('completed')}
						className={`workshop-pill-tab ${activeTab === 'completed' ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
					>
						{t('workshop.contracts.status.completed') || 'Completed'} ({completedCount})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('cancelled')}
						className={`workshop-pill-tab ${activeTab === 'cancelled' ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
					>
						{t('workshop.contracts.tabs.cancelled') || 'Cancelled'} ({cancelledCount})
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
				{filteredContracts.length === 0 ? (
					<div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
						<div className="w-16 h-16 bg-[#34C759]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Car className="w-8 h-8 text-[#34C759]" />
						</div>
						<h3 className="text-base font-black text-[#05324f] mb-2">
							{activeTab === 'active'
								? (t('workshop.contracts.no_current_contracts') || 'No Active Contracts')
								: activeTab === 'completed'
									? (t('workshop.contracts.no_completed_contracts') || 'No Completed Contracts')
									: (t('workshop.contracts.no_cancelled_contracts') || 'No Cancelled Contracts')
							}
						</h3>
						<p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
							{activeTab === 'active'
								? (t('workshop.contracts.no_current_contracts_desc') || "You don't have any active contracts at the moment.")
								: activeTab === 'completed'
									? (t('workshop.contracts.no_completed_contracts_desc') || "You don't have any completed contracts yet.")
									: (t('workshop.contracts.no_cancelled_contracts_desc') || "You don't have any cancelled contracts.")
							}
						</p>
					</div>
				) : (
					filteredContracts.map((offer) => {
						const offerId = offer._id || offer.id
						const request = offer.requestId || offer.request
						const customer = request?.customerId || request?.customer
						const vehicle = request?.vehicleId || request?.vehicle

						const booking = bookings.find(b => {
							const bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
							return String(bOfferId) === String(offerId)
						})

						if (!offer || !request) return null

						const scheduledTime = booking?.scheduledAt ? formatTime(booking.scheduledAt) : null

						return (
							<div
								key={offerId}
								className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full"
							>
								{activeTab === 'active' && (
									<div className="mb-2.5">
										{booking?.scheduledAt ? (
											<span className="inline-flex items-center gap-1 bg-[#F2F9F4] text-[#38BC54] px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#38BC54]/15">
												<Calendar size={12} className="shrink-0" />
												{t('workshop.contracts.scheduled')}
											</span>
										) : (
											<span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-amber-200">
												<Clock size={12} className="shrink-0" />
												{t('workshop.contracts.not_scheduled')}
											</span>
										)}
									</div>
								)}
								<div className="flex gap-3 md:gap-4 flex-1 items-start">
									<div className="w-28 md:w-32 shrink-0 self-start rounded-xl overflow-hidden flex items-start justify-center">
										<VehicleImage
											make={vehicle?.make}
											model={vehicle?.model}
											year={vehicle?.year}
											width={400}
											className="w-full max-h-32 md:max-h-[8rem]"
											fallbackClassName="w-full h-24 md:h-[7rem]"
											alt={`${vehicle?.make} ${vehicle?.model}`}
										/>
									</div>
									<div className="flex-1 min-w-0 self-start">
										<div className="flex items-start justify-between gap-2 mb-0.5">
											<h3 className="text-sm font-semibold text-[#05324f] leading-snug line-clamp-2 flex-1 min-w-0">
												{vehicle?.make} {vehicle?.model} {vehicle?.year}
											</h3>
											<div className="shrink-0 text-right">
												<p className="text-sm font-semibold text-[#38BC54] leading-tight whitespace-nowrap">
													{formatPrice(offer.price)}
												</p>
												<p className="text-[9px] text-gray-400 font-medium">inkl. moms</p>
											</div>
										</div>
										<div className="space-y-1">
											{customer?.name && (
												<p className="text-[11px] text-[#05324f]/80 leading-snug">
													<span className="font-semibold">{t('common.customer') || 'Customer'}:</span> {customer.name}
												</p>
											)}
											<p className="text-[11px] text-[#05324f]/80 leading-snug line-clamp-2">
												<span className="font-semibold">{t('workshop.requests.problem_label') || 'Problem'}:</span>{' '}
												{request.description?.trim() ? request.description.trim() : '—'}
											</p>
											{booking?.scheduledAt && (
												<p className="text-[11px] text-[#05324f]/80">
													<span className="font-semibold">{t('workshop.contracts.scheduled') || 'Scheduled'}:</span>{' '}
													{formatDate(booking.scheduledAt)}
													{scheduledTime ? ` · ${scheduledTime}` : ''}
												</p>
											)}
										</div>
									</div>
								</div>

								{activeTab === 'active' && !booking?.scheduledAt && (
									<>
										<CustomerScheduleNotice t={t} />
										<button
											type="button"
											className="w-full mt-2.5 h-10 border border-[#38BC54] rounded-xl text-[#38BC54] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F9F4] transition-all active:scale-[0.98]"
											onClick={() => {
												setSelectedCustomerContact(getCustomerContact(customer, booking))
												setContactModalOpen(true)
											}}
										>
											<ChatBubbleIcon />
											{t('workshop.contracts.contact_customer')}
										</button>
									</>
								)}

								{activeTab === 'active' && (
									<div className={`flex gap-2 ${booking?.scheduledAt ? 'mt-4' : 'mt-2.5'}`}>
										{booking?.scheduledAt ? (
											<>
												<Button
													onClick={() => handleRescheduleClick(offer)}
													className="flex-1 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs shadow-sm"
												>
													{t('my_cases.reschedule_job') || 'Reschedule'}
												</Button>
												<Button
													variant="secondary"
													onClick={() => handleCancelClick(offerId)}
													className="flex-1 h-10 rounded-xl font-semibold text-xs"
												>
													{t('common.cancel') || 'Cancel'}
												</Button>
											</>
										) : (
											<>
												<Button
													onClick={() => handleConfirmClick(offer)}
													className="flex-1 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs shadow-sm"
												>
													{t('workshop.contracts.schedule_appointment') || 'Schedule appointment'}
												</Button>
												<Button
													variant="secondary"
													onClick={() => handleCancelClick(offerId)}
													className="flex-1 h-10 rounded-xl font-semibold text-xs"
												>
													{t('common.cancel') || 'Cancel'}
												</Button>
											</>
										)}
									</div>
								)}
							</div>
						)
					})
				)}
			</div>
		</div>

			{/* Contact Customer Modal */}
			<Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
				<DialogContent
					onClose={() => setContactModalOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					{selectedCustomerContact && (
						<>
							<DialogHeader className="text-center items-center sm:text-center">
								<DialogTitle className="text-xl sm:text-2xl font-bold text-[#05324f] leading-tight text-center w-full">
									{selectedCustomerContact.name || t('common.customer')}
								</DialogTitle>
							</DialogHeader>

							<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
								<Button
									variant="outline"
									disabled={!selectedCustomerContact.email}
									onClick={() => {
										if (!selectedCustomerContact.email) {
											toast.error(t('my_cases.contact_unavailable'))
											return
										}
										window.location.href = `mailto:${selectedCustomerContact.email}`
										setContactModalOpen(false)
									}}
									className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm disabled:opacity-40"
								>
									{t('my_cases.contact_via_mail')}
								</Button>
								<Button
									disabled={!selectedCustomerContact.phone}
									onClick={() => {
										if (!selectedCustomerContact.phone) {
											toast.error(t('my_cases.contact_unavailable'))
											return
										}
										window.location.href = `tel:${stripSwedishPhoneForTel(selectedCustomerContact.phone)}`
										setContactModalOpen(false)
									}}
									className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
								>
									{t('my_cases.contact_via_call')}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Footer className="max-lg:hidden" />
		</div>
	)
}
