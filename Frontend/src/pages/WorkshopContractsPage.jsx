import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	Car,
	Calendar,
	CheckCircle,
	User,
	Phone,
	Mail,
	DollarSign,
	FileText,
	X,
	AlertTriangle,
	Clock,
	Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { offersAPI, bookingsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function WorkshopContractsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [contracts, setContracts] = useState([])
	const [bookings, setBookings] = useState([])
	const [loading, setLoading] = useState(true)
	const [cancellingId, setCancellingId] = useState(null)
	const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [contractToCancel, setContractToCancel] = useState(null)
	const [activeTab, setActiveTab] = useState('current')
	const [showDoneDialog, setShowDoneDialog] = useState(false)
	const [contractToDone, setContractToDone] = useState(null)
	const [isCompleting, setIsCompleting] = useState(false)
	const [finalPrice, setFinalPrice] = useState('')
	const [cancellationReason, setCancellationReason] = useState('')
	const [selectedContractForDetails, setSelectedContractForDetails] = useState(null)
	const [detailsModalOpen, setDetailsModalOpen] = useState(false)

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
					navigate('/my-cases', { replace: true })
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
				// Filter only accepted offers (contracts)
				const accepted = allOffers.filter(offer => offer.status === 'ACCEPTED')
				setContracts(accepted)
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
	const getFilteredContracts = () => {
		if (activeTab === 'current') {
			// Current contracts: ACCEPTED offers where booking is NOT DONE AND request is NOT COMPLETED
			// When offer is accepted, it shows in current contracts
			// When customer completes job, booking status becomes 'DONE' and request status becomes 'COMPLETED'
			// Contract should then move to completed tab
			return contracts.filter(offer => {
				const offerId = offer._id || offer.id
				if (!offerId) return false
				
				// Find matching booking by offerId
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
				
				// Check booking status
				const bookingStatus = booking?.status?.toUpperCase()
				const isBookingDone = booking && bookingStatus === 'DONE'
				
				// Check request status (when booking is DONE, request status becomes COMPLETED)
				const request = offer.requestId || offer.request
				const requestStatus = request?.status?.toUpperCase()
				const isRequestCompleted = requestStatus === 'COMPLETED'
				
				// Show in current ONLY if:
				// 1. Booking is NOT DONE, AND
				// 2. Request is NOT COMPLETED
				// If either is true, it should show in completed tab
				return !isBookingDone && !isRequestCompleted
			})
		} else {
			// Completed contracts: ACCEPTED offers where booking status is DONE OR request status is COMPLETED
			// When customer completes job, booking status becomes 'DONE' and request status becomes 'COMPLETED'
			return contracts.filter(offer => {
				const offerId = offer._id || offer.id
				if (!offerId) return false
				
				// Find matching booking by offerId
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
				
				// Check booking status
				const bookingStatus = booking?.status?.toUpperCase()
				const isBookingDone = booking && bookingStatus === 'DONE'
				
				// Check request status (when booking is DONE, request status becomes COMPLETED)
				const request = offer.requestId || offer.request
				const requestStatus = request?.status?.toUpperCase()
				const isRequestCompleted = requestStatus === 'COMPLETED'
				
				// Show if booking is DONE OR request is COMPLETED
				return isBookingDone || isRequestCompleted
			})
		}
	}

	const filteredContracts = getFilteredContracts()

	const handleDoneClick = (offer) => {
		setContractToDone(offer)
		setFinalPrice(offer.price?.toString() || '')
		setShowDoneDialog(true)
	}

	const handleDoneConfirm = async () => {
		if (!contractToDone) return
		
		setIsCompleting(true)
		try {
			// Find the booking ID associated with this offer
			const offerId = contractToDone._id || contractToDone.id
			const booking = bookings.find(b => {
				let bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
				return String(bOfferId) === String(offerId)
			})
			
			if (booking) {
				await bookingsAPI.complete(booking._id || booking.id)
				toast.success(t('workshop.contracts.job_completed') || 'Job marked as completed!')
				setShowDoneDialog(false)
				fetchContracts()
			} else {
				toast.error(t('workshop.contracts.booking_not_found') || 'No booking found for this contract.')
			}
		} catch (error) {
			console.error('Failed to complete job:', error)
			toast.error(t('workshop.contracts.complete_error') || 'Failed to complete job')
		} finally {
			setIsCompleting(false)
			setContractToDone(null)
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
			toast.error(t('workshop.contracts.cancel_error') || 'Failed to cancel contract')
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
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
					{/* Header Skeleton */}
					<div className="mb-8">
						<Skeleton className="h-8 md:h-10 w-48" />
					</div>
					{/* Tabs Skeleton */}
					<div className="flex flex-wrap gap-2 mb-6">
						{[...Array(2)].map((_, i) => (
							<Skeleton key={`tab-${i}`} className="h-9 w-24 rounded-md" />
						))}
					</div>
					{/* Contracts List Skeleton */}
					<div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-comp-${i}`} className="p-4 sm:p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<Skeleton className="h-4 w-16 rounded-full" />
											<Skeleton className="h-3 w-12" />
										</div>
										<Skeleton className="h-5 w-40" />
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-24" />
											<Skeleton className="h-6 w-6 rounded-md" />
											<Skeleton className="h-6 w-6 rounded-md" />
										</div>
									</div>
									<div className="hidden md:flex flex-col items-center gap-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-20" />
									</div>
									<div className="flex justify-end items-center md:items-end gap-3">
										<div className="flex-1 md:flex-none text-right space-y-1">
											<Skeleton className="h-6 w-20 ml-auto" />
										</div>
										<Skeleton className="h-9 w-24 rounded-lg" />
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

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			
			{/* Job Done Dialog */}
			<Dialog open={showDoneDialog} onOpenChange={setShowDoneDialog}>
				<DialogContent onClose={() => setShowDoneDialog(false)} className="max-w-md px-4">
					<div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
						<div className="bg-green-50 px-8 py-10 flex flex-col items-center text-center">
							<div className="w-16 h-16 bg-[#34C759]/10 rounded-full flex items-center justify-center mb-6">
								<CheckCircle className="w-10 h-10 text-[#34C759]" />
							</div>
							<DialogTitle className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
								{t('workshop.contracts.job_done_title') || 'Job Completed?'}
							</DialogTitle>
							<DialogDescription className="text-gray-600 font-medium whitespace-pre-line">
								{t('workshop.contracts.job_done_desc') || 'Are you sure the car is ready and the customer has been notified?'}
							</DialogDescription>
						</div>
						
						<div className="px-8 py-8 bg-white">
							<div className="space-y-4 mb-8">
								<div className="flex justify-between items-center text-sm font-black p-4 bg-gray-50 rounded-2xl border border-gray-100">
									<span className="text-gray-400 uppercase tracking-widest text-[10px]">Service Total Value</span>
									<span className="text-[#05324f] text-lg tracking-tighter">{formatPrice(contractToDone?.price)}</span>
								</div>
							</div>
							
							<div className="flex flex-col gap-3">
								<Button
									size="lg"
									onClick={handleDoneConfirm}
									className="w-full h-14 bg-[#34C759] hover:bg-[#2eb34f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#34C759]/20 transition-all active:scale-95"
									disabled={isCompleting}
								>
									{isCompleting ? (
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									) : (
										t('workshop.contracts.confirm_and_complete') || 'Confirm & Complete'
									)}
								</Button>
								
								<Button
									variant="ghost"
									onClick={() => setShowDoneDialog(false)}
									className="w-full h-12 text-gray-400 font-bold rounded-2xl hover:bg-gray-50"
									disabled={isCompleting}
								>
									{t('common.not_yet') || 'Not Yet'}
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Cancel Confirmation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent onClose={handleCancelDialogClose} className="max-w-md px-4">
					<div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
						<div className="bg-red-50 px-8 py-10 flex flex-col items-center text-center">
							<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
								<AlertTriangle className="w-10 h-10 text-red-600" />
							</div>
							<DialogTitle className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{t('workshop.contracts.cancel_contract') || 'Cancel Contract'}</DialogTitle>
							<DialogDescription className="text-red-700 font-black text-[10px] uppercase tracking-widest">
								{t('workshop.contracts.cancel_confirm') || 'Warning: This action cannot be undone and may affect your ratings.'}
							</DialogDescription>
						</div>
						
						<div className="px-8 py-8 bg-white">
							<div className="space-y-4 mb-8">
								<div className="space-y-2">
									<p className="text-[10px] font-black text-[#05324f] uppercase tracking-widest flex items-center gap-2 mb-3">
										<FileText className="w-4 h-4 text-[#34C759]" />
										{t('workshop.contracts.cancellation_reason_label') || 'Reason for cancellation'} <span className="text-red-500">*</span>
									</p>
									<textarea
										value={cancellationReason}
										onChange={(e) => setCancellationReason(e.target.value)}
										placeholder={t('workshop.contracts.cancel_reason_placeholder') || 'Please explain why you need to cancel this contract.'}
										className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-[#34C759] transition-all outline-none resize-none shadow-inner"
										required
									></textarea>
								</div>
							</div>

							<div className="flex flex-col gap-3">
								<Button
									size="lg"
									onClick={handleCancelDialogClose}
									className="w-full h-14 bg-[#05324f] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-[#05324f]/20 active:scale-95 transition-all"
									disabled={isCompleting}
								>
									{t('workshop.contracts.no_keep') || 'No, Keep It'}
								</Button>
								<Button
									variant="ghost"
									onClick={handleCancelConfirm}
									disabled={isCompleting || !cancellationReason.trim()}
									className={`w-full h-12 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all ${!cancellationReason.trim() ? 'text-gray-200' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
								>
									{isCompleting ? (
										<div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
									) : (t('workshop.contracts.yes_cancel') || 'Yes, Cancel Contract')}
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			
		<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-xl md:text-xl font-bold text-[#05324f]">
					{t('workshop.contracts.title') || 'Contracts'}
				</h1>
			</div>

				{/* Navigation Tabs - Synchronized & Refined Style */}
				<div className="flex justify-start mb-8 animate-fade-in-up overflow-x-auto no-scrollbar pb-2">
					<div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1 max-md:w-full max-md:bg-gray-100 max-md:border-0 max-md:shadow-none max-md:p-0 max-md:gap-2 max-md:rounded-xl">
						<button
							onClick={() => setActiveTab('current')}
							className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[100px] max-md:flex-1 max-md:py-2 max-md:rounded-lg max-md:text-[11px] shadow-sm border border-transparent flex items-center justify-center gap-2 ${
								activeTab === 'current'
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:bg-gray-200 max-md:border-0'
							}`}
						>
							<span>{t('workshop.contracts.active_jobs') || 'Active Jobs'}</span>

						</button>

						<button
							onClick={() => setActiveTab('completed')}
							className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[100px] max-md:flex-1 max-md:py-2 max-md:rounded-lg max-md:text-[11px] shadow-sm border border-transparent flex items-center justify-center gap-2 ${
								activeTab === 'completed'
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:bg-gray-200 max-md:border-0'
							}`}
						>
							<span>{t('workshop.contracts.past_records') || 'Past Records'}</span>

						</button>
					</div>
				</div>

				{/* Contracts List */}
				<div className="bg-transparent md:bg-white md:border md:border-gray-200 md:rounded-xl md:overflow-hidden flex flex-col md:block gap-4 md:gap-0">
					{filteredContracts.length === 0 ? (
						<Card className="border-0 shadow-xl overflow-hidden rounded-3xl animate-fade-in-up">
							<CardContent className="text-center py-20 sm:py-24 px-6 bg-white">
								<div className="relative inline-block mb-8">
									<div className="w-24 h-24 bg-[#34C759]/10 rounded-3xl flex items-center justify-center mb-0 rotate-3 transition-transform hover:rotate-0">
										<Car className="w-12 h-12 text-[#34C759]" />
									</div>
								</div>
								<h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#05324f' }}>
									{activeTab === 'current' 
										? (t('workshop.contracts.no_current_contracts') || 'No Current Contracts')
										: (t('workshop.contracts.no_completed_contracts') || 'No Completed Contracts')
									}
								</h3>
								<p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed" style={{ color: '#05324f' }}>
									{activeTab === 'current'
										? (t('workshop.contracts.no_current_contracts_desc') || 'You don\'t have any active contracts at the moment.')
										: (t('workshop.contracts.no_completed_contracts_desc') || 'You don\'t have any completed contracts yet.')
									}
								</p>
							</CardContent>
						</Card>
					) : (
						filteredContracts.map((offer, index) => {
								const offerId = offer._id || offer.id
								const request = offer.requestId || offer.request
								const customer = request?.customerId || request?.customer
								const vehicle = request?.vehicleId || request?.vehicle
								
								// Find the booking for this offer to get the date
								const booking = bookings.find(b => {
									const bOfferId = b.offerId?._id || b.offerId?.id || b.offerId
									return String(bOfferId) === String(offerId)
								})

								// Skip if essential data is missing
								if (!offer || !request) return null

								return (
									<div
										key={offerId}
										className={`flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr] md:items-center py-6 px-5 sm:px-8 gap-5 md:gap-4 md:py-4 md:px-6 bg-white md:bg-transparent rounded-3xl md:rounded-none border border-gray-100 md:border-0 md:border-b last:border-b-0 shadow-sm md:shadow-none transition-all hover:bg-gray-50/30 group animate-fade-in-up`}
										style={{ animationDelay: `${index * 50}ms` }}
									>
										{/* Section 1: Vehicle & Customer Info */}
										<div className="w-full flex-1 flex flex-col gap-1.5 min-w-0">
											<div className="flex items-center gap-2 mb-0.5 flex-wrap">
												<Badge className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight border-0 transition-none ${
													booking?.status === 'CANCELLED'
														? 'bg-red-50 text-red-600'
														: 'bg-green-50 text-green-600'
												}`}>
													{booking?.status || (activeTab === 'current' ? 'Active' : 'Completed')}
												</Badge>
												<span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">REF: {offerId.slice(-6)}</span>
											</div>

											<h3 className="text-base font-bold text-[#05324f] leading-tight mb-1">
												{vehicle?.make} {vehicle?.model} {vehicle?.year}
											</h3>
											
											<div className="flex flex-col gap-0.5 md:gap-0">
												{customer?.name && (
													<p className="text-xs font-bold text-gray-700">{customer.name}</p>
												)}
												{customer?.phone && (
													<a 
														href={`tel:${customer.phone}`} 
														className="text-[11px] text-gray-500 font-medium hover:text-[#34C759] hover:underline flex items-center gap-1 transition-colors w-max"
													>
														{customer.phone}
													</a>
												)}
												{customer?.email && (
													<a 
														href={`mailto:${customer.email}`} 
														className="text-[11px] text-gray-400 font-medium hover:text-[#05324f] hover:underline flex items-center gap-1 transition-colors w-max"
													>
														{customer.email}
													</a>
												)}
											</div>
										</div>

										{/* Section 2: Inline Divider Info Row (Mobile Card) / Grid Cell (PC Row) */}
										<div className="flex flex-row md:flex-col items-center md:justify-center gap-4 md:gap-1 py-3 px-4 md:py-0 md:px-0 bg-gray-50/80 md:bg-transparent rounded-2xl md:rounded-none w-max max-md:w-full border border-gray-100/50 md:border-0">
											<div className="flex items-center gap-2">
												<Calendar className="w-3.5 h-3.5 text-[#34C759]" />
												<span className="text-xs font-bold text-[#05324f]">
													{booking?.scheduledAt ? formatDate(booking.scheduledAt) : 'No Date'}
												</span>
											</div>
											
											<div className="w-px h-3.5 bg-gray-300 md:hidden"></div>
											
											<div className="flex items-center gap-2 text-gray-400">
												<Clock className="w-3.5 h-3.5 text-gray-300" />
												<span className="text-[11px] font-bold">
													{booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
												</span>
											</div>
										</div>

										{/* Section 3 & 4 (Combined for Grid on PC) */}
										<div className="flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end gap-3 w-full md:w-auto pt-3 md:pt-0 max-md:border-t max-md:border-gray-50">
											<div className="text-right">
												<p className="text-xl md:text-lg font-black text-[#34C759]">
													{formatPrice(offer.price)}
												</p>
											</div>

											<div className="flex flex-row items-center gap-2 w-full md:w-auto">
												{activeTab === 'current' ? (
													<>
														<Button
															onClick={() => handleDoneClick(offer)}
															className="flex-1 h-9 md:h-8 px-4 rounded-xl md:rounded-lg bg-[#34C759] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#2eb34f] transition-all active:scale-[0.98] shadow-lg shadow-green-100 md:shadow-none"
														>
															Done
														</Button>
														<Button
															variant="outline"
															onClick={() => handleCancelClick(offerId)}
															className="flex-1 h-9 md:h-8 px-4 rounded-xl md:rounded-lg border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-[0.98]"
														>
															Cancel
														</Button>
													</>
												) : (
													<Button
														onClick={() => {
															setSelectedContractForDetails({ offer, booking })
															setDetailsModalOpen(true)
														}}
														className="flex-1 h-9 md:h-8 px-6 rounded-xl md:rounded-lg bg-[#05324f] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#05324f]/90 transition-all active:scale-[0.98]"
													>
														Details
													</Button>
												)}
											</div>
										</div>
									</div>
								)
							})
						)}
					</div>
				</div>
			
			{/* View Details Modal */}
			<Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
				<DialogContent className="max-w-2xl px-4">
					<div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 max-h-[90vh] overflow-y-auto border border-gray-50">
						<div className="mb-8">
							<DialogTitle className="text-2xl font-black text-[#05324f] uppercase tracking-tight mb-2">
								Contract Oversight
							</DialogTitle>
							<DialogDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
								Full technical and financial record archive
							</DialogDescription>
						</div>
						
						{selectedContractForDetails && (
							<div className="space-y-6">
								{/* Simplified Cancellation Notice */}
								{selectedContractForDetails.booking?.status === 'CANCELLED' && (
									<div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-2">
										<p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 leading-none">
											{selectedContractForDetails.booking.cancelledBy === 'WORKSHOP' ? 'Audit: Revoked by Workshop' : 'Audit: Terminated by Customer'}
										</p>
										<p className="text-sm text-red-900 font-bold leading-relaxed">
											"{selectedContractForDetails.booking.cancellationReason || 'No formal reason provided'}"
										</p>
									</div>
								)}

								<div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
									{/* Customer Section */}
									<div className="space-y-4">
										<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Client Details</h4>
										<div className="space-y-3">
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Holder</p>
												<p className="text-sm font-bold text-[#05324f]">{selectedContractForDetails.offer.requestId?.customerId?.name}</p>
											</div>
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Reference</p>
												<p className="text-sm font-bold text-[#05324f]">{selectedContractForDetails.offer.requestId?.customerId?.email}</p>
											</div>
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Phone</p>
												<p className="text-sm font-bold text-[#05324f]">{selectedContractForDetails.offer.requestId?.customerId?.phone || 'N/A'}</p>
											</div>
										</div>
									</div>

									{/* Vehicle Section */}
									<div className="space-y-4">
										<h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Machine Info</h4>
										<div className="space-y-3">
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Manufacturer</p>
												<p className="text-sm font-bold text-[#05324f]">
													{selectedContractForDetails.offer.requestId?.vehicleId?.make} {selectedContractForDetails.offer.requestId?.vehicleId?.model}
												</p>
											</div>
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Build Cycle</p>
												<p className="text-sm font-bold text-[#05324f]">{selectedContractForDetails.offer.requestId?.vehicleId?.year}</p>
											</div>
											<div>
												<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Primary Color</p>
												<p className="text-sm font-bold text-[#05324f]">{selectedContractForDetails.offer.requestId?.vehicleId?.color || 'Standard Silver'}</p>
											</div>
										</div>
									</div>
								</div>

								{/* Service Brief */}
								<div className="pt-6 border-t border-gray-100">
									<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Brief</p>
									<p className="text-sm font-semibold text-[#05324f] leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
										{selectedContractForDetails.offer.requestId?.description || 'No description available'}
									</p>
								</div>

								{/* Financial Block */}
								<div className="pt-6 border-t border-gray-100 flex justify-between items-end px-1">
									<div>
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Job Value</p>
										<p className="text-2xl font-black text-[#34C759]">
											{formatPrice(selectedContractForDetails.offer.price)}
										</p>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Badge className="bg-green-50 text-green-700 border-0 font-black text-[9px] px-2 py-0.5 uppercase tracking-widest shadow-none">VAT INCLUDED</Badge>
										<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Final Amount</p>
									</div>
								</div>
								
								<Button 
									onClick={() => setDetailsModalOpen(false)}
									className="w-full h-14 bg-gray-50 hover:bg-white text-[#05324f] font-black uppercase tracking-widest text-[10px] rounded-2xl border border-gray-200 transition-all active:scale-95 shadow-sm mt-4"
								>
									Dismiss Record
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Footer />
		</div>
	)
}
