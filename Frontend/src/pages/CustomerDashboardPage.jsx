import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
	Camera,
	FileText,
	Tag,
	User,
	Wallet,
	Briefcase,
	CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Skeleton } from '../components/ui/Skeleton'
import StatCard from '../components/ui/StatCard'
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction'
import { useAuth } from '../context/AuthContext'
import { computeCustomerSentOfferCount } from '../context/CustomerOfferCountContext'
import { requestsAPI, bookingsAPI } from '../services/api'
import { formatPrice } from '../utils/cn'

function getCompletedBookingAmount(booking) {
	if (booking?.totalAmount != null && Number(booking.totalAmount) > 0) {
		return Number(booking.totalAmount)
	}
	const offerPrice = booking?.offerId?.price
	if (offerPrice != null && Number(offerPrice) > 0) {
		return Number(offerPrice)
	}
	return 0
}

export default function CustomerDashboardPage() {
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState({
		totalSpent: 0,
		activeCases: 0,
		offersReceived: 0,
		completedJobs: 0,
		openRequests: 0,
		currentCases: 0,
		pendingOffers: 0,
	})

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			const role = user.role?.toUpperCase()
			if (role === 'WORKSHOP') {
				navigate('/workshop/dashboard', { replace: true })
				return
			}
			if (role === 'ADMIN') {
				navigate('/admin', { replace: true })
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return

		const fetchDashboard = async () => {
			try {
				const userId = user._id || user.id
				const [requestsRes, bookingsRes] = await Promise.all([
					requestsAPI.getByCustomer(userId),
					bookingsAPI.getByCustomer(userId),
				])

				const requests = Array.isArray(requestsRes.data) ? requestsRes.data : []
				const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : []

				const activeCases = requests.filter(
					(r) => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status?.toUpperCase())
				).length

				const openRequests = requests.filter((r) =>
					['NEW', 'IN_BIDDING'].includes(r.status?.toUpperCase())
				).length

				const currentCases = requests.filter((r) => {
					const requestBookings = r.bookings || []
					return requestBookings.some((b) => ['CONFIRMED', 'RESCHEDULED'].includes(b.status))
				}).length

				const pendingOffers = computeCustomerSentOfferCount(requests)

				const offersReceived = requests.reduce((total, request) => {
					const sent = (request.offers || []).filter((o) => o.status === 'SENT').length
					return total + sent
				}, 0)

				const completedBookings = bookings.filter((b) => b.status?.toUpperCase() === 'DONE')

				const completedJobs = completedBookings.length

				const totalSpent = completedBookings.reduce(
					(sum, booking) => sum + getCompletedBookingAmount(booking),
					0
				)

				setStats({
					totalSpent,
					activeCases,
					offersReceived,
					completedJobs,
					openRequests,
					currentCases,
					pendingOffers,
				})
			} catch (error) {
				console.error('Failed to fetch customer dashboard:', error)
				toast.error(t('dashboard.fetch_error') || 'Failed to load dashboard')
			} finally {
				setLoading(false)
			}
		}

		fetchDashboard()
	}, [user, t, pathname])

	const firstName = user?.name?.split(' ')[0] || user?.name || ''

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

	if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return null

	return (
		<div className="list-page-shell bg-[#F4F7F6]">
			<Navbar />

			<div className="list-page-content max-w-5xl mx-auto">
				<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#34C759] via-[#38BC54] to-[#2eb34f] p-5 sm:p-7 md:p-8 mb-6 sm:mb-8 shadow-lg shadow-[#34C759]/20">
					<div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
					<div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
					<div className="relative z-[1]">
						<p className="inline-flex items-center bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-3 text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider">
							{t('dashboard.customer.badge') || 'Customer Dashboard'}
						</p>
						<h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-1.5">
							{t('dashboard.welcome_back', { name: firstName }) || `Welcome back, ${firstName}`}
						</h1>
						<p className="text-sm sm:text-base text-white/75 max-w-lg leading-relaxed">
							{t('dashboard.customer.subtitle') || 'Track your cases, offers and bookings in one place.'}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
					<StatCard
						icon={Wallet}
						value={formatPrice(stats.totalSpent)}
						label={t('dashboard.customer.total_spent') || 'Total spent'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={Briefcase}
						value={stats.activeCases}
						label={t('dashboard.customer.active_cases') || 'Active cases'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={Tag}
						value={stats.offersReceived}
						label={t('dashboard.customer.offers_received') || 'Offers received'}
						iconColor="#38BC54"
						iconBg="bg-[#F2F9F4]"
					/>
					<StatCard
						icon={CheckCircle2}
						value={stats.completedJobs}
						label={t('dashboard.customer.completed_jobs') || 'Completed jobs'}
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
							to="/upload"
							icon={Camera}
							label={t('dashboard.customer.action_new_request') || 'New request'}
							description={t('dashboard.customer.action_new_request_desc') || 'Upload inspection report and get quotes'}
							badge={stats.openRequests}
						/>
						<DashboardQuickAction
							to="/offers"
							icon={Tag}
							label={t('navigation.offers') || 'Offers'}
							description={t('dashboard.customer.action_offers_desc') || 'Compare workshop quotes'}
							badge={stats.pendingOffers}
						/>
						<DashboardQuickAction
							to="/contract"
							icon={FileText}
							label={t('navigation.contract') || 'Contract'}
							description={t('profile.contract_desc') || 'View your bookings and active contracts'}
						/>
						<DashboardQuickAction
							to="/profile"
							icon={User}
							label={t('navigation.profile') || 'Profile'}
							description={t('dashboard.customer.action_profile_desc') || 'Account settings and preferences'}
						/>
					</div>
				</div>
			</div>

			<Footer className="max-lg:hidden" />
		</div>
	)
}
