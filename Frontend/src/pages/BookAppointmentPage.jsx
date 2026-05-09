import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Label } from '../components/ui/Label'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { offersAPI, bookingsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import {
	MapPin,
	CheckCircle,
	Calendar,
	Star,
	Building2,
	Clock,
	Check,
	ShieldCheck,
	ArrowRight,
	MessageCircle,
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
	const [agreeToTerms, setAgreeToTerms] = useState(false)
	const [bookingSuccess, setBookingSuccess] = useState(false)

	// Parse workshop's available times from offer (stored as JSON string)
	const availableSlots = (() => {
		if (!offer?.availableDates) return []
		try {
			const raw = typeof offer.availableDates === 'string' ? JSON.parse(offer.availableDates) : offer.availableDates
			const arr = Array.isArray(raw) ? raw : []
			return arr.filter((d) => d && new Date(d).getTime())
		} catch {
			return []
		}
	})()

	// When offer has only one slot, pre-select it
	useEffect(() => {
		if (!offer?.availableDates) return
		try {
			const raw = typeof offer.availableDates === 'string' ? JSON.parse(offer.availableDates) : offer.availableDates
			const arr = Array.isArray(raw) ? raw : []
			const valid = arr.filter((d) => d && new Date(d).getTime())
			if (valid.length === 1) setScheduledAt(valid[0])
		} catch (_) {}
	}, [offer])

	const formatSlotLabel = (isoString) => {
		try {
			const d = new Date(isoString)
			return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
		} catch {
			return isoString
		}
	}

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
		if (!offer) return
		if (availableSlots.length === 0) {
			toast.error(t('offers_page.no_available_times') || "Workshop hasn't set available times")
			return
		}
		if (!scheduledAt) {
			toast.error(t('offers_page.select_workshop_time') || "Please select one of the workshop's available times")
			return
		}
		if (!agreeToTerms) {
			toast.error(t('offers_page.agree_to_terms_required') || "Please agree to the booking terms and no-show policy")
			return
		}

		setIsBooking(true)
		try {
			const response = await bookingsAPI.create({
				offerId: offer._id || offer.id,
				scheduledAt: new Date(scheduledAt).toISOString(),
				notes: bookingNotes,
				isAgreedToTerms: agreeToTerms,
			})

			if (response.data) {
				toast.success(t('offers_page.booking_success') || 'Booking created successfully!')
				setBookingSuccess(true)
				window.scrollTo(0, 0)
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
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full space-y-8">
					<div className="text-center max-md:hidden mb-8">
						<Skeleton className="h-10 w-1/2 mx-auto mb-4" />
						<Skeleton className="h-5 w-1/3 mx-auto" />
					</div>

					<div className="md:hidden space-y-5">
						<Skeleton className="h-10 w-32 mb-6" />
						<Skeleton className="h-32 w-full rounded-xl" />
						<Skeleton className="h-40 w-full rounded-xl" />
						<div className="space-y-3">
							<Skeleton className="h-5 w-32" />
							<div className="flex gap-2">
								<Skeleton className="h-10 w-24 rounded-lg" />
								<Skeleton className="h-10 w-24 rounded-lg" />
							</div>
							<Skeleton className="h-5 w-24 mt-4" />
							<Skeleton className="h-16 w-full rounded-lg" />
						</div>
						<Skeleton className="h-14 w-full rounded-xl mt-4" />
					</div>

					<div className="hidden md:block">
						<div className="bg-white rounded-card border border-gray-100 shadow-card p-6 sm:p-8 space-y-8">
							<div className="grid grid-cols-2 gap-6">
								<div>
									<Skeleton className="h-8 w-1/3 mb-6" />
									<Skeleton className="h-24 w-full rounded-lg" />
								</div>
								<div className="flex items-start justify-end">
									<Skeleton className="h-12 w-48 rounded-lg" />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-8">
								<div>
									<Skeleton className="h-64 w-full rounded-lg" />
									<Skeleton className="h-6 w-3/4 mt-4" />
								</div>
								<div className="space-y-6">
									<div>
										<Skeleton className="h-6 w-32 mb-2" />
										<Skeleton className="h-12 w-full" />
									</div>
									<div>
										<Skeleton className="h-6 w-40 mb-2" />
										<Skeleton className="h-24 w-full" />
									</div>
								</div>
							</div>
							<div className="pt-6 border-t border-gray-100">
								<Skeleton className="h-6 w-48 mb-3" />
								<div className="flex gap-2 mb-6">
									<Skeleton className="h-10 w-24 rounded-lg" />
									<Skeleton className="h-10 w-24 rounded-lg" />
									<Skeleton className="h-10 w-32 rounded-lg" />
								</div>
								<Skeleton className="h-6 w-24 mb-3" />
								<Skeleton className="h-24 w-full rounded-lg" />
							</div>
						</div>
					</div>
				</div>
				<Footer />
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
	const laborAmount = offer.laborCost || 0
	const materialAmount = offer.partsCost || 0
	const address = workshop?.address || ''
	const city = workshop?.city || ''
	const postalCode = workshop?.postalCode || ''
	const fullAddress = `${address}${postalCode ? `, ${postalCode}` : ''} ${city}`.trim()
	const workshopRating = workshop?.rating != null ? Number(workshop.rating) : null
	const reviewCount = workshop?.reviewCount || 0
	const isVerified = workshop?.isVerified === true
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

	const mapSrc = workshop?.latitude && workshop?.longitude
		? `https://www.google.com/maps?q=${workshop.latitude},${workshop.longitude}&output=embed&z=15`
		: fullAddress ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed&z=15` : null

	if (offer?.status === 'ACCEPTED' && !bookingSuccess) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-xl mx-auto px-4 pt-24 pb-20 w-full flex items-center justify-center">
					<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
						<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
							<span className="text-3xl">⚠️</span>
						</div>
						<h1 className="text-2xl font-bold text-gray-900">{t('offers_page.already_booked') || 'Offer Already Booked'}</h1>
						<p className="text-gray-600">{t('offers_page.already_booked_desc') || "This offer has already been accepted and booked. Please check your cases for details."}</p>
						<Button
							onClick={() => navigate('/my-cases')}
							className="w-full py-4 rounded-xl font-bold mt-4"
							style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
						>
							{t('offers_page.go_to_my_cases') || 'Go to My Cases'}
						</Button>
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (bookingSuccess) {
		const successSteps = [
			{ key: 's1', label: t('upload.form.step1') || 'Upload', state: 'done' },
			{ key: 's2', label: t('upload.form.step2') || 'Details', state: 'done' },
			{ key: 's3', label: t('offers_page.step_select_workshop') || 'Choose', state: 'done' },
			{ key: 's4', label: t('offers_page.step_done') || 'Done!', state: 'active' },
		]

		return (
			<div className="min-h-screen bg-[#FAFBFC] flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-xl w-full mx-auto px-4 pt-24 md:pt-28 pb-20 max-md:pb-24">
					{/* Step Indicator */}
					<div className="flex items-center justify-center mb-6">
						{successSteps.map((step, idx, arr) => (
							<div key={step.key} className="flex items-center">
								<div className="flex flex-col items-center">
									<div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
										step.state === 'done' ? 'bg-[#38BC54] text-white' :
										step.state === 'active' ? 'bg-[#38BC54] text-white shadow-md shadow-green-200' :
										'bg-gray-200 text-gray-400'
									}`}>
										{step.state === 'done' || step.state === 'active' ? <Check className="w-4 h-4" strokeWidth={3} /> : idx + 1}
									</div>
									<span className={`text-[8px] sm:text-[9px] font-bold mt-1 whitespace-nowrap ${step.state === 'pending' ? 'text-gray-400' : 'text-[#05324f]'}`}>
										{step.label}
									</span>
								</div>
								{idx < arr.length - 1 && (
									<div className={`h-[2px] w-3 sm:w-5 mx-0.5 sm:mx-1 -mt-5 ${arr[idx + 1].state !== 'pending' ? 'bg-[#38BC54]' : 'bg-gray-200'}`} />
								)}
							</div>
						))}
					</div>

					{/* Big check + sparkles */}
					<div className="relative flex justify-center mb-5">
						<div className="absolute -top-2 -left-3 text-2xl text-[#38BC54] opacity-60">✦</div>
						<div className="absolute top-2 -right-2 text-xl text-[#38BC54] opacity-50">✦</div>
						<div className="absolute -bottom-1 -left-1 text-lg text-[#38BC54] opacity-40">✦</div>
						<div className="absolute bottom-3 right-0 text-base text-[#38BC54] opacity-30">✦</div>
						<div className="w-20 h-20 rounded-full bg-[#F2F9F4] border-4 border-white shadow-lg flex items-center justify-center">
							<Check className="w-10 h-10 text-[#38BC54]" strokeWidth={3.5} />
						</div>
					</div>

					{/* Heading */}
					<div className="text-center mb-6">
						<h1 className="text-2xl sm:text-3xl font-black text-[#05324f] leading-tight mb-2">
							{t('offers_page.thanks_title') || 'Thanks! Your booking has been sent.'}
						</h1>
						<p className="text-sm text-gray-500 leading-snug px-2">
							{t('offers_page.thanks_subtitle', { workshop: workshopName }) || `${workshopName} will contact you soon.`}
						</p>
					</div>

					{/* Workshop card */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
						<div className="flex gap-3">
							<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
								{workshop?.image ? (
									<img src={getFullUrl(workshop.image)} alt={workshopName} className="w-full h-full object-cover" />
								) : (
									<Building2 className="text-white/30 w-6 h-6" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1.5 mb-0.5">
									<h3 className="text-[0.95rem] font-black text-[#05324f] truncate">{workshopName}</h3>
									{isVerified && <ShieldCheck size={14} className="text-[#38BC54] shrink-0" fill="#38BC54" fillOpacity={0.15} />}
								</div>
								{workshopRating != null && (
									<div className="flex items-center gap-1">
										<span className="text-[11px] font-bold text-[#05324f]">{workshopRating.toFixed(1)}</span>
										<div className="flex gap-0.5">
											{[...Array(5)].map((_, i) => (
												<Star key={i} size={10} fill={i < Math.floor(workshopRating) ? '#FFB800' : 'none'} className={i < Math.floor(workshopRating) ? 'text-[#FFB800]' : 'text-gray-200'} />
											))}
										</div>
										<span className="text-[11px] text-gray-400 font-semibold">({reviewCount} {t('offers_page.reviews') || 'reviews'})</span>
									</div>
								)}
								{offer.distance != null && (
									<div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-0.5">
										<MapPin size={11} className="text-gray-400" />
										{offer.distance.toFixed(1)} {t('offers_page.km_from_you') || 'km from you'}
									</div>
								)}
							</div>
							<div className="text-right shrink-0">
								<div className="text-base font-black text-[#05324f] leading-none">{formatPrice(totalPrice)}</div>
								<div className="text-[10px] text-gray-400 font-bold mt-0.5">{t('offers_page.incl_vat') || 'incl. VAT'}</div>
							</div>
						</div>
					</div>

					{/* What happens now */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
						<h4 className="text-sm font-black text-[#05324f] mb-4">
							{t('offers_page.what_happens_now') || 'What happens now?'}
						</h4>
						<div className="space-y-4">
							{[
								{ icon: <Building2 className="w-4 h-4 text-[#38BC54]" />, title: t('offers_page.step_contact_title') || 'The workshop contacts you', desc: t('offers_page.step_contact_desc') || "You'll receive a call or SMS from the workshop shortly." },
								{ icon: <Calendar className="w-4 h-4 text-[#38BC54]" />, title: t('offers_page.step_pick_time_title') || 'Schedule a time that suits you', desc: t('offers_page.step_pick_time_desc') || 'Choose a time that suits you and the workshop.' },
								{ icon: <CheckCircle className="w-4 h-4 text-[#38BC54]" />, title: t('offers_page.step_get_fixed_title') || 'Get your car fixed', desc: t('offers_page.step_get_fixed_desc') || 'The workshop completes the work and notifies you. Done!' },
							].map((step, i) => (
								<div key={i} className="flex items-start gap-3">
									<div className="w-9 h-9 rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
										{step.icon}
									</div>
									<div className="flex-1 min-w-0 pt-0.5">
										<p className="text-sm font-black text-[#05324f] leading-tight">{step.title}</p>
										<p className="text-[11px] text-gray-500 font-semibold leading-snug mt-0.5">{step.desc}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Help footer */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 mb-5">
						<div className="w-10 h-10 rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<MessageCircle className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-black text-[#05324f]">{t('offers_page.need_help') || 'Need help?'}</p>
							<p className="text-[11px] text-gray-400 font-semibold leading-tight">{t('offers_page.need_help_subtitle') || "We're here if you have any questions."}</p>
						</div>
						<a
							href="mailto:info@fixa2an.se"
							className="px-3 py-2 border border-[#38BC54] rounded-lg text-[#38BC54] text-xs font-black active:scale-95 transition-transform"
						>
							{t('offers_page.contact_us') || 'Contact us'}
						</a>
					</div>

					{/* CTA */}
					<Button
						onClick={() => navigate('/my-cases')}
						className="w-full h-13 py-4 text-base font-black bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
					>
						{t('offers_page.to_my_bookings') || 'To my bookings'} <ArrowRight className="w-5 h-5" />
					</Button>
				</div>
				<Footer />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			<div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
				
				{/* Desktop Header */}
				<div className="text-center mb-8 max-md:hidden">
					<h1 className="text-xl font-bold mb-2 text-[#05324f]">{workshopName}</h1>
					<p className="text-gray-500 text-base">{t('offers_page.your_chosen_workshop')}</p>
				</div>

				{/* Mobile Layout - Image 5 */}
				<div className="max-md:block hidden space-y-5 pb-10">
					{/* Step Indicator */}
					<div className="flex items-center justify-center mb-2">
						{[
							{ key: 's1', label: t('upload.form.step1') || 'Upload', state: 'done' },
							{ key: 's2', label: t('upload.form.step2') || 'Details', state: 'done' },
							{ key: 's3', label: t('offers_page.step_select_workshop') || 'Choose workshop', state: 'active' },
						].map((step, idx, arr) => (
							<div key={step.key} className="flex items-center">
								<div className="flex flex-col items-center">
									<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
										step.state === 'done' ? 'bg-[#38BC54] text-white' :
										step.state === 'active' ? 'bg-[#38BC54] text-white shadow-md shadow-green-200' :
										'bg-gray-200 text-gray-400'
									}`}>
										{step.state === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : idx + 1}
									</div>
									<span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${step.state === 'pending' ? 'text-gray-400' : 'text-[#05324f]'}`}>
										{step.label}
									</span>
								</div>
								{idx < arr.length - 1 && (
									<div className={`h-[2px] w-5 mx-1 -mt-5 ${arr[idx + 1].state !== 'pending' ? 'bg-[#38BC54]' : 'bg-gray-200'}`} />
								)}
							</div>
						))}
					</div>

					{/* Heading */}
					<div className="text-center pt-2">
						<h1 className="text-2xl font-black text-[#05324f] leading-tight mb-1.5">
							{t('offers_page.confirm_title') || "You're one step from booking!"}
						</h1>
						<p className="text-sm text-gray-500 leading-snug px-2">
							{t('offers_page.confirm_subtitle') || 'Review your selection and confirm to continue.'}
						</p>
					</div>

					{/* Workshop Card */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
						<div className="flex gap-3">
							{/* Black logo box */}
							<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
								{workshop?.image ? (
									<img src={getFullUrl(workshop.image)} alt={workshopName} className="w-full h-full object-cover" />
								) : (
									<Building2 className="text-white/30 w-6 h-6" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1.5 mb-0.5">
									<h3 className="text-[0.95rem] font-black text-[#05324f] truncate">{workshopName}</h3>
									{isVerified && <ShieldCheck size={14} className="text-[#38BC54] shrink-0" fill="#38BC54" fillOpacity={0.15} />}
								</div>
								{workshopRating != null && (
									<div className="flex items-center gap-1">
										<span className="text-[11px] font-bold text-[#05324f]">{workshopRating.toFixed(1)}</span>
										<div className="flex gap-0.5">
											{[...Array(5)].map((_, i) => (
												<Star key={i} size={10} fill={i < Math.floor(workshopRating) ? '#FFB800' : 'none'} className={i < Math.floor(workshopRating) ? 'text-[#FFB800]' : 'text-gray-200'} />
											))}
										</div>
										<span className="text-[11px] text-gray-400 font-semibold">({reviewCount} {t('offers_page.reviews') || 'reviews'})</span>
									</div>
								)}
								{offer.distance != null && (
									<div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-0.5">
										<MapPin size={11} className="text-gray-400" />
										{offer.distance.toFixed(1)} {t('offers_page.km_from_you') || 'km from you'}
									</div>
								)}
							</div>
							<div className="text-right shrink-0">
								<div className="text-base font-black text-[#05324f] leading-none">{formatPrice(totalPrice)}</div>
								<div className="text-[10px] text-gray-400 font-bold mt-0.5">{t('offers_page.incl_vat') || 'incl. VAT'}</div>
							</div>
						</div>

						<div className="border-t border-gray-100 mt-4 pt-3">
							<div className="flex items-center gap-1.5 mb-0.5">
								<CheckCircle size={12} className="text-[#38BC54]" />
								<span className="text-xs font-black text-[#05324f]">{t('offers_page.price_fixed') || 'Price is fixed – no hidden fees'}</span>
							</div>
							<p className="text-[11px] text-gray-400 font-semibold ml-5">{t('offers_page.pay_directly') || 'You pay directly to the workshop.'}</p>
						</div>
					</div>

					{/* Inclusions */}
					{offer.inclusions && (
						<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
							<h4 className="text-sm font-black text-[#05324f] mb-3">{t('offers_page.included_question') || "What's included in the price?"}</h4>
							<div className="space-y-2">
								{offer.inclusions.split(/[,;\n]+/).map((item, i) => {
									const trimmed = item.trim()
									if (!trimmed) return null
									return (
										<div key={i} className="flex items-start gap-2">
											<Check size={14} className="text-[#38BC54] mt-0.5 shrink-0" strokeWidth={3} />
											<span className="text-xs text-[#05324f] font-semibold leading-snug">{trimmed}</span>
										</div>
									)
								})}
							</div>
							{offer.note && (
								<details className="mt-3 group">
									<summary className="cursor-pointer flex items-center gap-1 text-xs font-bold text-[#38BC54] underline-offset-2 hover:underline list-none">
										{t('offers_page.see_full_description') || 'See full description'}
										<ArrowRight size={12} className="group-open:rotate-90 transition-transform" />
									</summary>
									<p className="text-[11px] text-[#05324f]/80 font-semibold leading-snug mt-2 pl-1 italic">
										{offer.note}
									</p>
								</details>
							)}
						</div>
					)}

					{/* 100% Safe Choice */}
					<div className="bg-[#F2F9F4] rounded-2xl border border-[#38BC54]/15 p-4 flex items-start gap-3">
						<div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
							<ShieldCheck className="w-4 h-4 text-[#38BC54]" fill="#38BC54" fillOpacity={0.15} />
						</div>
						<div className="flex-1">
							<p className="text-sm font-black text-[#05324f]">{t('offers_page.safe_choice_title') || '100% safe choice'}</p>
							<p className="text-[11px] text-[#05324f]/70 font-semibold leading-snug mt-0.5">
								{t('offers_page.safe_choice_desc') || "Only verified workshops. We don't commit you to anything until you continue."}
							</p>
						</div>
					</div>

					{/* Slot picker (functional) */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
						<Label className="text-sm font-bold text-[#05324f] block">
							{t('offers_page.workshop_available_times') || "Workshop's available times"} *
						</Label>
						{availableSlots.length === 0 ? (
							<p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
								{t('offers_page.no_available_times') || "Workshop hasn't set available times."}
							</p>
						) : (
							<div className="flex flex-wrap gap-2">
								{availableSlots.map((slot) => (
									<button
										key={slot}
										type="button"
										onClick={() => setScheduledAt(slot)}
										className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
											scheduledAt === slot
												? 'border-[#38BC54] bg-[#F2F9F4] text-[#38BC54]'
												: 'border-gray-200 bg-white text-gray-600'
										}`}
									>
										{formatSlotLabel(slot)}
									</button>
								))}
							</div>
						)}
						<div className="flex items-start gap-2 pt-1">
							<input
								type="checkbox"
								id="agreeToTerms-m"
								checked={agreeToTerms}
								onChange={(e) => setAgreeToTerms(e.target.checked)}
								className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#38BC54] focus:ring-[#38BC54]"
							/>
							<label htmlFor="agreeToTerms-m" className="text-[11px] font-semibold text-[#05324f] cursor-pointer leading-snug">
								{t('offers_page.agree_to_terms')} *
							</label>
						</div>
					</div>

					{/* Confirm button */}
					<Button
						onClick={handleBooking}
						disabled={availableSlots.length === 0 || !scheduledAt || !agreeToTerms || isBooking}
						className="w-full h-13 py-4 text-base font-black bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
					>
						{isBooking ? (
							<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('offers_page.booking')}</>
						) : (
							<>
								{t('offers_page.confirm_continue') || 'Confirm and continue'} <ArrowRight className="w-5 h-5" />
							</>
						)}
					</Button>
				</div>

				{/* Desktop Layout */}
				<div className="hidden md:block">
					<div className="bg-white rounded-card border border-gray-100 shadow-card p-8 space-y-10">
						<div className="grid grid-cols-2 gap-10">
							<div className="space-y-6">
								<div>
									<h2 className="text-lg font-bold text-gray-900 mb-4">Offer Price</h2>
									<div className="py-2">
										<div className="space-y-2 mb-4">
											<div className="flex justify-between text-sm text-gray-500">
												<span>{t('offers_page.labor_cost') || 'Labor'}</span>
												<span className="font-semibold text-gray-700">{formatPrice(laborAmount)}</span>
											</div>
											<div className="flex justify-between text-sm text-gray-500">
												<span>{t('offers_page.material_cost') || 'Materials'}</span>
												<span className="font-semibold text-gray-700">{formatPrice(materialAmount)}</span>
											</div>
										</div>
										<div className="flex justify-between items-center pt-4 border-t border-gray-100">
											<div className="flex flex-col">
												<span className="font-bold text-gray-900">Total Price</span>
												<span className="text-[10px] text-gray-400 font-bold uppercase">{t('offers_page.incl_vat') || 'Incl. VAT'}</span>
											</div>
											<span className="font-bold text-2xl text-[#34C759]">{formatPrice(totalPrice)}</span>
										</div>

										{/* Offer Details - Desktop Column 1 Overlay */}
										<div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
											<div className="flex items-center gap-2.5 text-sm text-gray-600">
												<div className="p-1 bg-green-50 rounded-md">
													<Clock className="w-4 h-4 text-[#34C759]" />
												</div>
												<span>{t('workshop.offer.offer_valid_for') || 'Offer Valid For'}: <span className="font-bold text-gray-900">{offer.validityDays} Days</span></span>
											</div>
											{offer.inclusions && (
												<div className="flex items-start gap-2.5 text-sm text-gray-600">
													<div className="p-1 bg-green-50 rounded-md mt-0.5">
														<CheckCircle className="w-4 h-4 text-[#34C759]" />
													</div>
													<p>
														<span className="font-bold text-gray-900">{t('workshop.offer.included_services') || 'Included Services'}:</span>{' '}
														{offer.inclusions}
													</p>
												</div>
											)}
										</div>

										{offer.note && <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200 italic leading-relaxed">"{offer.note}"</p>}
									</div>
								</div>

								{mapSrc ? (
									<div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
										<iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={mapSrc} />
									</div>
								) : (
									<div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
										<MapPin className="w-12 h-12 text-gray-300" />
									</div>
								)}
							</div>

							<div className="space-y-8">
								<div className="grid grid-cols-1 gap-6">
									<div>
										<h3 className="font-bold text-lg text-gray-900 mb-3">Address</h3>
										<p className="text-gray-700 leading-relaxed">{fullAddress}</p>
									</div>
									<div>
										<h3 className="font-bold text-lg text-gray-900 mb-3">Opening Hours</h3>
										<div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{openingHoursFormatted}</div>
									</div>
									{warrantyText && (
										<div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 w-fit">
											<CheckCircle className="w-5 h-5 text-[#34C759]" />
											<span className="text-sm font-medium text-green-800">{warrantyText}</span>
										</div>
									)}
								</div>

								<div className="pt-6 border-t border-gray-100 space-y-4">
									<Label className="text-lg font-bold text-gray-900 block">{t('offers_page.workshop_available_times')} *</Label>
									{availableSlots.length === 0 ? (
										<p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
											{t('offers_page.no_available_times')}
										</p>
									) : (
										<div className="flex flex-wrap gap-2">
											{availableSlots.map((slot) => (
												<button
													key={slot}
													type="button"
													onClick={() => setScheduledAt(slot)}
													className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
														scheduledAt === slot
															? 'border-[#34C759] bg-[#34C759]/10 text-[#34C759] shadow-sm'
															: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
													}`}
												>
													{formatSlotLabel(slot)}
												</button>
											))}
										</div>
									)}
								</div>

								<div className="space-y-3">
									<Label htmlFor="notes-d" className="text-lg font-bold text-gray-900 block">{t('offers_page.notes')}</Label>
									<textarea id="notes-d" value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] outline-none transition-all shadow-sm" rows={3} placeholder={t('offers_page.notes_placeholder')} />
								</div>
							</div>
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
							<div className="flex items-start gap-4">
								<CheckCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
								<div>
									<h4 className="font-bold text-amber-900 text-lg mb-1">{t('offers_page.notice_title')}</h4>
									<p className="text-amber-800 leading-relaxed text-sm">
										{t('offers_page.no_show_notice')}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 pt-2">
								<input
									type="checkbox"
									id="agreeToTerms-d"
									checked={agreeToTerms}
									onChange={(e) => setAgreeToTerms(e.target.checked)}
									className="w-6 h-6 rounded border-gray-300 text-[#34C759] focus:ring-[#34C759] cursor-pointer"
								/>
								<label htmlFor="agreeToTerms-d" className="text-lg font-bold text-gray-900 cursor-pointer select-none">
									{t('offers_page.agree_to_terms')} *
								</label>
							</div>
						</div>

						<div className="flex justify-end pt-4">
							<Button 
								onClick={handleBooking} 
								disabled={availableSlots.length === 0 || !scheduledAt || !agreeToTerms || isBooking} 
								className="px-12 py-5 text-lg font-normal rounded-2xl shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] w-full md:w-auto" 
								style={{ backgroundColor: agreeToTerms ? '#34C759' : '#9ca3af', color: '#FFFFFF' }}
							>
								{isBooking ? (
									<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3 inline-block" />{t('offers_page.booking')}</>
								) : (
									t('offers_page.book_this_workshop')
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}

