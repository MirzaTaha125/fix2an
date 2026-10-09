import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookingCalendarSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import WorkshopImage from '../components/WorkshopImage'
import bookingConfirmedIcon from '../assets/booking-confirmed.png'
import { offersAPI, bookingsAPI, requestsAPI } from '../services/api'
import {
	Check,
	Calendar,
	Car,
	ChevronLeft,
	ChevronRight,
	ArrowLeft,
	Bell,
} from 'lucide-react'

const MORNING = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const AFTERNOON = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

function startOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

function daysInMonth(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function sameDay(a, b) {
	return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDayLabel(date, locale) {
	return date.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

function formatDayShort(date, locale) {
	return date
		.toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		})
		.replace(',', '')
}

function openUntil(workshop) {
	const raw = workshop?.openingHours
	if (!raw) return null
	try {
		const hours = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!hours || typeof hours !== 'object') return null
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
		const today = hours[days[new Date().getDay()]]
		return today?.close || today?.closes || null
	} catch {
		return null
	}
}

function dayStatus(day, today) {
	const start = new Date(day)
	start.setHours(0, 0, 0, 0)
	if (start < today) return 'past'
	if (day.getDay() === 0) return 'closed'
	if (day.getDay() === 6) return 'booked'
	return 'available'
}

export default function BookAppointmentPage({
	embedded = false,
	offerId: offerIdProp,
	requestId: requestIdProp,
	onDone,
	onBackToQuotes,
}) {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t, i18n } = useTranslation()

	const offerId = offerIdProp || searchParams.get('offerId')
	const requestId = requestIdProp || searchParams.get('requestId')
	const [offer, setOffer] = useState(null)
	const [requestDetails, setRequestDetails] = useState(null)
	const [loading, setLoading] = useState(true)
	const [step, setStep] = useState('calendar') // calendar | time | confirm | success
	const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState(null)
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
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (embedded || !offerId || !requestId) return
		navigate(`/contract?case=${requestId}&panel=booking&offerId=${offerId}`, { replace: true })
	}, [embedded, offerId, requestId, navigate])

	useEffect(() => {
		if (!embedded) return
		if (!offerId) {
			toast.error(t('offers_page.no_offer_selected') || 'No offer selected')
			onBackToQuotes?.()
			return
		}
		fetchOffer()
	}, [offerId, embedded])

	const fetchOffer = async () => {
		setLoading(true)
		try {
			if (!requestId) {
				toast.error(t('offers_page.request_id_required') || 'Request ID required')
				if (onBackToQuotes) onBackToQuotes()
				else navigate('/offers', { replace: true })
				return
			}
			const [offersRes, requestRes] = await Promise.all([
				offersAPI.getByRequest(requestId),
				requestsAPI.getById(requestId),
			])
			const found = (offersRes.data || []).find((o) => String(o._id || o.id) === String(offerId))
			if (!found) {
				toast.error(t('offers_page.offer_not_found') || 'Offer not found')
				if (onBackToQuotes) onBackToQuotes()
				else navigate('/offers', { replace: true })
				return
			}
			setOffer(found)
			setRequestDetails(requestRes.data || null)
		} catch (error) {
			console.error(error)
			toast.error(t('errors.fetch_failed') || 'Failed to fetch offer')
			if (onBackToQuotes) onBackToQuotes()
			else navigate('/offers', { replace: true })
		} finally {
			setLoading(false)
		}
	}

	const calendarCells = useMemo(() => {
		const first = startOfMonth(monthCursor)
		const total = daysInMonth(monthCursor)
		const startWeekday = (first.getDay() + 6) % 7 // Mon=0
		const cells = []
		for (let i = 0; i < startWeekday; i++) cells.push(null)
		for (let d = 1; d <= total; d++) {
			cells.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d))
		}
		return cells
	}, [monthCursor])

	const today = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d
	}, [])

	const handleBook = async () => {
		if (!offer || !selectedDate || !selectedTime) return
		setIsBooking(true)
		try {
			const [hh, mm] = selectedTime.split(':').map(Number)
			const scheduledAt = new Date(selectedDate)
			scheduledAt.setHours(hh, mm, 0, 0)

			await bookingsAPI.create({
				offerId: offer._id || offer.id,
				scheduledAt: scheduledAt.toISOString(),
				notes: '',
				isAgreedToTerms: true,
			})
			toast.success(t('offers_page.booking_success') || 'Booking created')
			setBookingSuccess(true)
			setStep('success')
			window.scrollTo(0, 0)
		} catch (error) {
			toast.error(error.response?.data?.message || t('offers_page.booking_failed') || 'Failed to book')
		} finally {
			setIsBooking(false)
		}
	}

	const workshopRaw = offer?.workshop || offer?.workshopId
	const workshop = workshopRaw && typeof workshopRaw === 'object' ? workshopRaw : null
	const vehicle = requestDetails?.vehicleId && typeof requestDetails.vehicleId === 'object'
		? requestDetails.vehicleId
		: null
	const reg = requestDetails?.registrationNumber || vehicle?.registrationNumber
	const leaveQuotes = () => {
		if (onBackToQuotes) onBackToQuotes()
		else navigate(`/offers?requestId=${requestId}`)
	}
	const mobileBack =
		step === 'time'
			? () => setStep('calendar')
			: step === 'confirm'
				? () => setStep('time')
				: step === 'calendar'
					? leaveQuotes
					: null
	useRegisterMobileBack(mobileBack, Boolean(mobileBack) && Boolean(offer) && step !== 'success')
	const leaveCases = () => {
		if (onDone) onDone()
		else navigate('/contract')
	}

	if (!embedded) return null

	if (loading || authLoading) {
		return <BookingCalendarSkeleton />
	}

	if (!offer) return null

	return (
		<div className="w-full">
				{step === 'calendar' && (
					<div className="w-full">
						<button
							type="button"
							onClick={leaveQuotes}
							className="mb-3 -ml-1 p-1 text-[#05324f] hover:opacity-70 max-lg:hidden"
							aria-label={t('common.back')}
						>
							<ArrowLeft className="w-5 h-5" strokeWidth={2} />
						</button>
						<h1 className="page-title lg:text-4xl">{t('booking.flow.pick_date')}</h1>
						<p className="text-sm lg:text-base text-[#6B7280] mb-5">{t('booking.flow.pick_date_sub')}</p>
						<WorkshopMini
							workshop={workshop}
							distance={offer.distance}
							t={t}
							onChange={leaveQuotes}
						/>

						<div className="mt-6">
							<div className="flex items-center justify-between mb-4">
								<p className="text-base font-bold text-[#05324f] capitalize">
									{monthCursor.toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-GB', { month: 'long', year: 'numeric' })}
								</p>
								<div className="flex items-center gap-1">
									<button
										type="button"
										aria-label={t('common.back')}
										className="w-8 h-8 flex items-center justify-center text-[#05324f]"
										onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
									>
										<ChevronLeft className="w-5 h-5" />
									</button>
									<button
										type="button"
										className="w-8 h-8 flex items-center justify-center text-[#05324f]"
										onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
									>
										<ChevronRight className="w-5 h-5" />
									</button>
								</div>
							</div>
							<div className="grid grid-cols-7 gap-y-1 text-center text-[12px] text-[#9CA3AF] mb-2">
								{['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
									<span key={d}>{t(`booking.flow.dow_${d}`)}</span>
								))}
							</div>
							<div className="grid grid-cols-7 gap-y-1">
								{calendarCells.map((day, i) => {
									if (!day) return <span key={`e-${i}`} />
									const status = dayStatus(day, today)
									const selected = sameDay(day, selectedDate)
									const disabled = status === 'past' || status === 'closed' || status === 'booked'
									return (
										<button
											key={day.toISOString()}
											type="button"
											disabled={disabled}
											onClick={() => setSelectedDate(day)}
											className="h-11 flex flex-col items-center justify-center"
										>
											<span
												className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
													selected
														? 'bg-brand-btn text-white'
														: status === 'available'
															? 'bg-[#E7F6EC] text-[#05324f]'
															: status === 'booked'
																? 'bg-[#F3F4F6] text-[#9CA3AF]'
																: 'text-[#D1D5DB]'
												}`}
											>
												{day.getDate()}
											</span>
										</button>
									)
								})}
							</div>
							<div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[12px] text-[#6B7280]">
								<span className="inline-flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-[#1B8F3E]" />
									{t('booking.flow.available')}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
									{t('booking.flow.fully_booked')}
								</span>
								<span className="inline-flex items-center gap-1.5">
									<span className="w-2 h-2 rounded-full bg-[#E5E7EB]" />
									{t('booking.flow.not_available')}
								</span>
							</div>
						</div>

						{selectedDate ? (
							<button
								type="button"
								onClick={() => setStep('time')}
								className="mt-6 w-full flex items-center justify-between rounded-2xl bg-[#F3FBF6] px-4 py-3.5"
							>
								<span className="flex items-center gap-3 min-w-0">
									<span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
										<Calendar className="w-5 h-5 text-[#1B8F3E]" />
									</span>
									<span className="text-left min-w-0">
										<p className="font-bold text-[#05324f] capitalize truncate">{formatDayShort(selectedDate, i18n.language)}</p>
										<p className="text-xs text-[#6B7280]">{t('booking.flow.slots_available', { count: MORNING.length + AFTERNOON.length })}</p>
									</span>
								</span>
								<ChevronRight className="w-5 h-5 text-[#9CA3AF] shrink-0" />
							</button>
						) : (
							<div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
								<Calendar className="w-5 h-5 text-[#1B8F3E] shrink-0" />
								<p className="text-sm text-[#4B5563] leading-snug">{t('booking.flow.select_date_hint')}</p>
							</div>
						)}
					</div>
				)}

				{step === 'time' && selectedDate && (
					<div className="w-full">
						<button type="button" onClick={() => setStep('calendar')} className="mb-4 -ml-1 p-1 text-[#05324f] max-lg:hidden" aria-label={t('common.back')}>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<h1 className="page-title lg:text-4xl">{t('booking.flow.pick_time')}</h1>
						<p className="text-sm lg:text-base text-[#6B7280] mb-5 capitalize">{formatDayShort(selectedDate, i18n.language)}</p>
						<WorkshopMini
							workshop={workshop}
							distance={offer.distance}
							t={t}
							onChange={leaveQuotes}
						/>
						<TimeSection title={t('booking.flow.morning')} times={MORNING} selected={selectedTime} onSelect={setSelectedTime} />
						<TimeSection title={t('booking.flow.afternoon')} times={AFTERNOON} selected={selectedTime} onSelect={setSelectedTime} />
						<button
							type="button"
							disabled={!selectedTime}
							onClick={() => setStep('confirm')}
							className="mt-8 w-full min-h-[52px] bg-brand-btn disabled:opacity-40 text-white rounded-lg font-semibold"
						>
							{t('booking.flow.continue')}
						</button>
					</div>
				)}

				{step === 'confirm' && selectedDate && selectedTime && (
					<div className="w-full">
						<button type="button" onClick={() => setStep('time')} className="mb-4 -ml-1 p-1 text-[#05324f] max-lg:hidden" aria-label={t('common.back')}>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<h1 className="page-title lg:text-4xl">{t('booking.flow.confirm_title')}</h1>
						<p className="text-sm lg:text-base text-[#6B7280] mb-5">{t('booking.flow.confirm_sub')}</p>
						<div className="space-y-3">
							<InfoCard
								icon={
									<span className="w-10 h-10 rounded-full bg-[#E7F6EC] flex items-center justify-center">
										<Calendar className="w-5 h-5 text-[#1B8F3E]" />
									</span>
								}
								title={formatDayLabel(selectedDate, i18n.language)}
								sub={`${t('booking.flow.at')} ${selectedTime}`}
							/>
							<InfoCard
								icon={<div className="w-10 h-10 rounded-full overflow-hidden"><WorkshopImage workshop={workshop} className="w-full h-full" /></div>}
								title={workshop?.companyName || t('offers_page.workshop')}
								lines={[
									distanceLine(offer.distance),
									[workshop?.address, workshop?.postalCode, workshop?.city].filter(Boolean).join(', '),
								]}
								link={t('booking.flow.show_map')}
							/>
							<InfoCard
								icon={
									<span className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
										<Car className="w-5 h-5 text-[#05324f]" />
									</span>
								}
								title={[vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || '—'}
								sub={[reg, vehicle?.year, vehicle?.fuelType].filter(Boolean).join(' · ')}
							/>
							<div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
								<h2 className="text-sm font-bold text-[#05324f] mb-3">{t('booking.flow.keep_in_mind')}</h2>
								<ul className="space-y-2.5 text-sm text-[#4B5563]">
									{[
										t('booking.flow.tip_cancel'),
										t('booking.flow.tip_id'),
										t('booking.flow.tip_belongings'),
										t('booking.flow.tip_reminder'),
									].map((tip) => (
										<li key={tip} className="flex items-center gap-2.5">
											<span className="w-5 h-5 rounded-full bg-[#1B8F3E] flex items-center justify-center shrink-0">
												<Check className="w-3 h-3 text-white" strokeWidth={3} />
											</span>
											{tip}
										</li>
									))}
								</ul>
							</div>
						</div>
						<button
							type="button"
							disabled={isBooking}
							onClick={handleBook}
							className="mt-6 w-full min-h-[52px] bg-brand-btn text-white rounded-lg font-semibold"
						>
							{isBooking ? '...' : t('booking.flow.confirm_booking')}
						</button>
					</div>
				)}

				{(step === 'success' || bookingSuccess) && (
					<div className="pt-10 max-w-md mx-auto">
						<div className="text-center mb-8">
						<img
							src={bookingConfirmedIcon}
							alt=""
							className="w-[148px] h-[148px] mx-auto mb-6 object-contain"
						/>
						<h1 className="page-title !mt-0 text-center mx-auto">
							{t('booking.flow.success_title')}
						</h1>
						<p className="text-sm text-[#6B7280] text-center mx-auto">
							{t('booking.flow.success_sub')}
						</p>
						</div>
						<div>
						<div className="space-y-3 text-left mb-4">
							<InfoCard
								icon={<Calendar className="w-5 h-5 text-[#6B7280]" />}
								title={formatDayLabel(selectedDate, i18n.language)}
								sub={`${t('booking.flow.at')} ${selectedTime}`}
							/>
							<InfoCard
								icon={<div className="w-10 h-10 rounded-full overflow-hidden"><WorkshopImage workshop={workshop} className="w-full h-full" /></div>}
								title={workshop?.companyName}
								sub={[distanceLine(offer.distance), workshop?.address, workshop?.city].filter(Boolean).join(', ')}
							/>
							<InfoCard
								icon={<Car className="w-5 h-5 text-[#6B7280]" />}
								title={[vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || '—'}
								sub={[reg, vehicle?.year, vehicle?.fuelType].filter(Boolean).join(' · ')}
							/>
						</div>
						<div className="mb-6 rounded-2xl bg-[#F3FBF6] px-4 py-3.5 flex items-center gap-3 text-left">
							<Bell className="w-5 h-5 text-[#1B8F3E] shrink-0" />
							<p className="text-sm text-[#05324f]">{t('booking.flow.reminder_note')}</p>
						</div>
						<button type="button" onClick={leaveCases} className="w-full min-h-[52px] bg-brand-btn text-white rounded-lg font-semibold mb-3">
							{t('booking.flow.to_my_cases')}
						</button>
						<button
							type="button"
							onClick={() => {
								if (!selectedDate || !selectedTime) return
								const [hh, mm] = selectedTime.split(':').map(Number)
								const start = new Date(selectedDate)
								start.setHours(hh, mm, 0, 0)
								const end = new Date(start.getTime() + 60 * 60 * 1000)
								const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${toIcs(start)}\nDTEND:${toIcs(end)}\nSUMMARY:Fixa2an – ${workshop?.companyName || 'Workshop'}\nEND:VEVENT\nEND:VCALENDAR`
								const blob = new Blob([ics], { type: 'text/calendar' })
								const url = URL.createObjectURL(blob)
								const a = document.createElement('a')
								a.href = url
								a.download = 'fixa2an-booking.ics'
								a.click()
								URL.revokeObjectURL(url)
							}}
							className="w-full min-h-[52px] border-[1.5px] border-[#1B8F3E] text-[#1B8F3E] rounded-lg font-semibold"
						>
							{t('booking.flow.add_to_calendar')}
						</button>
						</div>
					</div>
				)}
		</div>
	)
}

function toIcs(date) {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function WorkshopMini({ workshop, distance, t, onChange }) {
	const until = openUntil(workshop)
	const km = distance != null ? `${Number(distance).toFixed(1).replace('.', ',')} km` : workshop?.city || '—'
	return (
		<div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
			<div className="w-12 h-12 rounded-full overflow-hidden bg-[#F3F4F6] shrink-0 ring-1 ring-black/5">
				<WorkshopImage workshop={workshop} className="w-full h-full" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-bold text-[#05324f] truncate">{workshop?.companyName || t('offers_page.workshop')}</p>
				<p className="text-xs text-[#6B7280] mt-0.5 truncate">
					{t('booking.flow.km_away', { km })}
					{until ? ` · ${t('booking.flow.open_until', { time: until })}` : ''}
				</p>
				{onChange && (
					<button type="button" onClick={onChange} className="text-xs font-semibold text-[#1B8F3E] mt-0.5">
						{t('booking.flow.change_workshop')}
					</button>
				)}
			</div>
		</div>
	)
}

function distanceLine(distance) {
	if (distance == null) return null
	return `${Number(distance).toFixed(1).replace('.', ',')} km`
}

function TimeSection({ title, times, selected, onSelect }) {
	return (
		<div className="mt-6">
			<h2 className="text-sm font-bold text-[#05324f] mb-3">{title}</h2>
			<div className="grid grid-cols-3 gap-2.5">
				{times.map((time) => {
					const active = selected === time
					return (
						<button
							key={time}
							type="button"
							onClick={() => onSelect(time)}
							className={`h-11 rounded-xl text-sm font-semibold border ${
								active
									? 'bg-[#1B8F3E] border-[#1B8F3E] text-white'
									: 'bg-white border-gray-200 text-[#05324f]'
							}`}
						>
							{active ? (
								<span className="inline-flex items-center gap-1.5">
									<span className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0">
										<Check className="w-2.5 h-2.5 text-[#1B8F3E]" strokeWidth={3.5} />
									</span>
									{time}
								</span>
							) : (
								time
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}

function InfoCard({ icon, title, sub, lines, link }) {
	const rows = (lines || (sub ? [sub] : [])).filter(Boolean)
	return (
		<div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3">
			<div className="shrink-0">{icon}</div>
			<div className="min-w-0">
				<p className="text-sm font-bold text-[#05324f] capitalize">{title}</p>
				{rows.map((line) => (
					<p key={line} className="text-xs text-[#6B7280] mt-0.5">{line}</p>
				))}
				{link && <p className="text-xs font-semibold text-[#1B8F3E] mt-1">{link}</p>}
			</div>
		</div>
	)
}
