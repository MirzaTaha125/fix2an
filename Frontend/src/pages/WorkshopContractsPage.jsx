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
					<div className="bg-white border border-gray-200 rounded-lg overflow-hidden space-y-0">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-comp-${i}`} className="border-b border-gray-100 last:border-b-0">
								<div className="p-4 sm:p-6 block hover:bg-gray-50 transition-colors">
									<div className="flex flex-col sm:flex-row justify-between gap-4">
										<div className="space-y-3 flex-1">
											<div className="flex items-center gap-3">
												<Skeleton className="h-5 w-48" />
												<Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
											</div>
											<Skeleton className="h-4 w-3/4 max-w-[400px]" />
											<div className="flex flex-wrap gap-4 mt-2">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-4 w-32 hidden sm:block" />
											</div>
										</div>
										<div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
											<Skeleton className="h-6 w-24 rounded-full" />
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

				{/* Navigation Tabs - Redesigned Segmented Control */}
				<div className="flex justify-center mb-10 animate-fade-in-up">
					<div className="inline-flex p-1 bg-white border border-gray-100 rounded-full shadow-sm max-md:rounded-2xl max-w-full gap-1 max-md:bg-transparent max-md:border-0 max-md:shadow-none max-md:p-0 max-md:gap-2 max-md:w-full max-md:grid max-md:grid-cols-2">
						<button
							onClick={() => setActiveTab('current')}
							className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[120px] max-md:flex-1 max-md:py-3.5 max-md:rounded-xl shadow-sm border border-transparent flex items-center justify-center gap-2 ${
								activeTab === 'current'
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:border-gray-200'
							}`}
						>
							<Clock className="w-4 h-4" />
							{t('workshop.contracts.active_jobs') || 'Active Jobs'}
							<Badge className={`ml-1 border-0 h-5 min-w-[20px] flex items-center justify-center text-[10px] ${activeTab === 'current' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
								{contracts.filter(offer => {
									const booking = bookings.find(b => (b.offerId?._id || b.offerId?.id || b.offerId) === (offer._id || offer.id))
									return !booking || booking.status !== 'DONE'
								}).length}
							</Badge>
						</button>

						<button
							onClick={() => setActiveTab('completed')}
							className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[120px] max-md:flex-1 max-md:py-3.5 max-md:rounded-xl shadow-sm border border-transparent flex items-center justify-center gap-2 ${
								activeTab === 'completed'
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:border-gray-200'
							}`}
						>
							<CheckCircle className="w-4 h-4" />
							{t('workshop.contracts.past_records') || 'Past Records'}
							<Badge className={`ml-1 border-0 h-5 min-w-[20px] flex items-center justify-center text-[10px] ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
								{contracts.filter(offer => {
									const booking = bookings.find(b => (b.offerId?._id || b.offerId?.id || b.offerId) === (offer._id || offer.id))
									return booking && booking.status === 'DONE'
								}).length}
							</Badge>
						</button>
					</div>
				</div>

				{/* Contracts List */}
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{filteredContracts.length === 0 ? (
						<Card className="border-0 shadow-2xl overflow-hidden">
							<CardContent className="text-center py-20 sm:py-24 px-6 bg-white">
								<h3 className="text-xl font-bold mb-4" style={{ color: '#05324f' }}>
									{activeTab === 'current' 
										? (t('workshop.contracts.no_current_contracts') || 'No Current Contracts')
										: (t('workshop.contracts.no_completed_contracts') || 'No Completed Contracts')
									}
								</h3>
								<p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: '#05324f' }}>
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
										className={`p-0 transition-all hover:bg-gray-50/30 ${index !== filteredContracts.length - 1 ? 'border-b border-gray-100' : ''}`}
									>
										<div className="p-4">
											{/* Top Header Label */}
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<Badge className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight border-0 ${
														booking?.status === 'RESCHEDULED' 
															? 'bg-amber-100 text-amber-700' 
															: booking?.status === 'CANCELLED'
																? 'bg-red-100 text-red-700'
																: activeTab === 'current' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
													}`}>
														{booking?.status === 'RESCHEDULED' 
															? 'Rescheduled' 
															: booking?.status === 'CANCELLED'
																? 'Cancelled'
																: activeTab === 'current' ? 'Active' : 'Completed'
														}
													</Badge>
													<span className="text-[8px] text-gray-300 font-bold tracking-widest uppercase truncate max-w-[60px]">ID: {offerId.slice(-6)}</span>
												</div>
												<div className="flex items-center gap-1 text-gray-400">
													<Calendar className="w-3 h-3" />
													<span className="text-[10px] font-bold">{booking?.scheduledAt ? formatDate(booking.scheduledAt) : 'Pending'}</span>
												</div>
											</div>

											<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
												{/* Left: Car & Info */}
												<div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-100 pb-3 lg:pb-0 lg:pr-4">
													<div className="min-w-0">
														<h3 className="text-base font-black text-[#05324f] leading-tight truncate">
															{vehicle?.make} {vehicle?.model}
														</h3>
														<p className="text-[9px] text-gray-400 font-medium truncate mt-0.5">
															{vehicle?.year} • {vehicle?.color || 'Standard Silver'}
														</p>
													</div>
												</div>

												{/* Middle: Customer & Details */}
												<div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
													{/* Customer Group */}
													<div className="flex items-center gap-2">
														<div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
															<User className="w-3.5 h-3.5 text-[#34C759]" />
														</div>
														<div className="min-w-0 flex-1">
															<p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Customer</p>
															<p className="text-xs font-bold text-[#05324f] truncate leading-tight">{customer?.name}</p>
															<div className="flex items-center gap-1.5 mt-1">
																<a href={`tel:${customer?.phone}`} className="p-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all">
																	<Phone className="w-2.5 h-2.5" />
																</a>
																<a href={`mailto:${customer?.email}`} className="p-1 bg-gray-50 text-gray-400 rounded-md hover:bg-[#05324f] hover:text-white transition-all">
																	<Mail className="w-2.5 h-2.5" />
																</a>
															</div>
														</div>
													</div>

													{/* Appointment Brief */}
													<div className="bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50 self-center">
														<div className="flex items-center gap-2">
															<Clock className="w-3 h-3 text-[#34C759]" />
															<p className="text-sm font-black text-[#05324f]">
																{booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00'}
															</p>
															<span className="text-[9px] text-gray-400 font-medium">• Slot</span>
														</div>
													</div>
												</div>


												{/* Right: Actions */}
												<div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2 justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-4">
													<div className="text-left lg:text-right min-w-[70px]">
														<div className="flex items-baseline justify-center lg:justify-end gap-0.5">
															<span className="text-xl font-black text-[#05324f] tracking-tight">{formatPrice(offer.price)}</span>
														</div>
														<p className="text-[8px] text-[#34C759] font-bold flex items-center justify-center lg:justify-end gap-0.5">
															<Shield className="w-2 h-2" />
															VAT INC
														</p>
													</div>

													<div className="flex-1 flex flex-col items-stretch lg:items-end w-full max-w-[140px]">
														{activeTab === 'current' ? (
															<>
																<Button
																	onClick={() => handleDoneClick(offer)}
																	className="w-full h-9 bg-[#34C759] hover:bg-[#2eb34f] text-white font-bold rounded-lg shadow-sm hover:scale-[1.01] transition-all active:scale-95 text-[10px]"
																>
																	<CheckCircle className="w-3.5 h-3.5 mr-1.5" />
																	{t('workshop.contracts.mark_completed') || 'Done'}
																</Button>
																<button
																	onClick={() => handleCancelClick(offerId)}
																	className="w-full py-1 text-[8px] text-gray-400 hover:text-red-500 font-bold transition-colors uppercase tracking-widest"
																>
																	{t('workshop.contracts.cancel_job') || 'Cancel'}
																</button>
															</>
														) : (
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setSelectedContractForDetails({ offer, booking })
																	setDetailsModalOpen(true)
																}}
																className="w-full text-[10px] font-bold border-2 border-[#05324f] text-[#05324f] rounded-lg hover:bg-[#05324f]/5"
															>
																View Details
															</Button>
														)}
													</div>
												</div>
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
							<div className="space-y-8">
								{/* Simplified Cancellation Notice */}
								{selectedContractForDetails.booking?.status === 'CANCELLED' && (
									<div className="bg-red-50/50 border-l-4 border-red-500 rounded-r-2xl p-6 animate-in fade-in slide-in-from-left-4 duration-500">
										<div className="flex items-center gap-5">
											<div className="bg-red-100 p-3 rounded-2xl shrink-0">
												<AlertTriangle className="w-6 h-6 text-red-600" />
											</div>
											<div className="flex-1">
												<p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1.5 leading-none">
													{selectedContractForDetails.booking.cancelledBy === 'WORKSHOP' ? 'Audit: Revoked by Workshop' : 'Audit: Terminated by Customer'}
												</p>
												<p className="text-sm text-red-900 font-bold italic leading-relaxed bg-white/40 p-3 rounded-xl border border-red-100">
													"{selectedContractForDetails.booking.cancellationReason || 'No formal reason provided'}"
												</p>
												{selectedContractForDetails.booking.cancelledAt && (
													<p className="text-[9px] text-red-400 mt-2.5 font-black uppercase tracking-widest">
														Timestamp: {formatDate(selectedContractForDetails.booking.cancelledAt)}
													</p>
												)}
											</div>
										</div>
									</div>
								)}

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
									<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
										<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
											<Car className="w-4 h-4 text-[#05324f]" /> Destination Vehicle
										</p>
										<p className="text-base font-black text-[#05324f] uppercase tracking-tight">
											{selectedContractForDetails.offer.requestId?.vehicleId?.make} {selectedContractForDetails.offer.requestId?.vehicleId?.model}
										</p>
										<p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Build Cycle: {selectedContractForDetails.offer.requestId?.vehicleId?.year}</p>
									</div>
									
									<div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
										<p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
											<User className="w-4 h-4 text-[#34C759]" /> Service Recipient
										</p>
										<p className="text-base font-black text-[#05324f] uppercase tracking-tight">
											{selectedContractForDetails.offer.requestId?.customerId?.name}
										</p>
										<p className="text-xs font-bold text-gray-400 mt-1 truncate">{selectedContractForDetails.offer.requestId?.customerId?.email}</p>
									</div>
								</div>

								<div className="p-8 bg-[#05324f] rounded-3xl text-white shadow-2xl shadow-[#05324f]/20">
									<p className="text-[10px] font-black text-[#34C759] uppercase tracking-widest mb-6 flex items-center gap-2">
										<Shield className="w-4 h-4" /> Financial Finality
									</p>
									<div className="flex justify-between items-end">
										<div>
											<p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Contract Total</p>
											<p className="text-3xl font-black text-white tracking-tighter">
												{formatPrice(selectedContractForDetails.offer.price)}
											</p>
										</div>
										<Badge className="bg-[#34C759] text-white border-0 font-black text-[9px] px-3 py-1 uppercase tracking-widest mb-2 shadow-lg shadow-[#34C759]/20">VAT INCLUDED</Badge>
									</div>
								</div>
								
								<Button 
									onClick={() => setDetailsModalOpen(false)}
									className="w-full h-14 bg-gray-50 hover:bg-gray-100 text-[#05324f] font-black uppercase tracking-widest text-[10px] rounded-2xl border border-gray-200 transition-all active:scale-95"
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
