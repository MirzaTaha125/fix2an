import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/Dialog'
import { CaseDetailSkeleton, WorkshopCasesListSkeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime, calculateDistance } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/ui/StatCard'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { WorkshopCasePanel } from './WorkshopCaseDetailPage'
import { CreateQuotePanel } from './CreateOfferPage'
import { getCaseTitle, getVehicleLine } from '../components/cases/caseHelpers'
import CreateOfferModal from '../components/CreateOfferModal'
import ViewOfferModal from '../components/ViewOfferModal'

import { requestsAPI, workshopAPI, offersAPI, bookingsAPI } from '../services/api'
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
	const [searchParams, setSearchParams] = useSearchParams()
	const selectedId = searchParams.get('case')
	const showQuote = searchParams.get('panel') === 'quote'
	const openCase = (requestId) => {
		const next = new URLSearchParams(searchParams)
		next.set('case', requestId)
		next.delete('panel')
		next.delete('view')
		setSearchParams(next)
	}
	const closeCase = () => {
		const next = new URLSearchParams(searchParams)
		next.delete('case')
		next.delete('panel')
		next.delete('view')
		setSearchParams(next)
	}
	const openQuote = () => {
		const next = new URLSearchParams(searchParams)
		next.set('panel', 'quote')
		setSearchParams(next)
	}
	const closeQuote = () => {
		const next = new URLSearchParams(searchParams)
		next.delete('panel')
		next.delete('view')
		setSearchParams(next)
	}
	const { user, loading: authLoading } = useAuth()
	const { t, i18n } = useTranslation()
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
	const [caseFilter, setCaseFilter] = useState('all')
	const [showAllCases, setShowAllCases] = useState(false)
	const [offerModalOpen, setOfferModalOpen] = useState(false)
	const [selectedRequestIdForOffer, setSelectedRequestIdForOffer] = useState(null)
	const [viewModalOpen, setViewModalOpen] = useState(false)
	const [selectedOffer, setSelectedOffer] = useState(null)
	const [workshopOffers, setWorkshopOffers] = useState([])
	const [completedBookings, setCompletedBookings] = useState([])

	// Redirect if not authenticated or not workshop
	useEffect(() => {
		if (!authLoading) {
			const userRole = user?.role?.toUpperCase()
			if (!user) {
				navigate('/workshop/login', { replace: true })
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

	const fetchRequests = async ({ silent = false } = {}) => {
		if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return

		try {
			const response = await requestsAPI.getAvailable()
			
			if (response.data) {
				setRequests(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			if (!silent) toast.error(error.response?.data?.message || t('errors.fetch_failed'))
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

	const fetchCompletedBookings = async () => {
		try {
			const response = await bookingsAPI.getByWorkshopMe()
			const rows = Array.isArray(response.data) ? response.data : []
			setCompletedBookings(rows.filter((booking) => {
				const bookingStatus = String(booking.status || '').toUpperCase()
				const requestStatus = String(booking.requestId?.status || '').toUpperCase()
				return bookingStatus === 'DONE' || requestStatus === 'COMPLETED'
			}))
		} catch (error) {
			console.error('Failed to fetch completed bookings:', error)
			setCompletedBookings([])
		}
	}

	useEffect(() => {
		if (user && user.role?.toUpperCase() === 'WORKSHOP') {
			fetchRequests()
			fetchWorkshopProfile()
			fetchWorkshopOffers()
			fetchCompletedBookings()
		}
	}, [user])

	useEffect(() => {
		if (!user || user.role?.toUpperCase() !== 'WORKSHOP') return undefined
		const timer = setInterval(() => {
			if (document.visibilityState !== 'visible') return
			fetchRequests({ silent: true })
			fetchWorkshopOffers()
			fetchCompletedBookings()
		}, 8000)
		return () => clearInterval(timer)
	}, [user])

	const quotePanelWasOpen = useRef(false)
	useEffect(() => {
		if (quotePanelWasOpen.current && !showQuote && user?.role?.toUpperCase() === 'WORKSHOP') {
			fetchRequests()
			fetchWorkshopOffers()
		}
		quotePanelWasOpen.current = showQuote
	}, [showQuote, user])

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
				<WorkshopShell>
				<div className="workshop-cases-page list-page-shell bg-transparent flex flex-col">
					<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 flex flex-col overflow-hidden">
						<WorkshopCasesListSkeleton />
					</div>
				</div>
				</WorkshopShell>
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

	const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

	const isRequestWithin48Hours = (request) => {
		if (!request?.createdAt) return true
		const createdAt = new Date(request.createdAt).getTime()
		if (Number.isNaN(createdAt)) return true
		return Date.now() - createdAt < FORTY_EIGHT_HOURS_MS
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
			(request.description && request.description.toLowerCase().includes(query)) ||
			(request.registrationNumber && request.registrationNumber.toLowerCase().includes(query.replace(/\s/g, '')))
		)
	}

	const searched = requests.filter((request) => matchesSearch(request))

	const hasQuoteDraft = (requestId) => {
		try {
			const raw = sessionStorage.getItem(`offer-draft-${requestId}`)
			if (!raw) return false
			const draft = JSON.parse(raw)
			return Boolean(draft && typeof draft === 'object')
		} catch {
			return false
		}
	}

	const closedFromBookings = completedBookings
		.map((booking) => {
			const request = booking.requestId && typeof booking.requestId === 'object'
				? booking.requestId
				: { _id: booking.requestId }
			const requestId = request._id || request.id || booking.requestId
			if (!requestId) return null
			return {
				...request,
				_id: requestId,
				id: requestId,
				vehicleId: request.vehicleId,
				description: request.description,
				registrationNumber: request.registrationNumber,
				offers: booking.offerId ? [booking.offerId] : [{ status: 'DONE' }],
				updatedAt: booking.updatedAt || booking.completedAt || request.updatedAt || request.createdAt,
				_completed: true,
			}
		})
		.filter(Boolean)
		.filter((item, index, list) => list.findIndex((row) => String(row._id) === String(item._id)) === index)
		.filter((request) => matchesSearch(request))

	// All = still needs a quote; Waiting = quote sent (awaiting customer)
	const allList = searched.filter((request) => (request.offers || []).length === 0)
	const waitingList = searched.filter((request) => (request.offers || []).length > 0)
	const closedList = closedFromBookings
	const draftList = searched.filter((request) => {
		const id = request._id || request.id
		return hasQuoteDraft(id) && (request.offers || []).length === 0
	})

	const filteredList = (() => {
		if (caseFilter === 'waiting') return waitingList
		if (caseFilter === 'closed') return closedList
		if (caseFilter === 'draft') return draftList
		return allList
	})()
	const mobileList = showAllCases ? filteredList : filteredList.slice(0, 4)

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

	const caseUpdatedLabel = (request) => {
		const raw = request?.updatedAt || request?.createdAt
		if (!raw) return ''
		const date = new Date(raw)
		if (Number.isNaN(date.getTime())) return ''
		const now = new Date()
		const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
		const time = date.toLocaleTimeString(i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
		if (isToday) return `${t('my_cases.flow.last_updated')}: ${t('my_cases.flow.today')} ${time}`
		return `${t('my_cases.flow.last_updated')}: ${formatDateTime(date, i18n.language)}`
	}

	return (
	<WorkshopShell>
	<div className="workshop-cases-page list-page-shell bg-transparent flex flex-col">

		{(authLoading || loading) ? (
			<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 flex flex-col overflow-hidden">
				{selectedId ? <CaseDetailSkeleton /> : <WorkshopCasesListSkeleton />}
			</div>
		) : (
		<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 overflow-hidden flex flex-col">
		<div className="flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 lg:items-stretch">
			<div className={`flex flex-col min-h-0 h-full overflow-hidden ${selectedId ? 'max-lg:hidden' : ''}`}>
			<div className="mb-5 shrink-0">
				<h1 className="page-title">
					{t('workshop.panel.nav.cases')}
				</h1>
				<p className="text-sm text-[#6B7280] mt-2">
					{t('workshop.panel.cases_sub')}
				</p>
			</div>

			<div className="shrink-0 flex w-full border-b border-gray-200 mb-2 pt-2">
				{[
					['all', t('workshop.panel.filter_all'), allList.length],
					['waiting', t('workshop.panel.filter_waiting'), waitingList.length],
					['draft', t('workshop.panel.filter_draft'), draftList.length],
					['closed', t('workshop.panel.filter_closed'), closedList.length],
				].map(([key, label, count]) => (
					<button
						key={key}
						type="button"
						onClick={() => setCaseFilter(key)}
						className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${caseFilter === key ? 'text-[#008037] border-[#008037]' : 'text-[#9CA3AF] border-transparent'}`}
					>
						<span className="block truncate">{label} ({count})</span>
					</button>
				))}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain mt-4 space-y-3 pb-2">
				{mobileList.length === 0 ? (
					<EmptyState
						title={
							caseFilter === 'draft'
								? t('common.empty.workshop_drafts_title')
								: caseFilter === 'closed'
									? t('common.empty.workshop_closed_title')
									: caseFilter === 'waiting'
										? t('common.empty.workshop_waiting_title')
										: t('common.empty.workshop_requests_title')
						}
						description={
							caseFilter === 'draft'
								? t('common.empty.workshop_drafts_desc')
								: caseFilter === 'closed'
									? t('common.empty.workshop_closed_desc')
									: caseFilter === 'waiting'
										? t('common.empty.workshop_waiting_desc')
										: t('common.empty.workshop_requests_desc')
						}
					/>
				) : (
					mobileList.map((request) => {
						const requestId = request._id || request.id
						const selected = String(selectedId) === String(requestId)
						const shortId = String(requestId || '').slice(-4).toUpperCase()
						const isCompleted = Boolean(request._completed)
						const hasOffer = (request.offers || []).length > 0
						const isDraft = !isCompleted && !hasOffer && hasQuoteDraft(requestId)
						const vehicle = request.vehicleId || request.vehicle
						const vehicleRequest = vehicle && vehicle !== request.vehicleId ? { ...request, vehicleId: vehicle } : request
						return (
							<button
								key={`m-${requestId}`}
								type="button"
								onClick={() => openCase(requestId)}
								className={`w-full text-left rounded-2xl border bg-white p-4 flex items-center gap-3 transition-colors ${
									selected ? 'border-[#008037] bg-[#F0F7F2]' : 'border-gray-100 hover:border-gray-200'
								}`}
							>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] text-gray-400 mb-2">{t('my_cases.flow.case_no', { id: shortId })}</p>
									<p className="font-bold text-brand-dark text-[15px] leading-snug line-clamp-2">{getCaseTitle(request)}</p>
									<p className="text-sm text-[#374151] mt-1">{getVehicleLine(vehicleRequest)}</p>
									<p className="text-xs text-[#6B7280] mt-2">{caseUpdatedLabel(request)}</p>
								</div>
								<div className="shrink-0 self-stretch relative flex items-center pl-1 min-w-[5.5rem]">
									<span className={`absolute top-0 right-0 whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
										isCompleted
											? 'bg-[#ECFDF5] text-[#008037] border-[#86EFAC]'
											: hasOffer
												? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
												: isDraft
													? 'bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]'
													: 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
									}`}>
										{isCompleted
											? t('workshop.panel.completed_badge')
											: hasOffer
												? t('workshop.panel.offer_sent')
												: isDraft
													? t('workshop.panel.draft_badge')
													: t('workshop.panel.new_badge')}
									</span>
									<ChevronRight className="w-5 h-5 text-brand-dark ml-auto" />
								</div>
							</button>
						)
					})
				)}
			</div>
			{!showAllCases && filteredList.length > 4 && (
				<button
					type="button"
					onClick={() => setShowAllCases(true)}
					className="shrink-0 w-full mt-4 min-h-[52px] rounded-xl border border-[#008037] bg-white text-sm font-semibold text-[#008037] hover:bg-[#F3FBF6]"
				>
					{t('workshop.panel.view_all_cases')}
				</button>
			)}
			</div>

			<div className={selectedId ? 'min-w-0 min-h-0 h-full overflow-y-auto no-scrollbar overscroll-contain' : 'hidden lg:block min-w-0 h-full'}>
				{selectedId ? (
					<>
						<div className={showQuote ? 'hidden' : ''} aria-hidden={showQuote}>
							<WorkshopCasePanel
								requestId={selectedId}
								embedded
								onBack={closeCase}
								suspendBack={showQuote}
								onCreateQuote={openQuote}
								quoteSent={(requests.find((request) => String(request._id || request.id) === String(selectedId))?.offers || []).length > 0}
								quote={workshopOffers.find((offer) => {
									const offerRequestId = offer.requestId?._id || offer.requestId?.id || offer.requestId
									return String(offerRequestId) === String(selectedId)
								}) || null}
							/>
						</div>
						{showQuote ? (
							<CreateQuotePanel requestId={selectedId} onBack={closeQuote} />
						) : null}
					</>
				) : (
					<div className="h-full min-h-[280px] flex items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 text-center">
						<p className="text-sm text-[#9CA3AF]">{t('workshop.panel.select_case')}</p>
					</div>
				)}
			</div>

		</div>
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
										className="bg-[#008037] hover:bg-[#2EB04F] text-white px-8 py-6 rounded-xl shadow-xl shadow-[#008037]/20 font-semibold uppercase tracking-widest text-xs transition-all active:scale-95"
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

		</div>
	</WorkshopShell>
	)
}
