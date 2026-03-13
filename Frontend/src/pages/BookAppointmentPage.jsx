import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { offersAPI, bookingsAPI } from '../services/api'
import {
	MapPin,
	CheckCircle,
	Calendar,
} from 'lucide-react'

export default function BookAppointmentPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	
	const offerId = searchParams.get('offerId')
	const [offer, setOffer] = useState(null)
	const [loading, setLoading] = useState(true)
	const [scheduledAt, setScheduledAt] = useState('')
	const [bookingNotes, setBookingNotes] = useState('')
	const [isBooking, setIsBooking] = useState(false)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				navigate('/my-cases', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (offerId) {
			fetchOffer()
		} else {
			toast.error(t('offers_page.no_offer_selected') || 'No offer selected')
			navigate('/offers', { replace: true })
		}
	}, [offerId])

	const fetchOffer = async () => {
		if (!offerId) return

		setLoading(true)
		try {
			// Get requestId from URL or find it from the offer
			const requestId = searchParams.get('requestId')
			if (requestId) {
				const response = await offersAPI.getByRequest(requestId)
				if (response.data) {
					const foundOffer = response.data.find(
						(o) => (o._id || o.id) === offerId
					)
					if (foundOffer) {
						setOffer(foundOffer)
					} else {
						toast.error(t('offers_page.offer_not_found') || 'Offer not found')
						navigate('/offers', { replace: true })
					}
				}
			} else {
				toast.error(t('offers_page.request_id_required') || 'Request ID required')
				navigate('/offers', { replace: true })
			}
		} catch (error) {
			console.error('Failed to fetch offer:', error)
			toast.error(t('errors.fetch_failed') || 'Failed to fetch offer')
			navigate('/offers', { replace: true })
		} finally {
			setLoading(false)
		}
	}

	const handleBooking = async () => {
		if (!offer || !scheduledAt) {
			toast.error(t('offers_page.booking_date_required') || 'Please select a date and time')
			return
		}

		setIsBooking(true)
		try {
			const response = await bookingsAPI.create({
				offerId: offer._id || offer.id,
				scheduledAt: new Date(scheduledAt).toISOString(),
				notes: bookingNotes,
			})

			if (response.data) {
				toast.success(t('offers_page.booking_success') || 'Booking created successfully!')
				navigate('/my-cases', { replace: true })
			}
		} catch (error) {
			console.error('Booking error:', error)
			toast.error(
				error.response?.data?.message ||
				t('offers_page.booking_failed') ||
				'Failed to create booking'
			)
		} finally {
			setIsBooking(false)
		}
	}

	if (loading || authLoading) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="w-8 h-8 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
					</div>
				</div>
			</div>
		)
	}

	if (!offer) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<p className="text-gray-600 mb-4">{t('offers_page.offer_not_found') || 'Offer not found'}</p>
						<Button onClick={() => navigate('/offers')} style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
							{t('common.go_back') || 'Go Back'}
						</Button>
					</div>
				</div>
			</div>
		)
	}

	const workshop = offer.workshopId || offer.workshop
	const workshopName = workshop?.companyName || 'Workshop'
	const totalPrice = offer.price || 0
	const address = workshop?.address || ''
	const city = workshop?.city || ''
	const postalCode = workshop?.postalCode || ''
	const fullAddress = `${address}${postalCode ? `, ${postalCode}` : ''} ${city}`.trim()
	// Format opening hours
	const formatOpeningHours = (openingHoursStr) => {
		if (!openingHoursStr) {
			return 'Monday - Friday\n07:00 - 17:00'
		}

		try {
			const hours = JSON.parse(openingHoursStr)
			const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
			const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
			
			// Group consecutive days with same hours
			const groups = []
			let currentGroup = null
			
			days.forEach((day, index) => {
				const dayHours = hours[day]
				if (!dayHours || !dayHours.open || !dayHours.close) {
					// Closed or no hours
					if (currentGroup) {
						groups.push(currentGroup)
						currentGroup = null
					}
					return
				}
				
				const timeRange = `${dayHours.open} - ${dayHours.close}`
				
				if (currentGroup && currentGroup.timeRange === timeRange) {
					// Same hours, extend group
					currentGroup.endDay = dayNames[index]
				} else {
					// Different hours or new group
					if (currentGroup) {
						groups.push(currentGroup)
					}
					currentGroup = {
						startDay: dayNames[index],
						endDay: dayNames[index],
						timeRange: timeRange
					}
				}
			})
			
			if (currentGroup) {
				groups.push(currentGroup)
			}
			
			// Format groups
			return groups.map(group => {
				if (group.startDay === group.endDay) {
					return `${group.startDay}\n${group.timeRange}`
				} else {
					return `${group.startDay} - ${group.endDay}\n${group.timeRange}`
				}
			}).join('\n\n')
		} catch (error) {
			// If parsing fails, return as is or default
			return openingHoursStr || 'Monday - Friday\n07:00 - 17:00'
		}
	}
	
	const openingHoursFormatted = formatOpeningHours(workshop?.openingHours)
	const warrantyText = offer.warranty || null

	return (
	<div className="min-h-screen bg-gray-50">
		<Navbar />
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
			{/* Header */}
			<div className="text-center mb-8">
				<h1 className="text-h1 font-bold mb-2 text-[#05324f]">
					{workshopName}
				</h1>
				<p className="text-gray-500 text-base">
					Your chosen workshop to fix the secondhand car
				</p>
			</div>

			{/* Main Card */}
			<div className="bg-white rounded-card border border-gray-100 shadow-card p-6 sm:p-8 space-y-6 sm:space-y-8">
					{/* Price and Booking Button */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Total Price */}
						<div>
							<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
								Offer Price
							</h2>
							<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
								<div className="flex justify-between items-center">
									<span className="font-semibold text-base text-gray-700">Total</span>
									<span className="font-bold text-2xl sm:text-3xl" style={{ color: '#05324f' }}>
										{formatPrice(totalPrice)}
									</span>
								</div>
								{offer.note && (
									<p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">{offer.note}</p>
								)}
							</div>
						</div>

						{/* Booking Button */}
						<div className="flex items-start justify-end">
							<Button
								onClick={handleBooking}
								disabled={!scheduledAt || isBooking}
								className="px-8 py-3 text-base font-semibold w-full md:w-auto"
								style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
							>
								{isBooking ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
										{t('offers_page.booking') || 'Booking...'}
									</>
													) : (
														<>
															<Calendar className="w-5 h-5 mr-2" />
															Book this workshop
														</>
													)}
							</Button>
						</div>
					</div>

					{/* Workshop Details Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
						{/* Left: Map */}
						<div>
							{workshop?.latitude && workshop?.longitude ? (
								<div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden mb-4 border border-gray-300">
									<iframe
										width="100%"
										height="100%"
										style={{ border: 0 }}
										loading="lazy"
										allowFullScreen
										referrerPolicy="no-referrer-when-downgrade"
										src={`https://www.google.com/maps?q=${workshop.latitude},${workshop.longitude}&output=embed&z=15`}
									></iframe>
								</div>
							) : fullAddress ? (
								<div className="w-full h-48 sm:h-64 rounded-lg overflow-hidden mb-4 border border-gray-300">
									<iframe
										width="100%"
										height="100%"
										style={{ border: 0 }}
										loading="lazy"
										allowFullScreen
										referrerPolicy="no-referrer-when-downgrade"
										src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed&z=15`}
									></iframe>
								</div>
							) : (
								<div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4 border border-gray-300">
									<MapPin className="w-12 h-12 text-gray-400" />
								</div>
							)}
						{/* Warranty */}
						{warrantyText && (
							<div className="flex items-center gap-2 text-sm sm:text-base text-gray-700">
								<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
								<span>{warrantyText}</span>
							</div>
						)}
						</div>

						{/* Right: Address, Opening Hours */}
						<div className="space-y-4 sm:space-y-6">
							{/* Address */}
							{fullAddress && (
								<div>
									<h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">
										Address
									</h3>
									<p className="text-sm sm:text-base text-gray-700">{fullAddress}</p>
								</div>
							)}

							{/* Opening Hours */}
							<div>
								<h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">
									Opening hours
								</h3>
								<div className="text-sm sm:text-base text-gray-700 whitespace-pre-line">
									{openingHoursFormatted}
								</div>
							</div>
						</div>
					</div>

					{/* Date & Time Selection */}
					<div className="border-t border-gray-300 pt-6">
						<Label htmlFor="scheduledAt" className="text-base sm:text-lg font-semibold text-gray-900 mb-3 block">
							{t('offers_page.select_date_time') || 'Select Date & Time'} *
						</Label>
						<Input
							id="scheduledAt"
							type="datetime-local"
							value={scheduledAt}
							onChange={(e) => setScheduledAt(e.target.value)}
							className="w-full"
							min={new Date().toISOString().slice(0, 16)}
						/>
					</div>

					{/* Notes */}
					<div>
						<Label htmlFor="notes" className="text-base sm:text-lg font-semibold text-gray-900 mb-3 block">
							{t('offers_page.notes') || 'Notes (Optional)'}
						</Label>
						<textarea
							id="notes"
							value={bookingNotes}
							onChange={(e) => setBookingNotes(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] outline-none"
							rows={3}
							placeholder={t('offers_page.notes_placeholder') || 'Add any special instructions...'}
						/>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

