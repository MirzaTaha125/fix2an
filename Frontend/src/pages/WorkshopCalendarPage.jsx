import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { bookingsAPI } from '../services/api'
const LEGEND = [
	{ key: 'legend_booked', swatch: 'bg-[#CDECC8]' },
	{ key: 'legend_confirmed', swatch: 'bg-[#D5E2FB]' },
	{ key: 'legend_done', swatch: 'bg-[#E4D7F8]' },
	{ key: 'legend_cancelled', swatch: 'bg-white border border-[#D1D5DB]' },
]

function eventTone(status) {
	const value = (status || '').toUpperCase()
	if (value === 'CANCELLED') return 'bg-[#F3F4F6] text-[#6B7280]'
	if (value === 'DONE' || value === 'READY_PICKUP') return 'bg-[#EDE4FA] text-[#6D4EA8]'
	if (value === 'IN_PROGRESS' || value === 'RECEIVED') return 'bg-[#FDECC8] text-[#8A6A2F]'
	if (value === 'CONFIRMED' || value === 'RESCHEDULED') return 'bg-[#D9E4FB] text-[#3E5E9A]'
	return 'bg-[#DDF3D8] text-[#3D7A45]'
}

function vehicleTitle(request) {
	const vehicle = request?.vehicleId || request?.vehicle
	const name = [vehicle?.make, vehicle?.model].filter((part) => part && part !== '—').join(' ')
	return name || request?.registrationNumber || ''
}

function startOfWeek(date) {
	const d = new Date(date)
	const day = (d.getDay() + 6) % 7
	d.setDate(d.getDate() - day)
	d.setHours(0, 0, 0, 0)
	return d
}

export default function WorkshopCalendarPage() {
	const { t, i18n } = useTranslation()
	const [cursor, setCursor] = useState(() => startOfWeek(new Date()))
	const [bookings, setBookings] = useState([])

	useEffect(() => {
		bookingsAPI.getByWorkshopMe()
			.then((response) => setBookings(Array.isArray(response.data) ? response.data : []))
			.catch(() => setBookings([]))
	}, [])

	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
		const date = new Date(cursor)
		date.setDate(cursor.getDate() + i)
		return date
	}), [cursor])

	const hours = Array.from({ length: 9 }, (_, i) => i + 8)
	const locale = i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-GB'
	const rangeLabel = `${days[0].toLocaleDateString(locale, { day: 'numeric' })} – ${days[6].toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`

	const events = bookings
		.filter((booking) => booking.scheduledAt)
		.map((booking) => {
			const when = new Date(booking.scheduledAt)
			const request = booking.requestId
			return {
				id: booking._id || booking.id,
				when,
				title: vehicleTitle(request) || t('workshop.panel.jobs'),
				detail: request?.description || '',
				tone: eventTone(booking.status),
			}
		})

	const weekday = (day) => {
		const raw = day.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')
		return raw.charAt(0).toUpperCase() + raw.slice(1)
	}

	return (
		<WorkshopShell>
			<div className="workshop-calendar-page list-page-shell bg-transparent flex flex-col">
				<div className="list-page-content !max-w-none flex-1 !min-h-0 flex flex-col overflow-hidden !pb-2">
					<div className="mb-4 shrink-0">
						<h1 className="page-title">{t('workshop.panel.calendar_title')}</h1>
					</div>

					<div className="flex items-center justify-between gap-3 mb-3 shrink-0">
						<div className="flex items-center gap-2 min-w-0">
							<p className="text-sm font-bold text-[#111827] truncate">{rangeLabel}</p>
							<button type="button" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))} aria-label={t('workshop.panel.prev_week')} className="text-[#6B7280] shrink-0">
								<ChevronLeft className="w-4 h-4" />
							</button>
							<button type="button" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))} aria-label={t('workshop.panel.next_week')} className="text-[#6B7280] shrink-0">
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
						<button type="button" onClick={() => setCursor(startOfWeek(new Date()))} className="min-h-[36px] px-3 sm:px-4 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F8FAF9] shrink-0">
							{t('workshop.panel.today')}
						</button>
					</div>

					<div className="workshop-calendar-scroll flex-1 min-h-0">
						<div className="min-w-[720px] w-max max-w-none pb-2">
							<div className="grid grid-cols-[64px_repeat(7,minmax(88px,1fr))] mb-2 sticky top-0 z-10 bg-white">
								<div />
								{days.map((day) => {
									const isToday = day.toDateString() === new Date().toDateString()
									return (
										<div key={day.toISOString()} className="flex justify-center py-1">
											<div className={`flex flex-col items-center justify-center min-w-[52px] rounded-full px-2 py-1 ${isToday ? 'bg-brand-btn text-white' : 'text-[#111827]'}`}>
												<span className={`text-[11px] leading-none ${isToday ? 'text-white' : 'text-[#9CA3AF]'}`}>{weekday(day)}</span>
												<span className="text-sm font-bold leading-tight mt-0.5">{day.getDate()}</span>
											</div>
										</div>
									)
								})}
							</div>
							{hours.map((hour) => (
								<div key={hour} className="grid grid-cols-[64px_repeat(7,minmax(88px,1fr))]">
									<div className="text-[11px] text-[#9CA3AF] text-right pr-3 -mt-2">{String(hour).padStart(2, '0')}:00</div>
									{days.map((day) => {
										const slot = events.filter((event) => (
											event.when.getFullYear() === day.getFullYear()
											&& event.when.getMonth() === day.getMonth()
											&& event.when.getDate() === day.getDate()
											&& event.when.getHours() === hour
										))
										return (
											<div key={`${day.toISOString()}-${hour}`} className="relative h-20 border-t border-l border-[#EEF0F4]">
												{slot.map((event) => (
													<div key={event.id} className={`absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-lg px-2.5 py-2 overflow-hidden ${event.tone}`}>
														<p className="text-xs font-bold leading-snug truncate">{event.title}</p>
														{event.detail && <p className="text-[11px] leading-snug truncate mt-0.5 opacity-80">{event.detail}</p>}
													</div>
												))}
											</div>
										)
									})}
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-3 shrink-0 text-sm text-[#6B7280]">
						{LEGEND.map((item) => (
							<span key={item.key} className="inline-flex items-center gap-2">
								<span className={`w-4 h-4 rounded-[4px] ${item.swatch}`} />
								{t(`workshop.panel.${item.key}`)}
							</span>
						))}
					</div>
				</div>
			</div>
		</WorkshopShell>
	)
}
