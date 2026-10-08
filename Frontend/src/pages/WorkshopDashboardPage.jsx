import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { requestsAPI, workshopAPI } from '../services/api'
import { formatVehicleDetailsLine, formatRequestRegistration } from '../components/VehicleRequestCard'

export default function WorkshopDashboardPage() {
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [workshopName, setWorkshopName] = useState('')
	const [latest, setLatest] = useState([])
	const [stats, setStats] = useState({
		monthlyRevenue: 0,
		totalRevenue: 0,
		completedContracts: 0,
		proposalsSent: 0,
		activeOffers: 0,
		totalRequests: 0,
		completedJobs: 0,
		rating: 0,
		reviewCount: 0,
	})

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/workshop/login', { replace: true })
				return
			}
			const role = user.role?.toUpperCase()
			if (role !== 'WORKSHOP') {
				if (role === 'ADMIN') navigate('/admin', { replace: true })
				else navigate('/dashboard', { replace: true })
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return

		const fetchDashboard = async () => {
			try {
				const [statsRes, profileRes, requestsRes] = await Promise.all([
					workshopAPI.getStats(),
					workshopAPI.getProfile(),
					requestsAPI.getAvailable().catch(() => ({ data: [] })),
				])
				const rows = Array.isArray(requestsRes.data) ? requestsRes.data.slice(0, 3) : []
				setLatest(rows)

				if (profileRes.data?.workshop?.companyName) {
					setWorkshopName(profileRes.data.workshop.companyName)
				}

				if (statsRes.data) {
					setStats({
						monthlyRevenue: statsRes.data.monthlyRevenue || 0,
						totalRevenue: statsRes.data.totalRevenue || 0,
						completedContracts: statsRes.data.completedContracts || 0,
						proposalsSent: statsRes.data.proposalsSent || 0,
						activeOffers: statsRes.data.activeOffers || 0,
						totalRequests: statsRes.data.totalRequests || 0,
						completedJobs: statsRes.data.completedJobs || 0,
						rating: statsRes.data.rating || 0,
						reviewCount: statsRes.data.reviewCount || 0,
					})
				}
			} catch (error) {
				console.error('Failed to fetch workshop dashboard:', error)
				toast.error(t('dashboard.fetch_error') || 'Failed to load dashboard')
			} finally {
				setLoading(false)
			}
		}

		fetchDashboard()
	}, [user, t, pathname])

	if (authLoading || loading) {
		return (
			<WorkshopShell>
			<div className="list-page-shell bg-transparent">
				<div className="list-page-content">
					<div className="flex items-start justify-between gap-4 mb-6">
						<div className="min-w-0 flex-1 space-y-2">
							<Skeleton className="h-8 w-56 max-w-full rounded-lg" />
							<Skeleton className="h-4 w-44 max-w-[85%] rounded-md" />
						</div>
						<Skeleton className="h-8 w-24 rounded-full shrink-0" />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
						{[0, 1, 2].map((i) => (
							<div key={i} className="bg-white rounded-2xl border border-[#EEF0F4] px-5 py-4 space-y-3">
								<Skeleton className="h-3 w-20 rounded-md" />
								<Skeleton className="h-9 w-16 rounded-lg" />
								<Skeleton className="h-3 w-24 rounded-md" />
							</div>
						))}
					</div>

					<div className="bg-white rounded-2xl border border-[#EEF0F4] px-6 py-5 sm:px-8">
						<div className="flex items-center justify-between mb-3">
							<Skeleton className="h-5 w-28 rounded-md" />
							<Skeleton className="h-7 w-16 rounded-full" />
						</div>
						{[0, 1, 2].map((i) => (
							<div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 py-4 border-t border-[#F3F4F6]">
								<div className="min-w-0 space-y-2">
									<Skeleton className="h-4 w-32 max-w-full rounded-md" />
									<Skeleton className="h-3 w-24 max-w-[80%] rounded-md" />
								</div>
								<Skeleton className="h-6 w-12 rounded-full justify-self-center" />
								<Skeleton className="h-3 w-20 rounded-md justify-self-end" />
							</div>
						))}
					</div>
				</div>
			</div>
			</WorkshopShell>
		)
	}

	if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return null

	const firstName = (user?.name || workshopName || '').split(' ')[0]
	const rating = Number(stats.rating || 0).toFixed(1)

	return (
		<WorkshopShell>
		<div className="list-page-shell bg-transparent">
			<div className="list-page-content">
				<div className="flex items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-[1.75rem] font-semibold text-[#0B1B3A] leading-tight">
							{t('workshop.panel.welcome', { name: firstName || workshopName })}
						</h1>
						<p className="text-sm text-[#9CA3AF] mt-1">{t('workshop.panel.welcome_sub')}</p>
					</div>
					<span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#374151] border border-[#E5E7EB] bg-white rounded-full px-3 py-1.5">
						{t('workshop.panel.this_week')}
						<ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
					<div className="bg-white rounded-2xl border border-[#EEF0F4] px-5 py-4">
						<p className="text-xs text-[#6B7280]">{t('workshop.panel.new_cases')}</p>
						<p className="text-[2rem] leading-none font-semibold text-[#008037] mt-2">{stats.totalRequests}</p>
						<p className="text-[11px] text-[#008037] mt-2">{t('workshop.panel.this_week')}</p>
					</div>
					<div className="bg-white rounded-2xl border border-[#EEF0F4] px-5 py-4">
						<p className="text-xs text-[#6B7280]">{t('workshop.panel.quotes_sent')}</p>
						<p className="text-[2rem] leading-none font-semibold text-[#008037] mt-2">{stats.proposalsSent}</p>
						<p className="text-[11px] text-[#008037] mt-2">{t('workshop.panel.this_week')}</p>
					</div>
					<div className="bg-white rounded-2xl border border-[#86EFAC] px-5 py-4">
						<p className="text-xs text-[#6B7280]">{t('workshop.panel.booked_jobs')}</p>
						<p className="text-[2rem] leading-none font-semibold text-[#008037] mt-2 inline-flex items-center gap-1">
							{rating}
							<Star className="w-4 h-4 fill-[#008037] text-[#008037]" />
						</p>
						<p className="text-[11px] text-[#6B7280] mt-2">{t('workshop.panel.based_on_reviews', { count: stats.reviewCount || 0 })}</p>
					</div>
				</div>

				<div className="bg-white rounded-2xl border border-[#EEF0F4] px-6 py-5 sm:px-8">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-base font-bold text-[#0B1B3A]">{t('workshop.panel.latest')}</h2>
						<Link to="/workshop/requests" className="text-xs font-semibold text-[#374151] border border-[#E5E7EB] rounded-full px-3 py-1">
							{t('workshop.panel.view_all')}
						</Link>
					</div>
					{latest.length === 0 ? (
						<EmptyState
							compact
							title={t('common.empty.workshop_latest_title')}
							description={t('common.empty.workshop_latest_desc')}
						/>
					) : latest.map((request) => {
						const id = request._id || request.id
						const vehicle = request.vehicleId || request.vehicle
						const hasOffer = (request.offers || []).length > 0
						const title = formatVehicleDetailsLine(vehicle) || formatRequestRegistration(request)
						return (
							<Link key={id} to={`/workshop/requests?case=${id}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 py-4 border-t border-[#F3F4F6]">
								<div className="min-w-0">
									<p className="text-sm font-bold text-[#111827] truncate">{title}</p>
									<p className="text-xs text-[#9CA3AF] line-clamp-1 mt-0.5">{request.description || request.city}</p>
								</div>
								<span className={`justify-self-center text-[11px] font-bold px-2.5 py-1 rounded-full ${hasOffer ? 'bg-[#E0F2FE] text-[#0284C7]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
									{hasOffer ? t('workshop.panel.offer_sent') : t('workshop.panel.new_badge')}
								</span>
								{request.createdAt ? (
									<span className="text-[11px] text-[#9CA3AF] text-right leading-snug">{formatCaseTime(request.createdAt, t)}</span>
								) : <span />}
							</Link>
						)
					})}
				</div>
			</div>
		</div>
		</WorkshopShell>
	)
}

function formatCaseTime(value, t) {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const now = new Date()
	const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diff = Math.round((startToday - start) / 86400000)
	const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	if (diff === 0) return `${t('my_cases.flow.chat_today')} ${time}`
	if (diff === 1) return `${t('my_cases.flow.yesterday')} ${time}`
	return date.toLocaleDateString()
}
