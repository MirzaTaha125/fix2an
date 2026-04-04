import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog'
import { Textarea } from '../components/ui/Textarea'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { adminAPI, authAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import Logo from '../components/Logo'
import {
	Users,
	Building2,
	FileText,
	DollarSign,
	TrendingUp,
	CheckCircle,
	XCircle,
	Clock,
	AlertTriangle,
	Search,
	Ban,
	Unlock,
	Shield,
	Calendar,
	Package,
	CreditCard,
	RefreshCw,
	LogOut,
	ChevronDown,
	Menu,
	X,
	Filter,
	User,
	Mail,
	Phone,
	MapPin,
	Eye,
	Car,
	ExternalLink,
	Smartphone,
	Wrench,
	FileX,
	ShieldAlert,
	ShieldOff,
	UserCircle,
	Fingerprint,
	Receipt
} from 'lucide-react'

export default function AdminPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, logout } = useAuth()
	const { t } = useTranslation()
	const [searchParams, setSearchParams] = useSearchParams()
	const activeTab = searchParams.get('tab') || 'dashboard'
	const [loading, setLoading] = useState(true)
	const [listLoading, setListLoading] = useState(false)
	const [stats, setStats] = useState({
		totalCustomers: 0,
		totalWorkshops: 0,
		pendingWorkshops: 0,
		totalRequests: 0,
		totalBookings: 0,
	})
	
	// Data states
	const [customers, setCustomers] = useState([])
	const [workshops, setWorkshops] = useState([])
	const [requests, setRequests] = useState([])
	const [offers, setOffers] = useState([])
	const [bookings, setBookings] = useState([])
	
	// Filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
	
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [workshopActionConfirm, setWorkshopActionConfirm] = useState({ open: false, workshopId: null, action: null, workshopName: '' })
	const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
	const [rejectionReason, setRejectionReason] = useState('')
	const [selectedWorkshopForRejection, setSelectedWorkshopForRejection] = useState(null)
	const mobileMenuRef = useRef(null)
	const [emailConfig, setEmailConfig] = useState({
		provider: 'smtp',
		host: '', port: 587, user: '', password: '', from: '', secure: false,
		emailjsUserId: '', emailjsServiceId: '', emailjsTemplateId: '', emailjsPrivateKey: '',
	})
	const [emailConfigSaving, setEmailConfigSaving] = useState(false)
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
	const [twoFactorSetup, setTwoFactorSetup] = useState({ qrCode: '', secret: '' })
	const [twoFactorCode, setTwoFactorCode] = useState('')
	const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('')
	const [twoFactorDisableCode, setTwoFactorDisableCode] = useState('')
	const [twoFactorLoading, setTwoFactorLoading] = useState(false)
	const [selectedBooking, setSelectedBooking] = useState(null)
	const [bookingDetailModalOpen, setBookingDetailModalOpen] = useState(false)
	const [selectedRequest, setSelectedRequest] = useState(null)
	const [requestDetailModalOpen, setRequestDetailModalOpen] = useState(false)
	const [selectedOffer, setSelectedOffer] = useState(null)
	const [offerDetailModalOpen, setOfferDetailModalOpen] = useState(false)

	// Redirect if not authenticated or not admin
	useEffect(() => {
		if (!authLoading) {
			const userRole = user?.role?.toUpperCase()
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (userRole !== 'ADMIN') {
				if (userRole === 'WORKSHOP') {
					navigate('/workshop/requests', { replace: true })
				} else {
					navigate('/my-cases', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
				setMobileMenuOpen(false)
			}
		}

		if (mobileMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [mobileMenuOpen])

	useEffect(() => {
		if (user && user.role?.toUpperCase() === 'ADMIN') {
			fetchStats()
			if (activeTab === 'dashboard') {
				fetchPendingWorkshops()
			}
		}
		if (activeTab === 'settings') {
			fetchEmailConfig()
			fetch2FAStatus()
		}
	}, [user, activeTab])

	// Update data when filters change
	useEffect(() => {
		if (user && user.role?.toUpperCase() === 'ADMIN') {
			// For customers tab, add a small debounce to avoid too many API calls while typing
			if (activeTab === 'settings') return
			if (activeTab === 'customers') {
				const timeoutId = setTimeout(() => fetchTabData(), 200)
				return () => clearTimeout(timeoutId)
			}
			fetchTabData()
		}
	}, [activeTab, searchQuery, statusFilter, pagination.page, user])

	const fetchStats = async () => {
		try {
			const response = await adminAPI.getStats()
			if (response.data) {
				setStats(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchEmailConfig = async () => {
		try {
			const response = await adminAPI.getEmailConfig()
			if (response.data) {
				setEmailConfig({
					provider: response.data.provider || 'smtp',
					host: response.data.host || '',
					port: response.data.port ?? 587,
					user: response.data.user || '',
					password: '',
					from: response.data.from || '',
					secure: response.data.secure ?? false,
					emailjsUserId: response.data.emailjsUserId || '',
					emailjsServiceId: response.data.emailjsServiceId || '',
					emailjsTemplateId: response.data.emailjsTemplateId || '',
					emailjsPrivateKey: '',
				})
			}
		} catch (error) {
			console.error('Failed to fetch email config:', error)
			toast.error(t('admin.settings.fetch_error'))
		}
	}

	const handleUpdateEmailConfig = async () => {
		setEmailConfigSaving(true)
		try {
			const payload = {
				provider: emailConfig.provider,
				host: emailConfig.host,
				port: emailConfig.port,
				user: emailConfig.user,
				from: emailConfig.from,
				secure: emailConfig.secure,
				emailjsUserId: emailConfig.emailjsUserId,
				emailjsServiceId: emailConfig.emailjsServiceId,
				emailjsTemplateId: emailConfig.emailjsTemplateId,
			}
			if (emailConfig.password) payload.password = emailConfig.password
			if (emailConfig.emailjsPrivateKey) payload.emailjsPrivateKey = emailConfig.emailjsPrivateKey
			const response = await adminAPI.updateEmailConfig(payload)
			if (response.data) {
				setEmailConfig({ ...response.data, password: '' })
				toast.success(t('admin.settings.saved'))
			}
		} catch (error) {
			toast.error(error.response?.data?.message || t('admin.settings.save_error'))
		} finally {
			setEmailConfigSaving(false)
		}
	}

	const fetch2FAStatus = async () => {
		try {
			const response = await authAPI.get2FAStatus()
			if (response.data) setTwoFactorEnabled(!!response.data.twoFactorEnabled)
		} catch {
			setTwoFactorEnabled(false)
		}
	}

	const handleStart2FASetup = async () => {
		setTwoFactorLoading(true)
		try {
			const response = await authAPI.get2FASetup()
			if (response.data?.qrCode) {
				setTwoFactorSetup({ qrCode: response.data.qrCode, secret: response.data.secret || '' })
				setTwoFactorCode('')
			}
		} catch (err) {
			toast.error(err.response?.data?.message || t('admin.settings.twofa_setup_error'))
		} finally {
			setTwoFactorLoading(false)
		}
	}

	const handleVerify2FASetup = async () => {
		if (!/^\d{6}$/.test(twoFactorCode)) {
			toast.error(t('admin.settings.twofa_verify_error'))
			return
		}
		setTwoFactorLoading(true)
		try {
			await authAPI.verify2FASetup({ code: twoFactorCode })
			setTwoFactorEnabled(true)
			setTwoFactorSetup({ qrCode: '', secret: '' })
			setTwoFactorCode('')
			toast.success(t('admin.settings.twofa_enabled_success'))
		} catch (err) {
			toast.error(err.response?.data?.message || t('admin.settings.twofa_verify_error'))
		} finally {
			setTwoFactorLoading(false)
		}
	}

	const handleDisable2FA = async () => {
		if (!twoFactorDisablePassword || !/^\d{6}$/.test(twoFactorDisableCode)) {
			toast.error(t('errors.fill_all_fields'))
			return
		}
		setTwoFactorLoading(true)
		try {
			await authAPI.disable2FA({ password: twoFactorDisablePassword, code: twoFactorDisableCode })
			setTwoFactorEnabled(false)
			setTwoFactorDisablePassword('')
			setTwoFactorDisableCode('')
			toast.success(t('admin.settings.twofa_disabled_success'))
		} catch (err) {
			toast.error(err.response?.data?.message || t('admin.settings.save_error'))
		} finally {
			setTwoFactorLoading(false)
		}
	}

	const fetchPendingWorkshops = async () => {
		try {
			const response = await adminAPI.getPendingWorkshops()
			if (response.data) {
				setWorkshops(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch pending workshops:', error)
		}
	}

	const fetchTabData = async () => {
		setListLoading(true)
		try {
			const params = {}
			if (searchQuery) params.search = searchQuery
			if (statusFilter !== 'all') {
				if (activeTab === 'customers') {
					if (statusFilter === 'active') params.isActive = 'true'
					else if (statusFilter === 'inactive') params.isActive = 'false'
				} else if (activeTab === 'workshops' && statusFilter === 'pending') {
					params.verified = 'false'
				} else {
					params.status = statusFilter
				}
			}
			params.page = pagination.page
			params.limit = pagination.limit

			let response
			switch (activeTab) {
				case 'customers':
					response = await adminAPI.getUsers(params)
					if (response.data) {
						setCustomers(response.data.users || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'workshops':
					response = await adminAPI.getWorkshops(params)
					if (response.data) {
						setWorkshops(response.data.workshops || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'requests':
					response = await adminAPI.getRequests(params)
					if (response.data) {
						setRequests(response.data.requests || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'offers':
					response = await adminAPI.getOffers(params)
					if (response.data) {
						setOffers(response.data.offers || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'bookings':
					response = await adminAPI.getBookings(params)
					if (response.data) {
						setBookings(response.data.bookings || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
					break
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('common.could_not_fetch'))
		} finally {
			setListLoading(false)
		}
	}

	const confirmWorkshopAction = (workshopId, action, workshopName = '') => {
		if (action === 'approve') {
			setWorkshopActionConfirm({ open: true, workshopId, action, workshopName })
		} else if (action === 'reject') {
			setSelectedWorkshopForRejection({ id: workshopId, name: workshopName })
			setRejectionReason('')
			setRejectionDialogOpen(true)
		} else {
			handleWorkshopAction(workshopId, action)
		}
	}

	const handleRejectWithReason = async () => {
		if (!rejectionReason.trim()) {
			toast.error(t('admin.workshops.reason_required') || 'Please provide a reason')
			return
		}
		
		const workshopId = selectedWorkshopForRejection.id
		setRejectionDialogOpen(false)
		
		try {
			const response = await adminAPI.updateWorkshop({ 
				id: workshopId, 
				verificationStatus: 'REJECTED',
				rejectionReason: rejectionReason,
				isVerified: false
			})

			if (response.data) {
				toast.success(t('common.workshop_rejected') || 'Workshop rejected')
				setWorkshops((prev) => prev.filter((w) => (w.id || w._id) !== workshopId))
				fetchStats()
				if (activeTab !== 'dashboard') fetchTabData()
				else fetchPendingWorkshops()
			}
		} catch (error) {
			toast.error(t('common.failed_update_workshop'))
		}
	}

	const handleWorkshopAction = async (workshopId, action) => {
		setWorkshopActionConfirm({ open: false, workshopId: null, action: null, workshopName: '' })
		try {
			let updateData = {}
			if (action === 'approve') updateData.isVerified = true
			if (action === 'reject') updateData.isVerified = false
			if (action === 'block') updateData.isActive = false
			if (action === 'unblock') updateData.isActive = true

			const response = await adminAPI.updateWorkshop({ id: workshopId, ...updateData })

			if (response.data) {
				const actionKey = action === 'approve' ? 'workshop_approved' : action === 'reject' ? 'workshop_rejected' : action === 'block' ? 'workshop_blocked' : 'workshop_unblocked'
				toast.success(t(`common.${actionKey}`))
				
				// Immediately remove from pending workshops list if approve/reject
				if (action === 'approve' || action === 'reject') {
					setWorkshops((prev) => prev.filter((w) => w.id !== workshopId))
				}
				
				// Update stats and tab data
				fetchStats()
				if (activeTab !== 'dashboard') {
					fetchTabData()
				} else {
					// Refresh pending workshops for dashboard
					fetchPendingWorkshops()
				}
			}
		} catch (error) {
			toast.error(t('common.failed_update_workshop'))
		}
	}

	const handleToggleUserStatus = async (user) => {
		try {
			const newStatus = !user.isActive
			await adminAPI.updateUser(user.id, { isActive: newStatus })
			
			// Update local state
			setCustomers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u))
			
			const statusMsg = newStatus ? (t('admin.customers.active_success') || 'User activated') : (t('admin.customers.inactive_success') || 'User deactivated')
			toast.success(statusMsg)
		} catch (error) {
			console.error('Toggle user status error:', error)
			toast.error(t('admin.customers.update_failed') || 'Failed to update user status')
		}
	}

	const CustomerCard = ({ customer }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center">
						<User className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<h4 className="font-semibold text-gray-900 leading-tight truncate">{customer.name || 'User'}</h4>
						<p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">ID: {customer.id.substring(0, 8)}</p>
					</div>
				</div>
				<Badge 
					className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
					style={customer.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : { backgroundColor: '#E5E7EB', color: '#6B7280' }}
				>
					{customer.isActive ? t('admin.customers.active') : t('admin.customers.inactive')}
				</Badge>
			</div>
			
			<div className="space-y-2 mb-4 text-xs">
				<div className="flex items-center gap-2 text-gray-600">
					<Mail className="w-3.5 h-3.5 text-gray-300" />
					<span className="truncate">{customer.email}</span>
				</div>
				{customer.phone && (
					<div className="flex items-center gap-2 text-gray-600">
						<Phone className="w-3.5 h-3.5 text-gray-300" />
						<span>{customer.phone}</span>
					</div>
				)}
				<div className="flex items-center gap-2 text-gray-600 font-medium">
					<FileText className="w-3.5 h-3.5 text-gray-300" />
					<span>{customer._count?.requests || 0} {t('admin.customers.requests_label') || 'Requests'}</span>
				</div>
			</div>

			<Button 
				variant="outline" 
				className="w-full text-[10px] font-semibold h-8 border-gray-100 hover:bg-gray-50 uppercase tracking-widest"
				onClick={() => handleToggleUserStatus(customer)}
			>
				{t('admin.customers.toggle_status') || 'Change Status'}
			</Button>
		</div>
	)

	const PendingWorkshopCard = ({ workshop }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center">
						<Building2 className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<h4 className="font-semibold text-gray-900 leading-tight truncate">{workshop.companyName}</h4>
						<p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">Reg: {formatDate(new Date(workshop.createdAt))}</p>
					</div>
				</div>
				<Badge className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
					{t('common.pending')}
				</Badge>
			</div>
			
			<div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
				<Mail className="w-3.5 h-3.5 text-gray-300" />
				<span className="truncate">{workshop.email}</span>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button 
					variant="outline" 
					className="flex-1 min-w-[70px] text-[10px] font-semibold h-8 border-gray-100 uppercase tracking-tight"
					onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
				>
					{t('admin.workshops.view_details_short')}
				</Button>
				<Button 
					variant="outline" 
					className="flex-1 min-w-[70px] text-[10px] font-semibold h-8 border-green-100 text-green-600 hover:bg-green-50 uppercase tracking-tight"
					onClick={() => confirmWorkshopAction(workshop.id, 'approve', workshop.companyName)}
				>
					{t('admin.workshops.approve_short')}
				</Button>
				<Button 
					variant="outline" 
					className="flex-1 min-w-[70px] text-[10px] font-semibold h-8 border-red-100 text-red-600 hover:bg-red-50 uppercase tracking-tight"
					onClick={() => confirmWorkshopAction(workshop.id || workshop._id, 'reject', workshop.companyName)}
				>
					{t('admin.workshops.reject_short')}
				</Button>
			</div>
		</div>
	)

	const WorkshopCard = ({ workshop }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center">
						<Building2 className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5">
							<h4 className="font-semibold text-gray-900 leading-tight truncate">{workshop.companyName}</h4>
							{workshop.isVerified && <CheckCircle className="w-3.5 h-3.5 text-[#34C759] flex-shrink-0" />}
						</div>
						<p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">Org: {workshop.organizationNumber}</p>
					</div>
				</div>
				<div className="flex flex-col items-end gap-1">
					<Badge 
						className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
						style={workshop.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : { backgroundColor: '#EF4444', color: '#FFFFFF' }}
					>
						{workshop.isActive ? t('admin.workshops.active') : t('admin.workshops.blocked')}
					</Badge>
				</div>
			</div>
			
			<div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
				<Mail className="w-3.5 h-3.5 text-gray-300" />
				<span className="truncate">{workshop.email}</span>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button 
					variant="outline" 
					className="flex-1 min-w-[100px] text-[10px] font-semibold h-8 border-gray-100 uppercase tracking-widest"
					onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
				>
					{t('admin.workshops.view_details_short')}
				</Button>
				{workshop.isActive ? (
					<Button 
						variant="outline" 
						className="flex-1 min-w-[100px] text-[10px] font-semibold h-8 border-red-100 text-red-600 hover:bg-red-50 uppercase tracking-widest"
						onClick={() => handleWorkshopAction(workshop.id, 'block')}
					>
						{t('admin.workshops.block_short')}
					</Button>
				) : (
					<Button 
						variant="outline" 
						className="flex-1 min-w-[100px] text-[10px] font-semibold h-8 border-green-100 text-green-600 hover:bg-green-50 uppercase tracking-widest"
						onClick={() => handleWorkshopAction(workshop.id, 'unblock')}
					>
						{t('admin.workshops.unblock_short')}
					</Button>
				)}
			</div>
		</div>
	)

	const RequestCard = ({ request }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center">
						<FileText className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<h4 className="font-semibold text-gray-900 leading-tight truncate">
							{request.vehicle?.make} {request.vehicle?.model}
						</h4>
						<p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">Year: {request.vehicle?.year}</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button 
						variant="outline" 
						size="sm" 
						className="h-7 w-7 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] transition-all"
						onClick={(e) => {
							e.stopPropagation()
							setSelectedRequest(request)
							setRequestDetailModalOpen(true)
						}}
					>
						<Eye className="w-3.5 h-3.5" />
					</Button>
					<Badge
						className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-none"
						style={
							request.status === 'COMPLETED' || request.status === 'BOOKED'
								? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
								: request.status === 'EXPIRED' || request.status === 'CANCELLED'
								? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
								: request.status === 'NEW' || request.status === 'IN_BIDDING'
								? { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
								: { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#F3F4F6' }
						}
					>
						{request.status === 'NEW' ? t('admin.requests.new') : request.status === 'IN_BIDDING' ? t('admin.requests.in_bidding') : request.status === 'BIDDING_CLOSED' ? t('admin.requests.bidding_closed') : request.status === 'BOOKED' ? t('admin.requests.booked') : request.status === 'COMPLETED' ? t('admin.requests.completed') : request.status === 'CANCELLED' ? t('admin.requests.cancelled') : request.status === 'EXPIRED' ? t('workshop.proposals.status.expired') : request.status}
					</Badge>
				</div>
			</div>

			{/* Cancellation/Expiration Notice */}
			{request.status === 'CANCELLED' && (
				<div className="mb-4 p-3 bg-red-50/50 border-l-4 border-red-500 rounded-r-xl">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
						<div className="flex-1">
							<p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-0.5">
								{request.cancelledBy === 'ADMIN' ? 'Cancelled by Admin' : 'Cancelled by Customer'}
							</p>
							<p className="text-xs text-red-800 font-medium italic leading-tight">
								"{request.cancellationReason || 'No reason provided'}"
							</p>
						</div>
					</div>
				</div>
			)}
			{request.status === 'EXPIRED' && (
				<div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r-xl">
					<div className="flex items-center gap-3">
						<Clock className="w-4 h-4 text-gray-500 shrink-0" />
						<div className="flex-1">
							<p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Automatic Expiration</p>
							<p className="text-xs text-gray-600 font-medium leading-tight">
								This request reached its 14-day bidding limit.
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="space-y-2 mb-3 text-xs">
				<div className="flex items-center gap-2 text-gray-600">
					<User className="w-3.5 h-3.5 text-gray-300" />
					<span className="truncate font-medium">{request.customer?.name || request.customer?.email}</span>
				</div>
				<div className="flex items-center gap-2 text-gray-600">
					<MapPin className="w-3.5 h-3.5 text-gray-300" />
					<span className="truncate">{request.city}, {request.address}</span>
				</div>
				<div className="flex items-center gap-2 text-gray-400 font-medium tracking-tight">
					<Calendar className="w-3.5 h-3.5 opacity-50" />
					<span>{formatDate(new Date(request.createdAt))}</span>
				</div>
			</div>

			<div className="flex items-center justify-between pt-3 border-t border-gray-50">
				<div className="flex items-center gap-1.5">
					<div className="w-2 h-2 rounded-full bg-[#34C759]"></div>
					<span className="text-[10px] font-semibold text-[#34C759] uppercase tracking-widest">{request._count?.offers || 0} {t('admin.requests.offers')}</span>
				</div>
				<div 
					className="flex items-center gap-1.5 text-[9px] font-bold text-[#34C759] uppercase tracking-widest cursor-pointer hover:translate-x-1 transition-transform"
					onClick={() => {
						setSelectedRequest(request)
						setRequestDetailModalOpen(true)
					}}
				>
					Details <TrendingUp className="w-3 h-3" />
				</div>
			</div>
		</div>
	)

	const RequestDetailDialog = () => {
		if (!selectedRequest) return null
		const vehicle = selectedRequest.vehicle

		return (
			<Dialog 
				open={requestDetailModalOpen} 
				onOpenChange={setRequestDetailModalOpen}
			>
				<DialogContent className="w-[95vw] md:w-[80vw] lg:w-[50vw] max-h-[95vh] overflow-y-auto custom-scrollbar border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-300">
					<Button 
						variant="ghost" 
						size="icon" 
						className="absolute right-8 top-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all z-50 h-10 w-10 shadow-sm border border-gray-100"
						onClick={() => setRequestDetailModalOpen(false)}
					>
						<X className="w-5 h-5" />
					</Button>
					
					<DialogHeader className="p-10 pb-6 border-b border-gray-50 bg-white">
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<DialogTitle className="text-2xl font-black text-[#05324f] tracking-tight uppercase">
										Request Oversight
									</DialogTitle>
									<Badge
										className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
										style={
											selectedRequest.status === 'IN_BIDDING'
												? { backgroundColor: '#34C759', color: 'white' }
												: selectedRequest.status === 'CANCELLED'
												? { backgroundColor: '#FF3B30', color: 'white' }
												: { backgroundColor: '#007AFF', color: 'white' }
										}
									>
										{selectedRequest.status}
									</Badge>
								</div>
								<DialogDescription className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
									Ref: {selectedRequest.id} • Registered: {formatDate(new Date(selectedRequest.createdAt))}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-10 space-y-8 bg-gray-50/30">
						{/* Master Identity Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
							{/* Client Identity Card */}
							<div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
									<UserCircle className="w-4 h-4 text-[#007AFF]" /> Client Identity
								</p>
								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-sm">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">Account Holder</p>
											<p className="text-lg font-black text-[#05324f]">{selectedRequest.customer?.name}</p>
										</div>
									</div>
									<div className="pt-4 border-t border-gray-50 grid grid-cols-1 gap-3">
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600 truncate">
											<Mail className="w-4 h-4 text-gray-300" /> {selectedRequest.customer?.email}
										</div>
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600">
											<Smartphone className="w-4 h-4 text-gray-300" /> {selectedRequest.customer?.phone || 'N/A'}
										</div>
									</div>
								</div>
							</div>

							{/* Vehicle Hub Card - Elite Standard */}
							<div className="bg-[#05324f] p-6 rounded-3xl text-white shadow-xl shadow-[#05324f]/20 relative overflow-hidden flex flex-col justify-between h-full">
								<div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
								<p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5 flex items-center gap-3 relative z-10">
									<Car className="w-4 h-4 text-[#34C759]" /> Vehicle Identity
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Manufacturer</p>
										<p className="text-lg font-black uppercase tracking-tight text-white/90">{vehicle.make}</p>
									</div>
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Model Basis</p>
										<p className="text-lg font-black uppercase tracking-tight text-white/90">{vehicle.model}</p>
									</div>
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-[#34C759] uppercase tracking-widest mb-1.5 opacity-80">Production Cycle</p>
										<p className="text-lg font-black tracking-tight text-[#34C759]">{vehicle.year}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Request Briefing & Action Location */}
						<div className="flex flex-col gap-6">
							<div className="w-full space-y-6">
								<div className="p-8 border border-gray-100 rounded-[2rem] bg-white shadow-sm hover:shadow-md transition-shadow">
									<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
										<Wrench className="w-4 h-4 text-[#05324f]" /> Core Briefing Description
									</p>
									<p className="text-sm text-gray-700 leading-relaxed font-semibold italic p-6 bg-gray-50/50 rounded-2xl border-l-[6px] border-[#05324f]">
										"{selectedRequest.description || 'No specific description provided by the client.'}"
									</p>
								</div>
								
								<div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
									<p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
										<MapPin className="w-4 h-4 text-red-500" /> Operational Geo-Marker
									</p>
									<p className="text-sm font-black text-[#05324f] uppercase tracking-tight pl-6 leading-none">
										{selectedRequest.address}, {selectedRequest.city}
									</p>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	const OfferCard = ({ offer }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center">
						<Package className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<h4 className="font-semibold text-gray-900 leading-tight truncate">{offer.workshop?.companyName}</h4>
						<p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">
							{offer.request?.vehicleId?.make} {offer.request?.vehicleId?.model}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button 
						variant="outline" 
						size="sm" 
						className="h-7 w-7 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] transition-all"
						onClick={(e) => {
							e.stopPropagation()
							setSelectedOffer(offer)
							setOfferDetailModalOpen(true)
						}}
					>
						<Eye className="w-3.5 h-3.5" />
					</Button>
					<Badge
						className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-none"
						style={
							offer.status === 'ACCEPTED'
								? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
								: offer.status === 'CANCELLED' || offer.status === 'EXPIRED' || offer.status === 'DECLINED'
								? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
								: offer.status === 'SENT'
								? { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
								: { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#F3F4F6' }
						}
					>
						{offer.status === 'SENT' ? t('workshop.proposals.status.sent') : offer.status === 'ACCEPTED' ? t('workshop.proposals.status.accepted') : offer.status === 'DECLINED' ? t('workshop.proposals.status.declined') : offer.status === 'EXPIRED' ? t('workshop.proposals.status.expired') : offer.status === 'CANCELLED' ? t('workshop.proposals.status.cancelled') : offer.status}
					</Badge>
				</div>
			</div>

			{/* Expiration Notice */}
			{offer.status === 'EXPIRED' && (
				<div className="mb-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r-xl">
					<div className="flex items-center gap-3">
						<Clock className="w-4 h-4 text-gray-500 shrink-0" />
						<div className="flex-1">
							<p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Offer Expired</p>
							<p className="text-xs text-gray-600 font-medium leading-tight">
								This offer was automatically closed because the request expired or another workshop was booked.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Cancellation Notice */}
			{offer.status === 'CANCELLED' && (
				<div className="mb-4 p-3 bg-red-50/50 border-l-4 border-red-500 rounded-r-xl animate-in fade-in slide-in-from-left-4 duration-500">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
						<div className="flex-1">
							<p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-0.5">
								{offer.cancelledBy === 'WORKSHOP' ? 'Cancelled by Workshop' : 'Cancelled by Customer'}
							</p>
							<p className="text-xs text-red-800 font-medium italic leading-tight">
								"{offer.cancellationReason || 'No reason provided'}"
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="space-y-2.5 mb-4">
				<div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-50">
					<span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Price</span>
					<span className="text-lg font-black text-[#34C759] tracking-tighter">
						{formatPrice(offer.price)}
					</span>
				</div>
				
				<div className="grid grid-cols-3 gap-2 px-1">
					<div className="text-center">
						<p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Labor</p>
						<p className="text-[10px] font-semibold text-gray-700">{formatPrice(offer.laborCost || 0)}</p>
					</div>
					<div className="text-center border-l border-gray-100">
						<p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Parts</p>
						<p className="text-[10px] font-semibold text-gray-700">{formatPrice(offer.partsCost || 0)}</p>
					</div>
					<div className="text-center border-l border-gray-100">
						<p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">VAT</p>
						<p className="text-[10px] font-semibold text-gray-700">{formatPrice(offer.vat || 0)}</p>
					</div>
				</div>
			</div>

			<div className="pt-3 border-t border-gray-50 flex justify-between items-center text-[9px] text-gray-300 font-medium">
				<div className="flex items-center gap-1.5 uppercase tracking-tight">
					<Calendar className="w-3 h-3 opacity-50" />
					{formatDate(new Date(offer.createdAt))}
				</div>
				<div 
					className="flex items-center gap-1.5 text-[9px] font-bold text-[#34C759] uppercase tracking-widest cursor-pointer hover:translate-x-1 transition-transform"
					onClick={() => {
						setSelectedOffer(offer)
						setOfferDetailModalOpen(true)
					}}
				>
					Details <TrendingUp className="w-3 h-3" />
				</div>
			</div>
		</div>
	)

	const OfferDetailDialog = () => {
		if (!selectedOffer) return null
		const vehicle = selectedOffer.request?.vehicleId

		return (
			<Dialog 
				open={offerDetailModalOpen} 
				onOpenChange={setOfferDetailModalOpen}
			>
				<DialogContent className="w-[95vw] md:w-[80vw] lg:w-[50vw] max-h-[95vh] overflow-y-auto custom-scrollbar border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-300">
					<Button 
						variant="ghost" 
						size="icon" 
						className="absolute right-8 top-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all z-50 h-10 w-10 shadow-sm border border-gray-100"
						onClick={() => setOfferDetailModalOpen(false)}
					>
						<X className="w-5 h-5" />
					</Button>
					<DialogHeader className="p-10 pb-6 border-b border-gray-50 bg-white">
						<div className="flex items-center justify-between pr-8">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<DialogTitle className="text-2xl font-black text-[#05324f] tracking-tight uppercase px-4 md:px-0">
										Offer Detail Oversight
									</DialogTitle>
									<Badge
										className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
										style={
											selectedOffer.status === 'ACCEPTED'
												? { backgroundColor: '#34C759', color: 'white' }
												: selectedOffer.status === 'CANCELLED' || selectedOffer.status === 'EXPIRED'
												? { backgroundColor: '#FF3B30', color: 'white' }
												: { backgroundColor: '#007AFF', color: 'white' }
										}
									>
										{selectedOffer.status}
									</Badge>
								</div>
								<DialogDescription className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 md:px-0">
									Offer ID: {selectedOffer.id} • Registered: {formatDate(new Date(selectedOffer.createdAt))}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-10 space-y-10 bg-gray-50/30">
						{/* Strategic Identity Center */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div className="space-y-6">
								{/* Workshop Party Card */}
								<div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-full">
									<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
										<Building2 className="w-4 h-4 text-[#34C759]" /> Service Entity Identification
									</p>
									<div className="space-y-5 flex-1">
										<div className="flex items-center gap-5">
											<div className="w-14 h-14 rounded-3xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759] shadow-inner">
												<Building2 className="w-8 h-8" />
											</div>
											<div>
												<p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 opacity-60">Contractor Name</p>
												<span className="text-lg font-black text-[#05324f] uppercase tracking-tight">{selectedOffer.workshop?.companyName}</span>
											</div>
										</div>
										<div className="pt-6 border-t border-gray-50 grid grid-cols-1 gap-4">
											<div className="flex items-center gap-3 text-xs font-black text-gray-600 truncate bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
												<Mail className="w-4 h-4 text-gray-300" /> {selectedOffer.workshop?.email}
											</div>
											<div className="flex items-center gap-3 text-xs font-black text-gray-600 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
												<Phone className="w-4 h-4 text-gray-300" /> {selectedOffer.workshop?.phone || 'N/A PERSISTENT_LINE'}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="space-y-6">
								{/* Vehicle Specs Section */}
								{vehicle && (
									<div className="p-8 bg-[#05324f] border border-[#05324f] text-white rounded-[2.5rem] flex flex-col h-full shadow-2xl shadow-[#05324f]/20 relative overflow-hidden">
										<div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-4xl" />
										<p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
											<Car className="w-4 h-4 text-[#34C759]" /> Destination Vehicle Hub
										</p>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 w-full">
											<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
												<p className="text-[8px] font-black text-white/30 uppercase tracking-widest opacity-60 leading-none mb-1.5">Manufacturer</p>
												<p className="text-sm font-black text-white/90 uppercase tracking-widest">{vehicle.make}</p>
											</div>
											<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
												<p className="text-[8px] font-black text-white/30 uppercase tracking-widest opacity-60 leading-none mb-1.5">Model Basis</p>
												<p className="text-sm font-black text-white/90 uppercase tracking-widest">{vehicle.model}</p>
											</div>
											<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
												<p className="text-[8px] font-black text-[#34C759] uppercase tracking-widest leading-none mb-1.5">Production Cycle</p>
												<p className="text-sm font-black text-[#34C759] tracking-widest">{vehicle.year}</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Offer Statement & Financials */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
							<div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col h-full">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Workshop Technical Notes</p>
								<div className="p-4 bg-gray-50/50 border-l-4 border-[#34C759] rounded-r-xl flex-1">
									<p className="text-sm text-gray-700 leading-relaxed italic font-medium">
										"{selectedOffer.note || 'No additional technical notes provided for this proposal.'}"
									</p>
								</div>
							</div>

							<div className="p-8 bg-[#05324f] rounded-2xl text-white shadow-2xl shadow-[#05324f]/20">
								<div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
									<div>
										<p className="text-[10px] font-black text-[#34C759] uppercase tracking-widest mb-1.5 flex items-center gap-2">
											<CreditCard className="w-4 h-4" /> Proposal Financials
										</p>
										<h5 className="text-xl font-black uppercase tracking-tight">Bid Total Value</h5>
									</div>
									<div className="text-right">
										<p className="text-3xl font-black text-[#34C759] tracking-tighter leading-none">
											{formatPrice(selectedOffer.price)}
										</p>
									</div>
								</div>
								
								<div className="grid grid-cols-3 gap-8">
									<div className="space-y-2">
										<p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Labor Cost</p>
										<p className="text-lg font-bold">{formatPrice(selectedOffer.laborCost || 0)}</p>
									</div>
									<div className="space-y-2 border-l border-white/10 pl-8">
										<p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Parts</p>
										<p className="text-lg font-bold">{formatPrice(selectedOffer.partsCost || 0)}</p>
									</div>
									<div className="space-y-2 border-l border-white/10 pl-8">
										<p className="text-[10px] text-white/40 font-black uppercase tracking-widest">VAT (Tax)</p>
										<p className="text-lg font-bold">{formatPrice(selectedOffer.vat || 0)}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Cancellation Analytics */}
						{selectedOffer.status === 'CANCELLED' && (
							<div className="p-6 border-2 border-red-100 bg-red-50/30 rounded-2xl overflow-hidden hover:bg-red-50/50 transition-colors">
								<div className="flex items-center gap-4 mb-4 pb-4 border-b border-red-100">
									<div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 animate-pulse">
										<ShieldOff className="w-5 h-5" />
									</div>
									<div>
										<p className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none mb-1">Termination Audit</p>
										<p className="text-sm font-black text-red-800">Proposal Revoked / Cancelled</p>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-1.5">
										<p className="text-[10px] text-red-600/50 font-black uppercase tracking-widest">Party Signature</p>
										<p className="text-sm font-black text-red-700 uppercase tracking-widest flex items-center gap-2">
											<UserCircle className="w-4 h-4" /> {selectedOffer.cancelledBy || 'AUTOMATED_SYSTEM'}
										</p>
									</div>
									<div className="space-y-1.5">
										<p className="text-[10px] text-red-600/50 font-black uppercase tracking-widest">Revocation Reason</p>
										<p className="text-sm font-bold text-red-900 italic leading-tight bg-white/50 p-3 rounded-lg border border-red-100/50">
											"{selectedOffer.cancellationReason || 'No technical revocation reason provided.'}"
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	const BookingCard = ({ booking }) => (
		<div 
			className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer group"
			onClick={() => {
				setSelectedBooking(booking)
				setBookingDetailModalOpen(true)
			}}
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-[#EDFBF1] flex items-center justify-center group-hover:scale-110 transition-transform">
						<Calendar className="w-5 h-5 text-[#34C759]" />
					</div>
					<div className="min-w-0">
						<h4 className="font-semibold text-gray-900 leading-tight truncate">{booking.workshop?.companyName}</h4>
						<div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-tight">
							<User className="w-3 h-3 opacity-50" />
							{booking.customer?.name || 'Customer'}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button 
						variant="outline" 
						size="sm" 
						className="h-7 w-7 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] transition-all"
						onClick={(e) => {
							e.stopPropagation()
							setSelectedBooking(booking)
							setBookingDetailModalOpen(true)
						}}
					>
						<Eye className="w-3.5 h-3.5" />
					</Button>
					<Badge
						className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-none"
						style={
							booking.status === 'DONE' || booking.status === 'CONFIRMED'
								? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
								: booking.status === 'CANCELLED' || booking.status === 'NO_SHOW'
								? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
								: { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
						}
					>
						{booking.status === 'CONFIRMED' ? t('admin.bookings.confirmed') : booking.status === 'RESCHEDULED' ? t('admin.bookings.rescheduled') : booking.status === 'CANCELLED' ? t('workshop.proposals.status.cancelled') : booking.status === 'DONE' ? t('admin.bookings.done') : booking.status === 'NO_SHOW' ? t('admin.bookings.no_show') : booking.status}
					</Badge>
				</div>
			</div>

			{/* Cancellation Notice */}
			{booking.status === 'CANCELLED' && (
				<div className="mb-4 p-3 bg-red-50/50 border-l-4 border-red-500 rounded-r-xl animate-in fade-in slide-in-from-left-4 duration-500">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
						<div className="flex-1">
							<p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-0.5">
								{booking.cancelledBy === 'WORKSHOP' ? 'Cancelled by Workshop' : 'Cancelled by Customer'}
							</p>
							<p className="text-xs text-red-800 font-medium italic leading-tight">
								"{booking.cancellationReason || 'No reason provided'}"
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="grid grid-cols-2 gap-4 mb-3">
				<div>
					<p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Scheduled At</p>
					<div className="text-xs font-medium text-gray-700 leading-tight">
						{formatDateTime(new Date(booking.scheduledAt))}
					</div>
				</div>
				<div className="text-right">
					<p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total Amount</p>
					<div className="text-sm font-medium text-gray-900 tracking-tighter">
						{formatPrice(booking.totalAmount)}
					</div>
				</div>
			</div>

			<div className="pt-3 border-t border-gray-50 flex items-center justify-between">
				<p className="text-[9px] text-gray-300 font-medium uppercase tracking-tighter">Booking ID: {booking.id.substring(0, 8)}</p>
				<div className="flex items-center gap-1 text-[9px] font-bold text-[#34C759] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
					Details <TrendingUp className="w-3 h-3" />
				</div>
			</div>
		</div>
	)

	const BookingDetailDialog = () => {
		if (!selectedBooking) return null

		const vehicle = selectedBooking.requestId?.vehicleId
		const offer = selectedBooking.offerId

		return (
			<Dialog 
				open={bookingDetailModalOpen} 
				onOpenChange={setBookingDetailModalOpen}
			>
				<DialogContent className="w-[95vw] md:w-[80vw] lg:w-[50vw] max-h-[95vh] overflow-y-auto custom-scrollbar border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-300">
					<Button 
						variant="ghost" 
						size="icon" 
						className="absolute right-8 top-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all z-50 h-10 w-10 shadow-sm border border-gray-100"
						onClick={() => setBookingDetailModalOpen(false)}
					>
						<X className="w-5 h-5" />
					</Button>
					
					<DialogHeader className="p-10 pb-6 border-b border-gray-50 bg-white">
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<DialogTitle className="text-2xl font-black text-[#05324f] tracking-tight uppercase">
										Booking Oversight
									</DialogTitle>
									<Badge
										className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm"
										style={
											selectedBooking.status === 'DONE' || selectedBooking.status === 'CONFIRMED'
												? { backgroundColor: '#34C759', color: 'white' }
												: selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'NO_SHOW'
												? { backgroundColor: '#FF3B30', color: 'white' }
												: { backgroundColor: '#007AFF', color: 'white' }
										}
									>
										{selectedBooking.status}
									</Badge>
								</div>
								<DialogDescription className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
									Ref: {selectedBooking.id} • Registered: {formatDate(new Date(selectedBooking.createdAt))}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="p-10 space-y-8 bg-gray-50/30">
						{/* Double Identity Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Client Card */}
							<div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
									<UserCircle className="w-4 h-4 text-[#007AFF]" /> Client Identity
								</p>
								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] shadow-sm">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">Account Holder</p>
											<p className="text-lg font-black text-[#05324f]">{selectedBooking.customer?.name}</p>
										</div>
									</div>
									<div className="pt-4 border-t border-gray-50 grid grid-cols-1 gap-3">
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600 truncate">
											<Mail className="w-4 h-4 text-gray-300" /> {selectedBooking.customer?.email}
										</div>
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600">
											<Phone className="w-4 h-4 text-gray-300" /> {selectedBooking.customer?.phone || 'N/A'}
										</div>
									</div>
								</div>
							</div>

							{/* Workshop Card */}
							<div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
								<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
									<Building2 className="w-4 h-4 text-[#34C759]" /> Workshop Identity
								</p>
								<div className="space-y-4">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759] shadow-sm">
											<Building2 className="w-6 h-6" />
										</div>
										<div>
											<p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">Service Entity</p>
											<p className="text-lg font-black text-[#05324f]">{selectedBooking.workshop?.companyName}</p>
										</div>
									</div>
									<div className="pt-4 border-t border-gray-50 grid grid-cols-1 gap-3">
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600 truncate">
											<Mail className="w-4 h-4 text-gray-300" /> {selectedBooking.workshop?.email}
										</div>
										<div className="flex items-center gap-2 text-xs font-bold text-gray-600">
											<Phone className="w-4 h-4 text-gray-300" /> {selectedBooking.workshop?.phone || 'N/A'}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Vehicle Identity Card */}
						{vehicle && (
							<div className="bg-[#05324f] p-8 rounded-[2rem] text-white shadow-xl shadow-[#05324f]/20 relative overflow-hidden">
								<div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
								<p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
									<Car className="w-4 h-4" /> Vehicle Identity
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Manufacturer</p>
										<p className="text-lg font-black uppercase tracking-tight">{vehicle.make}</p>
									</div>
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Model Basis</p>
										<p className="text-lg font-black uppercase tracking-tight">{vehicle.model}</p>
									</div>
									<div className="bg-white/5 p-4 rounded-2xl border border-white/10">
										<p className="text-[9px] font-black text-[#34C759] uppercase tracking-widest mb-1.5 opacity-80">Production Cycle</p>
										<p className="text-lg font-black tracking-tight">{vehicle.year}</p>
									</div>
								</div>
							</div>
						)}

						{/* Financial Authority Section */}
						<div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
							<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
								<Receipt className="w-4 h-4 text-[#34C759]" /> Financial Summary
							</p>
							<div className="flex flex-col md:flex-row items-center justify-between gap-10">
								<div className="flex-1 w-full">
									<p className="text-[11px] font-black text-[#05324f] uppercase tracking-widest mb-2 opacity-50">Total Amount (Inc. VAT)</p>
									<p className="text-5xl font-black text-[#34C759] tracking-tighter">
										{formatPrice(selectedBooking.totalAmount)}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-8 md:w-1/2 w-full pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-10">
									<div>
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Labor Cost</p>
										<p className="text-xl font-black text-[#05324f]">{formatPrice(offer?.laborCost || 0)}</p>
									</div>
									<div>
										<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Service Cost</p>
										<p className="text-xl font-black text-[#05324f]">{formatPrice(offer?.partsCost || 0)}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Conditional Cancellation Audit */}
						{selectedBooking.status === 'CANCELLED' && (
							<div className="p-8 border-2 border-red-50 bg-red-50/50 rounded-[2rem] shadow-sm animate-in zoom-in-95 duration-500">
								<div className="flex items-center gap-4 mb-6">
									<div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
										<ShieldAlert className="w-6 h-6" />
									</div>
									<div>
										<p className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none mb-1.5">Audit Alert</p>
										<p className="text-base font-black text-red-900 uppercase">Cancellation Reason Surface</p>
									</div>
								</div>
								<div className="bg-white p-5 rounded-2xl border border-red-100/50 shadow-inner text-center">
									<p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-2 opacity-50">Root Stated Reason</p>
									<p className="text-sm font-bold text-red-900 italic leading-relaxed">
										"{selectedBooking.cancellationReason || 'No technical revocation reason provided.'}"
									</p>
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	const LoadingCard = () => (
		<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm max-md:border-gray-200 max-md:shadow-none max-md:border max-md:p-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex-1 w-full space-y-2">
					<Skeleton className="h-5 w-3/4 max-w-[250px]" />
					<Skeleton className="h-4 w-1/2 max-w-[150px]" />
				</div>
				<Skeleton className="h-8 w-20 rounded-lg" />
			</div>
		</div>
	)

	const TableSkeleton = ({ rows = 5, cols = 5 }) => (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
			<div className="bg-gray-50/50 p-4 flex justify-between">
				{[...Array(cols)].map((_, i) => (
					<Skeleton key={i} className="h-4 w-20" />
				))}
			</div>
			<div className="divide-y divide-gray-50">
				{[...Array(rows)].map((_, i) => (
					<div key={i} className="p-4 flex justify-between items-center bg-white">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-40 max-md:hidden" />
						<Skeleton className="h-4 w-24 max-sm:hidden" />
						<Skeleton className="h-6 w-16 rounded-full" />
						<div className="flex gap-2">
							<Skeleton className="h-8 w-24 rounded-md" />
						</div>
					</div>
				))}
			</div>
		</div>
	)

	const handleLogout = () => {
		logout()
		navigate('/')
	}

	const sanitizeCSVValue = (value) => {
		const str = value == null ? '' : String(value)
		// Prefix dangerous formula characters to prevent CSV injection
		if (/^[=+\-@|%]/.test(str)) {
			return JSON.stringify(`'${str}`)
		}
		return JSON.stringify(str)
	}

	const exportToCSV = (data, filename) => {
		if (data.length === 0) return

		const headers = Object.keys(data[0])
		const csv = [
			headers.join(','),
			...data.map((row) => headers.map((header) => sanitizeCSVValue(row[header])).join(',')),
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		window.URL.revokeObjectURL(url)
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen flex flex-col bg-white">
				{/* Header Skeleton */}
				<header className="bg-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-100 max-md:border-gray-200">
					<div className="flex items-center gap-2 sm:gap-3">
						<Skeleton className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-lg" />
						<Skeleton className="w-32 h-10" />
						<Skeleton className="hidden max-md:block w-16 h-6 ml-1" />
					</div>
					<div className="flex items-center gap-2 sm:gap-3">
						<Skeleton className="w-24 h-8 sm:h-10 rounded-lg" />
						<Skeleton className="w-24 h-8 sm:h-10 rounded-lg" />
					</div>
				</header>
				
				{/* KPI Cards Skeleton */}
				<div className="bg-gray-50 px-3 sm:px-6 py-4 sm:py-5 max-md:bg-white max-md:py-4">
					<div className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-4 max-md:gap-1.5 mb-8 pb-2 no-scrollbar px-1">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={`skel-kpi-${i}`} className="flex-shrink-0 w-[110px] sm:w-[160px] h-20 sm:h-32 rounded-card max-md:rounded-lg" />
						))}
					</div>
				</div>

				{/* Content Area Skeleton */}
				<div className="flex-1 flex min-h-0 pb-3 sm:pb-6">
					{/* Sidebar Skeleton */}
					<div className="hidden lg:flex flex-col w-64 flex-shrink-0 rounded-2xl p-4 ml-3 sm:ml-6 mb-3 sm:mb-6" style={{ backgroundColor: '#05324f' }}>
						<div className="flex-1 space-y-2">
							{[...Array(9)].map((_, i) => (
								<Skeleton key={`skel-nav-${i}`} className="h-12 w-full rounded-lg bg-white/10" />
							))}
						</div>
					</div>

					{/* Main Content Area Skeleton */}
					<div className="flex-1 flex flex-col min-w-0">
						<main className="flex-1 overflow-y-auto bg-white p-3 sm:p-4 lg:p-6 max-md:pb-8">
							<div className="space-y-6">
								<Skeleton className="h-6 sm:h-7 w-48 mb-4" />
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-24" />
									</div>
									<div className="divide-y divide-gray-100">
										{[...Array(5)].map((_, i) => (
											<div key={`skel-row-${i}`} className="p-4 flex justify-between items-center bg-white">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-4 w-48" />
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-6 w-20 rounded-full" />
												<div className="flex gap-2">
													<Skeleton className="h-8 w-24 rounded-md" />
													<Skeleton className="h-8 w-24 rounded-md" />
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'ADMIN') {
		return null
	}

	const tabs = ['dashboard', 'customers', 'workshops', 'requests', 'offers', 'bookings', 'settings']
	const sidebarBgColor = '#05324f' // Dark blue color

	return (
		<div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
			{/* Header */}
			<header className="bg-white px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 max-md:border-gray-200">
				<div className="flex items-center justify-between gap-4 relative">
					{/* Left: Menu Button (Mobile) */}
					<div className="flex items-center lg:hidden">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 hover:bg-gray-100 rounded-lg"
						>
							<Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
						</button>
					</div>

					{/* Center: Logo (Mobile) / Left: Logo (Desktop) */}
					<div className="flex items-center lg:static absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 lg:left-0 lg:top-0">
						<Logo />
					</div>

					{/* Right: Language Switcher */}
					<div className="flex items-center">
						<LanguageSwitcher isScrolled={true} />
					</div>
				</div>
			</header>


			{/* Content Area with Sidebar and Main Content */}
			<div className="flex-1 flex min-h-0 pb-3 sm:pb-6 overflow-hidden">
				{/* Dark Blue Sidebar Menu - Left Side */}
				<div 
					className="hidden lg:flex flex-col w-64 flex-shrink-0 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-2xl p-4 ml-3 sm:ml-6 mb-3 sm:mb-6"
					style={{ backgroundColor: sidebarBgColor }}
				>
					<nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
						{tabs.map((tab, index) => (
									<button
										key={tab}
										onClick={() => {
											setSearchParams({ tab })
											setSearchQuery('')
											setStatusFilter('all')
											setPagination({ ...pagination, page: 1 })
								}}
								className={`w-full text-left px-4 py-3 transition-all rounded-lg text-sm font-medium ${
											activeTab === tab
										? 'bg-white text-gray-900 font-semibold'
										: 'text-white/80 hover:text-white hover:bg-white/10'
								}`}
									>
										{t(`admin.tabs.${tab}`)}
									</button>
								))}
					</nav>
					<div className="mt-auto pt-4 space-y-4">
						<button
							onClick={handleLogout}
							className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
						>
							<LogOut className="w-4 h-4" />
							<span>{t('common.logout')}</span>
						</button>
						<p className="text-white/60 text-xs px-4">{t('admin.version')}</p>
					</div>
								</div>

				{/* Main Content Area - Right Side */}
				<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile Sidebar Overlay */}
				{mobileMenuOpen && (
					<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
				)}
				<div 
					ref={mobileMenuRef}
					className={`fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col transform transition-transform duration-300 lg:hidden ${
						mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
					style={{ backgroundColor: sidebarBgColor }}
				>
					<div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
						<h2 className="text-white font-bold text-xl tracking-tight">
							Admin <span className="text-[#34C759]">Panel</span>
						</h2>
						<button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white">
							<X className="w-5 h-5" />
						</button>
					</div>
					<nav className="flex-1 p-3 space-y-1.5">
						{tabs.map((tab, index) => (
								<button
									key={tab}
									onClick={() => {
										setSearchParams({ tab })
										setSearchQuery('')
										setStatusFilter('all')
										setPagination({ ...pagination, page: 1 })
									setMobileMenuOpen(false)
									}}
								className={`w-full text-left px-3 py-2.5 transition-all rounded-lg text-[15px] font-medium ${
										activeTab === tab
										? 'bg-white text-gray-900 font-bold shadow-sm'
										: 'text-white/80 hover:text-white hover:bg-white/10'
								}`}
								>
									{t(`admin.tabs.${tab}`)}
								</button>
							))}
					</nav>
					<div className="p-3 mt-auto space-y-3">
						<button
							onClick={handleLogout}
							className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-[15px] font-medium"
						>
							<LogOut className="w-4 h-4" />
							<span>{t('common.logout')}</span>
						</button>
						<p className="text-white/40 text-[10px] px-3">{t('admin.version')}</p>
					</div>
				</div>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto bg-white p-3 sm:p-4 lg:p-6 max-md:pb-8">
				{/* Dashboard Tab */}
				{activeTab === 'dashboard' && (
						<div className="space-y-6">
							{/* KPI Cards - only on dashboard */}
							<div className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-4 max-md:gap-1.5 mb-8 pb-2 custom-scrollbar no-scrollbar scroll-smooth px-1">
								<div className="flex-shrink-0 w-[110px] sm:w-[160px] rounded-xl border border-gray-100 bg-white shadow-card p-3 sm:p-6 max-md:rounded-lg max-md:border-gray-200 max-md:shadow-none max-md:p-3 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
									<div className="text-xl sm:text-5xl font-semibold text-[#05324f] leading-none mb-1.5 max-md:text-2xl">{stats.totalCustomers}</div>
									<div className="text-[10px] sm:text-sm text-gray-500 font-medium max-md:text-[10px] uppercase tracking-tighter">{t('admin.stats.customers')}</div>
								</div>
								<div className="flex-shrink-0 w-[110px] sm:w-[160px] rounded-xl border border-gray-100 bg-white shadow-card p-3 sm:p-6 max-md:rounded-lg max-md:border-gray-200 max-md:shadow-none max-md:p-3 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
									<div className="text-xl sm:text-5xl font-semibold text-[#05324f] leading-none mb-1.5 max-md:text-2xl">{stats.totalWorkshops}</div>
									<div className="text-[10px] sm:text-sm text-gray-500 font-medium max-md:text-[10px] uppercase tracking-tighter">{t('admin.stats.workshops')}</div>
								</div>
								<div className="flex-shrink-0 w-[110px] sm:w-[160px] rounded-xl border border-gray-100 bg-white shadow-card p-3 sm:p-6 max-md:rounded-lg max-md:border-gray-200 max-md:shadow-none max-md:p-3 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
									<div className="text-xl sm:text-5xl font-semibold text-[#05324f] leading-none mb-1.5 max-md:text-2xl">{stats.totalRequests}</div>
									<div className="text-[10px] sm:text-sm text-gray-500 font-medium max-md:text-[10px] uppercase tracking-tighter">{t('admin.stats.requests')}</div>
								</div>
							</div>
						{/* Pending Workshops */}
									<div>
								<h2 className="text-lg sm:text-xl font-bold mb-4" style={{ color: '#05324f' }}>
											{t('admin.workshops.pending_workshops')}
								</h2>
								{/* Pending Workshops List */}
								{workshops.filter((w) => !w.isVerified).length === 0 ? (
									<div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
										<CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
										<p className="text-gray-500 font-bold">{t('admin.workshops.no_pending')}</p>
									</div>
								) : (
									<>
										{/* Mobile View: Card Grid */}
										<div className="md:hidden grid grid-cols-1 gap-4">
											{workshops
												.filter((w) => !w.isVerified)
												.map((workshop) => (
													<PendingWorkshopCard key={workshop.id} workshop={workshop} />
												))}
										</div>

										{/* Desktop View: Table */}
										<div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
											<div className="overflow-x-auto">
												<table className="w-full min-w-[600px]">
													<thead className="bg-gray-50/50">
														<tr>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.workshops.company_name')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.email')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('common.registered')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.status')}</th>
															<th className="text-right p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('common.actions')}</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-50">
														{workshops
															.filter((w) => !w.isVerified)
															.map((workshop) => (
																<tr key={workshop.id} className="hover:bg-gray-50/50 transition-colors">
																	<td className="p-4">
																		<div className="font-black text-gray-900 leading-tight">{workshop.companyName}</div>
																		<div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">ID: {workshop.id.substring(0, 8)}</div>
																	</td>
																	<td className="p-4 text-sm text-gray-600">{workshop.email}</td>
																	<td className="p-4 text-xs text-gray-500 font-medium">{formatDate(new Date(workshop.createdAt))}</td>
																	<td className="p-4">
																		<Badge className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
																			{t('common.pending')}
																		</Badge>
																	</td>
																	<td className="p-4 text-right">
																		<div className="flex justify-end gap-2">
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
																				className="h-8 text-[10px] font-bold border-gray-100 uppercase tracking-tight"
																			>
																				<FileText className="w-3 h-3 mr-1" />
																				{t('admin.workshops.view_details')}
																			</Button>
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => confirmWorkshopAction(workshop.id, 'approve', workshop.companyName)}
																				className="h-8 text-[10px] font-bold border-green-100 text-green-600 hover:bg-green-50 uppercase tracking-tight"
																			>
																				<CheckCircle className="w-3 h-3 mr-1" />
																				{t('admin.workshops.approve')}
																			</Button>
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => confirmWorkshopAction(workshop.id || workshop._id, 'reject', workshop.companyName)}
																				className="h-8 text-[10px] font-bold border-red-100 text-red-600 hover:bg-red-50 uppercase tracking-tight"
																			>
																				<XCircle className="w-3 h-3 mr-1" />
																				{t('admin.workshops.reject')}
																			</Button>
																		</div>
																	</td>
																</tr>
															))}
													</tbody>
												</table>
											</div>
										</div>
									</>
								)}
							</div>

							{/* Rejection Reason Dialog */}
							{/* Rejection Reason Dialog */}
							<Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
								<DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
									<div className="p-8 space-y-6">
										<div className="space-y-2">
											<DialogTitle className="text-2xl font-black tracking-tight text-[#05324f]">
												{t('admin.workshops.reject_title') || 'Reject Workshop'}
											</DialogTitle>
											<DialogDescription className="text-gray-500 text-sm font-medium leading-relaxed">
												{t('admin.workshops.reject_desc', { name: selectedWorkshopForRejection?.name }) || `Are you sure you want to reject ${selectedWorkshopForRejection?.name}?`}
											</DialogDescription>
										</div>

										<div className="space-y-3">
											<label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
												{t('admin.workshops.reason_label') || 'Rejection Reason'}
											</label>
											<Textarea
												placeholder={t('admin.workshops.reason_placeholder') || "Please explain why this workshop is being rejected..."}
												value={rejectionReason}
												onChange={(e) => setRejectionReason(e.target.value)}
												className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/30 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none"
											/>
										</div>

										<div className="flex gap-3 pt-2">
											<Button
												variant="outline"
												onClick={() => setRejectionDialogOpen(false)}
												className="flex-1 rounded-2xl h-12 font-bold text-xs border-gray-100 hover:bg-gray-50 text-gray-500 transition-all"
											>
												{t('common.cancel')}
											</Button>
											<Button
												onClick={handleRejectWithReason}
												className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 font-bold text-xs shadow-md shadow-red-500/10 border-none transition-all"
											>
												{t('admin.workshops.confirm_reject') || 'Confirm Reject'}
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						</div>
				)}

				{/* Customers Tab */}
				{activeTab === 'customers' && (
						<div className="space-y-6">
										<div>
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
									<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
										{t('admin.customers.title')}
									</h2>
									<div className="hidden sm:block">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="active">{t('admin.customers.active')}</SelectItem>
												<SelectItem value="inactive">{t('admin.customers.inactive')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
										</div>
							<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
										placeholder={t('admin.customers.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
										className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
										/>
									</div>
									<div className="sm:hidden flex-shrink-0">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-24 h-9 text-sm">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="active">{t('admin.customers.active')}</SelectItem>
												<SelectItem value="inactive">{t('admin.customers.inactive')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								</div>

								{/* Mobile View: Card Grid */}
								<div className="md:hidden">
									{listLoading ? (
										<div className="grid grid-cols-1 gap-4">
											{[1, 2, 3].map(i => <LoadingCard key={i} />)}
										</div>
									) : customers.length === 0 ? (
										<div className="bg-white rounded-xl p-10 text-center border border-dashed border-gray-200">
											<Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
											<p className="text-gray-500 font-bold text-sm tracking-tight">{t('admin.customers.no_customers')}</p>
										</div>
									) : (
										<div className="grid grid-cols-1 gap-4">
											{customers.map(customer => (
												<CustomerCard key={customer.id} customer={customer} />
											))}
										</div>
									)}
								</div>

								{/* Desktop View: Table */}
								<div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
								{listLoading ? (
									<TableSkeleton rows={5} cols={5} />
								) : customers.length === 0 ? (
										<div className="text-center py-12">
											<Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
											<p className="text-gray-600 font-medium">{t('admin.customers.no_customers')}</p>
									</div>
								) : (
										<div className="overflow-x-auto">
											<table className="w-full min-w-[500px]">
												<thead className="bg-gray-50">
													<tr>
														<th className="text-left p-4 font-semibold text-sm text-gray-700">{t('admin.customers.name')}</th>
														<th className="text-left p-4 font-semibold text-sm text-gray-700">{t('admin.customers.email')}</th>
														<th className="text-left p-4 font-semibold text-sm text-gray-700">{t('admin.customers.requests')}</th>
														<th className="text-left p-4 font-semibold text-sm text-gray-700">{t('admin.customers.status')}</th>
														<th className="text-right p-4 font-semibold text-sm text-gray-700">{t('common.actions')}</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-100">
												{customers.map((customer) => (
														<tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
															<td className="p-4">
																<div className="font-bold text-gray-900">{customer.name || 'User'}</div>
																<div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">ID: {customer.id.substring(0, 8)}</div>
															</td>
															<td className="p-4 text-sm text-gray-600">{customer.email}</td>
															<td className="p-4">
																<div className="flex items-center gap-1">
																	<span className="font-bold text-gray-900">{customer._count?.requests || 0}</span>
																	<span className="text-xs text-gray-400 font-medium tracking-tight h-min">sent</span>
																</div>
															</td>
															<td className="p-4">
																<Badge 
																	className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
																	style={customer.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : { backgroundColor: '#E5E7EB', color: '#6B7280' }}
																>
																{customer.isActive ? t('admin.customers.active') : t('admin.customers.inactive')}
															</Badge>
														</td>
														<td className="p-4 text-right">
															<Button
																variant="outline"
																size="sm"
																className="text-[10px] font-bold h-8 border-gray-100 hover:bg-gray-50 uppercase tracking-widest"
																onClick={() => handleToggleUserStatus(customer)}
															>
																{t('admin.customers.toggle_status') || 'Change Status'}
															</Button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
								</div>
							</div>
					</div>
				)}

				{/* Workshops Tab */}
				{activeTab === 'workshops' && (
					<div className="space-y-6">
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
								<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
									{t('admin.workshops.title')}
								</h2>
									<div className="hidden sm:block">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="verified">{t('admin.workshops.verified')}</SelectItem>
												<SelectItem value="pending">{t('common.pending')}</SelectItem>
												<SelectItem value="active">{t('admin.workshops.active')}</SelectItem>
												<SelectItem value="blocked">{t('admin.workshops.blocked')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.workshops.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
										/>
									</div>
									<div className="sm:hidden flex-shrink-0">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-24 h-9 text-sm">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="verified">{t('admin.workshops.verified')}</SelectItem>
												<SelectItem value="pending">{t('common.pending')}</SelectItem>
												<SelectItem value="active">{t('admin.workshops.active')}</SelectItem>
												<SelectItem value="blocked">{t('admin.workshops.blocked')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
								{listLoading ? (
									<div className="space-y-6">
										<div className="md:hidden grid grid-cols-1 gap-4">
											{[1, 2, 3].map(i => <LoadingCard key={i} />)}
										</div>
										<div className="hidden md:block">
											<TableSkeleton rows={8} cols={5} />
										</div>
									</div>
								) : workshops.length === 0 ? (
									<div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
										<Building2 className="w-16 h-16 mx-auto mb-4 text-gray-100" />
										<p className="text-gray-500 font-bold">{t('admin.workshops.no_workshops')}</p>
									</div>
								) : (
									<div className="space-y-6">
										{/* Mobile View: Card Grid */}
										<div className="md:hidden grid grid-cols-1 gap-4">
											{workshops.map((workshop) => (
												<WorkshopCard key={workshop.id} workshop={workshop} />
											))}
										</div>

										{/* Desktop View: Table */}
										<div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
											<div className="overflow-x-auto">
												<table className="w-full min-w-[700px]">
													<thead className="bg-gray-50/50">
														<tr>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.workshops.company_name')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.email')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.workshops.organization_number')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.status')}</th>
															<th className="text-right p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('common.actions')}</th>
														</tr>
													</thead>
													<tbody>
														{workshops.map((workshop) => (
															<tr key={workshop.id} className="hover:bg-gray-50/50 transition-colors">
																<td className="p-4">
																	<div className="flex items-center gap-2">
																		<div className="font-bold text-gray-900 leading-tight">{workshop.companyName}</div>
																		{workshop.isVerified && <CheckCircle className="w-4 h-4 text-[#34C759] flex-shrink-0" />}
																	</div>
																	<div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">ID: {workshop.id.substring(0, 8)}</div>
																</td>
																<td className="p-4 text-sm text-gray-600">{workshop.email}</td>
																<td className="p-4 text-xs text-gray-500 font-medium tracking-tighter uppercase">{workshop.organizationNumber}</td>
																<td className="p-4">
																	<div className="flex flex-wrap gap-1.5">
																		<Badge 
																			className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm"
																			style={workshop.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : { backgroundColor: '#EF4444', color: '#FFFFFF' }}
																		>
																			{workshop.isActive ? t('admin.workshops.active') : t('admin.workshops.blocked')}
																		</Badge>
																	</div>
																</td>
																<td className="p-4 text-right">
																	<div className="flex justify-end gap-2">
																		<Button
																			size="sm"
																			variant="outline"
																			onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
																			className="h-8 text-[10px] font-bold border-gray-100 uppercase tracking-tight"
																		>
																			<FileText className="w-3 h-3 mr-1" />
																			{t('admin.workshops.view_details')}
																		</Button>
																		{!workshop.isVerified && (
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => confirmWorkshopAction(workshop.id, 'approve', workshop.companyName)}
																				className="h-8 text-[10px] font-bold border-green-100 text-green-600 hover:bg-green-50 uppercase tracking-tight"
																			>
																				<CheckCircle className="w-3 h-3 mr-1" />
																				{t('admin.workshops.approve')}
																			</Button>
																		)}
																		{workshop.isActive ? (
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => handleWorkshopAction(workshop.id, 'block')}
																				className="h-8 text-[10px] font-bold border-red-100 text-red-600 hover:bg-red-50 uppercase tracking-tight"
																			>
																				<Ban className="w-3 h-3 mr-1" />
																				{t('admin.workshops.block')}
																			</Button>
																		) : (
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={() => handleWorkshopAction(workshop.id, 'unblock')}
																				className="h-8 text-[10px] font-bold border-green-100 text-green-600 hover:bg-green-50 uppercase tracking-tight"
																			>
																				<Unlock className="w-3 h-3 mr-1" />
																				{t('admin.workshops.unblock')}
																			</Button>
																		)}
																	</div>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								)}
						</div>
					</div>
				)}

				{/* Requests Tab */}
				{activeTab === 'requests' && (
					<div className="space-y-6">
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
								<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
									{t('admin.requests.title')}
								</h2>
									<div className="hidden sm:block">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
											<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
											<SelectItem value="NEW">{t('admin.requests.new')}</SelectItem>
											<SelectItem value="IN_BIDDING">{t('admin.requests.in_bidding')}</SelectItem>
											<SelectItem value="BOOKED">{t('admin.requests.booked')}</SelectItem>
											<SelectItem value="COMPLETED">{t('admin.requests.completed')}</SelectItem>
											<SelectItem value="EXPIRED">Expired</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.requests.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
										/>
									</div>
									<div className="sm:hidden flex-shrink-0">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-24 h-9 text-sm">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="NEW">{t('admin.requests.new')}</SelectItem>
												<SelectItem value="IN_BIDDING">{t('admin.requests.in_bidding')}</SelectItem>
												<SelectItem value="BOOKED">{t('admin.requests.booked')}</SelectItem>
												<SelectItem value="COMPLETED">{t('admin.requests.completed')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
								{listLoading ? (
									<div className="space-y-6">
										<div className="md:hidden grid grid-cols-1 gap-4">
											{[1, 2, 3].map(i => <LoadingCard key={i} />)}
										</div>
										<div className="hidden md:block">
											<TableSkeleton rows={8} cols={6} />
										</div>
									</div>
								) : requests.length === 0 ? (
									<div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
										<FileText className="w-16 h-16 mx-auto mb-4 text-gray-100" />
										<p className="text-gray-500 font-bold">{t('admin.requests.no_requests')}</p>
									</div>
								) : (
									<div className="space-y-6">
										{/* Mobile View: Card Grid */}
										<div className="md:hidden grid grid-cols-1 gap-4">
											{requests.map((request) => (
												<RequestCard key={request.id} request={request} />
											))}
										</div>

										{/* Desktop View: Table */}
										<div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
											<div className="overflow-x-auto">
												<table className="w-full min-w-[700px]">
													<thead className="bg-gray-50/50">
														<tr>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.requests.vehicle')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.requests.customer')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.requests.location')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.requests.created')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.requests.offers')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.status')}</th>
															<th className="text-right p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Actions</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-50">
														{requests.map((request) => (
															<tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
																<td className="p-4">
																	<div className="font-black text-gray-900 leading-tight">
																		{request.vehicle?.make} {request.vehicle?.model}
																	</div>
																	<div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mt-0.5">Year: {request.vehicle?.year}</div>
																</td>
																<td className="p-4">
																	<div className="text-sm font-bold text-gray-700">{request.customer?.name || 'User'}</div>
																	<div className="text-[10px] text-gray-500 truncate max-w-[150px]">{request.customer?.email}</div>
																</td>
																<td className="p-4 text-xs text-gray-500 font-medium">{request.city}, {request.address}</td>
																<td className="p-4 text-xs text-gray-400 font-medium">{formatDate(new Date(request.createdAt))}</td>
																<td className="p-4">
																	<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#EDFBF1] text-[#34C759]">
																		{request._count?.offers || 0}
																	</span>
																</td>
																<td className="p-4">
																	<Badge
																		className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-none"
																		style={
																			request.status === 'COMPLETED' || request.status === 'BOOKED'
																				? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
																				: request.status === 'EXPIRED' || request.status === 'CANCELLED'
																				? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
																				: request.status === 'NEW' || request.status === 'IN_BIDDING'
																				? { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
																				: { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#F3F4F6' }
																		}
																	>
																		{request.status === 'NEW' ? t('admin.requests.new') : request.status === 'IN_BIDDING' ? t('admin.requests.in_bidding') : request.status === 'BIDDING_CLOSED' ? t('admin.requests.bidding_closed') : request.status === 'BOOKED' ? t('admin.requests.booked') : request.status === 'COMPLETED' ? t('admin.requests.completed') : request.status === 'CANCELLED' ? t('admin.requests.cancelled') : request.status === 'EXPIRED' ? t('workshop.proposals.status.expired') : request.status}
																	</Badge>
																</td>
																<td className="p-4 text-right">
																	<Button 
																		variant="outline" 
																		size="sm" 
																		className="h-8 w-8 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] hover:bg-[#F0FDF4]/50 transition-all"
																		onClick={() => {
																			setSelectedRequest(request)
																			setRequestDetailModalOpen(true)
																		}}
																	>
																		<Eye className="w-4 h-4" />
																	</Button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								)}
											</div>
					</div>
				)}

				{/* Offers Tab */}
				{activeTab === 'offers' && (
					<div className="space-y-6">
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
								<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
									{t('admin.offers.title')}
								</h2>
								<div className="hidden sm:block">
									<Select
										value={statusFilter}
										onValueChange={(value) => {
											setStatusFilter(value)
											setPagination({ ...pagination, page: 1 })
										}}
									>
										<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue placeholder={t('admin.filters.all')} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
											<SelectItem value="SENT">{t('admin.offers.sent')}</SelectItem>
											<SelectItem value="ACCEPTED">{t('admin.offers.accepted')}</SelectItem>
											<SelectItem value="DECLINED">{t('admin.offers.declined')}</SelectItem>
											<SelectItem value="EXPIRED">{t('admin.offers.expired')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.offers.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
										/>
									</div>
									<div className="sm:hidden flex-shrink-0">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-24 h-9 text-sm">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="SENT">{t('admin.offers.sent')}</SelectItem>
												<SelectItem value="ACCEPTED">{t('admin.offers.accepted')}</SelectItem>
												<SelectItem value="DECLINED">{t('admin.offers.declined')}</SelectItem>
												<SelectItem value="EXPIRED">{t('admin.offers.expired')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
								{listLoading ? (
									<div className="space-y-6">
										<div className="md:hidden grid grid-cols-1 gap-4">
											{[1, 2, 3].map(i => <LoadingCard key={i} />)}
										</div>
										<div className="hidden md:block">
											<TableSkeleton rows={8} cols={5} />
										</div>
									</div>
								) : offers.length === 0 ? (
									<div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
										<Package className="w-16 h-16 mx-auto mb-4 text-gray-100" />
										<p className="text-gray-500 font-bold">{t('admin.offers.no_offers')}</p>
									</div>
								) : (
									<div className="space-y-6">
										{/* Mobile View: Card Grid */}
										<div className="md:hidden grid grid-cols-1 gap-4">
											{offers.map((offer) => (
												<OfferCard key={offer.id} offer={offer} />
											))}
										</div>

										{/* Desktop View: Table */}
										<div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
											<div className="overflow-x-auto">
												<table className="w-full min-w-[600px]">
													<thead className="bg-gray-50/50">
														<tr>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.offers.workshop')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.offers.vehicle')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.offers.price')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.offers.created')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.customers.status')}</th>
															<th className="text-right p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Actions</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-50">
														{offers.map((offer) => (
															<tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
																<td className="p-4">
																	<div className="font-black text-gray-900 leading-tight">{offer.workshop?.companyName}</div>
																	<div className="text-[10px] text-gray-300 font-medium tracking-tighter uppercase mt-0.5">ID: {offer.id.substring(0, 8)}</div>
																</td>
																<td className="p-4 text-sm font-bold text-gray-600">
																	{offer.request?.vehicleId?.make} {offer.request?.vehicleId?.model}
																</td>
																<td className="p-4 font-medium text-[#34C759] tracking-tighter">
																	{formatPrice(offer.price)}
																</td>
																<td className="p-4 text-xs text-gray-400 font-medium">
																	{formatDate(new Date(offer.createdAt))}
																</td>
																<td className="p-4">
																	<Badge
																		className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-none"
																		style={
																			offer.status === 'ACCEPTED'
																				? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
																				: offer.status === 'CANCELLED' || offer.status === 'EXPIRED' || offer.status === 'DECLINED'
																				? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
																				: offer.status === 'SENT'
																				? { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
																				: { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#F3F4F6' }
																		}
																	>
																		{offer.status === 'SENT' ? t('workshop.proposals.status.sent') : offer.status === 'ACCEPTED' ? t('workshop.proposals.status.accepted') : offer.status === 'DECLINED' ? t('workshop.proposals.status.declined') : offer.status === 'EXPIRED' ? t('workshop.proposals.status.expired') : offer.status}
																	</Badge>
																</td>
																<td className="p-4 text-right">
																	<Button 
																		variant="outline" 
																		size="sm" 
																		className="h-8 w-8 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] hover:bg-[#F0FDF4]/50 transition-all"
																		onClick={() => {
																			setSelectedOffer(offer)
																			setOfferDetailModalOpen(true)
																		}}
																	>
																		<Eye className="w-4 h-4" />
																	</Button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								)}
											</div>
					</div>
				)}

				{/* Bookings Tab */}
				{activeTab === 'bookings' && (
					<div className="space-y-6">
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
								<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
									{t('admin.bookings.title')}
								</h2>
									<div className="hidden sm:block">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="CONFIRMED">{t('admin.bookings.confirmed')}</SelectItem>
												<SelectItem value="DONE">{t('admin.bookings.done')}</SelectItem>
												<SelectItem value="CANCELLED">{t('admin.bookings.cancelled')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.bookings.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
										/>
									</div>
									<div className="sm:hidden flex-shrink-0">
										<Select
											value={statusFilter}
											onValueChange={(value) => {
												setStatusFilter(value)
												setPagination({ ...pagination, page: 1 })
											}}
										>
											<SelectTrigger className="w-24 h-9 text-sm">
												<SelectValue placeholder={t('admin.filters.all')} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
												<SelectItem value="CONFIRMED">{t('admin.bookings.confirmed')}</SelectItem>
												<SelectItem value="DONE">{t('admin.bookings.done')}</SelectItem>
												<SelectItem value="CANCELLED">{t('admin.bookings.cancelled')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
								{listLoading ? (
									<div className="space-y-6">
										<div className="md:hidden grid grid-cols-1 gap-4">
											{[1, 2, 3].map(i => <LoadingCard key={i} />)}
										</div>
										<div className="hidden md:block">
											<TableSkeleton rows={8} cols={5} />
										</div>
									</div>
								) : bookings.length === 0 ? (
									<div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
										<Calendar className="w-16 h-16 mx-auto mb-4 text-gray-100" />
										<p className="text-gray-500 font-bold">{t('admin.bookings.no_bookings')}</p>
									</div>
								) : (
									<div className="space-y-6">
										{/* Mobile View: Card Grid */}
										<div className="md:hidden grid grid-cols-1 gap-4">
											{bookings.map((booking) => (
												<BookingCard key={booking.id} booking={booking} />
											))}
										</div>

										{/* Desktop View: Table */}
										<div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
											<div className="overflow-x-auto">
												<table className="w-full min-w-[700px]">
													<thead className="bg-gray-50/50">
														<tr>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.bookings.customer')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.bookings.workshop')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.bookings.scheduled')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.bookings.amount')}</th>
															<th className="text-left p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.bookings.status')}</th>
															<th className="text-right p-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Actions</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-50">
														{bookings.map((booking) => (
															<tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
																<td className="p-4">
																	<div className="text-sm font-bold text-gray-700">{booking.customer?.name || 'User'}</div>
																	<div className="text-[10px] text-gray-500 truncate max-w-[150px]">{booking.customer?.email}</div>
																</td>
																<td className="p-4">
																	<div className="font-black text-gray-900 leading-tight">{booking.workshop?.companyName}</div>
																	<div className="text-[10px] text-gray-300 font-medium tracking-tighter uppercase mt-0.5">ID: {booking.id.substring(0, 8)}</div>
																</td>
																<td className="p-4 text-xs text-gray-500 font-medium">
																	{formatDateTime(new Date(booking.scheduledAt))}
																</td>
																<td className="p-4 font-medium text-gray-900 tracking-tighter">
																	{formatPrice(booking.totalAmount)}
																</td>
																<td className="p-4 text-left">
																	<Badge
																		className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-none"
																		style={
																			booking.status === 'DONE' || booking.status === 'CONFIRMED'
																				? { backgroundColor: '#F0FDF4', color: '#15803D', borderColor: '#DCFCE7' }
																				: booking.status === 'CANCELLED' || booking.status === 'NO_SHOW'
																				? { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: '#FEE2E2' }
																				: { backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#DBEAFE' }
																		}
																	>
																		{booking.status === 'CONFIRMED' ? t('admin.bookings.confirmed') : booking.status === 'RESCHEDULED' ? t('admin.bookings.rescheduled') : booking.status === 'CANCELLED' ? t('workshop.proposals.status.cancelled') : booking.status === 'DONE' ? t('admin.bookings.done') : booking.status === 'NO_SHOW' ? t('admin.bookings.no_show') : booking.status}
																	</Badge>
																</td>
																<td className="p-4 text-right">
																	<Button 
																		variant="outline" 
																		size="sm" 
																		className="h-8 w-8 p-0 rounded-full border-gray-200 text-gray-400 hover:text-[#34C759] hover:border-[#34C759] hover:bg-[#F0FDF4]/50 transition-all"
																		onClick={() => {
																			setSelectedBooking(booking)
																			setBookingDetailModalOpen(true)
																		}}
																	>
																		<Eye className="w-4 h-4" />
																	</Button>
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								)}
						</div>
					</div>
				)}


				{/* Settings Tab - Email Config */}
				{activeTab === 'settings' && (
					<div className="space-y-6">
						<div>
							<h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: '#05324f' }}>{t('admin.settings.title')}</h2>
							<p className="text-sm text-gray-600 mb-4">{t('admin.settings.subtitle')}</p>
							<Card className="max-w-xl">
								<CardHeader>
									<CardTitle className="text-base" style={{ color: '#05324f' }}>{t('admin.settings.email_config')}</CardTitle>
									<CardDescription>{t('admin.settings.email_desc')}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.settings.email_provider')}</label>
										<div className="flex gap-4">
											<label className="flex items-center gap-2 cursor-pointer">
												<input type="radio" checked={emailConfig.provider === 'emailjs'} onChange={() => setEmailConfig((c) => ({ ...c, provider: 'emailjs' }))} />
												<span>EmailJS</span>
											</label>
											<label className="flex items-center gap-2 cursor-pointer">
												<input type="radio" checked={emailConfig.provider === 'smtp'} onChange={() => setEmailConfig((c) => ({ ...c, provider: 'smtp' }))} />
												<span>SMTP</span>
											</label>
										</div>
									</div>
									{emailConfig.provider === 'emailjs' ? (
										<>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">User ID (Public Key)</label>
												<Input placeholder="user_xxxxx" value={emailConfig.emailjsUserId} onChange={(e) => setEmailConfig((c) => ({ ...c, emailjsUserId: e.target.value }))} className="h-10" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
												<Input placeholder="service_xxxxx" value={emailConfig.emailjsServiceId} onChange={(e) => setEmailConfig((c) => ({ ...c, emailjsServiceId: e.target.value }))} className="h-10" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
												<Input placeholder="template_xxxxx" value={emailConfig.emailjsTemplateId} onChange={(e) => setEmailConfig((c) => ({ ...c, emailjsTemplateId: e.target.value }))} className="h-10" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Private Key (Access Token)</label>
												<Input type="password" placeholder="Required for server-side" value={emailConfig.emailjsPrivateKey} onChange={(e) => setEmailConfig((c) => ({ ...c, emailjsPrivateKey: e.target.value }))} className="h-10" />
												<p className="text-xs text-gray-500 mt-1">EmailJS Account → Security → Enable API requests, add Private Key</p>
											</div>
										</>
									) : (
										<>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.smtp_host')}</label>
												<Input placeholder="smtp.example.com" value={emailConfig.host} onChange={(e) => setEmailConfig((c) => ({ ...c, host: e.target.value }))} className="h-10" />
											</div>
											<div className="flex gap-4">
												<div className="flex-1">
													<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.smtp_port')}</label>
													<Input type="number" placeholder="587" value={emailConfig.port} onChange={(e) => setEmailConfig((c) => ({ ...c, port: parseInt(e.target.value, 10) || 587 }))} className="h-10" />
												</div>
												<div className="flex items-end pb-2">
													<label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
														<input type="checkbox" checked={emailConfig.secure} onChange={(e) => setEmailConfig((c) => ({ ...c, secure: e.target.checked }))} className="rounded border-gray-300" />
														{t('admin.settings.secure')}
													</label>
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.smtp_user')}</label>
												<Input placeholder="user@example.com" value={emailConfig.user} onChange={(e) => setEmailConfig((c) => ({ ...c, user: e.target.value }))} className="h-10" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.smtp_password')}</label>
												<Input type="password" placeholder={t('admin.settings.password_placeholder')} value={emailConfig.password} onChange={(e) => setEmailConfig((c) => ({ ...c, password: e.target.value }))} className="h-10" />
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.from_address')}</label>
												<Input placeholder="noreply@example.com" value={emailConfig.from} onChange={(e) => setEmailConfig((c) => ({ ...c, from: e.target.value }))} className="h-10" />
											</div>
										</>
									)}
									<Button
										onClick={handleUpdateEmailConfig}
										disabled={emailConfigSaving}
										className="h-10"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{emailConfigSaving ? t('common.loading') : t('common.save')}
									</Button>
								</CardContent>
							</Card>

							{/* 2FA Card - Admin only */}
							<Card className="max-w-xl mt-6">
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2" style={{ color: '#05324f' }}>
										<Shield className="w-4 h-4" />
										{t('admin.settings.twofa_title')}
									</CardTitle>
									<CardDescription>{t('admin.settings.twofa_desc')}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{twoFactorEnabled ? (
										<>
											<Badge className="px-3 py-1" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
												{t('admin.settings.twofa_enabled')}
											</Badge>
											<div className="space-y-3 pt-2 border-t">
												<label className="block text-sm font-medium text-gray-700">{t('admin.settings.twofa_disable_password')}</label>
												<Input
													type="password"
													value={twoFactorDisablePassword}
													onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
													placeholder="••••••••"
													className="h-10"
												/>
												<label className="block text-sm font-medium text-gray-700">{t('admin.settings.twofa_disable_code')}</label>
												<Input
													type="text"
													inputMode="numeric"
													placeholder="000000"
													value={twoFactorDisableCode}
													onChange={(e) => setTwoFactorDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
													className="h-10"
												/>
												<Button
													variant="outline"
													onClick={handleDisable2FA}
													disabled={twoFactorLoading || !twoFactorDisablePassword || twoFactorDisableCode.length !== 6}
													className="h-10 border-red-200 text-red-700 hover:bg-red-50"
												>
													{twoFactorLoading ? t('common.loading') : t('admin.settings.twofa_disable')}
												</Button>
											</div>
										</>
									) : twoFactorSetup.qrCode ? (
										<>
											<p className="text-sm text-gray-600">{t('admin.settings.twofa_scan_qr')}</p>
											<img src={twoFactorSetup.qrCode} alt="2FA QR" className="w-48 h-48 border rounded-lg" />
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.twofa_enter_code')}</label>
												<Input
													type="text"
													inputMode="numeric"
													placeholder="000000"
													value={twoFactorCode}
													onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
													className="h-10 max-w-[140px]"
												/>
											</div>
											<div className="flex gap-2">
												<Button
													onClick={handleVerify2FASetup}
													disabled={twoFactorLoading || twoFactorCode.length !== 6}
													className="h-10"
													style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
												>
													{twoFactorLoading ? t('common.loading') : t('admin.settings.twofa_enable')}
												</Button>
												<Button variant="outline" onClick={() => setTwoFactorSetup({ qrCode: '', secret: '' })} className="h-10">
													{t('common.cancel')}
												</Button>
											</div>
										</>
									) : (
										<Button
											onClick={handleStart2FASetup}
											disabled={twoFactorLoading}
											className="h-10"
											style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
										>
											{twoFactorLoading ? t('common.loading') : t('admin.settings.twofa_enable')}
										</Button>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}
				{/* Mobile footer - reference */}
				<p className="max-md:block hidden text-center text-gray-400 text-xs py-6 border-t border-gray-100 mt-6">Admin panel v1.0</p>
			</main>
		</div>
		{/* Detail Modals */}
		<BookingDetailDialog />
		<RequestDetailDialog />
		<OfferDetailDialog />

		{/* Workshop approve/reject confirmation dialog */}
		<Dialog 
			open={workshopActionConfirm.open} 
			onOpenChange={(open) => !open && setWorkshopActionConfirm({ ...workshopActionConfirm, open: false })}
		>
			<DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
				<div className="p-8 space-y-6">
					<div className="space-y-2">
						<DialogTitle className="text-2xl font-black tracking-tight text-[#05324f]">
							{workshopActionConfirm.action === 'approve' ? 'Approve Workshop' : 'Confirm Action'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm font-medium leading-relaxed">
							{workshopActionConfirm.action === 'approve'
								? `Are you sure you want to approve "${workshopActionConfirm.workshopName}"? They will be publicly listed and able to submit offers.`
								: `Are you sure you want to proceed with this action for "${workshopActionConfirm.workshopName}"?`}
						</DialogDescription>
					</div>

					<div className="flex gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => setWorkshopActionConfirm({ open: false, workshopId: null, action: null, workshopName: '' })}
							className="flex-1 rounded-2xl h-12 font-bold text-xs border-gray-100 hover:bg-gray-50 text-gray-500 transition-all text-center"
						>
							{t('common.cancel')}
						</Button>
						<Button
							onClick={() => handleWorkshopAction(workshopActionConfirm.workshopId, workshopActionConfirm.action)}
							className={`flex-1 text-white rounded-2xl h-12 font-bold text-xs shadow-md border-none transition-all ${
								workshopActionConfirm.action === 'approve' 
									? 'bg-[#34C759] shadow-[#34C759]/10 hover:bg-[#2eb34f]' 
									: 'bg-red-500 shadow-red-500/10 hover:bg-red-600'
							}`}
						>
							{workshopActionConfirm.action === 'approve' ? 'Yes, Approve' : 'Confirm'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
		</div>
	</div>
	)
}
