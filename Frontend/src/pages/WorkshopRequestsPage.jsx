import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, calculateDistance } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, workshopAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import {
	Car,
	MapPin,
	Clock,
	Eye,
	Calendar,
	AlertCircle,
	User,
	Send,
	CheckCircle2,
	Search,
	CheckCircle,
	XCircle,
	Users,
	MessageSquare,
	DollarSign,
	FileText,
	X,
	ChevronDown,
	Mail,
	BarChart2,
	UserCircle,
} from 'lucide-react'

export default function WorkshopRequestsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [workshopName, setWorkshopName] = useState('')
	const [stats, setStats] = useState({
		totalRequests: 0,
		completedContracts: 0,
		monthlyRevenue: 0,
	})
	const [workshopCoords, setWorkshopCoords] = useState({ lat: null, lng: null })
	const [selectedReport, setSelectedReport] = useState(null)
	const [showReportDialog, setShowReportDialog] = useState(false)

	// Redirect if not authenticated or not workshop
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/my-cases', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchRequests = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			// Fetch all available requests (no distance filtering)
			const response = await requestsAPI.getAvailable()
			
			if (response.data) {
				setRequests(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			console.error('Error details:', error.response?.data)
			toast.error(error.response?.data?.message || t('errors.fetch_failed'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchRequests()
			fetchWorkshopProfile()
		}
	}, [user])

	const fetchWorkshopProfile = async () => {
		try {
			const profileResponse = await workshopAPI.getProfile()
			const workshop = profileResponse.data?.workshop
			if (workshop?.companyName) {
				setWorkshopName(workshop.companyName)
			}
			if (workshop?.latitude && workshop?.longitude) {
				setWorkshopCoords({ lat: parseFloat(workshop.latitude), lng: parseFloat(workshop.longitude) })
			}
			
			// Fetch stats
			const statsResponse = await workshopAPI.getStats()
			if (statsResponse.data) {
				setStats({
					totalRequests: statsResponse.data.totalRequests || 0,
					completedContracts: statsResponse.data.completedContracts || 0,
					monthlyRevenue: statsResponse.data.monthlyRevenue || 0,
				})
			}
		} catch (error) {
			console.error('Failed to fetch workshop profile:', error)
		}
	}

	if (!user || user.role !== 'WORKSHOP') {
		if (authLoading) {
			return (
				<div className="min-h-screen bg-white">
					<Navbar />
					<div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
						<div className="text-center">
							<div className="relative">
								<div className="w-20 h-20 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-4"></div>
								<Car className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#34C759]" />
							</div>
							<p className="text-gray-600 font-medium">{t('common.loading')}</p>
						</div>
					</div>
				</div>
			)
		}
		return null
	}

	const getStatusBadge = (status) => {
		const statusMap = {
			NEW: {
				label: t('workshop.dashboard.status.new'),
				className: 'bg-green-100 text-green-800 border-green-200 border',
			},
			IN_BIDDING: {
				label: t('workshop.dashboard.status.in_bidding'),
				className: 'bg-green-100 text-green-800 border-green-200 border',
			},
			BIDDING_CLOSED: {
				label: t('workshop.dashboard.status.bidding_closed'),
				className: 'bg-green-100 text-green-800 border-green-200 border',
			},
			BOOKED: {
				label: t('workshop.dashboard.status.booked'),
				className: 'bg-green-100 text-green-800 border-green-200 border',
			},
			COMPLETED: {
				label: t('workshop.dashboard.status.completed'),
				className: 'bg-emerald-100 text-emerald-800 border-emerald-200 border',
			},
			CANCELLED: {
				label: t('workshop.dashboard.status.cancelled'),
				className: 'bg-red-100 text-red-800 border-red-200 border',
			},
		}

		const statusInfo = statusMap[status] || {
			label: status,
			className: 'bg-gray-100 text-gray-800 border-gray-200 border',
		}

		return (
			<div className={`${statusInfo.className} inline-flex items-center rounded-full border font-semibold px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm`}>
				{statusInfo.label}
			</div>
		)
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'NEW':
			case 'IN_BIDDING':
				return <Clock className="w-4 h-4" />
			case 'BIDDING_CLOSED':
				return <AlertCircle className="w-4 h-4" />
			case 'BOOKED':
				return <Calendar className="w-4 h-4" />
			case 'COMPLETED':
				return <CheckCircle className="w-4 h-4" />
			case 'CANCELLED':
				return <XCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	// Filter requests: remove already applied jobs and apply search filter
	const filteredRequests = requests.filter((request) => {
		// Remove requests where workshop has already applied
		const offers = request.offers || []
		const hasOffer = offers.length > 0
		if (hasOffer) return false

		// Apply search filter if query exists
		if (!searchQuery.trim()) return true

		const query = searchQuery.toLowerCase()
		const vehicle = request.vehicleId || request.vehicle
		const customer = request.customerId || request.customer

		return (
			(vehicle?.make && vehicle.make.toLowerCase().includes(query)) ||
			(vehicle?.model && vehicle.model.toLowerCase().includes(query)) ||
			(vehicle?.year && vehicle.year.toString().includes(query)) ||
			(request.city && request.city.toLowerCase().includes(query)) ||
			(request.address && request.address.toLowerCase().includes(query)) ||
			(customer?.name && customer.name.toLowerCase().includes(query)) ||
			(request.description && request.description.toLowerCase().includes(query))
		)
	})

	const formatK = (value) => {
		if (!value) return '0'
		const num = Number(value)
		if (isNaN(num)) return '0'
		if (num >= 1000) {
			return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'k'
		}
		return num.toString()
	}

	return (
	<div className="min-h-screen bg-gray-50 flex flex-col">
		<Navbar />

		{(authLoading || loading) ? (
			<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-24 w-full">
				{/* Desktop Header Skeletons */}
				<div className="mb-8 max-md:mb-4 max-md:hidden">
					<Skeleton className="h-4 w-32 mb-2" />
					<Skeleton className="h-10 w-64 mb-8" />
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
						<Skeleton className="h-32 w-full rounded-xl" />
						<Skeleton className="h-32 w-full rounded-xl" />
						<Skeleton className="h-32 w-full rounded-xl" />
					</div>
				</div>
				{/* Mobile Stats Skeletons */}
				<div className="md:hidden grid grid-cols-3 gap-2 mb-6">
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
					<Skeleton className="h-28 w-full rounded-xl" />
				</div>
				{/* Inbox Skeletons */}
				<div className="mb-6">
					<Skeleton className="h-8 w-48 mb-6 max-md:mb-3" />
					<div className="space-y-0 max-md:space-y-3">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-req-${i}`} className="grid grid-cols-1 md:grid-cols-3 items-center py-4 px-4 sm:px-6 gap-3 sm:gap-4 max-md:flex max-md:flex-col max-md:items-start max-md:gap-3 max-md:bg-white max-md:rounded-xl max-md:border max-md:border-gray-200 max-md:p-5 max-md:shadow-sm border-b border-gray-200 md:border-b max-md:border-b-0">
								<div className="min-w-0 flex-1 w-full space-y-2">
									<Skeleton className="h-5 w-3/4 max-w-[250px]" />
									<Skeleton className="h-4 w-[90%] max-w-[400px]" />
									<Skeleton className="h-3 w-1/2 max-w-[200px]" />
									<div className="hidden md:flex items-center gap-2 mt-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
								</div>
								<div className="hidden md:flex justify-center">
									<Skeleton className="h-4 w-20" />
								</div>
								<div className="flex justify-end gap-2 flex-wrap max-md:w-full max-md:mt-1 max-md:grid max-md:grid-cols-2 max-md:gap-3">
									<Skeleton className="h-9 md:h-10 w-full md:w-24 rounded-md" />
									<Skeleton className="h-9 md:h-10 w-full md:w-32 rounded-md" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		) : (
		<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-24 w-full">
			{/* Greeting + Stats - desktop */}
			{workshopName && (
				<div className="mb-8 max-md:mb-4 max-md:hidden">
					<p className="text-small text-gray-400 font-medium uppercase tracking-wide mb-1">
						{t('workshop.requests.hi') || 'Welcome'}
					</p>
					<h1 className="text-xl font-bold text-[#05324f] mb-8">
						{workshopName}
					</h1>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
						<div className="rounded-card border border-gray-100 bg-white shadow-card p-5">
							<div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
								<CheckCircle size={20} className="text-[#34C759]" />
							</div>
							<p className="text-3xl font-bold text-[#05324f] leading-none mb-1">{stats.totalRequests}</p>
							<p className="text-small text-gray-500 font-medium">{t('workshop.requests.new_requests')}</p>
						</div>
						<div className="rounded-card border border-gray-100 bg-white shadow-card p-5">
							<div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
								<CheckCircle size={20} className="text-[#34C759]" />
							</div>
							<p className="text-3xl font-bold text-[#05324f] leading-none mb-1">{stats.completedContracts}</p>
							<p className="text-small text-gray-500 font-medium">{t('workshop.requests.won_jobs')}</p>
						</div>
						<div className="rounded-card border border-gray-100 bg-white shadow-card p-5">
							<div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
								<DollarSign size={20} className="text-[#34C759]" />
							</div>
							<p className="text-3xl font-bold text-[#05324f] leading-none mb-1">{formatK(stats.monthlyRevenue)}</p>
							<p className="text-small text-gray-500 font-medium">{t('workshop.requests.revenue_this_month')}</p>
						</div>
					</div>
				</div>
			)}

			{/* Mobile: 3 stat cards - reference (icon in gray square, number, label) */}
			<div className="md:hidden grid grid-cols-3 gap-2 mb-6">
				<div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col items-center text-center shadow-none">
					<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
						<ChevronDown className="w-5 h-5 text-[#05324f]" />
					</div>
					<p className="text-2xl font-bold text-[#05324f] leading-none">{stats.totalRequests}</p>
					<p className="text-xs text-gray-500 mt-1">{t('workshop.requests.new_inquiries')}</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col items-center text-center shadow-none">
					<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
						<CheckCircle className="w-5 h-5 text-[#34C759]" />
					</div>
					<p className="text-2xl font-bold text-[#05324f] leading-none">{stats.completedContracts}</p>
					<p className="text-xs text-gray-500 mt-1">{t('workshop.requests.won_jobs')}</p>
				</div>
				<div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col items-center text-center shadow-none">
					<div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
						<DollarSign className="w-5 h-5 text-[#34C759]" />
					</div>
					<p className="text-xl font-bold text-[#05324f] leading-none">{formatK(stats.monthlyRevenue)}</p>
					<p className="text-xs text-gray-500 mt-1">{t('workshop.requests.income')}</p>
				</div>
			</div>

			{/* Offer Inbox Section */}
			<div className="mb-6">
				<h2 className="text-xl font-bold text-[#05324f] mb-6 max-md:mb-3 max-md:text-lg">{t('workshop.requests.offer_inbox')}</h2>
					
					<div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:bg-transparent max-md:border-0">
						{filteredRequests.length === 0 ? (
							<Card className="border-0 shadow-2xl overflow-hidden max-md:rounded-xl max-md:border max-md:border-gray-200 max-md:shadow-none">
								<CardContent className="text-center py-20 sm:py-24 px-6 bg-white max-md:py-12">
									<div className="relative inline-block mb-8 max-md:mb-4">
										<div className="relative p-10 sm:p-12 rounded-3xl border-2 border-gray-200 max-md:p-8">
											<Car className="w-24 h-24 sm:w-28 sm:h-28 mx-auto max-md:w-16 max-md:h-16" style={{ color: '#34C759' }} />
										</div>
									</div>
							<h3 className="text-3xl sm:text-4xl font-bold mb-4 max-md:text-xl" style={{ color: '#05324f' }}>
								{t('workshop.requests.no_requests.title')}
							</h3>
							<p className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed max-md:text-sm" style={{ color: '#05324f' }}>
								{t('workshop.requests.no_requests.description')}
							</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-0 max-md:space-y-3">
								{filteredRequests.map((request, index) => {
									const requestId = request._id || request.id
									const vehicle = request.vehicleId || request.vehicle
									
						// Calculate distance using workshop profile coordinates
						const workshopLat = workshopCoords.lat
						const workshopLng = workshopCoords.lng
						const requestLat = request.latitude
						const requestLng = request.longitude
						const distance = requestLat && requestLng && workshopLat && workshopLng
							? calculateDistance(workshopLat, workshopLng, requestLat, requestLng)
							: null

									const customer = request.customerId || request.customer
									const requestDateTime = request.createdAt ? new Date(request.createdAt).toLocaleString('en-US', { 
										month: 'short', 
										day: 'numeric', 
										year: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
										hour12: true
									}) : ''
									const latestDate = request.createdAt ? new Date(request.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''

									const report = request.reportId || request.report
									const hasReport = report && report.fileUrl

									return (
										<div
											key={requestId}
											className={`grid grid-cols-1 md:grid-cols-3 items-center py-4 px-4 sm:px-6 gap-3 sm:gap-4 max-md:flex max-md:flex-col max-md:items-start max-md:gap-3 max-md:bg-white max-md:rounded-xl max-md:border max-md:border-gray-200 max-md:p-5 max-md:shadow-sm max-md:min-h-0 ${index !== filteredRequests.length - 1 ? 'border-b border-gray-200 md:border-b' : ''} max-md:border-b-0`}
										>
											{/* Left: Vehicle (bold) + Description + "X km away · Latest date" - reference card layout */}
											<div className="min-w-0 flex-1 w-full">
												<h3 className="text-base font-bold mb-1 max-md:text-base max-md:mb-1.5 text-gray-900" style={{ color: '#05324f' }}>
													{vehicle?.make} {vehicle?.model} {vehicle?.year}
												</h3>
												<p className="text-sm mb-1.5 md:mb-0 max-md:text-sm max-md:mb-1 text-gray-700" style={{ color: 'inherit' }}>
													{request.description || t('workshop.requests.no_description_provided')}
												</p>
												{/* "8 km away · Latest 2 May" - reference line with middle dot */}
												<p className="text-xs text-gray-500 max-md:block">
													{distance != null && `${Math.round(distance)} ${t('workshop.requests.km_away')}`}
													{distance != null && latestDate && ' · '}
													{latestDate && `${t('workshop.requests.latest')} ${latestDate}`}
													{distance == null && !latestDate && t('common.no_data')}
												</p>
												{/* Desktop only: Username + Date, Distance */}
												<div className="hidden md:flex items-center gap-2 mb-1 flex-wrap mt-2">
													{customer?.name && (
														<div className="flex items-center gap-1.5">
															<User className="w-3 h-3" style={{ color: '#05324f' }} />
															<p className="text-xs font-semibold" style={{ color: '#05324f' }}>{customer.name}</p>
														</div>
													)}
													{customer?.name && requestDateTime && <span style={{ color: '#05324f' }}>·</span>}
													{requestDateTime && <p className="text-xs" style={{ color: '#05324f' }}>{requestDateTime}</p>}
												</div>
												<div className="hidden md:block mt-1">
													{distance !== null ? (
														<p className="text-xs text-gray-500">{Math.round(distance)} {t('workshop.requests.km_from_job')}</p>
													) : (
														<p className="text-xs text-gray-500">{t('common.no_data')}</p>
													)}
												</div>
											</div>

											{/* Center: Desktop only */}
											<div className="hidden md:flex justify-center">
												{distance !== null ? (
													<p className="text-xs sm:text-sm" style={{ color: '#05324f' }}>{Math.round(distance)} {t('workshop.requests.km_from_job')}</p>
												) : (
													<p className="text-xs sm:text-sm" style={{ color: '#05324f' }}>{t('common.no_data')}</p>
												)}
											</div>

											{/* Right: View report + Submit offer - both visible on mobile */}
											<div className="flex justify-end gap-2 flex-wrap max-md:w-full max-md:mt-1 max-md:grid max-md:grid-cols-2 max-md:gap-3">
												{hasReport && (
													<Button
														onClick={() => { setSelectedReport(report); setShowReportDialog(true) }}
														variant="outline"
														className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-1.5 max-md:rounded-xl max-md:border-[#05324f] max-md:text-[#05324f] max-md:px-3 max-md:py-2.5 max-md:w-full"
														style={{ borderColor: '#05324f', color: '#05324f' }}
													>
														<Eye className="w-3 h-3 sm:w-4 sm:h-4" />
														<span className="hidden sm:inline">{t('workshop.requests.view_report')}</span>
														<span className="sm:hidden">{t('workshop.requests.view')}</span>
													</Button>
												)}
												<Link to={`/workshop/requests/${requestId}/offer`} className={`max-md:w-full ${hasReport ? '' : 'max-md:col-span-2'}`}>
													<Button 
														className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg max-md:rounded-xl max-md:!bg-[#34C759] max-md:!text-white max-md:px-4 max-md:py-3 max-md:whitespace-nowrap max-md:w-full"
														style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
													>
														{t('workshop.requests.submit_offer')}
													</Button>
												</Link>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</div>
			</div>
			)}

			{/* Inspection Report Dialog */}
			<Dialog open={showReportDialog} onOpenChange={setShowReportDialog} className="max-w-4xl">
				<div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
					<div className="flex items-center justify-between mb-4">
						<DialogTitle style={{ color: '#05324f' }}>
							{t('workshop.requests.inspection_report')}
						</DialogTitle>
						<button
							onClick={() => setShowReportDialog(false)}
							className="p-1 hover:bg-gray-100 rounded-full transition-colors"
						>
							<X className="w-5 h-5 text-gray-600" />
						</button>
					</div>
					{selectedReport && (
						<div className="space-y-4">
							{selectedReport.mimeType && selectedReport.mimeType.startsWith('image/') ? (
								<div className="flex justify-center">
									<img
										src={getFullUrl(selectedReport.fileUrl)}
										alt={selectedReport.fileName || 'Inspection Report'}
										className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
										onError={(e) => {
											e.target.style.display = 'none'
											const errorDiv = e.target.nextSibling
											if (errorDiv) {
												errorDiv.style.display = 'block'
											}
										}}
									/>
									<div style={{ display: 'none' }} className="text-center p-8 text-red-600">
										<AlertCircle className="w-12 h-12 mx-auto mb-2" />
										<p>{t('workshop.requests.failed_to_load_image')}</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center space-y-4">
									<div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
										<FileText className="w-16 h-16 text-gray-400" />
									</div>
									<a
										href={getFullUrl(selectedReport.fileUrl)}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
									>
										<Eye className="w-4 h-4" />
										{t('workshop.requests.open_pdf_new_tab')}
									</a>
								</div>
							)}
						</div>
					)}
				</div>
			</Dialog>

			

			<Footer />
		</div>
	)
}
