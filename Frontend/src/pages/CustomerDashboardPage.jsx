import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Car, FileText, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { DashboardPageSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { computeCustomerSentOfferCount } from '../context/CustomerOfferCountContext'
import { requestsAPI, bookingsAPI } from '../services/api'

function OverviewCard({ title, value, meta, icon: Icon, to, seeMore }) {
	return (
		<div className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4 sm:px-6 sm:py-5">
			<div className="flex items-center gap-3 sm:gap-5">
				<div className="min-w-0 flex-1">
					<p className="text-sm sm:text-base font-semibold text-[#05324f] truncate">{title}</p>
					<p className="text-3xl sm:text-4xl font-bold text-[#1B8F3E] leading-none mt-2 tabular-nums">{value}</p>
				</div>
				<div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#F2F9F4] flex items-center justify-center">
					<Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#1B8F3E]" strokeWidth={1.75} />
				</div>
				<div className="min-w-0 flex-1 text-right">
					<p className="text-xs sm:text-sm text-[#6B7280] truncate">{meta}</p>
					<Link
						to={to}
						className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-[#1B8F3E] hover:text-[#006b28]"
					>
						{seeMore}
						<ArrowRight className="w-4 h-4" strokeWidth={2.25} />
					</Link>
				</div>
			</div>
		</div>
	)
}

export default function CustomerDashboardPage() {
	const navigate = useNavigate()
	const { pathname } = useLocation()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState({
		myCases: 0,
		offers: 0,
		favouriteWorkshops: 0,
	})
	const [offersCaseId, setOffersCaseId] = useState(null)

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

				const myCases = requests.filter(
					(r) => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status?.toUpperCase())
				).length

				const offers = computeCustomerSentOfferCount(requests)

				const workshopIds = new Set()
				bookings.forEach((booking) => {
					const raw = booking.workshopId
					const id = raw && typeof raw === 'object' ? raw._id || raw.id : raw
					if (id) workshopIds.add(String(id))
				})
				let firstOffersCaseId = null
				requests.forEach((request) => {
					const requestId = request._id || request.id
					;(request.offers || []).forEach((offer) => {
						if (!['SENT', 'ACCEPTED'].includes(String(offer.status || '').toUpperCase())) return
						const raw = offer.workshopId
						const id = (raw && typeof raw === 'object' ? raw._id || raw.id : raw) || offer.workshop?.id
						if (id) workshopIds.add(String(id))
						if (!firstOffersCaseId && requestId) firstOffersCaseId = String(requestId)
					})
				})

				setOffersCaseId(firstOffersCaseId)
				setStats({
					myCases,
					offers,
					favouriteWorkshops: workshopIds.size,
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
			<div className="list-page-shell bg-white">
				<Navbar />
				<div className="list-page-content !max-w-3xl">
					<DashboardPageSkeleton stats={0} rows={3} />
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role?.toUpperCase() !== 'CUSTOMER') return null

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<div className="list-page-content flex-1 flex flex-col !max-w-3xl">
				<div className="mb-6 sm:mb-8">
					<h1 className="page-title">
						{t('dashboard.customer.hi_name', { name: firstName })}
					</h1>
					<p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
						{t('dashboard.customer.overview_subtitle')}
					</p>
				</div>

				<div className="space-y-3 sm:space-y-4">
					<OverviewCard
						title={t('navigation.my_cases')}
						value={stats.myCases}
						meta={t('dashboard.customer.card_cases_meta')}
						icon={FileText}
						to="/contract"
						seeMore={t('dashboard.customer.see_more')}
					/>
					<OverviewCard
						title={t('navigation.offers')}
						value={stats.offers}
						meta={t('dashboard.customer.card_offers_meta')}
						icon={Car}
						to={offersCaseId ? `/contract?case=${offersCaseId}&panel=quotes` : '/contract'}
						seeMore={t('dashboard.customer.see_more')}
					/>
					<OverviewCard
						title={t('dashboard.customer.favourite_workshops')}
						value={stats.favouriteWorkshops}
						meta={t('dashboard.customer.card_favourites_meta')}
						icon={Star}
						to="/contract?view=messages"
						seeMore={t('dashboard.customer.see_more')}
					/>
				</div>
			</div>

			<Footer className="max-lg:hidden" />
		</div>
	)
}
