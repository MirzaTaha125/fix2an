import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
	FileText,
	Send,
	FileCheck,
	User,
	TrendingUp,
	Briefcase,
	Star,
	ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Skeleton } from '../components/ui/Skeleton'
import StatCard from '../components/ui/StatCard'
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction'
import { useAuth } from '../context/AuthContext'
import { workshopAPI } from '../services/api'
import { formatPrice } from '../utils/cn'

export default function WorkshopDashboardPage() {
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [workshopName, setWorkshopName] = useState('')
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
				navigate('/auth/signin', { replace: true })
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
				const [statsRes, profileRes] = await Promise.all([
					workshopAPI.getStats(),
					workshopAPI.getProfile(),
				])

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
			<div className="list-page-shell bg-[#F4F7F6]">
				<Navbar />
				<div className="list-page-content max-w-5xl mx-auto">
					<Skeleton className="h-36 w-full rounded-2xl mb-6" />
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
						))}
					</div>
					<Skeleton className="h-6 w-32 mb-4" />
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-20 rounded-2xl" />
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return null

	return (
		<div className="list-page-shell bg-[#F4F7F6]">
			<Navbar />

			<div className="list-page-content max-w-5xl mx-auto">
				<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#34C759] via-[#38BC54] to-[#2eb34f] p-5 sm:p-7 md:p-8 mb-6 sm:mb-8 shadow-lg shadow-[#34C759]/20">
					<div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
					<div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
					<div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 z-[1]">
						<div>
							<p className="inline-flex items-center bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-3 text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider">
								{t('dashboard.workshop.badge') || 'Workshop Dashboard'}
							</p>
							<h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-1.5">
								{workshopName || t('workshop.dashboard.welcome') || 'Welcome back'}
							</h1>
							<p className="text-sm sm:text-base text-white/75 max-w-lg leading-relaxed">
								{t('dashboard.workshop.subtitle') || 'Your sales, jobs and performance at a glance.'}
							</p>
						</div>
						{stats.reviewCount > 0 && (
							<div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 self-start sm:self-auto">
								<Star className="w-4 h-4 text-amber-400 fill-amber-400" />
								<span className="text-white font-bold text-sm">{Number(stats.rating).toFixed(1)}</span>
								<span className="text-white/60 text-xs">
									({stats.reviewCount} {t('offers_page.reviews') || 'reviews'})
								</span>
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
					<StatCard
						icon={TrendingUp}
						value={formatPrice(stats.monthlyRevenue)}
						label={t('dashboard.workshop.monthly_sales') || 'Monthly sales'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={TrendingUp}
						value={formatPrice(stats.totalRevenue)}
						label={t('dashboard.workshop.total_sales') || 'Total sales'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={FileCheck}
						value={stats.completedContracts}
						label={t('dashboard.workshop.active_contracts') || 'Active contracts'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={Briefcase}
						value={stats.completedJobs}
						label={t('workshop.dashboard.stats.completed_jobs') || 'Completed jobs'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
				</div>

				<div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
					<StatCard
						icon={ClipboardList}
						value={stats.totalRequests}
						label={t('dashboard.workshop.new_jobs') || 'New job requests'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={Send}
						value={stats.proposalsSent}
						label={t('dashboard.workshop.proposals_sent') || 'Proposals sent'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
				</div>

				<div>
					<h2 className="text-sm sm:text-base font-black text-[#05324f] uppercase tracking-wider mb-3 sm:mb-4">
						{t('dashboard.quick_actions') || 'Quick actions'}
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<DashboardQuickAction
							to="/workshop/requests"
							icon={FileText}
							label={t('navigation.jobs') || 'Jobs'}
							description={t('dashboard.workshop.action_jobs_desc') || 'Browse new customer requests'}
							badge={stats.totalRequests}
						/>
						<DashboardQuickAction
							to="/workshop/proposals"
							icon={Send}
							label={t('navigation.proposals') || 'Proposals'}
							description={t('dashboard.workshop.action_proposals_desc') || 'Manage submitted offers'}
							badge={stats.activeOffers}
						/>
						<DashboardQuickAction
							to="/workshop/contracts"
							icon={FileCheck}
							label={t('navigation.contracts') || 'Contracts'}
							description={t('dashboard.workshop.action_contracts_desc') || 'Active and completed bookings'}
							badge={stats.completedContracts}
						/>
						<DashboardQuickAction
							to="/workshop/profile"
							icon={User}
							label={t('navigation.profile') || 'Profile'}
							description={t('dashboard.workshop.action_profile_desc') || 'Workshop settings and reviews'}
						/>
					</div>
				</div>
			</div>

			<Footer className="max-lg:hidden" />
		</div>
	)
}
