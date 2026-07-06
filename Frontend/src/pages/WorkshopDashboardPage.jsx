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
				<div className="list-page-content">
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

			<div className="list-page-content">
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
						<div>
							<p className="inline-flex items-center bg-[#F2F9F4] border border-[#38BC54]/15 rounded-full px-3 py-1 mb-3 text-[10px] sm:text-xs font-semibold text-[#38BC54] uppercase tracking-wider">
								{t('dashboard.workshop.badge') || 'Workshop Dashboard'}
							</p>
							<h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#05324f] leading-tight mb-1.5">
								{workshopName || t('workshop.dashboard.welcome') || 'Welcome back'}
							</h1>
							<p className="text-sm sm:text-base text-gray-500 max-w-lg leading-relaxed">
								{t('dashboard.workshop.subtitle') || 'Your sales, jobs and performance at a glance.'}
							</p>
						</div>
						{stats.reviewCount > 0 && (
							<div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 self-start sm:self-auto shadow-sm">
								<Star className="w-4 h-4 text-amber-400 fill-amber-400" />
								<span className="text-[#05324f] font-bold text-sm">{Number(stats.rating).toFixed(1)}</span>
								<span className="text-gray-400 text-xs">
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
