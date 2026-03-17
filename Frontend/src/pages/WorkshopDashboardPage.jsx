import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	Car,
	Clock,
	CheckCircle,
	XCircle,
	AlertCircle,
	Calendar,
	TrendingUp,
	Briefcase,
	DollarSign,
	Send,
	Mail,
	BarChart2,
	User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WorkshopBottomNav from '../components/WorkshopBottomNav'
import { requestsAPI, workshopAPI } from '../services/api'

export default function WorkshopDashboardPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeOffers: 0,
		completedJobs: 0,
		totalRevenue: 0,
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') navigate('/admin', { replace: true })
				else navigate('/my-cases', { replace: true })
			}
		}
	}, [user, authLoading, navigate])

	const fetchData = async () => {
		if (!user || user.role !== 'WORKSHOP') return
		try {
			const workshopId = user.id || user._id
			const requestsResponse = await requestsAPI.getAvailable({
				workshopId,
				latitude: user.latitude || 59.3293,
				longitude: user.longitude || 18.0686,
				radius: 50,
			})
			if (requestsResponse.data) setRequests(requestsResponse.data)

			try {
				const statsResponse = await workshopAPI.getStats()
				if (statsResponse.data) {
					setStats({
						totalRequests: statsResponse.data.totalRequests || 0,
						activeOffers: statsResponse.data.activeOffers || 0,
						completedJobs: statsResponse.data.completedJobs || 0,
						totalRevenue: statsResponse.data.totalRevenue || 0,
					})
				}
			} catch (statsError) {
				console.error('Stats fetch error:', statsError)
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('errors.fetch_failed'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') fetchData()
	}, [user])

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Navbar />
				<div className="text-center">
					<div className="w-14 h-14 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-500 font-medium">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') return null

	const getStatusBadge = (status) => {
		const statusMap = {
			NEW: { label: t('workshop.dashboard.status.new'), className: 'bg-green-100 text-green-800 border border-green-200' },
			IN_BIDDING: { label: t('workshop.dashboard.status.in_bidding'), className: 'bg-blue-100 text-blue-800 border border-blue-200' },
			BIDDING_CLOSED: { label: t('workshop.dashboard.status.bidding_closed'), className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
			BOOKED: { label: t('workshop.dashboard.status.booked'), className: 'bg-purple-100 text-purple-800 border border-purple-200' },
			COMPLETED: { label: t('workshop.dashboard.status.completed'), className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
			CANCELLED: { label: t('workshop.dashboard.status.cancelled'), className: 'bg-red-100 text-red-800 border border-red-200' },
		}
		const s = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border border-gray-200' }
		return (
			<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
				{s.label}
			</span>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-24">

				{/* Header - mobile: compact */}
				<div className="mb-8 max-md:mb-6">
					<p className="text-small text-gray-400 font-medium uppercase tracking-wide mb-1 max-md:hidden">
						{t('workshop.dashboard.welcome') || 'Welcome back'}
					</p>
					<h1 className="text-h1 font-bold text-[#05324f] max-md:text-xl">
						{user?.workshop?.companyName || user?.name || 'Workshop'}
					</h1>
				</div>

				{/* Stats Grid - 3 cards inline on all screens */}
				<div className="grid grid-cols-3 gap-2 sm:gap-6 mb-10 max-md:mb-6">
					<StatCard
						icon={TrendingUp}
						value={stats.totalRequests}
						label={t('workshop.dashboard.stats.new_inquiries') || t('workshop.dashboard.stats.total_requests') || 'New inquiries'}
					/>
					<StatCard
						icon={Briefcase}
						value={stats.completedJobs}
						label={t('workshop.dashboard.stats.won_jobs') || t('workshop.dashboard.stats.completed_jobs') || 'Won jobs'}
					/>
					<StatCard
						icon={DollarSign}
						value={formatPrice(stats.totalRevenue)}
						label={t('workshop.dashboard.stats.monthly_revenue') || 'Income'}
					/>
				</div>

				{/* Offer Inbox - mobile: reference list style */}
				<div className="mb-10 max-md:mb-6">
					<div className="flex items-center justify-between mb-4 max-md:mb-3">
						<h2 className="text-h2 font-bold text-[#05324f] max-md:text-lg">
							{t('workshop.dashboard.offer_inbox') || 'Offer Inbox'}
						</h2>
						<Link to="/workshop/requests" className="max-md:hidden">
							<Button variant="outline" size="sm">
								{t('workshop.dashboard.view_all') || 'View all'}
							</Button>
						</Link>
					</div>

					{requests.length === 0 ? (
						<Card className="max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none">
							<CardContent className="py-12 text-center text-gray-400 max-md:py-8">
								<Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
								<p className="font-medium text-sm">
									{t('workshop.dashboard.no_requests') || 'No requests available'}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-3 max-md:space-y-2">
							{requests.slice(0, 5).map((request) => {
								const requestId = request._id || request.id
								const vehicle = request.vehicleId || request.vehicle
								const hasOffer = (request.offers || []).length > 0

								return (
									<Card key={requestId} className="hover:shadow-card-hover transition-shadow duration-200 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:border">
										<CardContent className="p-5 max-md:p-4">
											<div className="flex items-center justify-between gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<h3 className="font-bold text-[#05324f] truncate max-md:text-sm">
															{vehicle?.make} {vehicle?.model} {vehicle?.year}
														</h3>
														<span className="hidden md:inline">{getStatusBadge(request.status)}</span>
													</div>
													{request.description && (
														<p className="text-small text-gray-500 line-clamp-1 max-md:text-xs">
															{request.description}
														</p>
													)}
													{/* Mobile: distance / date placeholder - could use request.createdAt */}
													<p className="text-xs text-gray-400 mt-0.5 max-md:block hidden">
														{t('workshop.dashboard.latest') || 'Latest'} {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ''}
													</p>
												</div>
												<div className="shrink-0">
													{!hasOffer ? (
														<Link to={`/workshop/requests/${requestId}/offer`}>
															<Button size="sm" className="max-md:!bg-[#34C759] max-md:!text-white max-md:rounded-xl max-md:text-xs max-md:px-3 max-md:py-2">
																{t('workshop.dashboard.submit_offer') || 'Submit offer'}
															</Button>
														</Link>
													) : (
														<span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
															<CheckCircle size={12} />
															{t('workshop.dashboard.offer_sent') || 'Offer sent'}
														</span>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								)
							})}
						</div>
					)}
				</div>

				{/* Active Jobs */}
				<div>
					<h2 className="text-h2 font-bold text-[#05324f] mb-4">
						{t('workshop.dashboard.my_jobs') || 'My Jobs'}
					</h2>
					<Card>
						<CardContent className="py-12 text-center text-gray-400">
							<Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
							<p className="font-medium">
								{t('workshop.dashboard.no_active_jobs') || 'No active jobs'}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			<WorkshopBottomNav />
			<Footer />
		</div>
	)
}
