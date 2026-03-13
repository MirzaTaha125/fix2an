import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
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

	const handleCancelClick = (offerId) => {
		setContractToCancel(offerId)
		setShowCancelDialog(true)
	}

	const handleCancelConfirm = async () => {
		if (!contractToCancel) return

		setCancellingId(contractToCancel)
		setShowCancelDialog(false)
		
		try {
			// Update offer status to DECLINED (cancelled by workshop)
			await offersAPI.update(contractToCancel, { status: 'DECLINED' })
			toast.success(t('workshop.contracts.cancelled') || 'Contract cancelled successfully')
			// Refresh contracts list
			fetchContracts()
		} catch (error) {
			console.error('Failed to cancel contract:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.cancel_error') || 'Failed to cancel contract')
		} finally {
			setCancellingId(null)
			setContractToCancel(null)
		}
	}

	const handleCancelDialogClose = () => {
		setShowCancelDialog(false)
		setContractToCancel(null)
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
			<div className="min-h-screen bg-white flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
						<FileText className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			
			{/* Cancel Confirmation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent onClose={handleCancelDialogClose}>
					<div className="flex items-start gap-4">
						<div className="p-3 bg-red-100 rounded-full flex-shrink-0">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<div className="flex-1">
							<DialogTitle>{t('workshop.contracts.cancel_contract') || 'Cancel Contract'}</DialogTitle>
							<DialogDescription>
								{t('workshop.contracts.cancel_confirm') || 'Are you sure you want to cancel this contract? This action cannot be undone.'}
							</DialogDescription>
							<div className="flex gap-3 mt-6">
								<Button
									variant="destructive"
									onClick={handleCancelConfirm}
									className="flex-1"
								>
									{t('workshop.contracts.yes_cancel') || 'Yes, Cancel Contract'}
								</Button>
								<Button
									variant="outline"
									onClick={handleCancelDialogClose}
									className="flex-1"
								>
									{t('workshop.contracts.no_keep') || 'No, Keep It'}
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			
		<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-h1 font-bold text-[#05324f]">
					{t('workshop.contracts.title') || 'Contracts'}
				</h1>
			</div>

				{/* Tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					<Button
						variant={activeTab === 'current' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('current')}
						className={activeTab === 'current' ? 'bg-[#34C759] text-white' : ''}
					>
						<Clock className="w-4 h-4 mr-2" />
						{t('workshop.contracts.current') || 'Current'}
					</Button>
					<Button
						variant={activeTab === 'completed' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('completed')}
						className={activeTab === 'completed' ? 'bg-[#34C759] text-white' : ''}
					>
						<CheckCircle className="w-4 h-4 mr-2" />
						{t('workshop.contracts.completed') || 'Completed'}
					</Button>
				</div>

				{/* Contracts List */}
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{filteredContracts.length === 0 ? (
						<Card className="border-0 shadow-2xl overflow-hidden">
							<CardContent className="text-center py-20 sm:py-24 px-6 bg-white">
								<div className="relative inline-block mb-8">
									<div className="relative p-10 sm:p-12 rounded-3xl border-2 border-gray-200">
										<FileText className="w-24 h-24 sm:w-28 sm:h-28 mx-auto" style={{ color: '#34C759' }} />
									</div>
								</div>
								<h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#05324f' }}>
									{activeTab === 'current' 
										? (t('workshop.contracts.no_current_contracts') || 'No Current Contracts')
										: (t('workshop.contracts.no_completed_contracts') || 'No Completed Contracts')
									}
								</h3>
								<p className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed" style={{ color: '#05324f' }}>
									{activeTab === 'current'
										? (t('workshop.contracts.no_current_contracts_desc') || 'You don\'t have any active contracts at the moment.')
										: (t('workshop.contracts.no_completed_contracts_desc') || 'You don\'t have any completed contracts yet.')
									}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-0">
							{filteredContracts.map((offer, index) => {
								const offerId = offer._id || offer.id
								const request = offer.requestId || offer.request
								const customer = request?.customerId || request?.customer
								const vehicle = request?.vehicleId || request?.vehicle
								// Skip if essential data is missing
								if (!offer || !request) {
									return null
								}

								return (
									<div
										key={offerId}
										className={`py-3 px-4 sm:px-6 ${index !== filteredContracts.length - 1 ? 'border-b border-gray-200' : ''}`}
									>
										<div className="grid grid-cols-1 md:grid-cols-3 items-start gap-3 sm:gap-4">
											{/* Left: Title, Name, Customer Details */}
											<div className="min-w-0">
												{/* Title (Vehicle Name) */}
												<h3 className="text-base font-bold mb-1" style={{ color: '#05324f' }}>
													{vehicle?.make && vehicle?.model 
														? `${vehicle.make} ${vehicle.model}-${vehicle.year || ''}`.trim()
														: 'Vehicle Information'
													}
												</h3>
												{/* Username with Phone and Price - Mobile view */}
												{customer?.name && (
													<div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
														<div className="flex items-center gap-1.5">
															<User className="w-3 h-3" style={{ color: '#05324f' }} />
															<p className="text-xs font-semibold" style={{ color: '#05324f' }}>{customer.name}</p>
															{customer.phone && (
																<>
																	<span style={{ color: '#05324f' }}>•</span>
																	<Phone className="w-3 h-3" style={{ color: '#05324f' }} />
																	<span className="text-xs" style={{ color: '#05324f' }}>{customer.phone}</span>
																</>
															)}
														</div>
														{/* Price on right side - Mobile view */}
														<div className="flex items-center gap-1.5 md:hidden" style={{ color: '#05324f' }}>
															<DollarSign className="w-3 h-3 flex-shrink-0" />
															<span className="text-xs">{formatPrice(offer.price)}</span>
														</div>
													</div>
												)}
												{/* Customer Email and Duration - Mobile view */}
												{customer?.email && (
													<div className="flex items-center justify-between gap-1.5 text-xs mb-1 flex-wrap">
														<div className="flex items-center gap-1.5">
															<Mail className="w-3 h-3 flex-shrink-0" />
															<span className="break-all">{customer.email}</span>
														</div>
														{/* Duration on right side - Mobile view */}
														{offer.estimatedDuration && (
															<div className="flex items-center gap-1.5 md:hidden" style={{ color: '#05324f' }}>
																<Clock className="w-3 h-3 flex-shrink-0" />
																<span>{offer.estimatedDuration} min</span>
															</div>
														)}
													</div>
												)}
											</div>

											{/* Center: Contract Details (Price, Duration, Note) - Desktop only */}
											<div className="hidden md:block min-w-0">
												{/* Price, Duration, and Note - Row on desktop */}
												<div className="flex flex-row items-center gap-8">
													<div className="flex items-center gap-2">
														<span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#05324f' }}>{t('workshop.contracts.price') || 'Price:'}</span>
														<span className="text-base font-bold" style={{ color: '#05324f' }}>{formatPrice(offer.price)}</span>
													</div>
													{offer.estimatedDuration && (
														<div className="flex items-center gap-2">
															<span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#05324f' }}>{t('workshop.contracts.duration') || 'Duration:'}</span>
															<span className="text-sm font-semibold" style={{ color: '#05324f' }}>{offer.estimatedDuration} min</span>
														</div>
													)}
													{(offer.note || offer.offerId?.note) && (
														<div className="flex items-start gap-2">
															<span className="text-xs font-medium uppercase tracking-wide flex-shrink-0" style={{ color: '#05324f' }}>{t('workshop.contracts.note') || 'Note:'}</span>
															<span className="text-sm break-words" style={{ color: '#05324f' }}>{offer.note || offer.offerId?.note}</span>
														</div>
													)}
												</div>
											</div>

											{/* Right: Status Badge and Cancel Button */}
											<div className="flex flex-col justify-start items-end gap-3">
												{activeTab === 'completed' && (
													<Badge className="bg-gray-100 text-gray-800 border-gray-200 border font-semibold">
														{t('workshop.contracts.completed') || 'Completed'}
													</Badge>
												)}
												{activeTab === 'current' && (
													<Button
														onClick={() => handleCancelClick(offerId)}
														disabled={cancellingId === offerId}
														variant="destructive"
														size="sm"
														className="px-3 py-1 text-xs font-semibold rounded-md"
													>
														{cancellingId === offerId ? (
															<>
																<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
																{t('workshop.contracts.cancelling') || 'Cancelling...'}
															</>
														) : (
															<>
																<X className="w-3 h-3 mr-1.5" />
																{t('workshop.contracts.cancel_contract') || 'Cancel Contract'}
															</>
														)}
													</Button>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	)
}
