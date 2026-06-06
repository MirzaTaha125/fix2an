import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime, formatTime, calculateDistance } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/ui/StatCard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VehicleImage from '../components/VehicleImage'
import CreateOfferModal from '../components/CreateOfferModal'
import ViewOfferModal from '../components/ViewOfferModal'

import { requestsAPI, workshopAPI, offersAPI } from '../services/api'
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
	ChevronRight,
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
	const [mobileTab, setMobileTab] = useState('new')
	const [offerModalOpen, setOfferModalOpen] = useState(false)
	const [selectedRequestIdForOffer, setSelectedRequestIdForOffer] = useState(null)
	const [viewModalOpen, setViewModalOpen] = useState(false)
	const [selectedOffer, setSelectedOffer] = useState(null)
	const [workshopOffers, setWorkshopOffers] = useState([])

	// Redirect if not authenticated or not workshop
	useEffect(() => {
		if (!authLoading) {
			const userRole = user?.role?.toUpperCase()
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (userRole !== 'WORKSHOP') {
				if (userRole === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/contract', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchRequests = async () => {
		if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return

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

	const fetchWorkshopOffers = async () => {
		try {
			const response = await offersAPI.getByWorkshop()
			if (response.data) {
				setWorkshopOffers(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch workshop offers:', error)
		}
	}

	useEffect(() => {
		if (user && user.role?.toUpperCase() === 'WORKSHOP') {
			fetchRequests()
			fetchWorkshopProfile()
			fetchWorkshopOffers()
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

	const matchesSearch = (request) => {
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
	}

	// "New" — only requests workshop hasn't applied to (default for desktop + mobile Nya tab)
	const filteredRequests = requests.filter((request) => {
		const offers = request.offers || []
		if (offers.length > 0) return false
		return matchesSearch(request)
	})

	// "All" — every request matching search (mobile Alla tab)
	const allRequests = requests.filter(matchesSearch)

	const mobileList = mobileTab === 'all' ? allRequests : filteredRequests

	const formatK = (value) => {
		if (!value) return '0'
		const num = Number(value)
		if (isNaN(num)) return '0'
		if (num >= 1000) {
			return (num / 1000).toFixed(2).replace(/\.00$/, '') + 'k'
		}
		return num.toString()
	}

	const handleViewOffer = (request) => {
		const requestId = request._id || request.id
		const offerStub = (request.offers || [])[0]
		const offerId = offerStub?.id || offerStub?._id

		let fullOffer = workshopOffers.find((o) => {
			const oid = o._id || o.id
			return oid?.toString() === offerId?.toString()
		})

		if (!fullOffer) {
			fullOffer = workshopOffers.find((o) => {
				const rid = o.requestId?._id || o.requestId?.id || o.requestId
				return rid?.toString() === requestId?.toString()
			})
		}

		if (!fullOffer) {
			toast.error(t('workshop.requests.offer_not_found') || 'Could not load offer details')
			return
		}

		const vehicle = request.vehicleId || request.vehicle
		const existingRequest = typeof fullOffer.requestId === 'object' ? fullOffer.requestId : {}

		setSelectedOffer({
			...fullOffer,
			requestId: {
				...existingRequest,
				_id: requestId,
				description: request.description ?? existingRequest.description,
				city: request.city ?? existingRequest.city,
				status: request.status ?? existingRequest.status,
				createdAt: request.createdAt ?? existingRequest.createdAt,
				vehicleId: vehicle ?? existingRequest.vehicleId,
				customerId: request.customerId || request.customer || existingRequest.customerId,
			},
		})
		setViewModalOpen(true)
	}

	const formatRelativeSent = (dateStr) => {
		if (!dateStr) return ''
		try {
			const d = new Date(dateStr)
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
			const yesterday = new Date(today.getTime() - 86400000)
			const time = formatTime(d)
			if (d >= today) return t('workshop.requests.sent_today', { time }) || `Today ${time}`
			if (d >= yesterday) return t('workshop.requests.sent_yesterday', { time }) || `Yesterday ${time}`
			return formatDateTime(d)
		} catch {
			return ''
		}
	}

	return (
	<div className="list-page-shell bg-gray-50">
		<Navbar />

		{(authLoading || loading) ? (
			<div className="list-page-content">
				<div className="mb-6 md:mb-7">
					<Skeleton className="h-9 w-40 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="list-tabs-row">
					<div className="workshop-pill-tabs-skeleton">
						<Skeleton className="h-10 flex-1 rounded-lg" />
						<Skeleton className="h-10 flex-1 rounded-lg" />
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-req-${i}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4">
								<div className="flex gap-3 md:gap-4">
									<Skeleton className="w-28 h-16 md:w-32 md:h-20 rounded-xl shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-2/3" />
									</div>
								</div>
								<Skeleton className="h-10 w-full rounded-xl mt-4" />
							</div>
						))}
				</div>
			</div>
		) : (
		<div className="list-page-content">
			<div className="mb-6 md:mb-7">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#05324f] leading-tight mb-1.5 lg:mb-2">
					{t('workshop.requests.page_title') || 'Requests'}
				</h1>
				<p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
					{t('workshop.requests.page_subtitle') || 'See new requests from customers here.'}
				</p>
			</div>

			{/* Tabs (New / All) */}
			<div className="list-tabs-row">
				<div className="workshop-pill-tabs">
					<button
						type="button"
						onClick={() => setMobileTab('new')}
						className={`workshop-pill-tab ${mobileTab === 'new' ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
					>
						{t('workshop.requests.tab_new') || 'New'} ({filteredRequests.length})
					</button>
					<button
						type="button"
						onClick={() => setMobileTab('all')}
						className={`workshop-pill-tab ${mobileTab === 'all' ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
					>
						{t('workshop.requests.tab_all') || 'All'} ({allRequests.length})
					</button>
				</div>
			</div>

			{/* Job cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
				{mobileList.length === 0 ? (
					<div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
						<Car className="w-12 h-12 text-gray-200 mx-auto mb-3" />
						<h3 className="text-base font-black text-[#05324f] mb-1">{t('workshop.requests.no_requests.title')}</h3>
						<p className="text-xs text-gray-500">{t('workshop.requests.no_requests.description')}</p>
					</div>
				) : (
					mobileList.map((request) => {
						const requestId = request._id || request.id
						const vehicle = request.vehicleId || request.vehicle
						const hasOffer = (request.offers || []).length > 0
						return (
							<div key={`m-${requestId}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full">
								<div className="flex gap-3 md:gap-4 flex-1 items-stretch min-h-0">
									<div className="w-28 md:w-32 shrink-0 rounded-xl overflow-hidden flex items-start justify-center">
										<VehicleImage
											make={vehicle?.make}
											model={vehicle?.model}
											year={vehicle?.year}
											width={400}
											className="w-full max-h-32 md:max-h-[8rem]"
											fallbackClassName="w-full h-24 md:h-[7rem]"
											alt={`${vehicle?.make} ${vehicle?.model}`}
										/>
									</div>
									<div className="flex-1 min-w-0 flex flex-col">
										<div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
											<h3 className="text-sm font-black text-[#05324f] leading-snug line-clamp-2">
												{vehicle?.make} {vehicle?.model} {vehicle?.year}
											</h3>
											{hasOffer ? (
												<span className="shrink-0 text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md border border-gray-200">
													{t('workshop.requests.offer_sent') || 'Sent'}
												</span>
											) : (
												<span className="shrink-0 text-[10px] font-black bg-[#F2F9F4] text-[#38BC54] px-2 py-0.5 rounded-md border border-[#38BC54]/20">
													{t('workshop.requests.new_badge') || 'New'}
												</span>
											)}
										</div>
										<div className="space-y-1">
											<p className="text-[11px] text-[#05324f]/80 leading-snug line-clamp-2">
												<span className="font-bold">{t('workshop.requests.problem_label') || 'Problem'}:</span>
												{request.description?.trim() ? ` ${request.description.trim()}` : ' —'}
											</p>
											{request.city && (
												<p className="text-[11px] text-[#05324f]/80">
													<span className="font-bold">{t('workshop.requests.location_label') || 'Location'}:</span> {request.city}
												</p>
											)}
											{request.createdAt && (
												<p className="text-[11px] text-[#05324f]/80">
													<span className="font-bold">{t('workshop.requests.sent_label') || 'Sent'}:</span> {formatRelativeSent(request.createdAt)}
												</p>
											)}
										</div>
										{hasOffer ? (
											<div className="mt-auto pt-4 flex items-center gap-3.5 shrink-0">
												<Button
													onClick={() => handleViewOffer(request)}
													className="flex-1 min-w-0 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs flex items-center justify-center shadow-sm"
												>
													{t('common.view') || 'View'}
												</Button>
												<ChevronRight className="w-5 h-5 text-black shrink-0" strokeWidth={2} />
											</div>
										) : (
											<div className="mt-auto pt-4 flex items-center gap-3.5 shrink-0">
												<Button
													onClick={() => {
														setSelectedRequestIdForOffer(requestId)
														setOfferModalOpen(true)
													}}
													className="flex-1 min-w-0 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs flex items-center justify-center shadow-sm"
												>
													{t('workshop.requests.leave_a_quote') || 'Submit offer'}
												</Button>
												<ChevronRight className="w-5 h-5 text-black shrink-0" strokeWidth={2} />
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})
				)}
			</div>

			{/* Disclaimer */}
			{mobileList.length > 0 && (
				<div className="flex items-start gap-2.5 px-1 pt-2 md:pt-4">
					<CheckCircle className="w-4 h-4 text-[#38BC54] shrink-0 mt-0.5" />
					<p className="text-[11px] text-gray-500 leading-snug">
						{t('workshop.requests.share_disclaimer') || 'You only share offers with the customer if you choose to send them.'}
					</p>
				</div>
			)}

		</div>
		)}

			{/* Inspection Report Dialog */}
			<Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
				<div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto max-w-4xl w-full mx-auto">
					<div className="flex items-center justify-between mb-6">
						<DialogTitle className="text-2xl font-black text-[#05324f] uppercase tracking-tight">
							{t('workshop.requests.inspection_report')}
						</DialogTitle>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowReportDialog(false)}
							className="rounded-full hover:bg-gray-100"
						>
							<X className="w-5 h-5 text-gray-500" />
						</Button>
					</div>
					{selectedReport && (
						<div className="space-y-6">
							{selectedReport.mimeType && selectedReport.mimeType.startsWith('image/') ? (
								<div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
									<img
										src={getFullUrl(selectedReport.fileUrl)}
										alt={selectedReport.fileName || 'Inspection Report'}
										className="max-w-full h-auto rounded-lg border border-white shadow-sm"
										onError={(e) => {
											e.target.style.display = 'none'
											const errorDiv = e.target.nextSibling
											if (errorDiv) {
												errorDiv.style.display = 'block'
											}
										}}
									/>
									<div style={{ display: 'none' }} className="text-center p-12 text-red-600 bg-white rounded-xl border border-red-100">
										<AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p className="font-bold text-sm uppercase tracking-widest">{t('workshop.requests.failed_to_load_image')}</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center space-y-6 p-10 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
									<div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg border border-gray-50">
										<FileText className="w-10 h-10 text-[#05324f]" />
									</div>
									<div className="text-center space-y-2">
										<p className="text-xs font-black text-gray-400 uppercase tracking-widest">Protocol Metadata Analysis</p>
										<p className="text-sm font-bold text-gray-700">Audit Protocol File Type: {selectedReport.mimeType || 'PDF_STANDARD'}</p>
									</div>
									<Button
										asChild
										className="bg-[#34C759] hover:bg-[#2EB04F] text-white px-8 py-6 rounded-2xl shadow-xl shadow-[#34C759]/20 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
									>
										<a
											href={getFullUrl(selectedReport.fileUrl)}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Eye className="w-4 h-4 mr-2" />
											{t('workshop.requests.open_pdf_new_tab')}
										</a>
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</Dialog>

			<CreateOfferModal
				open={offerModalOpen}
				onOpenChange={setOfferModalOpen}
				requestId={selectedRequestIdForOffer}
				onSuccess={() => {
					fetchRequests()
					fetchWorkshopOffers()
				}}
			/>

			<ViewOfferModal
				open={viewModalOpen}
				onOpenChange={setViewModalOpen}
				offer={selectedOffer}
			/>

			<Footer className="max-lg:hidden" />
		</div>
	)
}
