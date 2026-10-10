import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
	BarChart3,
	Building2,
	ChevronDown,
	CreditCard,
	Download,
	FileText,
	FolderOpen,
	Home,
	LifeBuoy,
	LogOut,
	Menu,
	Settings,
	Star,
	Users,
	X,
} from 'lucide-react'
import { formatPrice } from '../../utils/cn'
import { formatSwedishPhone } from '../../utils/swedishPhone'
import mainLogo from '../../assets/main_logo.png'
import { supportAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Skeleton } from '../ui/Skeleton'

const NAV = [
	{ id: 'dashboard', key: 'overview', icon: Home },
	{ id: 'requests', key: 'cases', icon: FolderOpen },
	{ id: 'workshops', key: 'workshops', icon: Building2 },
	{ id: 'customers', key: 'customers', icon: Users },
	{ id: 'support', key: 'support', icon: LifeBuoy },
	{ id: 'commissions', key: 'commissions', icon: CreditCard },
	{ id: 'statistics', key: 'statistics', icon: BarChart3 },
	{ id: 'content', key: 'content', icon: FileText },
	{ id: 'settings', key: 'settings', icon: Settings },
]

const CMS_PAGES = [
	{ title: 'Home', path: '/', key: 'pages' },
	{ title: 'How it works', path: '/how-it-works', key: 'pages' },
	{ title: 'About us', path: '/about', key: 'pages' },
	{ title: 'Help & support', path: '/support', key: 'faq' },
	{ title: 'Privacy policy', path: '/privacy', key: 'terms' },
	{ title: 'Terms', path: '/terms', key: 'terms' },
]

function monthKey(date) {
	return `${date.getFullYear()}-${date.getMonth()}`
}

function changePercent(current, previous) {
	if (!previous) return current ? 100 : 0
	return Math.round(((current - previous) / previous) * 100)
}

function Pill({ children, tone = 'gray' }) {
	const tones = {
		green: 'bg-[#E7F6EC] text-[#1B8F3E]',
		amber: 'bg-[#FFF6E8] text-[#C4841D]',
		red: 'bg-[#FDECEC] text-[#D64545]',
		blue: 'bg-[#EEF2FF] text-[#3B5BDB]',
		gray: 'bg-[#F3F4F6] text-[#6B7280]',
	}
	return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone] || tones.gray}`}>{children}</span>
}

function requestTone(status) {
	if (status === 'NEW') return 'green'
	if (status === 'IN_BIDDING' || status === 'BIDDING_CLOSED') return 'blue'
	if (status === 'BOOKED') return 'green'
	if (status === 'COMPLETED') return 'green'
	if (status === 'CANCELLED' || status === 'EXPIRED') return 'red'
	return 'gray'
}

export default function AdminPanelView({
	activeTab,
	onTab,
	onLogout,
	stats,
	requests,
	bookings,
	workshops,
	customers,
	listLoading,
	searchQuery,
	onSearch,
	statusFilter,
	onStatus,
	pagination,
	onPage,
	onViewRequest,
	onViewBooking,
	emailConfig,
	onEmailChange,
	onSaveEmail,
	emailSaving,
	user,
	commissionRate,
	onCommissionChange,
	vatRate,
	onVatChange,
	onSaveCommission,
	commissionSaving,
	onSaveAccount,
	accountSaving,
	twoFactorEnabled,
	twoFactorSetup,
	twoFactorCode,
	setTwoFactorCode,
	twoFactorDisablePassword,
	setTwoFactorDisablePassword,
	twoFactorDisableCode,
	setTwoFactorDisableCode,
	twoFactorLoading,
	onStart2FA,
	onVerify2FA,
	onDisable2FA,
}) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const [period, setPeriod] = useState('month')
	const [contentTab, setContentTab] = useState('pages')
	const [settingsTab, setSettingsTab] = useState('account')
	const [payTab, setPayTab] = useState('overview')
	const [prefs, setPrefs] = useState(() => {
		try {
			return {
				registration: true,
				requests: true,
				workshops: true,
				payouts: true,
				autoApprove: false,
				...JSON.parse(localStorage.getItem('fixa2an-admin-prefs') || '{}'),
			}
		} catch {
			return { registration: true, requests: true, workshops: true, payouts: true, autoApprove: false }
		}
	})

	const locale = i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-GB'
	const label = (key) => t(`admin.panel.${key}`)
	const dateLabel = (value) => {
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) return '—'
		return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
	}
	const caseNo = (id) => `#${String(id || '').slice(-5).toUpperCase()}`

	const go = (id) => {
		onTab(id)
		setOpen(false)
	}

	const togglePref = (key) => {
		setPrefs((prev) => {
			const next = { ...prev, [key]: !prev[key] }
			localStorage.setItem('fixa2an-admin-prefs', JSON.stringify(next))
			return next
		})
	}

	const now = new Date()
	const thisKey = monthKey(now)
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
	const prevKey = monthKey(prev)
	const inMonth = (value, key) => {
		const date = new Date(value)
		return !Number.isNaN(date.getTime()) && monthKey(date) === key
	}
	const casesNow = requests.filter((row) => inMonth(row.createdAt, thisKey)).length
	const casesPrev = requests.filter((row) => inMonth(row.createdAt, prevKey)).length
	const bookedNow = bookings.filter((row) => inMonth(row.createdAt, thisKey)).length
	const bookedPrev = bookings.filter((row) => inMonth(row.createdAt, prevKey)).length
	const revenueOf = (rows) => rows.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0)
	const revenueNow = revenueOf(bookings.filter((row) => inMonth(row.createdAt, thisKey)))
	const revenuePrev = revenueOf(bookings.filter((row) => inMonth(row.createdAt, prevKey)))
	const paidTotal = revenueOf(bookings.filter((row) => row.status === 'DONE'))
	const waitingTotal = revenueOf(bookings.filter((row) => row.status !== 'DONE' && row.status !== 'CANCELLED'))

	const months = useMemo(() => {
		const buckets = []
		for (let i = 5; i >= 0; i -= 1) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
			buckets.push({
				key: monthKey(date),
				label: date.toLocaleDateString(locale, { month: 'short' }),
				total: 0,
			})
		}
		requests.forEach((row) => {
			const date = new Date(row.createdAt)
			if (Number.isNaN(date.getTime())) return
			const bucket = buckets.find((item) => item.key === monthKey(date))
			if (bucket) bucket.total += 1
		})
		return buckets
	}, [requests, locale])

	const statusSlices = useMemo(() => {
		const groups = [
			{ key: 'new', match: ['NEW'], tone: '#3DDC84' },
			{ key: 'quotes', match: ['IN_BIDDING', 'BIDDING_CLOSED'], tone: '#5B8DEF' },
			{ key: 'booked', match: ['BOOKED'], tone: '#1B8F3E' },
			{ key: 'ongoing', match: ['IN_PROGRESS'], tone: '#F0A04B' },
			{ key: 'done', match: ['COMPLETED'], tone: '#E4C15A' },
		]
		const counts = groups.map((group) => ({
			...group,
			total: requests.filter((row) => group.match.includes(row.status)).length,
		}))
		const sum = counts.reduce((acc, item) => acc + item.total, 0) || 1
		return counts.map((item) => ({ ...item, pct: Math.round((item.total / sum) * 100) }))
	}, [requests])

	const weekStart = new Date(now)
	weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
	weekStart.setHours(0, 0, 0, 0)
	const weekEnd = new Date(weekStart)
	weekEnd.setDate(weekStart.getDate() + 6)
	const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
	const rangeLabel = sameMonth
		? `${weekStart.getDate()} – ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
		: `${weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
	const weekDays = useMemo(() => {
		const days = []
		for (let i = 0; i < 7; i += 1) {
			const date = new Date(weekStart)
			date.setDate(weekStart.getDate() + i)
			days.push({
				key: date.toDateString(),
				label: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
				total: 0,
			})
		}
		requests.forEach((row) => {
			const date = new Date(row.createdAt)
			if (Number.isNaN(date.getTime())) return
			const bucket = days.find((item) => item.key === date.toDateString())
			if (bucket) bucket.total += 1
		})
		return days
	}, [requests, locale, weekStart.getTime()])
	const lastWeekStart = new Date(weekStart)
	lastWeekStart.setDate(weekStart.getDate() - 7)
	const inRange = (value, start, end) => {
		const date = new Date(value)
		return !Number.isNaN(date.getTime()) && date >= start && date < end
	}
	const thisWeekEnd = new Date(weekEnd)
	thisWeekEnd.setDate(weekEnd.getDate() + 1)
	const newThisWeek = requests.filter((row) => inRange(row.createdAt, weekStart, thisWeekEnd)).length
	const newLastWeek = requests.filter((row) => inRange(row.createdAt, lastWeekStart, weekStart)).length
	const bookedThisWeek = bookings.filter((row) => inRange(row.createdAt, weekStart, thisWeekEnd)).length
	const bookedLastWeek = bookings.filter((row) => inRange(row.createdAt, lastWeekStart, weekStart)).length
	const revenueThisWeek = revenueOf(bookings.filter((row) => inRange(row.createdAt, weekStart, thisWeekEnd)))
	const revenueLastWeek = revenueOf(bookings.filter((row) => inRange(row.createdAt, lastWeekStart, weekStart)))

	return (
		<div className="admin-app h-[100dvh] max-h-[100dvh] bg-[#F3F5F8] flex overflow-hidden">
			<aside className="hidden lg:flex w-[248px] shrink-0 m-2 mr-0 bg-[#0B2540] text-white rounded-3xl flex-col py-6 px-4">
				<img src={mainLogo} alt="Fixa2an" className="h-8 w-auto object-contain brightness-0 invert px-3" />
				<nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
					{NAV.map((item) => {
						const Icon = item.icon
						const active = activeTab === item.id
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => go(item.id)}
								className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${active ? 'bg-brand-btn text-white' : 'text-white/80 hover:bg-white/10'}`}
							>
								<Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
								{label(item.key)}
							</button>
						)
					})}
				</nav>
				<button type="button" onClick={onLogout} className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/10">
					<LogOut className="w-4 h-4" />
					{label('logout')}
				</button>
			</aside>

			{open && (
				<div className="lg:hidden fixed inset-0 z-50">
					<button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close" />
					<aside className="relative w-[min(280px,86vw)] h-full max-h-[100dvh] bg-[#0B2540] text-white flex flex-col pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-4 shadow-2xl">
						<button type="button" onClick={() => setOpen(false)} className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 text-white/70 p-1" aria-label="Close">
							<X className="w-5 h-5" />
						</button>
						<img src={mainLogo} alt="Fixa2an" className="h-8 w-auto object-contain brightness-0 invert px-3 mt-1" />
						<nav className="mt-8 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
							{NAV.map((item) => {
								const Icon = item.icon
								const active = activeTab === item.id
								return (
									<button key={item.id} type="button" onClick={() => go(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? 'bg-brand-btn text-white' : 'text-white/80'}`}>
										<Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
										{label(item.key)}
									</button>
								)
							})}
						</nav>
						<button type="button" onClick={() => { setOpen(false); onLogout() }} className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/80 hover:bg-white/10">
							<LogOut className="w-4 h-4" />
							{label('logout')}
						</button>
					</aside>
				</div>
			)}

			<main className="flex-1 min-w-0 lg:m-2 bg-white lg:rounded-3xl overflow-y-auto overflow-x-hidden">
				<div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#EEF0F4] px-4 py-3 flex items-center gap-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
					<button type="button" onClick={() => setOpen(true)} aria-label="Menu" className="p-1 -ml-1 shrink-0">
						<Menu className="w-5 h-5 text-[#0B2540]" />
					</button>
					<p className="font-bold text-[#0B2540] truncate">{label(NAV.find((item) => item.id === activeTab)?.key || 'overview')}</p>
				</div>
				<div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
					{activeTab === 'dashboard' && (
						<Overview
							label={label}
							stats={stats}
							rangeLabel={rangeLabel}
							newThisWeek={newThisWeek}
							revenueTotal={revenueOf(bookings)}
							weekChange={{
								cases: changePercent(newThisWeek, newLastWeek),
								booked: changePercent(bookedThisWeek, bookedLastWeek),
								revenue: changePercent(revenueThisWeek, revenueLastWeek),
							}}
							weekDays={weekDays}
							slices={statusSlices}
						/>
					)}
					{activeTab === 'requests' && (
						<CasesTable
							label={label}
							rows={requests}
							loading={listLoading}
							searchQuery={searchQuery}
							onSearch={onSearch}
							statusFilter={statusFilter}
							onStatus={onStatus}
							stats={stats}
							pagination={pagination}
							onPage={onPage}
							onView={onViewRequest}
							dateLabel={dateLabel}
							caseNo={caseNo}
							locale={locale}
						/>
					)}
					{activeTab === 'workshops' && (
						<WorkshopsTable
							label={label}
							rows={workshops}
							loading={listLoading}
							searchQuery={searchQuery}
							onSearch={onSearch}
							dateLabel={dateLabel}
							onView={(workshop) => navigate(`/admin/workshops/${workshop.id || workshop._id}`)}
							pagination={pagination}
							onPage={onPage}
						/>
					)}
					{activeTab === 'customers' && (
						<CustomersTable
							label={label}
							rows={customers}
							loading={listLoading}
							searchQuery={searchQuery}
							onSearch={onSearch}
							dateLabel={dateLabel}
							pagination={pagination}
							onPage={onPage}
						/>
					)}
					{activeTab === 'support' && <SupportView label={label} />}
					{activeTab === 'commissions' && (
						<PaymentsView
							label={label}
							bookings={bookings}
							paidTotal={paidTotal}
							waitingTotal={waitingTotal}
							payTab={payTab}
							setPayTab={setPayTab}
							dateLabel={dateLabel}
							caseNo={caseNo}
							onView={onViewBooking}
							locale={locale}
						/>
					)}
					{activeTab === 'statistics' && (
						<StatisticsView
							label={label}
							period={period}
							setPeriod={setPeriod}
							requests={requests}
							bookings={bookings}
							workshops={workshops}
							locale={locale}
							revenueNow={revenueNow}
							casesNow={casesNow}
							bookedNow={bookedNow}
							caseChange={changePercent(casesNow, casesPrev)}
							revenueChange={changePercent(revenueNow, revenuePrev)}
						/>
					)}
					{activeTab === 'content' && (
						<ContentView label={label} tab={contentTab} setTab={setContentTab} onOpen={(path) => navigate(path)} />
					)}
					{activeTab === 'settings' && (
						<SettingsView
							label={label}
							tab={settingsTab}
							setTab={setSettingsTab}
							prefs={prefs}
							togglePref={togglePref}
							emailConfig={emailConfig}
							onEmailChange={onEmailChange}
							onSaveEmail={onSaveEmail}
							emailSaving={emailSaving}
							onSupport={() => navigate('/support')}
							user={user}
							commissionRate={commissionRate}
							onCommissionChange={onCommissionChange}
							vatRate={vatRate}
							onVatChange={onVatChange}
							onSaveCommission={onSaveCommission}
							commissionSaving={commissionSaving}
							onSaveAccount={onSaveAccount}
							accountSaving={accountSaving}
							twoFactorEnabled={twoFactorEnabled}
							twoFactorSetup={twoFactorSetup}
							twoFactorCode={twoFactorCode}
							setTwoFactorCode={setTwoFactorCode}
							twoFactorDisablePassword={twoFactorDisablePassword}
							setTwoFactorDisablePassword={setTwoFactorDisablePassword}
							twoFactorDisableCode={twoFactorDisableCode}
							setTwoFactorDisableCode={setTwoFactorDisableCode}
							twoFactorLoading={twoFactorLoading}
							onStart2FA={onStart2FA}
							onVerify2FA={onVerify2FA}
							onDisable2FA={onDisable2FA}
						/>
					)}
				</div>
			</main>
		</div>
	)
}

function PageTitle({ children, extra }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
			<h1 className="text-[1.35rem] sm:text-[1.65rem] font-bold text-[#0B2540] leading-tight">{children}</h1>
			{extra ? <div className="shrink-0 self-start sm:self-auto">{extra}</div> : null}
		</div>
	)
}

function ScrollTable({ children, minClass = 'min-w-[720px]' }) {
	return (
		<div className="admin-h-scroll overflow-x-auto -mx-1 px-1">
			<div className={minClass}>{children}</div>
		</div>
	)
}

function ChipRow({ children }) {
	return (
		<div className="admin-h-scroll overflow-x-auto flex gap-2 mb-4 pb-0.5 -mx-1 px-1">
			{children}
		</div>
	)
}

function Delta({ value }) {
	if (value == null) return null
	return <p className={`text-xs font-semibold mt-1 ${value < 0 ? 'text-red-500' : 'text-[#1B8F3E]'}`}>{value > 0 ? '+' : ''}{value}%</p>
}

function Overview({ label, stats, rangeLabel, newThisWeek, revenueTotal, weekChange, weekDays, slices }) {
	const cards = [
		{ name: label('total_cases'), value: Number(stats?.totalRequests || 0).toLocaleString('sv-SE'), change: weekChange.cases },
		{ name: label('new_cases'), value: Number(newThisWeek || 0).toLocaleString('sv-SE'), change: weekChange.cases },
		{ name: label('booked_jobs'), value: Number(stats?.totalBookings || 0).toLocaleString('sv-SE'), change: weekChange.booked },
		{ name: label('revenue_vat'), value: formatPrice(revenueTotal || 0), change: weekChange.revenue },
	]
	const max = Math.max(8, ...weekDays.map((item) => item.total))
	const yMax = Math.ceil(max / 4) * 4
	const width = 560
	const height = 180
	const points = weekDays.map((item, index) => {
		const x = weekDays.length === 1 ? 0 : (index / (weekDays.length - 1)) * width
		const y = height - (item.total / yMax) * height
		return { x, y }
	})
	const line = points.map((point) => `${point.x},${point.y}`).join(' ')
	const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0]
	let angle = 0
	const painted = slices.filter((slice) => slice.total > 0)
	const gradient = (painted.length ? painted : slices).map((slice) => {
		const start = angle
		const sweep = painted.length ? (slice.total / painted.reduce((sum, item) => sum + item.total, 0)) * 360 : 72
		angle += sweep
		return `${slice.tone} ${start}deg ${angle}deg`
	}).join(', ')

	return (
		<div>
			<PageTitle extra={<span className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#374151] border border-[#E5E7EB] rounded-xl px-3 sm:px-4 min-h-[36px] sm:min-h-[40px] bg-white whitespace-nowrap">{rangeLabel}<ChevronDown className="w-4 h-4 text-[#9CA3AF]" /></span>}>
				{label('overview')}
			</PageTitle>
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
				{cards.map((card) => (
					<div key={card.name} className="rounded-2xl border border-[#E6E8EC] bg-white px-3.5 sm:px-5 py-3.5 sm:py-4 min-w-0">
						<p className="text-xs sm:text-sm text-[#6B7280] leading-snug">{card.name}</p>
						<p className="text-[1.35rem] sm:text-[1.7rem] font-bold text-[#1B8F3E] mt-2 leading-none break-words">{card.value}</p>
						<p className={`text-[11px] sm:text-xs font-semibold mt-2 leading-snug ${card.change < 0 ? 'text-red-500' : 'text-[#1B8F3E]'}`}>
							{card.change > 0 ? '+' : ''}{card.change}% <span className="hidden sm:inline">{label('from_last_week')}</span>
						</p>
					</div>
				))}
			</div>
			<div className="grid lg:grid-cols-[1.45fr_0.85fr] gap-4">
				<div className="rounded-2xl border border-[#E6E8EC] bg-white p-4 sm:p-5 min-w-0">
					<div className="flex items-center justify-between gap-2 mb-4">
						<p className="text-sm font-bold text-[#0B2540]">{label('cases_over_time')}</p>
						<span className="inline-flex items-center gap-1 text-xs text-[#374151] border border-[#E5E7EB] rounded-lg px-2.5 py-1 shrink-0 whitespace-nowrap">{label('this_week')}<ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" /></span>
					</div>
					<div className="flex gap-2 sm:gap-3">
						<div className="flex flex-col justify-between text-[10px] sm:text-[11px] text-[#9CA3AF] h-36 sm:h-44 pb-5 sm:pb-6 shrink-0">
							{yTicks.map((tick) => <span key={tick}>{tick}</span>)}
						</div>
						<div className="flex-1 min-w-0">
							<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 sm:h-44" preserveAspectRatio="none">
								{yTicks.map((_, index) => (
									<line key={index} x1="0" x2={width} y1={(height / 4) * index} y2={(height / 4) * index} stroke="#F3F4F6" />
								))}
								<polyline fill="none" stroke="#1B8F3E" strokeWidth="3" points={line} strokeLinejoin="round" strokeLinecap="round" />
							</svg>
							<div className="flex justify-between text-[9px] sm:text-[11px] text-[#9CA3AF] mt-1 gap-0.5">
								{weekDays.map((item) => <span key={item.key} className="truncate text-center flex-1">{item.label}</span>)}
							</div>
						</div>
					</div>
				</div>
				<div className="rounded-2xl border border-[#E6E8EC] bg-white p-4 sm:p-5 min-w-0">
					<p className="text-sm font-bold text-[#0B2540] mb-4">{label('cases_by_status')}</p>
					<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
						<div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full shrink-0 relative" style={{ background: `conic-gradient(${gradient || '#E8F6EC 0deg 360deg'})` }}>
							<div className="absolute inset-[18px] sm:inset-[22px] rounded-full bg-white" />
						</div>
						<div className="space-y-2 sm:space-y-2.5 text-sm w-full min-w-0">
							{slices.map((slice) => (
								<p key={slice.key} className="flex items-center gap-2 text-[#374151] flex-wrap">
									<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: slice.tone }} />
									<span>{label(slice.key)}</span>
									<span className="text-[#6B7280]">{slice.total} ({slice.pct}%)</span>
								</p>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function SearchBox({ value, onChange, placeholder }) {
	return (
		<input
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			className="h-10 min-w-[180px] rounded-xl border border-[#E5E7EB] px-3 text-sm outline-none"
		/>
	)
}

function FilterChip({ children }) {
	return <span className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[#E5E7EB] text-sm text-[#374151] whitespace-nowrap shrink-0">{children}<ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0" /></span>
}

function Pager({ pagination, onPage }) {
	const pages = Math.max(1, Math.ceil((pagination?.total || 0) / (pagination?.limit || 20)))
	if (pages <= 1) return null
	return (
		<div className="flex items-center justify-end gap-2 mt-4 text-sm">
			<button type="button" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} className="px-3 h-9 rounded-lg border border-[#E5E7EB] disabled:opacity-40">‹</button>
			<span className="text-[#6B7280]">{pagination.page} / {pages}</span>
			<button type="button" disabled={pagination.page >= pages} onClick={() => onPage(pagination.page + 1)} className="px-3 h-9 rounded-lg border border-[#E5E7EB] disabled:opacity-40">›</button>
		</div>
	)
}

function caseWhen(value, locale) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '—'
	const day = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
	const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
	return `${day}, ${time}`
}

function caseStatusClass(status) {
	if (status === 'NEW') return 'bg-white text-[#1B8F3E] border border-[#1B8F3E]'
	if (status === 'IN_BIDDING' || status === 'BIDDING_CLOSED') return 'bg-[#EEF2FF] text-[#3B5BDB]'
	if (status === 'BOOKED') return 'bg-[#E7F6EC] text-[#1B8F3E]'
	if (status === 'COMPLETED') return 'bg-[#F3F4F6] text-[#6B7280]'
	if (status === 'CANCELLED' || status === 'EXPIRED') return 'bg-[#FDECEC] text-[#D64545]'
	return 'bg-[#FFF6E8] text-[#C4841D]'
}

function CasesTable({ label, rows, loading, searchQuery, onSearch, statusFilter, onStatus, stats, pagination, onPage, onView, caseNo, locale }) {
	const filters = [
		['all', 'all', stats?.totalRequests],
		['NEW', 'new', statusFilter === 'NEW' ? pagination?.total : null],
		['IN_BIDDING', 'quotes', statusFilter === 'IN_BIDDING' ? pagination?.total : null],
		['BOOKED', 'booked', statusFilter === 'BOOKED' ? pagination?.total : null],
		['ONGOING', 'ongoing', statusFilter === 'ONGOING' ? pagination?.total : null],
		['COMPLETED', 'done', statusFilter === 'COMPLETED' ? pagination?.total : null],
	]
	return (
		<div className="min-w-0">
			<PageTitle>{label('all_cases')}</PageTitle>
			<ChipRow>
				{filters.map(([value, key, count]) => (
					<button
						key={value}
						type="button"
						onClick={() => onStatus(value)}
						className={`h-9 px-3.5 sm:px-4 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 ${statusFilter === value ? 'bg-brand-btn text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
					>
						{label(key)}{count != null ? ` ${Number(count).toLocaleString('sv-SE')}` : ''}
					</button>
				))}
			</ChipRow>
			<div className="flex flex-col sm:flex-wrap sm:flex-row sm:items-center gap-2 mb-5">
				<div className="flex items-center gap-2 h-10 w-full sm:min-w-[240px] sm:flex-1 sm:max-w-sm rounded-xl border border-[#E5E7EB] px-3">
					<span className="text-[#9CA3AF] text-sm">⌕</span>
					<input
						value={searchQuery}
						onChange={(event) => onSearch(event.target.value)}
						placeholder={label('search_cases')}
						className="flex-1 min-w-0 text-sm outline-none bg-transparent"
					/>
				</div>
				<div className="admin-h-scroll overflow-x-auto flex gap-2 -mx-1 px-1">
					<FilterChip>{label('all_workshops')}</FilterChip>
					<FilterChip>{label('all_dates')}</FilterChip>
					<button type="button" className="h-10 px-4 rounded-xl border border-[#1B8F3E] text-[#1B8F3E] text-sm font-semibold inline-flex items-center gap-2 shrink-0 whitespace-nowrap">
						<Download className="w-4 h-4" />
						{label('export')}
					</button>
				</div>
			</div>
			<ScrollTable minClass="min-w-[860px]">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
							{[label('case'), label('customer'), label('vehicle'), label('status'), label('created_on'), label('workshop'), label('action')].map((head) => <th key={head} className="font-medium py-3 pr-3 whitespace-nowrap">{head}</th>)}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={`sk-${i}`} className="border-b border-[#F3F4F6]">
									{Array.from({ length: 7 }).map((_, j) => (
										<td key={j} className="py-3.5 pr-3">
											<Skeleton className={`h-4 ${j === 0 ? 'w-20' : 'w-24'}`} />
										</td>
									))}
								</tr>
							))
						) : rows.length === 0 ? (
							<tr><td colSpan={7} className="py-10 text-center text-[#9CA3AF]">{label('empty')}</td></tr>
						) : rows.map((row) => {
							const vehicle = row.vehicle || row.vehicleId
							const car = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ')
							const plate = vehicle?.registrationNumber || vehicle?.licensePlate || ''
							const note = (row.description || '').split('\n')[0]
							return (
								<tr key={row.id || row._id} className="border-b border-[#F3F4F6]">
									<td className="py-3.5 pr-3">
										<p className="font-semibold text-[#111827]">{caseNo(row.id || row._id)}</p>
										{note && <p className="text-xs text-[#9CA3AF] truncate max-w-[140px]">{note}</p>}
									</td>
									<td className="py-3.5 pr-3 text-[#111827]">{row.customer?.name || '—'}</td>
									<td className="py-3.5 pr-3">
										<p className="text-[#111827]">{car || '—'}</p>
										{plate && <p className="text-xs text-[#9CA3AF]">{plate}</p>}
									</td>
									<td className="py-3.5 pr-3">
										<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${caseStatusClass(row.status)}`}>{label(statusKey(row.status))}</span>
									</td>
									<td className="py-3.5 pr-3 text-[#6B7280] whitespace-nowrap">{caseWhen(row.createdAt, locale)}</td>
									<td className="py-3.5 pr-3 text-[#6B7280]">—</td>
									<td className="py-3.5"><button type="button" onClick={() => onView(row)} className="text-[#1B8F3E] font-semibold">{label('view')}</button></td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</ScrollTable>
			<NumberPager pagination={pagination} onPage={onPage} />
		</div>
	)
}

function NumberPager({ pagination, onPage }) {
	const pages = Math.max(1, Math.ceil((pagination?.total || 0) / (pagination?.limit || 20)))
	if (pages <= 1) return null
	const current = pagination.page || 1
	const items = []
	const push = (value) => items.push(value)
	push(1)
	for (let page = Math.max(2, current - 1); page <= Math.min(pages - 1, current + 1); page += 1) push(page)
	if (pages > 1) push(pages)
	const unique = [...new Set(items)].sort((a, b) => a - b)
	const sequence = []
	unique.forEach((page, index) => {
		if (index > 0 && page - unique[index - 1] > 1) sequence.push('…')
		sequence.push(page)
	})
	return (
		<div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-6 text-sm px-1">
			{sequence.map((item, index) => item === '…' ? (
				<span key={`gap-${index}`} className="text-[#9CA3AF] px-1">…</span>
			) : (
				<button
					key={item}
					type="button"
					onClick={() => onPage(item)}
					className={`w-8 h-8 rounded-full font-semibold ${item === current ? 'bg-brand-btn text-white' : 'text-[#6B7280]'}`}
				>
					{item}
				</button>
			))}
			{current < pages && (
				<button type="button" onClick={() => onPage(current + 1)} className="w-8 h-8 text-[#6B7280]" aria-label="Next">›</button>
			)}
		</div>
	)
}

function statusKey(status) {
	if (status === 'NEW') return 'new'
	if (status === 'IN_BIDDING' || status === 'BIDDING_CLOSED') return 'quotes'
	if (status === 'BOOKED') return 'booked'
	if (status === 'COMPLETED') return 'done'
	if (status === 'CANCELLED' || status === 'EXPIRED') return 'closed'
	return 'waiting'
}

function workshopStatusView(workshop) {
	if (workshop.verificationStatus === 'REJECTED') return { key: 'status_rejected', className: 'bg-[#FDECEC] text-[#E24B4B]' }
	if (!workshop.isVerified || workshop.verificationStatus === 'PENDING') return { key: 'status_awaiting', className: 'bg-[#FFF1E6] text-[#E08A2C]' }
	if (workshop.isActive === false) return { key: 'status_paused', className: 'bg-[#F6F0E6] text-[#A6844A]' }
	return { key: 'status_active', className: 'bg-[#E7F6EC] text-[#3DAA62]' }
}

function WorkshopsTable({ label, rows, loading, searchQuery, onSearch, dateLabel, onView, pagination, onPage }) {
	return (
		<div className="min-w-0">
			<PageTitle extra={<span className="inline-flex items-center h-10 px-4 rounded-xl bg-brand-btn text-white text-sm font-semibold whitespace-nowrap">+ {label('add_workshop')}</span>}>
				{label('workshops')}
			</PageTitle>
			<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-5">
				<div className="flex items-center h-10 w-full sm:min-w-[220px] sm:flex-1 sm:max-w-sm rounded-xl border border-[#E5E7EB] px-3">
					<input
						value={searchQuery}
						onChange={(event) => onSearch(event.target.value)}
						placeholder={label('search_workshop')}
						className="flex-1 min-w-0 text-sm outline-none bg-transparent"
					/>
				</div>
				<div className="admin-h-scroll overflow-x-auto flex gap-2 -mx-1 px-1">
					<FilterChip>{label('all_status')}</FilterChip>
					<FilterChip>{label('all_places')}</FilterChip>
				</div>
			</div>
			<ScrollTable minClass="min-w-[720px]">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
							{[label('workshop'), label('location'), label('status'), label('joined'), label('rating'), label('action')].map((head) => <th key={head} className="font-medium py-3 pr-3 whitespace-nowrap">{head}</th>)}
						</tr>
					</thead>
					<tbody>
						{!loading && rows.length === 0 ? (
							<tr><td colSpan={6} className="py-10 text-center text-[#9CA3AF]">{label('empty')}</td></tr>
						) : rows.map((row) => {
							const status = workshopStatusView(row)
							const rating = Number(row.rating || 0)
							return (
								<tr key={row.id || row._id} className="border-b border-[#F3F4F6]">
									<td className="py-3.5 pr-3 font-semibold text-[#111827]">{row.companyName || '—'}</td>
									<td className="py-3.5 pr-3 text-[#6B7280]">{row.city || '—'}</td>
									<td className="py-3.5 pr-3">
										<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>{label(status.key)}</span>
									</td>
									<td className="py-3.5 pr-3 text-[#6B7280] whitespace-nowrap">{dateLabel(row.createdAt)}</td>
									<td className="py-3.5 pr-3">
										{rating > 0 ? (
											<span className="inline-flex items-center gap-1 text-[#111827]">
												<Star className="w-3.5 h-3.5 text-[#F5B400] fill-[#F5B400]" />
												{rating.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
											</span>
										) : '—'}
									</td>
									<td className="py-3.5"><button type="button" onClick={() => onView(row)} className="text-[#1B8F3E] font-semibold">{label('view')}</button></td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</ScrollTable>
			<NumberPager pagination={pagination} onPage={onPage} />
		</div>
	)
}

function CustomersTable({ label, rows, loading, searchQuery, onSearch, dateLabel, pagination, onPage }) {
	return (
		<div className="min-w-0">
			<PageTitle>{label('customers')}</PageTitle>
			<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 mb-5">
				<div className="flex items-center h-10 w-full sm:min-w-[260px] sm:flex-1 sm:max-w-md rounded-xl border border-[#E5E7EB] px-3">
					<input
						value={searchQuery}
						onChange={(event) => onSearch(event.target.value)}
						placeholder={label('search_customer')}
						className="flex-1 min-w-0 text-sm outline-none bg-transparent"
					/>
				</div>
				<div className="self-start">
					<FilterChip>{label('all_customers')}</FilterChip>
				</div>
			</div>
			<ScrollTable minClass="min-w-[720px]">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
							{[label('customer'), label('email'), label('phone'), label('registered'), label('requests'), label('action')].map((head) => <th key={head} className="font-medium py-3 pr-4 whitespace-nowrap">{head}</th>)}
						</tr>
					</thead>
					<tbody>
						{!loading && rows.length === 0 ? (
							<tr><td colSpan={6} className="py-10 text-center text-[#9CA3AF]">{label('empty')}</td></tr>
						) : rows.map((row) => (
							<tr key={row.id || row._id} className="border-b border-[#F3F4F6]">
								<td className="py-4 pr-4 font-medium text-[#111827]">{row.name || '—'}</td>
								<td className="py-4 pr-4 text-[#6B7280]">{row.email || '—'}</td>
								<td className="py-4 pr-4 text-[#6B7280] whitespace-nowrap">{formatSwedishPhone(row.phone) || '—'}</td>
								<td className="py-4 pr-4 text-[#6B7280] whitespace-nowrap">{dateLabel(row.createdAt)}</td>
								<td className="py-4 pr-4 text-[#111827]">{row._count?.requests || 0}</td>
								<td className="py-4"><span className="text-[#1B8F3E] font-semibold">{label('view')}</span></td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollTable>
			<NumberPager pagination={pagination} onPage={onPage} />
		</div>
	)
}

function SupportView({ label }) {
	const tabs = ['all', 'new', 'ongoing', 'waiting', 'closed']
	const [statusTab, setStatusTab] = useState('all')
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(true)
	const [selectedId, setSelectedId] = useState(null)
	const [ticket, setTicket] = useState(null)
	const [reply, setReply] = useState('')
	const [sending, setSending] = useState(false)

	const loadRows = async () => {
		setLoading(true)
		try {
			const res = await supportAPI.adminList({ status: statusTab === 'all' ? undefined : statusTab.toUpperCase() })
			setRows(Array.isArray(res.data) ? res.data : [])
		} catch {
			setRows([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadRows()
	}, [statusTab])

	useEffect(() => {
		if (!selectedId) {
			setTicket(null)
			return
		}
		let stop = false
		supportAPI.adminGet(selectedId)
			.then((res) => { if (!stop) setTicket(res.data) })
			.catch(() => { if (!stop) setTicket(null) })
		return () => { stop = true }
	}, [selectedId])

	const sendReply = async () => {
		if (!selectedId || !reply.trim()) return
		setSending(true)
		try {
			const res = await supportAPI.sendMessage(selectedId, { message: reply.trim() })
			setTicket(res.data)
			setReply('')
			await loadRows()
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to send')
		} finally {
			setSending(false)
		}
	}

	const setStatus = async (status) => {
		if (!selectedId) return
		try {
			const res = await supportAPI.adminStatus(selectedId, status)
			setTicket(res.data)
			await loadRows()
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to update')
		}
	}

	return (
		<div className="min-w-0">
			<PageTitle>{label('support')}</PageTitle>
			<div className="admin-h-scroll overflow-x-auto flex gap-5 sm:gap-6 border-b border-[#EEF0F4] mb-4 -mx-1 px-1">
				{tabs.map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => { setStatusTab(key); setSelectedId(null) }}
						className={`pb-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap shrink-0 ${statusTab === key ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}
					>
						{label(key)}
					</button>
				))}
			</div>

			{selectedId && ticket ? (
				<div className="grid lg:grid-cols-[1fr_340px] gap-4">
					<div className="rounded-2xl border border-[#E6E8EC] overflow-hidden flex flex-col min-h-[320px] sm:min-h-[420px]">
						<div className="px-3 sm:px-4 py-3 border-b border-[#EEF0F4] flex items-center justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-semibold text-[#0B2540] truncate">{ticket.subject}</p>
								<p className="text-xs text-[#9CA3AF] truncate">{ticket.customerId?.name || ticket.customerId?.email || '—'}</p>
							</div>
							<button type="button" onClick={() => setSelectedId(null)} className="text-sm font-semibold text-[#1B8F3E] shrink-0">{label('back') || 'Back'}</button>
						</div>
						<div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-[#FAFBFC]">
							{(ticket.messages || []).map((msg) => {
								const admin = msg.senderRole === 'ADMIN'
								return (
									<div key={msg._id || `${msg.createdAt}-${msg.body}`} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
										<div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm break-words ${admin ? 'bg-brand-btn text-white' : 'bg-white border border-gray-100 text-[#0B2540]'}`}>
											{msg.body}
										</div>
									</div>
								)
							})}
						</div>
						<div className="p-3 border-t border-[#EEF0F4] flex flex-col sm:flex-row gap-2">
							<input
								value={reply}
								onChange={(e) => setReply(e.target.value)}
								placeholder="Write a reply..."
								className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-[#E5E7EB] text-sm"
							/>
							<button type="button" disabled={sending || !reply.trim()} onClick={sendReply} className="h-11 px-4 rounded-xl bg-brand-btn text-white text-sm font-semibold disabled:opacity-50 shrink-0">
								Send
							</button>
						</div>
					</div>
					<div className="rounded-2xl border border-[#E6E8EC] p-4 space-y-3 h-fit">
						<p className="text-sm font-semibold text-[#0B2540]">{label('status')}</p>
						<div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
							{['NEW', 'ONGOING', 'WAITING', 'CLOSED'].map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => setStatus(status)}
									className={`w-full h-10 rounded-xl border text-sm font-semibold ${ticket.status === status ? 'border-[#1B8F3E] bg-[#F2F9F4] text-[#1B8F3E]' : 'border-[#E5E7EB] text-[#374151]'}`}
								>
									{status}
								</button>
							))}
						</div>
					</div>
				</div>
			) : (
				<ScrollTable minClass="min-w-[720px]">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
								{[label('ticket'), label('customer'), label('category'), label('status'), label('created'), label('action')].map((head) => <th key={head} className="font-medium py-3 pr-3 whitespace-nowrap">{head}</th>)}
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={`sk-sup-${i}`} className="border-b border-[#F3F4F6]">
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j} className="py-4 pr-4">
												<Skeleton className="h-4 w-24" />
											</td>
										))}
									</tr>
								))
							) : rows.length === 0 ? (
								<tr><td colSpan={6} className="py-10 text-center text-[#9CA3AF]">{label('support_empty')}</td></tr>
							) : rows.map((row) => (
								<tr key={row.id} className="border-b border-[#F3F4F6]">
									<td className="py-4 pr-4 font-medium text-[#111827]">{row.subject}</td>
									<td className="py-4 pr-4 text-[#6B7280]">{row.customer?.name || row.customer?.email || '—'}</td>
									<td className="py-4 pr-4 text-[#6B7280]">{row.category || '—'}</td>
									<td className="py-4 pr-4 text-[#6B7280]">{row.status}</td>
									<td className="py-4 pr-4 text-[#6B7280] whitespace-nowrap">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
									<td className="py-4">
										<button type="button" onClick={() => setSelectedId(row.id)} className="text-[#1B8F3E] font-semibold">
											{label('view')}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</ScrollTable>
			)}
		</div>
	)
}

function PaymentsView({ label, bookings, payTab, setPayTab, dateLabel, caseNo, onView }) {
	const now = new Date()
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
	const inMonth = (value, year, month) => {
		const date = new Date(value)
		return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month
	}
	const sum = (rows) => rows.reduce((total, row) => total + (Number(row.totalAmount) || 0), 0)
	const thisRows = bookings.filter((row) => inMonth(row.createdAt, now.getFullYear(), now.getMonth()))
	const prevRows = bookings.filter((row) => inMonth(row.createdAt, prev.getFullYear(), prev.getMonth()))
	const paidRows = (rows) => rows.filter((row) => row.status === 'DONE')
	const waitRows = (rows) => rows.filter((row) => row.status !== 'DONE' && row.status !== 'CANCELLED')
	const cards = [
		{ name: label('commission_month'), value: sum(thisRows), change: changePercent(sum(thisRows), sum(prevRows)) },
		{ name: label('paid_month'), value: sum(paidRows(thisRows)), change: changePercent(sum(paidRows(thisRows)), sum(paidRows(prevRows))) },
		{ name: label('awaiting_payout'), value: sum(waitRows(thisRows)), change: changePercent(sum(waitRows(thisRows)), sum(waitRows(prevRows))) },
	]
	const payoutRows = payTab === 'transactions' ? bookings : bookings.filter((row) => row.status === 'DONE')
	const tabs = [
		['overview', 'overview'],
		['payouts', 'payout_tab'],
		['transactions', 'transactions'],
	]
	return (
		<div className="min-w-0">
			<PageTitle extra={(
				<button type="button" className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap">
					<Download className="w-4 h-4" />
					{label('export')}
				</button>
			)}>
				{label('commissions')}
			</PageTitle>
			<div className="admin-h-scroll overflow-x-auto flex gap-6 sm:gap-8 border-b border-[#EEF0F4] mb-5 -mx-1 px-1">
				{tabs.map(([id, key]) => (
					<button key={id} type="button" onClick={() => setPayTab(id)} className={`pb-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap shrink-0 ${payTab === id ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}>
						{label(key)}
					</button>
				))}
			</div>
			{payTab === 'overview' && (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
					{cards.map((card) => (
						<div key={card.name} className="rounded-2xl border border-[#E6E8EC] px-4 sm:px-5 py-4 min-w-0">
							<p className="text-sm text-[#6B7280]">{card.name}</p>
							<p className="text-[1.25rem] sm:text-[1.45rem] font-bold text-[#0B2540] mt-2 break-words">{formatPrice(card.value || 0)}</p>
							<p className={`text-xs font-semibold mt-2 ${card.change < 0 ? 'text-red-500' : 'text-[#1B8F3E]'}`}>
								{card.change > 0 ? '+' : ''}{card.change}% {label('from_prev_month')}
							</p>
						</div>
					))}
				</div>
			)}
			{payTab === 'overview' && <p className="text-sm font-bold text-[#0B2540] mb-3">{label('latest_payouts')}</p>}
			<ScrollTable minClass={payTab === 'transactions' ? 'min-w-[780px]' : 'min-w-[640px]'}>
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
							{(payTab === 'transactions'
								? [label('case'), label('customer'), label('vehicle'), label('status'), label('amount'), label('action')]
								: [label('date'), label('workshop'), label('amount'), label('status'), label('action')]
							).map((head) => <th key={head} className="font-medium py-3 pr-3 whitespace-nowrap">{head}</th>)}
						</tr>
					</thead>
					<tbody>
						{payoutRows.length === 0 ? (
							<tr><td colSpan={6} className="py-10 text-center text-[#9CA3AF]">{label('empty')}</td></tr>
						) : payoutRows.map((row) => {
							const paid = row.status === 'DONE'
							const vehicle = row.requestId?.vehicleId
							const car = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ')
							return payTab === 'transactions' ? (
								<tr key={row.id || row._id} className="border-b border-[#F3F4F6]">
									<td className="py-3.5 pr-3 font-semibold text-[#111827]">{caseNo(row.requestId?._id || row.requestId || row.id)}</td>
									<td className="py-3.5 pr-3">{row.customer?.name || '—'}</td>
									<td className="py-3.5 pr-3 text-[#6B7280]">{car || '—'}</td>
									<td className="py-3.5 pr-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${paid ? 'bg-[#E7F6EC] text-[#3DAA62]' : 'bg-[#FFF6E8] text-[#C4841D]'}`}>{label(paid ? 'paid' : 'waiting')}</span></td>
									<td className="py-3.5 pr-3 whitespace-nowrap">{formatPrice(row.totalAmount || 0)}</td>
									<td className="py-3.5"><button type="button" onClick={() => onView(row)} className="text-[#1B8F3E] font-semibold">{label('receipt')}</button></td>
								</tr>
							) : (
								<tr key={row.id || row._id} className="border-b border-[#F3F4F6]">
									<td className="py-3.5 pr-3 text-[#6B7280] whitespace-nowrap">{dateLabel(row.createdAt)}</td>
									<td className="py-3.5 pr-3 font-semibold text-[#111827]">{row.workshop?.companyName || '—'}</td>
									<td className="py-3.5 pr-3 whitespace-nowrap">{formatPrice(row.totalAmount || 0)}</td>
									<td className="py-3.5 pr-3"><span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E7F6EC] text-[#3DAA62]">{label('paid')}</span></td>
									<td className="py-3.5"><button type="button" onClick={() => onView(row)} className="text-[#1B8F3E] font-semibold">{label('receipt')}</button></td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</ScrollTable>
		</div>
	)
}

function StatisticsView({ label, period, setPeriod, requests, bookings, locale }) {
	const now = new Date()
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const weekStart = new Date(startOfDay)
	weekStart.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7))
	const ranges = {
		today: [startOfDay, new Date(startOfDay.getTime() + 86400000)],
		week: [weekStart, new Date(weekStart.getTime() + 7 * 86400000)],
		month: [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)],
		quarter: [new Date(now.getFullYear(), now.getMonth() - 2, 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)],
		year: [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear() + 1, 0, 1)],
	}
	const [from, to] = ranges[period] || ranges.month
	const previousFrom = new Date(from.getTime() - (to - from))
	const inSpan = (value, start, end) => {
		const date = new Date(value)
		return !Number.isNaN(date.getTime()) && date >= start && date < end
	}
	const currentRequests = requests.filter((row) => inSpan(row.createdAt, from, to))
	const previousRequests = requests.filter((row) => inSpan(row.createdAt, previousFrom, from))
	const currentBookings = bookings.filter((row) => inSpan(row.createdAt, from, to))
	const previousBookings = bookings.filter((row) => inSpan(row.createdAt, previousFrom, from))
	const money = (rows) => rows.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0)
	const cards = [
		[label('total_cases'), currentRequests.length, changePercent(currentRequests.length, previousRequests.length)],
		[label('new_cases'), currentRequests.filter((row) => row.status === 'NEW').length, changePercent(currentRequests.filter((row) => row.status === 'NEW').length, previousRequests.filter((row) => row.status === 'NEW').length)],
		[label('booked_jobs'), currentBookings.length, changePercent(currentBookings.length, previousBookings.length)],
		[label('revenue_vat'), formatPrice(money(currentBookings)), changePercent(money(currentBookings), money(previousBookings))],
	]
	const dayCount = Math.max(1, Math.round((to - from) / 86400000))
	const bars = Array.from({ length: Math.min(dayCount, 31) }, (_, index) => {
		const date = new Date(from)
		date.setDate(from.getDate() + index)
		return {
			key: date.toDateString(),
			label: String(date.getDate()),
			show: period !== 'month' || [1, 5, 10, 15, 20, 25, 30].includes(date.getDate()),
			total: currentRequests.filter((row) => new Date(row.createdAt).toDateString() === date.toDateString()).length,
		}
	})
	const max = Math.max(1, ...bars.map((item) => item.total))
	const yMax = Math.max(4, Math.ceil(max / 4) * 4)
	const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0]
	const categories = {}
	currentRequests.forEach((row) => {
		const name = (row.description || '').split(/[\s,–—.-]/)[0]?.trim()
		const key = name ? name.charAt(0).toUpperCase() + name.slice(1) : label('other')
		categories[key] = (categories[key] || 0) + 1
	})
	const ranked = Object.entries(categories).sort((a, b) => b[1] - a[1])
	const top = ranked.slice(0, 4)
	const rest = ranked.slice(4).reduce((sum, item) => sum + item[1], 0)
	if (rest) top.push([label('other'), rest])
	const categoryTotal = top.reduce((sum, item) => sum + item[1], 0) || 1
	const rangeEnd = new Date(to.getTime() - 86400000)
	const rangeLabel = from.toDateString() === rangeEnd.toDateString()
		? rangeEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
		: `${from.getDate()} – ${rangeEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
	const periods = [
		['today', 'today'],
		['week', 'this_week'],
		['month', 'this_month'],
		['quarter', 'three_months'],
		['year', 'year_short'],
	]
	return (
		<div className="min-w-0">
			<div className="flex flex-col gap-3 mb-5">
				<h1 className="text-[1.35rem] sm:text-[1.65rem] font-bold text-[#0B2540]">{label('statistics')}</h1>
				<div className="admin-h-scroll overflow-x-auto flex items-center gap-2 -mx-1 px-1 pb-0.5">
					{periods.map(([id, key]) => (
						<button key={id} type="button" onClick={() => setPeriod(id)} className={`h-9 px-3.5 sm:px-4 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 ${period === id ? 'bg-brand-btn text-white' : 'bg-white border border-[#E5E7EB] text-[#374151]'}`}>
							{label(key)}
						</button>
					))}
					<span className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-[#E5E7EB] text-sm text-[#374151] whitespace-nowrap shrink-0">
						{rangeLabel}
						<ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
					</span>
				</div>
			</div>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
				{cards.map(([name, value, change]) => (
					<div key={name} className="rounded-2xl border border-[#E8EAEE] px-3.5 sm:px-5 py-3.5 sm:py-4 min-h-[96px] sm:min-h-[108px] min-w-0">
						<p className="text-xs sm:text-sm text-[#6B7280] leading-snug">{name}</p>
						<p className="text-[1.35rem] sm:text-[1.7rem] font-bold text-[#1B8F3E] mt-2 sm:mt-3 leading-none break-words">{typeof value === 'number' ? value.toLocaleString('sv-SE') : value}</p>
						<p className={`text-xs sm:text-sm font-semibold mt-2 ${change < 0 ? 'text-red-500' : 'text-[#1B8F3E]'}`}>
							{change > 0 ? '+' : ''}{change}%
						</p>
					</div>
				))}
			</div>
			<div className="grid lg:grid-cols-2 gap-4">
				<div className="rounded-2xl border border-[#E8EAEE] p-4 sm:p-5 min-w-0">
					<p className="text-sm font-bold text-[#0B2540] mb-4">{label('cases_over_time')}</p>
					<div className="flex gap-2 sm:gap-3">
						<div className="flex flex-col justify-between text-[10px] sm:text-[11px] text-[#9CA3AF] h-40 sm:h-48 pb-5 shrink-0">
							{yTicks.map((tick, index) => <span key={`${tick}-${index}`}>{tick}</span>)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-end h-40 sm:h-48 border-b border-[#F3F4F6]">
								{bars.map((bar) => (
									<div key={bar.key} className="flex-1 flex items-end justify-center h-full min-w-0">
										<div
											className="w-[5px] sm:w-[7px] max-w-full rounded-t-[3px] bg-[#1B8F3E]"
											style={{ height: bar.total ? `${Math.max(8, (bar.total / yMax) * 100)}%` : '0%' }}
										/>
									</div>
								))}
							</div>
							<div className="flex mt-1.5 text-[9px] sm:text-[10px] text-[#9CA3AF]">
								{bars.map((bar) => (
									<span key={`${bar.key}-label`} className="flex-1 text-center">{bar.show ? bar.label : ''}</span>
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="rounded-2xl border border-[#E8EAEE] p-4 sm:p-5 min-w-0">
					<p className="text-sm font-bold text-[#0B2540] mb-5">{label('by_category')}</p>
					{top.length === 0 ? <p className="text-sm text-[#9CA3AF]">{label('empty')}</p> : top.map(([name, count]) => {
						const pct = Math.round((count / categoryTotal) * 100)
						return (
							<div key={name} className="flex items-center gap-2 sm:gap-3 mb-4 last:mb-0">
								<span className="w-20 sm:w-28 shrink-0 text-sm text-[#111827] truncate">{name}</span>
								<div className="flex-1 h-2.5 rounded-full bg-[#F3F4F6] min-w-0">
									<div className="h-2.5 rounded-full bg-[#1B8F3E]" style={{ width: `${Math.max(pct, 4)}%` }} />
								</div>
								<span className="w-9 sm:w-10 text-right text-sm text-[#6B7280] shrink-0">{pct}%</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

function ContentView({ label, tab, setTab, onOpen }) {
	const tabs = ['pages', 'faq', 'blog', 'terms']
	const pages = tab === 'blog' ? [] : CMS_PAGES.filter((page) => (tab === 'pages' ? page.key === 'pages' : page.key === tab))
	return (
		<div className="min-w-0">
			<PageTitle extra={<span className="inline-flex items-center h-10 px-4 rounded-xl bg-brand-btn text-white text-sm font-semibold whitespace-nowrap">+ {label('new_page')}</span>}>
				{label('content')}
			</PageTitle>
			<div className="admin-h-scroll overflow-x-auto flex gap-5 sm:gap-6 border-b border-[#EEF0F4] mb-4 -mx-1 px-1">
				{tabs.map((key) => (
					<button key={key} type="button" onClick={() => setTab(key)} className={`pb-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap shrink-0 ${tab === key ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}>
						{label(key)}
					</button>
				))}
			</div>
			<ScrollTable minClass="min-w-[480px]">
				<table className="w-full text-sm">
					<thead>
						<tr className="text-left text-xs text-[#9CA3AF] border-b border-[#F3F4F6]">
							{[label('page'), label('status'), label('action')].map((head) => <th key={head} className="font-medium py-3 pr-3 whitespace-nowrap">{head}</th>)}
						</tr>
					</thead>
					<tbody>
						{pages.length === 0 ? (
							<tr><td colSpan={3} className="py-10 text-center text-[#9CA3AF]">{label('empty')}</td></tr>
						) : pages.map((page) => (
							<tr key={page.path} className="border-b border-[#F3F4F6]">
								<td className="py-3.5 pr-3 font-semibold text-[#0B2540]">{page.title}</td>
								<td className="py-3.5 pr-3"><Pill tone="green">{label('published')}</Pill></td>
								<td className="py-3.5"><button type="button" onClick={() => onOpen(page.path)} className="text-[#1B8F3E] font-semibold">{label('edit')}</button></td>
							</tr>
						))}
					</tbody>
				</table>
			</ScrollTable>
		</div>
	)
}

function SettingsView({
	label, tab, setTab, prefs, togglePref, emailConfig, onEmailChange, onSaveEmail, emailSaving, onSupport,
	user, commissionRate, onCommissionChange, vatRate, onVatChange, onSaveCommission, commissionSaving,
	onSaveAccount, accountSaving,
	twoFactorEnabled, twoFactorSetup, twoFactorCode, setTwoFactorCode,
	twoFactorDisablePassword, setTwoFactorDisablePassword, twoFactorDisableCode, setTwoFactorDisableCode,
	twoFactorLoading, onStart2FA, onVerify2FA, onDisable2FA,
}) {
	const { t } = useTranslation()
	const tabs = ['account', 'commission', 'general', 'notices', 'integrations', 'roles']
	const [form, setForm] = useState({
		name: user?.name || '',
		email: user?.email || '',
		phone: user?.phone || '',
		currentPassword: '',
		newPassword: '',
	})
	useEffect(() => {
		setForm((current) => ({
			...current,
			name: user?.name || '',
			email: user?.email || '',
			phone: user?.phone || '',
		}))
	}, [user?.name, user?.email, user?.phone])
	const field = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
	const notices = [
		['registration', 'new_registration'],
		['requests', 'new_request_notice'],
		['workshops', 'new_workshop_notice'],
		['payouts', 'payout_notice'],
		['autoApprove', 'auto_approve'],
	]
	return (
		<div className="grid xl:grid-cols-[1fr_280px] gap-6 min-w-0">
			<div className="min-w-0">
				<PageTitle>{label('settings')}</PageTitle>
				<div className="admin-h-scroll overflow-x-auto flex gap-5 sm:gap-6 border-b border-[#EEF0F4] mb-2 -mx-1 px-1">
					{tabs.map((key) => (
						<button key={key} type="button" onClick={() => setTab(key)} className={`pb-3 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 -mb-px ${tab === key ? 'text-[#1B8F3E] border-[#1B8F3E]' : 'text-[#9CA3AF] border-transparent'}`}>
							{label(key)}
						</button>
					))}
				</div>
				{tab === 'account' && (
					<div className="max-w-xl space-y-3 pt-4">
						<label className="block text-xs text-[#9CA3AF]">{label('full_name')}
							<input value={form.name} onChange={field('name')} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
						</label>
						<label className="block text-xs text-[#9CA3AF]">{label('email')}
							<input type="email" value={form.email} onChange={field('email')} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
						</label>
						<label className="block text-xs text-[#9CA3AF]">{label('phone')}
							<input value={form.phone} onChange={field('phone')} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
						</label>
						<label className="block text-xs text-[#9CA3AF]">{label('current_password')}
							<input type="password" value={form.currentPassword} onChange={field('currentPassword')} autoComplete="current-password" className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
						</label>
						<label className="block text-xs text-[#9CA3AF]">{label('new_password')}
							<input type="password" value={form.newPassword} onChange={field('newPassword')} autoComplete="new-password" className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
						</label>
						<p className="text-xs text-[#9CA3AF]">{label('password_hint')}</p>
						<button type="button" disabled={accountSaving} onClick={async () => {
							const saved = await onSaveAccount(form)
							if (saved) setForm((current) => ({ ...current, currentPassword: '', newPassword: '' }))
						}} className="h-10 px-5 rounded-xl bg-brand-btn text-white text-sm font-semibold disabled:opacity-60">
							{label('save')}
						</button>
						<div className="pt-6 mt-2 border-t border-[#F3F4F6]">
							<p className="text-sm font-semibold text-[#0B2540]">{t('admin.settings.twofa_title')}</p>
							<p className="text-xs text-[#9CA3AF] mt-1">{t('admin.settings.twofa_desc')}</p>
							<p className="text-sm text-[#1B8F3E] font-medium mt-3">{twoFactorEnabled ? t('admin.settings.twofa_enabled') : t('admin.settings.twofa_disabled')}</p>
							{!twoFactorEnabled && !twoFactorSetup?.qrCode && (
								<button type="button" onClick={onStart2FA} disabled={twoFactorLoading} className="mt-3 h-10 px-5 rounded-xl border border-[#1B8F3E] text-[#1B8F3E] text-sm font-semibold disabled:opacity-60">
									{t('admin.settings.twofa_enable')}
								</button>
							)}
							{twoFactorSetup?.qrCode && (
								<div className="mt-4 space-y-3">
									<img src={twoFactorSetup.qrCode} alt="" className="w-40 h-40 rounded-xl border border-[#E5E7EB]" />
									<p className="text-xs text-[#6B7280]">{t('admin.settings.twofa_scan_qr')}</p>
									<input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder={t('admin.settings.twofa_enter_code')} className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
									<button type="button" onClick={onVerify2FA} disabled={twoFactorLoading} className="h-10 px-5 rounded-xl bg-brand-btn text-white text-sm font-semibold disabled:opacity-60">
										{t('admin.settings.twofa_enable')}
									</button>
								</div>
							)}
							{twoFactorEnabled && (
								<div className="mt-4 space-y-3">
									<input type="password" value={twoFactorDisablePassword} onChange={(event) => setTwoFactorDisablePassword(event.target.value)} placeholder={t('admin.settings.twofa_disable_password')} className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
									<input value={twoFactorDisableCode} onChange={(event) => setTwoFactorDisableCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder={t('admin.settings.twofa_disable_code')} className="w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
									<button type="button" onClick={onDisable2FA} disabled={twoFactorLoading} className="h-10 px-5 rounded-xl border border-[#E5E7EB] text-[#0B2540] text-sm font-semibold disabled:opacity-60">
										{t('admin.settings.twofa_disable')}
									</button>
								</div>
							)}
						</div>
					</div>
				)}
				{tab === 'commission' && (
					<div className="max-w-xl space-y-4 pt-4">
						<label className="block text-xs text-[#9CA3AF]">{label('commission_rate')}
							<div className="mt-1 flex items-center gap-2">
								<input type="number" min="0" max="100" step="0.1" value={commissionRate} onChange={(event) => onCommissionChange(event.target.value)} className="w-32 h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
								<span className="text-sm font-semibold text-[#0B2540]">%</span>
							</div>
						</label>
						<p className="text-xs text-[#9CA3AF]">{label('commission_help')}</p>
						<label className="block text-xs text-[#9CA3AF]">{label('vat_rate')}
							<div className="mt-1 flex items-center gap-2">
								<input type="number" min="0" max="100" step="0.1" value={vatRate} onChange={(event) => onVatChange(event.target.value)} className="w-32 h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
								<span className="text-sm font-semibold text-[#0B2540]">%</span>
							</div>
						</label>
						<p className="text-xs text-[#9CA3AF]">{label('vat_help')}</p>
						<button type="button" onClick={onSaveCommission} disabled={commissionSaving} className="h-10 px-5 rounded-xl bg-brand-btn text-white text-sm font-semibold disabled:opacity-60">
							{label('save')}
						</button>
					</div>
				)}
				{tab === 'general' && (
					<div className="max-w-xl">
						<SettingRow label={label('platform_name')} value="Fixa2an" />
						<SettingRow label={label('support_email')} value="info@fixa2an.se" />
						<SettingRow label={label('phone')} value="08-000 00 00" />
						<SettingRow label={label('language')} value="Svenska / English" />
					</div>
				)}
				{tab === 'notices' && (
					<div className="max-w-xl">
						{notices.map(([key, name]) => (
							<button key={key} type="button" onClick={() => togglePref(key)} className="w-full flex items-center justify-between py-4 border-b border-[#F3F4F6] text-left">
								<span className="text-sm font-medium text-[#0B2540]">{label(name)}</span>
								<span className={`w-11 h-6 rounded-full p-0.5 ${prefs[key] ? 'bg-[#1B8F3E]' : 'bg-gray-200'}`}>
									<span className={`block w-5 h-5 rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-5' : ''}`} />
								</span>
							</button>
						))}
					</div>
				)}
				{tab === 'integrations' && (
					<div className="max-w-xl space-y-3 pt-4">
						<p className="text-sm font-semibold text-[#0B2540]">{t('admin.settings.email_config')}</p>
						<p className="text-xs text-[#9CA3AF]">{t('admin.settings.email_desc')}</p>
						<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.email_provider')}
							<select
								value={emailConfig?.provider || 'smtp'}
								onChange={(event) => onEmailChange({ ...emailConfig, provider: event.target.value })}
								className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540] bg-white"
							>
								<option value="emailjs">{t('admin.settings.provider_emailjs')}</option>
								<option value="smtp">{t('admin.settings.provider_smtp')}</option>
							</select>
						</label>
						{(emailConfig?.provider || 'smtp') === 'emailjs' ? (
							<>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.emailjs_user_id')}
									<input value={emailConfig?.emailjsUserId || ''} onChange={(event) => onEmailChange({ ...emailConfig, emailjsUserId: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="off" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.emailjs_service_id')}
									<input value={emailConfig?.emailjsServiceId || ''} onChange={(event) => onEmailChange({ ...emailConfig, emailjsServiceId: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="off" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.emailjs_template_id')}
									<input value={emailConfig?.emailjsTemplateId || ''} onChange={(event) => onEmailChange({ ...emailConfig, emailjsTemplateId: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="off" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.emailjs_private_key')}
									<input type="password" value={emailConfig?.emailjsPrivateKey || ''} onChange={(event) => onEmailChange({ ...emailConfig, emailjsPrivateKey: event.target.value })} placeholder={t('admin.settings.password_placeholder')} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="new-password" />
								</label>
							</>
						) : (
							<>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.smtp_host')}
									<input value={emailConfig?.host || ''} onChange={(event) => onEmailChange({ ...emailConfig, host: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.smtp_port')}
									<input type="number" value={emailConfig?.port ?? 587} onChange={(event) => onEmailChange({ ...emailConfig, port: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.smtp_user')}
									<input value={emailConfig?.user || ''} onChange={(event) => onEmailChange({ ...emailConfig, user: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="off" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.smtp_password')}
									<input type="password" value={emailConfig?.password || ''} onChange={(event) => onEmailChange({ ...emailConfig, password: event.target.value })} placeholder={t('admin.settings.password_placeholder')} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" autoComplete="new-password" />
								</label>
								<label className="block text-xs text-[#9CA3AF]">{t('admin.settings.from_address')}
									<input value={emailConfig?.from || ''} onChange={(event) => onEmailChange({ ...emailConfig, from: event.target.value })} className="mt-1 w-full h-11 rounded-xl border border-[#E5E7EB] px-3 text-sm text-[#0B2540]" />
								</label>
							</>
						)}
						<button type="button" onClick={onSaveEmail} disabled={emailSaving} className="h-10 px-5 rounded-xl bg-brand-btn text-white text-sm font-semibold disabled:opacity-60">
							{label('save')}
						</button>
					</div>
				)}
				{tab === 'roles' && <p className="text-sm text-[#6B7280] py-6">{label('roles_body')}</p>}
			</div>
			<div className="rounded-2xl border border-[#E6E8EC] p-5 h-fit text-center">
				<div className="w-16 h-16 mx-auto rounded-full bg-[#E7F6EC] flex items-center justify-center mb-3">
					<LifeBuoy className="w-8 h-8 text-[#1B8F3E]" />
				</div>
				<p className="text-base font-bold text-[#0B2540]">{label('help_title')}</p>
				<p className="text-sm text-[#6B7280] mt-1">{label('help_body')}</p>
				<button type="button" onClick={onSupport} className="mt-4 h-10 px-5 rounded-full bg-brand-btn text-white text-sm font-semibold">{label('help_cta')}</button>
				<p className="text-xs text-[#9CA3AF] mt-3">{label('help_hours')}</p>
			</div>
		</div>
	)
}

function SettingRow({ label: name, value }) {
	return (
		<div className="flex items-center justify-between gap-3 py-4 border-b border-[#F3F4F6]">
			<div>
				<p className="text-xs text-[#9CA3AF]">{name}</p>
				<p className="text-sm font-semibold text-[#0B2540]">{value}</p>
			</div>
		</div>
	)
}
