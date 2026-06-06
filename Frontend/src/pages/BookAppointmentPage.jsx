import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, parseInclusionItems } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WorkshopImage from '../components/WorkshopImage'
import { offersAPI, bookingsAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import {
	MapPin,
	CheckCircle,
	Calendar,
	Star,
	Building2,
	Check,
	ShieldCheck,
	ArrowRight,
	MessageCircle,
	Tag,
	FileText,
	ChevronRight,
} from 'lucide-react'

export default function BookAppointmentPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	
	const offerId = searchParams.get('offerId')
	const [offer, setOffer] = useState(null)
	const [loading, setLoading] = useState(true)
	const [bookingNotes, setBookingNotes] = useState('')
	const [isBooking, setIsBooking] = useState(false)
	const [bookingSuccess, setBookingSuccess] = useState(false)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				navigate('/contract', { replace: true })
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

		setIsBooking(true)
		try {
			const response = await bookingsAPI.create({
				offerId: offer._id || offer.id,
				notes: bookingNotes,
				isAgreedToTerms: true,
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
			<div className="list-page-shell bg-gray-50">
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
	const workshopRating = workshop?.rating != null ? Number(workshop.rating) : null
	const reviewCount = workshop?.reviewCount || 0
	const isVerified = workshop?.isVerified === true

	if (offer?.status === 'ACCEPTED' && !bookingSuccess) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="flex-1 max-w-xl mx-auto px-4 pt-24 pb-20 w-full flex items-center justify-center">
					<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
						<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
							<span className="text-3xl">⚠️</span>
						</div>
						<h1 className="text-2xl font-bold text-gray-900">{t('offers_page.already_booked') || 'Offer Already Booked'}</h1>
						<p className="text-gray-600">{t('offers_page.already_booked_desc') || "This offer has already been accepted and booked. Please check your cases for details."}</p>
						<Button
							onClick={() => navigate('/contract')}
							className="w-full py-4 rounded-xl font-bold mt-4"
							style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
						>
							{t('offers_page.go_to_my_cases') || 'Go to Contract'}
						</Button>
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (bookingSuccess) {
		const successSteps = [
			{ key: 's1', label: t('upload.form.step1') || 'Upload report', state: 'done' },
			{ key: 's2', label: t('upload.form.step2') || 'Fill in details', state: 'done' },
			{ key: 's3', label: t('upload.form.step3') || 'Your email', state: 'done' },
			{ key: 's4', label: t('offers_page.step_done') || 'Done!', state: 'active' },
		]

		return (
			<div className="list-page-shell bg-[#FAFBFC]">
				<Navbar />
				<div className="flex-1 max-w-xl w-full mx-auto px-4 pt-24 md:pt-28 pb-20 max-md:pb-24">
					{/* Step Indicator */}
					<div className="mb-6 px-1">
						<div className="flex items-start">
							{successSteps.map((step, idx, arr) => (
								<div key={step.key} className="contents">
									<div className="flex flex-col items-center flex-1 min-w-0">
										<div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shrink-0 ${
											step.state === 'done' ? 'bg-[#38BC54] text-white' :
											step.state === 'active' ? 'bg-[#38BC54] text-white shadow-md shadow-green-200' :
											'bg-gray-200 text-gray-400'
										}`}>
											{step.state === 'done' || step.state === 'active' ? <Check className="w-4 h-4" strokeWidth={3} /> : idx + 1}
										</div>
										<span className={`text-[8px] sm:text-[9px] font-medium mt-1.5 text-center leading-[1.25] px-0.5 w-full ${step.state === 'pending' ? 'text-gray-400' : 'text-[#05324f]'}`}>
											{step.label}
										</span>
									</div>
									{idx < arr.length - 1 && (
										<div className={`h-[2px] w-2 sm:w-4 shrink-0 mt-3.5 sm:mt-4 ${arr[idx + 1].state !== 'pending' ? 'bg-[#38BC54]' : 'bg-gray-200'}`} />
									)}
								</div>
							))}
						</div>
					</div>

					{/* Big check + sparkles */}
					<div className="relative w-20 h-20 mx-auto mb-5">
						<div className="absolute -top-2 -left-5 text-2xl text-[#38BC54] opacity-60">✦</div>
						<div className="absolute top-2 -right-6 text-xl text-[#38BC54] opacity-50">✦</div>
						<div className="absolute -bottom-1 -left-4 text-lg text-[#38BC54] opacity-40">✦</div>
						<div className="absolute bottom-3 -right-3 text-base text-[#38BC54] opacity-30">✦</div>
						<div className="w-20 h-20 rounded-full bg-[#F2F9F4] border-4 border-white shadow-lg flex items-center justify-center">
							<Check className="w-10 h-10 text-[#38BC54]" strokeWidth={3.5} />
						</div>
					</div>

					{/* Heading */}
					<div className="text-center mb-6">
						<h1 className="text-2xl sm:text-3xl font-medium text-[#05324f] leading-tight mb-2">
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
								<WorkshopImage workshop={workshop} alt={workshopName} />
							</div>
							<div className="flex-1 min-w-0">
								<div className="mb-0.5">
									<h3 className="text-[0.95rem] font-semibold text-[#05324f] truncate">{workshopName}</h3>
									{isVerified && <ShieldCheck size={14} className="text-[#38BC54] shrink-0 mt-1" fill="#38BC54" fillOpacity={0.15} />}
								</div>
								{workshopRating != null && (
									<div className="flex items-center gap-1 flex-nowrap min-w-0">
										<span className="text-[11px] font-semibold text-[#05324f] shrink-0">{workshopRating.toFixed(1)}</span>
										<div className="flex gap-0.5 shrink-0">
											{[...Array(5)].map((_, i) => (
												<Star key={i} size={10} fill={i < Math.floor(workshopRating) ? '#FFB800' : 'none'} className={i < Math.floor(workshopRating) ? 'text-[#FFB800]' : 'text-gray-200'} />
											))}
										</div>
										<span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap shrink-0">({reviewCount} {t('offers_page.reviews') || 'reviews'})</span>
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
								<div className="text-base font-semibold text-[#05324f] leading-none">{formatPrice(totalPrice)}</div>
							</div>
						</div>
					</div>

					{/* What happens now */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
						<h4 className="text-sm font-semibold text-[#05324f] mb-4">
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
										<p className="text-sm font-semibold text-[#05324f] leading-tight">{step.title}</p>
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
							<p className="text-sm font-semibold text-[#05324f]">{t('offers_page.need_help') || 'Need help?'}</p>
							<p className="text-[11px] text-gray-400 font-semibold leading-tight">{t('offers_page.need_help_subtitle') || "We're here if you have any questions."}</p>
						</div>
						<a
							href="mailto:info@fixa2an.se"
							className="px-3 py-2 border border-[#38BC54] rounded-lg text-[#38BC54] text-xs font-semibold active:scale-95 transition-transform"
						>
							{t('offers_page.contact_us') || 'Contact us'}
						</a>
					</div>

					{/* CTA */}
					<Button
						onClick={() => navigate('/contract')}
						className="w-full h-13 py-4 text-base font-semibold bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
					>
						{t('offers_page.to_my_bookings') || 'To my bookings'} <ArrowRight className="w-5 h-5" />
					</Button>
				</div>
				<Footer />
			</div>
		)
	}

	const inclusionItems = parseInclusionItems(offer.inclusions)

	const bookingSteps = [
		{ key: 's1', label: t('upload.form.step1') || 'Upload report', state: 'done' },
		{ key: 's2', label: t('upload.form.step2') || 'Fill in details', state: 'done' },
		{ key: 's3', label: t('upload.form.step3') || 'Your email', state: 'done' },
		{ key: 's4', label: t('offers_page.step_select_workshop') || 'Choose workshop', state: 'active' },
	]

	const renderStepIndicator = (steps, compact = false) => (
		<div className="mb-2 px-1">
			<div className="flex items-start">
				{steps.map((step, idx, arr) => (
					<div key={step.key} className="contents">
						<div className="flex flex-col items-center flex-1 min-w-0">
							<div
								className={`${compact ? 'w-7 h-7 sm:w-8 sm:h-8 text-[10px] sm:text-xs' : 'w-8 h-8 text-xs'} rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${
									step.state === 'done'
										? 'bg-[#38BC54] text-white'
										: step.state === 'active'
											? 'bg-[#38BC54] text-white shadow-md shadow-green-200'
											: 'bg-gray-200 text-gray-400'
								}`}
							>
								{step.state === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : idx + 1}
							</div>
							<span
								className={`${compact ? 'text-[8px] sm:text-[9px]' : 'text-[9px]'} font-medium mt-1.5 text-center leading-[1.25] px-0.5 w-full ${
									step.state === 'pending' ? 'text-gray-400' : 'text-[#05324f]'
								} ${step.state === 'active' ? 'font-semibold' : ''}`}
							>
								{step.label}
							</span>
						</div>
						{idx < arr.length - 1 && (
							<div
								className={`h-[2px] w-2 sm:w-4 shrink-0 mt-3.5 sm:mt-4 ${
									arr[idx + 1].state !== 'pending' ? 'bg-[#38BC54]' : 'bg-gray-200'
								}`}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	)

	const renderWorkshopCard = () => (
		<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
			<div className="p-4">
				<div className="flex gap-3 items-start">
					<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
						<WorkshopImage workshop={workshop} alt={workshopName} />
					</div>
					<div className="flex-1 min-w-0">
						<div className="mb-1">
							<h3 className="text-base font-semibold text-[#05324f] truncate">{workshopName}</h3>
							{isVerified && (
								<ShieldCheck size={15} className="text-[#38BC54] shrink-0 mt-1" fill="#38BC54" fillOpacity={0.15} />
							)}
						</div>
						{workshopRating != null && (
							<div className="flex items-center gap-1 flex-wrap">
								<span className="text-xs font-semibold text-[#05324f]">{workshopRating.toFixed(1)}</span>
								<div className="flex gap-0.5">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											size={11}
											fill={i < Math.floor(workshopRating) ? '#FFB800' : 'none'}
											className={i < Math.floor(workshopRating) ? 'text-[#FFB800]' : 'text-gray-200'}
										/>
									))}
								</div>
								<span className="text-[11px] text-gray-400 font-medium">
									({reviewCount} {t('offers_page.reviews') || 'reviews'})
								</span>
							</div>
						)}
						{offer.distance != null && (
							<div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-1">
								<MapPin size={12} className="text-gray-400 shrink-0" />
								{offer.distance.toFixed(1)} {t('offers_page.km_from_you') || 'km from you'}
							</div>
						)}
					</div>
					<div className="text-right shrink-0">
						<div className="text-xl font-semibold text-[#05324f] leading-none whitespace-nowrap">
							{formatPrice(totalPrice)}
						</div>
						<p className="text-[11px] text-gray-400 mt-1">{t('offers_page.incl_vat') || 'incl. VAT'}</p>
					</div>
				</div>

				<div className="bg-[#F2F9F4] rounded-xl px-3.5 py-3 mt-4 flex items-start gap-2.5">
					<Tag className="w-4 h-4 text-[#38BC54] shrink-0 mt-0.5" strokeWidth={2.25} />
					<div>
						<p className="text-xs font-semibold text-[#05324f] leading-snug">
							{t('offers_page.price_fixed') || 'Price is fixed – no hidden fees'}
						</p>
						<p className="text-[11px] text-gray-500 mt-0.5">
							{t('offers_page.pay_directly') || 'You pay directly to the workshop.'}
						</p>
					</div>
				</div>
			</div>

			{(inclusionItems.length > 0 || offer.note) && (
				<div className="px-4 pb-4 border-t border-gray-100 pt-4">
					{inclusionItems.length > 0 && (
						<>
							<h4 className="text-sm font-semibold text-[#05324f] mb-3">
								{t('offers_page.included_question') || "What's included in the price?"}
							</h4>
							<div className="space-y-2.5">
								{inclusionItems.map((item, i) => (
									<div key={i} className="flex items-start gap-2.5">
										<Check size={14} className="text-[#38BC54] mt-0.5 shrink-0" strokeWidth={3} />
										<span className="text-xs text-[#05324f] font-medium leading-snug">{item}</span>
									</div>
								))}
							</div>
						</>
					)}
					{offer.note && (
						<details className={`${inclusionItems.length > 0 ? 'mt-4' : ''} group`}>
							<summary className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-[#38BC54] list-none">
								<FileText size={14} className="shrink-0" />
								<span>{t('offers_page.see_full_description') || 'See full description'}</span>
								<ChevronRight size={14} className="ml-auto group-open:rotate-90 transition-transform" />
							</summary>
							<p className="text-[11px] text-[#05324f]/80 font-medium leading-relaxed mt-2 pl-6">
								{offer.note}
							</p>
						</details>
					)}
				</div>
			)}
		</div>
	)

	const renderSafeChoice = () => (
		<div className="bg-[#F2F9F4] rounded-2xl border border-[#38BC54]/15 p-4 flex items-start gap-3">
			<div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
				<ShieldCheck className="w-4 h-4 text-[#38BC54]" fill="#38BC54" fillOpacity={0.15} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-[#05324f]">{t('offers_page.safe_choice_title') || '100% secure choice'}</p>
				<p className="text-[11px] text-[#05324f]/70 font-medium leading-snug mt-1 whitespace-pre-line">
					{t('offers_page.safe_choice_desc') ||
						"Only verified workshops.\nYou are not committed to anything until you have booked a time with the workshop."}
				</p>
			</div>
		</div>
	)

	const renderConfirmButton = (className = '') => (
		<Button
			onClick={handleBooking}
			disabled={isBooking}
			className={`relative w-full h-12 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl !font-normal text-sm text-center justify-center shadow-md shadow-green-200/50 transition-all active:scale-[0.99] disabled:bg-gray-300 disabled:shadow-none ${className}`}
		>
			{isBooking ? (
				<>
					<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					{t('offers_page.booking')}
				</>
			) : (
				<>
					<span>{t('offers_page.confirm_continue') || 'Confirm choice and proceed'}</span>
					<ArrowRight size={18} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2" />
				</>
			)}
		</Button>
	)

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />
			<div className="flex-1 max-w-xl mx-auto px-4 pt-24 md:pt-28 pb-20 w-full">
				{renderStepIndicator(bookingSteps)}

				<div className="text-center pt-2 mb-5">
					<h1 className="text-2xl sm:text-[1.65rem] font-semibold text-[#05324f] leading-tight mb-2">
						{t('offers_page.confirm_title') || "You're one step from booking!"}
					</h1>
					<p className="text-sm text-gray-500 leading-snug px-2">
						{t('offers_page.confirm_subtitle') || 'Review your selection and confirm to continue.'}
					</p>
				</div>

				<div className="space-y-4 pb-6">
					{renderWorkshopCard()}
					{renderSafeChoice()}
					{renderConfirmButton()}
				</div>
			</div>
			<Footer />
		</div>
	)
}

