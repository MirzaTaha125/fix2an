import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import WorkshopShell from '../components/workshop/WorkshopShell'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { bookingsAPI, workshopAPI } from '../services/api'
import { formatPrice } from '../utils/cn'

function monthChange(current, previous) {
	if (!previous) return current ? 100 : 0
	return Math.round(((current - previous) / previous) * 100)
}

function inMonth(date, year, month) {
	return date.getFullYear() === year && date.getMonth() === month
}

export default function WorkshopStatisticsPage() {
	const { t, i18n } = useTranslation()
	const [stats, setStats] = useState(null)
	const [weeks, setWeeks] = useState([])
	const [jobs, setJobs] = useState([])
	const [changes, setChanges] = useState({ cases: 0, booked: 0, revenue: 0 })
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setLoading(true)
		Promise.all([workshopAPI.getStats(), bookingsAPI.getByWorkshopMe()])
			.then(([statsRes, bookingsRes]) => {
				setStats(statsRes.data || {})
				const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : []
				const now = new Date()
				const year = now.getFullYear()
				const month = now.getMonth()
				const prev = new Date(year, month - 1, 1)
				const locale = i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-GB'

				const weekBuckets = [1, 8, 15, 22, 29].map((day) => ({
					label: new Date(year, month, day).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
					total: 0,
				}))
				let casesNow = 0
				let casesPrev = 0
				let bookedNow = 0
				let bookedPrev = 0
				let revenueNow = 0
				let revenuePrev = 0

				bookings.forEach((booking) => {
					const created = booking.createdAt ? new Date(booking.createdAt) : null
					const amount = Number(booking.totalAmount) || 0
					const done = booking.status === 'DONE'
					if (created && inMonth(created, year, month)) {
						casesNow += 1
						const index = Math.min(4, Math.floor((created.getDate() - 1) / 7))
						weekBuckets[index].total += 1
						if (done) bookedNow += 1
						revenueNow += amount
					}
					if (created && inMonth(created, prev.getFullYear(), prev.getMonth())) {
						casesPrev += 1
						if (done) bookedPrev += 1
						revenuePrev += amount
					}
				})

				setWeeks(weekBuckets)
				setChanges({
					cases: monthChange(casesNow, casesPrev),
					booked: monthChange(bookedNow, bookedPrev),
					revenue: monthChange(revenueNow, revenuePrev),
				})

				const counts = {}
				bookings.filter((booking) => booking.status === 'DONE').forEach((booking) => {
					const text = (booking.requestId?.description || '').split(/[–,—.]/)[0].trim()
					const vehicle = booking.requestId?.vehicleId
					const label = text || [vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || t('workshop.panel.other')
					counts[label] = (counts[label] || 0) + 1
				})
				setJobs(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3))
			})
			.catch(() => setStats({}))
			.finally(() => setLoading(false))
	}, [t, i18n.language])

	const max = Math.max(80, ...weeks.map((item) => item.total))
	const chartWidth = 520
	const chartHeight = 180
	const points = weeks.map((item, index) => {
		const x = weeks.length === 1 ? 0 : (index / (weeks.length - 1)) * chartWidth
		const y = chartHeight - (item.total / max) * chartHeight
		return { x, y }
	})
	const line = points.map((point) => `${point.x},${point.y}`).join(' ')
	const area = points.length
		? `0,${chartHeight} ${line} ${chartWidth},${chartHeight}`
		: ''
	const sent = stats?.proposalsSent || 0
	const won = stats?.completedContracts || 0
	const rate = sent ? Math.round((won / sent) * 100) : 0
	const cards = [
		{ label: t('workshop.panel.stat_cases'), value: stats?.totalRequests ?? '—', change: changes.cases },
		{ label: t('workshop.panel.stat_quotes'), value: stats?.proposalsSent ?? '—', change: null },
		{ label: t('workshop.panel.stat_booked'), value: stats?.completedContracts ?? '—', change: changes.booked },
		{ label: t('workshop.panel.stat_revenue'), value: stats ? formatPrice(stats.monthlyRevenue || stats.totalRevenue || 0) : '—', change: changes.revenue },
	]
	const yTicks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]

	if (loading || stats == null) {
		return (
			<WorkshopShell>
				<div className="list-page-shell bg-transparent">
					<div className="list-page-content !max-w-none">
						<div className="flex items-center justify-between gap-4 mb-6">
							<Skeleton className="h-8 w-40" />
							<Skeleton className="h-10 w-32 rounded-xl" />
						</div>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="rounded-2xl border border-[#E6E8EC] bg-white px-5 py-4 space-y-3">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-8 w-16" />
									<Skeleton className="h-4 w-12" />
								</div>
							))}
						</div>
						<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5 mb-4 space-y-4">
							<Skeleton className="h-4 w-36" />
							<Skeleton className="h-44 w-full rounded-xl" />
						</div>
						<div className="grid lg:grid-cols-2 gap-4">
							<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5 space-y-3">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5 flex flex-col items-center gap-4">
								<Skeleton className="h-4 w-36 self-start" />
								<Skeleton className="h-40 w-40 rounded-full" />
							</div>
						</div>
					</div>
				</div>
			</WorkshopShell>
		)
	}

	return (
		<WorkshopShell>
			<div className="list-page-shell bg-transparent">
				<div className="list-page-content !max-w-none">
					<div className="flex items-center justify-between gap-4 mb-6">
						<h1 className="page-title">{t('workshop.panel.statistics_title')}</h1>
						<span className="inline-flex items-center gap-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-xl px-4 min-h-[40px] bg-white">
							{t('workshop.panel.this_month')}
							<ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
						</span>
					</div>

					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						{cards.map((card) => (
							<div key={card.label} className="rounded-2xl border border-[#E6E8EC] bg-white px-5 py-4">
								<p className="text-sm text-[#6B7280]">{card.label}</p>
								<p className="text-[1.75rem] leading-none font-bold text-[#0B2540] mt-3">{card.value}</p>
								<p className={`text-sm font-semibold mt-2 min-h-[1.25rem] ${card.change == null ? '' : card.change < 0 ? 'text-red-500' : 'text-[#1B8F3E]'}`}>
									{card.change == null ? '' : `${card.change > 0 ? '+' : ''}${card.change}%`}
								</p>
							</div>
						))}
					</div>

					<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5 mb-4">
						<p className="text-sm font-bold text-[#0B2540] mb-4">{t('workshop.panel.cases_over_time')}</p>
						<div className="flex gap-3">
							<div className="flex flex-col justify-between text-[11px] text-[#9CA3AF] h-44 pb-5">
								{yTicks.map((tick) => <span key={tick}>{tick}</span>)}
							</div>
							<div className="flex-1 min-w-0">
								<svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44">
									{yTicks.map((_, index) => (
										<line key={index} x1="0" x2={chartWidth} y1={(chartHeight / 4) * index} y2={(chartHeight / 4) * index} stroke="#F3F4F6" />
									))}
									{area && <polygon points={area} fill="#1B8F3E" opacity="0.12" />}
									{line && <polyline fill="none" stroke="#1B8F3E" strokeWidth="3" points={line} strokeLinejoin="round" strokeLinecap="round" />}
								</svg>
								<div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
									{weeks.map((item) => <span key={item.label}>{item.label}</span>)}
								</div>
							</div>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5">
							<p className="text-sm font-bold text-[#0B2540] mb-3">{t('workshop.panel.top_jobs')}</p>
							{jobs.length === 0 ? (
								<EmptyState
									compact
									title={t('common.empty.workshop_stats_title')}
									description={t('common.empty.workshop_stats_desc')}
								/>
							) : jobs.map(([label, count], index) => (
								<div key={label} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0 text-sm">
									<span className="text-[#111827]">{index + 1}. {label}</span>
									<span className="font-semibold text-[#6B7280]">{count}</span>
								</div>
							))}
						</div>
						<div className="rounded-2xl border border-[#E6E8EC] bg-white p-5">
							<p className="text-sm font-bold text-[#0B2540] mb-4">{t('workshop.panel.quote_to_booking')}</p>
							<div className="flex items-center justify-center py-4">
								<div
									className="w-40 h-40 rounded-full flex items-center justify-center"
									style={{ background: `conic-gradient(#3DDC84 ${rate * 3.6}deg, #E8F6EC 0deg)` }}
								>
									<div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
										<span className="text-2xl font-bold text-[#374151]">{rate}%</span>
										<span className="text-xs text-[#9CA3AF] mt-0.5">{t('workshop.panel.booking_rate')}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</WorkshopShell>
	)
}
