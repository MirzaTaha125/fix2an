import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { adminAPI, authAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
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
} from 'lucide-react'

export default function AdminPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, logout } = useAuth()
	const { t } = useTranslation()
	const [activeTab, setActiveTab] = useState('dashboard')
	const [loading, setLoading] = useState(true)
	const [listLoading, setListLoading] = useState(false)
	const [stats, setStats] = useState({
		totalCustomers: 0,
		totalWorkshops: 0,
		pendingWorkshops: 0,
		totalRequests: 0,
		totalBookings: 0,
		totalRevenue: 0,
		monthlyRevenue: 0,
	})
	
	// Data states
	const [customers, setCustomers] = useState([])
	const [workshops, setWorkshops] = useState([])
	const [requests, setRequests] = useState([])
	const [offers, setOffers] = useState([])
	const [bookings, setBookings] = useState([])
	const [payouts, setPayouts] = useState([])
	const [walletTransactions, setWalletTransactions] = useState([])
	
	// Filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
	
	// Payout generation
	const [payoutMonth, setPayoutMonth] = useState(new Date().getMonth() + 1)
	const [payoutYear, setPayoutYear] = useState(new Date().getFullYear())
	const [generating, setGenerating] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [workshopActionConfirm, setWorkshopActionConfirm] = useState({ open: false, workshopId: null, action: null, workshopName: '' })
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

	// Redirect if not authenticated or not admin
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'ADMIN') {
				if (user.role === 'WORKSHOP') {
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
		if (user && user.role === 'ADMIN') {
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
		if (user && user.role === 'ADMIN') {
			// For customers tab, add a small debounce to avoid too many API calls while typing
			if (activeTab === 'settings') return
			if (activeTab === 'customers') {
				const timeoutId = setTimeout(() => fetchTabData(), 200)
				return () => clearTimeout(timeoutId)
			}
			fetchTabData()
		}
	}, [activeTab, searchQuery, statusFilter, pagination.page, user, payoutMonth, payoutYear])

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
				case 'payouts':
					if (payoutMonth && payoutYear) {
						response = await adminAPI.getPayouts({ month: payoutMonth, year: payoutYear })
						if (response.data) {
							setPayouts(response.data.reports || [])
							setPagination((p) => ({ ...p, total: response.data.reports?.length || 0 }))
						}
					}
					break
				case 'wallet':
					response = await adminAPI.getWalletTransactions(params)
					if (response.data) {
						setWalletTransactions(response.data.transactions || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
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
		if (action === 'approve' || action === 'reject') {
			setWorkshopActionConfirm({ open: true, workshopId, action, workshopName })
		} else {
			handleWorkshopAction(workshopId, action)
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

	const handleGeneratePayouts = async () => {
		setGenerating(true)
		try {
			const response = await adminAPI.generatePayouts({ month: payoutMonth, year: payoutYear })

			if (response.data) {
				const count = response.data.count || 0
				toast.success(
					count === 1 
						? t('common.generated_reports_one')
						: t('common.generated_reports_other').replace('{count}', count.toString())
				)
				fetchTabData()
			}
		} catch (error) {
			toast.error(t('common.failed_generate_reports'))
		} finally {
			setGenerating(false)
		}
	}

	const handleMarkPayoutPaid = async (payoutId) => {
		try {
			const response = await adminAPI.markPayoutPaid(payoutId)

			if (response.data) {
				toast.success(t('common.payout_marked_paid'))
				fetchTabData()
			}
		} catch (error) {
			toast.error(t('common.failed_mark_paid'))
		}
	}

	const handleUpdateWalletTransactionStatus = async (txId, status) => {
		try {
			const response = await adminAPI.updateWalletTransaction(txId, { status })
			if (response.data) {
				toast.success('Transaction status updated')
				fetchTabData()
			}
		} catch (error) {
			toast.error(error.response?.data?.message || 'Failed to update transaction status')
		}
	}

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
						<Skeleton className="w-24 h-8 sm:h-10" />
						<Skeleton className="hidden max-md:block w-16 h-6 ml-1" />
					</div>
					<div className="flex items-center gap-2 sm:gap-3">
						<Skeleton className="w-24 h-8 sm:h-10 rounded-lg" />
						<Skeleton className="w-24 h-8 sm:h-10 rounded-lg" />
					</div>
				</header>
				
				{/* KPI Cards Skeleton */}
				<div className="bg-gray-50 px-3 sm:px-6 py-4 sm:py-5 max-md:bg-white max-md:py-4">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-md:gap-2">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-kpi-${i}`} className="rounded-card border border-gray-100 bg-white shadow-card p-4 sm:p-5 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:p-4 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
								<Skeleton className="w-4 h-4 mb-2 max-md:mb-2 max-md:w-8 max-md:h-8 rounded-full" />
								<Skeleton className="h-8 sm:h-10 w-24 mb-1 max-md:h-8 max-md:w-16" />
								<Skeleton className="h-4 w-20 max-md:h-3 max-md:w-16" />
							</div>
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

	const tabs = ['dashboard', 'customers', 'workshops', 'requests', 'offers', 'bookings', 'payouts', 'settings']
	const sidebarBgColor = '#05324f' // Dark blue color

	return (
		<div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
			{/* Header */}
			<header className="bg-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-100 max-md:border-gray-200">
				<div className="flex items-center gap-2 sm:gap-3">
					{/* Mobile Menu Button - reference: hamburger right */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
					>
						<Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
					</button>
					<span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
						<span className="text-[#05324f]">Fixa</span>
						<span style={{ color: '#34C759' }}>2an</span>
					</span>
					<span className="hidden max-md:inline text-base font-bold text-[#05324f] ml-1">{t('admin.tabs.dashboard') || 'Admin'}</span>
						</div>
				<div className="flex items-center gap-2 sm:gap-3">
						<LanguageSwitcher />
					<button
						onClick={handleLogout}
						className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-xs sm:text-sm"
					>
						<LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
						<span className="hidden sm:inline">{t('common.logout')}</span>
					</button>
				</div>
			</header>

			{/* KPI Cards - reference mobile: 2x2 grid, icon + number + label, border no shadow */}
			<div className="bg-gray-50 px-3 sm:px-6 py-4 sm:py-5 max-md:bg-white max-md:py-4">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-md:gap-2">
					<div className="rounded-card border border-gray-100 bg-white shadow-card p-4 sm:p-5 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:p-4 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
						<div className="flex items-center gap-2 mb-2 max-md:mb-2">
							<Users className="w-4 h-4 text-[#05324f] max-md:w-8 max-md:h-8" />
						</div>
						<div className="text-3xl sm:text-4xl font-bold text-[#05324f] leading-none mb-1 max-md:text-2xl">{stats.totalCustomers}</div>
						<div className="text-xs sm:text-small text-gray-500 font-medium max-md:text-xs">{t('admin.stats.customers')}</div>
					</div>
					<div className="rounded-card border border-gray-100 bg-white shadow-card p-4 sm:p-5 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:p-4 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
						<div className="flex items-center gap-2 mb-2 max-md:mb-2">
							<Building2 className="w-4 h-4 text-[#34C759] max-md:w-8 max-md:h-8" />
						</div>
						<div className="text-3xl sm:text-4xl font-bold text-[#05324f] leading-none mb-1 max-md:text-2xl">{stats.totalWorkshops}</div>
						<div className="text-xs sm:text-small text-gray-500 font-medium max-md:text-xs">{t('admin.stats.workshops')}</div>
					</div>
					<div className="rounded-card border border-gray-100 bg-white shadow-card p-4 sm:p-5 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:p-4 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
						<div className="flex items-center gap-2 mb-2 max-md:mb-2">
							<FileText className="w-4 h-4 text-[#05324f] max-md:w-8 max-md:h-8" />
						</div>
						<div className="text-3xl sm:text-4xl font-bold text-[#05324f] leading-none mb-1 max-md:text-2xl">{stats.totalRequests}</div>
						<div className="text-xs sm:text-small text-gray-500 font-medium max-md:text-xs">{t('admin.stats.requests')}</div>
					</div>
					<div className="rounded-card border border-gray-100 bg-white shadow-card p-4 sm:p-5 max-md:rounded-xl max-md:border-gray-200 max-md:shadow-none max-md:p-4 max-md:flex max-md:flex-col max-md:items-center max-md:text-center">
						<div className="flex items-center gap-2 mb-2 max-md:mb-2">
							<DollarSign className="w-4 h-4 text-[#34C759] max-md:w-8 max-md:h-8" />
						</div>
						<div className="text-3xl sm:text-4xl font-bold text-[#05324f] leading-none mb-1 max-md:text-2xl">{formatPrice(stats.monthlyRevenue)}</div>
						<div className="text-xs sm:text-small text-gray-500 font-medium max-md:text-xs">{t('admin.stats.monthly_revenue')}</div>
					</div>
				</div>
			</div>

			{/* Content Area with Sidebar and Main Content */}
			<div className="flex-1 flex min-h-0 pb-3 sm:pb-6">
				{/* Dark Blue Sidebar Menu - Left Side */}
				<div 
					className="hidden lg:flex flex-col w-64 flex-shrink-0 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-2xl p-4 ml-3 sm:ml-6 mb-3 sm:mb-6"
					style={{ backgroundColor: sidebarBgColor }}
				>
					<nav className="flex-1 space-y-2">
						{tabs.map((tab, index) => (
									<button
										key={tab}
										onClick={() => {
											setActiveTab(tab)
											setSearchQuery('')
											setStatusFilter('all')
											setPagination({ ...pagination, page: 1 })
								}}
								className={`w-full text-left px-4 py-3 transition-all ${
									index === 0 
										? activeTab === tab 
											? 'rounded-t-lg rounded-b-lg' 
											: 'rounded-t-lg rounded-b-lg'
										: activeTab === tab
											? 'rounded-lg'
											: 'rounded-lg'
								} ${
											activeTab === tab
										? 'bg-white text-gray-900 font-semibold'
										: 'text-white/80 hover:text-white hover:bg-white/10'
								}`}
									>
										{tab === 'wallet' ? 'Wallet & Withdrawals' : t(`admin.tabs.${tab}`)}
									</button>
								))}
					</nav>
					<div className="pt-4">
						<p className="text-white/60 text-xs">{t('admin.version')}</p>
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
					className={`fixed left-0 top-0 bottom-0 w-64 z-50 transform transition-transform duration-300 lg:hidden ${
						mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
					style={{ backgroundColor: sidebarBgColor }}
				>
					<div className="p-4 border-b flex items-center justify-end" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
						<button onClick={() => setMobileMenuOpen(false)} className="text-white">
							<X className="w-6 h-6" />
						</button>
					</div>
					<nav className="flex-1 p-4 space-y-2">
						{tabs.map((tab, index) => (
								<button
									key={tab}
									onClick={() => {
										setActiveTab(tab)
										setSearchQuery('')
										setStatusFilter('all')
										setPagination({ ...pagination, page: 1 })
									setMobileMenuOpen(false)
									}}
								className={`w-full text-left px-4 py-3 transition-all ${
									index === 0 ? 'rounded-t-lg' : 'rounded-lg'
								} ${
										activeTab === tab
										? 'bg-white text-gray-900 font-semibold'
										: 'text-white/80 hover:text-white hover:bg-white/10'
								}`}
								>
									{tab === 'wallet' ? 'Wallet & Withdrawals' : t(`admin.tabs.${tab}`)}
								</button>
							))}
					</nav>
					<div className="p-4 pt-4">
						<p className="text-white/60 text-xs">{t('admin.version')}</p>
					</div>
				</div>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto bg-white p-3 sm:p-4 lg:p-6 max-md:pb-8">
				{/* Dashboard Tab */}
				{activeTab === 'dashboard' && (
						<div className="space-y-6">
						{/* Pending Workshops */}
									<div>
								<h2 className="text-lg sm:text-xl font-bold mb-4" style={{ color: '#05324f' }}>
											{t('admin.workshops.pending_workshops')}
								</h2>
								{workshops.filter((w) => !w.isVerified).length === 0 ? (
									<div className="text-center py-12">
										<CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
										<p className="text-gray-600">{t('admin.workshops.no_pending')}</p>
									</div>
								) : (
									<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
										<div className="overflow-x-auto">
											<table className="w-full min-w-[600px]">
												<thead className="bg-gray-50">
													<tr>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.workshops.company_name')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.email')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('common.registered')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.status')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('common.actions')}</th>
													</tr>
												</thead>
												<tbody>
										{workshops
											.filter((w) => !w.isVerified)
														.map((workshop, index) => (
															<tr key={workshop.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
																<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>{workshop.companyName}</td>
																<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 break-all">{workshop.email}</td>
																<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{formatDate(new Date(workshop.createdAt))}</td>
																<td className="p-2 sm:p-4">
																	<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
																		{t('common.pending')}
																	</Badge>
																</td>
																<td className="p-2 sm:p-4">
																	<div className="flex gap-1 sm:gap-2">
															<Button
																size="sm"
																onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
																			className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 text-xs"
															>
																			<FileText className="w-3 h-3 mr-0.5 sm:mr-1" />
																<span className="hidden sm:inline">{t('admin.workshops.view_details')}</span>
															</Button>
														<Button
															size="sm"
															onClick={() => confirmWorkshopAction(workshop.id, 'approve', workshop.companyName)}
																		className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs"
														>
																		<CheckCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
															<span className="hidden sm:inline">{t('admin.workshops.approve')}</span>
														</Button>
														<Button
															size="sm"
															onClick={() => confirmWorkshopAction(workshop.id, 'reject', workshop.companyName)}
																		className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs"
														>
																		<XCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
															<span className="hidden sm:inline">{t('admin.workshops.reject')}</span>
														</Button>
														</div>
																</td>
															</tr>
											))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</div>
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

								{/* Customer Table */}
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
								{listLoading ? (
										<div className="text-center py-12">
											<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
											<p className="text-gray-600">{t('admin.customers.loading_customers')}</p>
									</div>
								) : customers.length === 0 ? (
										<div className="text-center py-12">
											<Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
											<p className="text-gray-600">{t('admin.customers.no_customers')}</p>
									</div>
								) : (
										<div className="overflow-x-auto">
											<table className="w-full min-w-[500px]">
												<thead className="bg-gray-50">
													<tr>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.name')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.requests')}</th>
														<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.status')}</th>
												</tr>
											</thead>
											<tbody>
												{customers.map((customer, index) => (
														<tr key={customer.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
															<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm text-gray-900 break-all">{customer.name || customer.email}</td>
															<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{customer._count?.requests || 0}</td>
															<td className="p-2 sm:p-4">
																<Badge 
																	className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
																	style={customer.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : { backgroundColor: '#E5E7EB', color: '#6B7280' }}
																>
																{customer.isActive ? t('admin.customers.active') : t('admin.customers.inactive')}
															</Badge>
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
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
									</div>
								) : workshops.length === 0 ? (
								<div className="text-center py-12">
									<Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">{t('admin.workshops.no_workshops')}</p>
									</div>
								) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[700px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.workshops.company_name')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.email')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.workshops.organization_number')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.status')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('common.actions')}</th>
												</tr>
											</thead>
											<tbody>
												{workshops.map((workshop, index) => (
													<tr key={workshop.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>{workshop.companyName}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 break-all">{workshop.email}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{workshop.organizationNumber}</td>
														<td className="p-2 sm:p-4">
															<div className="flex flex-wrap gap-1 sm:gap-2">
														{workshop.isVerified ? (
																	<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
																{t('admin.workshops.verified')}
															</Badge>
														) : (
																	<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}>
																		{t('admin.workshops.not_verified')}
																	</Badge>
														)}
														{workshop.isActive ? (
																	<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
																		{t('admin.workshops.active')}
																	</Badge>
														) : (
																	<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
																		{t('admin.workshops.blocked')}
																	</Badge>
														)}
													</div>
														</td>
														<td className="p-2 sm:p-4">
															<div className="flex gap-1 sm:gap-2">
													<Button
														size="sm"
														onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
																	className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 text-xs"
													>
																	<FileText className="w-3 h-3 mr-0.5 sm:mr-1" />
																	<span className="hidden sm:inline">{t('admin.workshops.view_details')}</span>
													</Button>
												{!workshop.isVerified && (
													<Button
														size="sm"
														onClick={() => confirmWorkshopAction(workshop.id, 'approve', workshop.companyName)}
																	className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs"
													>
																	<CheckCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
																	<span className="hidden sm:inline">{t('admin.workshops.approve')}</span>
													</Button>
												)}
													{workshop.isActive ? (
														<Button
															size="sm"
															onClick={() => handleWorkshopAction(workshop.id, 'block')}
																		className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs"
														>
																		<Ban className="w-3 h-3 mr-0.5 sm:mr-1" />
																		<span className="hidden sm:inline">{t('admin.workshops.block')}</span>
														</Button>
													) : (
														<Button
															size="sm"
															onClick={() => handleWorkshopAction(workshop.id, 'unblock')}
																		className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs"
														>
																		<Unlock className="w-3 h-3 mr-0.5 sm:mr-1" />
																		<span className="hidden sm:inline">{t('admin.workshops.unblock')}</span>
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
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
									</div>
								) : requests.length === 0 ? (
								<div className="text-center py-12">
									<FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">{t('admin.requests.no_requests')}</p>
									</div>
								) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[700px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.requests.vehicle')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.requests.customer')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.requests.location')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.requests.created')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.requests.offers')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.status')}</th>
												</tr>
											</thead>
											<tbody>
												{requests.map((request, index) => (
													<tr key={request.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>
															{request.vehicle?.make} {request.vehicle?.model} ({request.vehicle?.year})
														</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 break-all">{request.customer?.name || request.customer?.email}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{request.city}, {request.address}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{formatDate(new Date(request.createdAt))}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{request._count?.offers || 0}</td>
														<td className="p-2 sm:p-4">
														<Badge
															className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
															style={
																request.status === 'COMPLETED' || request.status === 'BOOKED'
																	? { backgroundColor: '#34C759', color: '#FFFFFF' }
																	: request.status === 'EXPIRED' || request.status === 'CANCELLED'
																	? { backgroundColor: '#FEE2E2', color: '#DC2626' }
																	: { backgroundColor: '#E5E7EB', color: '#6B7280' }
														}
													>
														{request.status === 'NEW' ? t('admin.requests.new') : request.status === 'IN_BIDDING' ? t('admin.requests.in_bidding') : request.status === 'BIDDING_CLOSED' ? t('admin.requests.bidding_closed') : request.status === 'BOOKED' ? t('admin.requests.booked') : request.status === 'COMPLETED' ? t('admin.requests.completed') : request.status === 'CANCELLED' ? t('admin.requests.cancelled') : request.status === 'EXPIRED' ? 'Expired' : request.status}
													</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
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
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
									</div>
								) : offers.length === 0 ? (
								<div className="text-center py-12">
									<Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">{t('admin.offers.no_offers')}</p>
									</div>
								) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[600px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.offers.workshop')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.offers.vehicle')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.offers.price')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.offers.created')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.status')}</th>
												</tr>
											</thead>
											<tbody>
												{offers.map((offer, index) => (
													<tr key={offer.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>{offer.workshop?.companyName}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">
															{offer.request?.vehicle?.make} {offer.request?.vehicle?.model}
														</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm" style={{ color: '#34C759' }}>
															{formatPrice(offer.price)}
														</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{formatDate(new Date(offer.createdAt))}</td>
														<td className="p-2 sm:p-4">
															<Badge
																className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
																style={
																	offer.status === 'ACCEPTED'
																		? { backgroundColor: '#34C759', color: '#FFFFFF' }
																		: { backgroundColor: '#E5E7EB', color: '#6B7280' }
																}
															>
															{offer.status === 'SENT' ? t('admin.offers.sent') : offer.status === 'ACCEPTED' ? t('admin.offers.accepted') : offer.status === 'DECLINED' ? t('admin.offers.declined') : offer.status === 'EXPIRED' ? t('admin.offers.expired') : offer.status}
														</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
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
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
									</div>
								) : bookings.length === 0 ? (
								<div className="text-center py-12">
									<Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">{t('admin.bookings.no_bookings')}</p>
									</div>
								) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[700px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.customer')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.workshop')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.scheduled')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.amount')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.commission')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.bookings.status')}</th>
												</tr>
											</thead>
											<tbody>
												{bookings.map((booking, index) => (
													<tr key={booking.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 break-all">{booking.customer?.name || booking.customer?.email}</td>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>{booking.workshop?.companyName}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{formatDateTime(new Date(booking.scheduledAt))}</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{formatPrice(booking.totalAmount)}</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm" style={{ color: '#34C759' }}>
															{formatPrice(booking.commission)}
														</td>
														<td className="p-2 sm:p-4">
															<Badge
																className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
																style={
																	booking.status === 'DONE'
																		? { backgroundColor: '#34C759', color: '#FFFFFF' }
																		: booking.status === 'CANCELLED'
																		? { backgroundColor: '#EF4444', color: '#FFFFFF' }
																		: { backgroundColor: '#E5E7EB', color: '#6B7280' }
																}
															>
																{booking.status === 'CONFIRMED' ? t('admin.bookings.confirmed') : booking.status === 'RESCHEDULED' ? t('admin.bookings.rescheduled') : booking.status === 'CANCELLED' ? t('admin.bookings.cancelled') : booking.status === 'DONE' ? t('admin.bookings.done') : booking.status === 'NO_SHOW' ? t('admin.bookings.no_show') : booking.status}
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									</div>
								)}
						</div>
					</div>
				)}

				{/* Payouts Tab */}
				{activeTab === 'payouts' && (
					<div className="space-y-6">
						<div>
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
										{t('admin.payouts.title')}
									</h2>
									<p className="text-sm text-gray-600 mt-1">{t('admin.payouts.subtitle')}</p>
								</div>
							</div>
							<div className="mb-4">
								<div className="relative w-full">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									<Input
										placeholder={t('admin.payouts.search')}
										value={searchQuery}
										onChange={(e) => {
											setSearchQuery(e.target.value)
											setPagination({ ...pagination, page: 1 })
										}}
										className="pl-10 h-9 sm:h-10 text-sm sm:text-base w-full"
									/>
								</div>
							</div>
							<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
									<Input
										type="number"
										placeholder={t('admin.payouts.month')}
										value={payoutMonth}
										onChange={(e) => setPayoutMonth(Number(e.target.value))}
										min={1}
										max={12}
										className="w-full sm:w-32 h-9 sm:h-10 text-sm sm:text-base"
									/>
									<Input
										type="number"
										placeholder={t('admin.payouts.year')}
										value={payoutYear}
										onChange={(e) => setPayoutYear(Number(e.target.value))}
										min={2020}
										max={2100}
										className="w-full sm:w-32 h-9 sm:h-10 text-sm sm:text-base"
									/>
									<Button
										onClick={handleGeneratePayouts}
										disabled={generating}
									className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{generating ? (
											<>
												<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
											<span className="hidden sm:inline">{t('admin.payouts.generating')}</span>
											</>
										) : (
											<>
												<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
											<span className="hidden sm:inline">{t('admin.payouts.generate')}</span>
											</>
										)}
									</Button>
									{payouts.length > 0 && (
									<Button
										variant="outline"
										onClick={() => exportToCSV(payouts, `payouts-${payoutYear}-${payoutMonth}.csv`)}
										className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
									>
										<span className="hidden sm:inline">{t('admin.payouts.export_csv')}</span>
										<span className="sm:hidden">{t('admin.payouts.export')}</span>
									</Button>
									)}
								</div>
								{loading ? (
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
									</div>
								) : payouts.length === 0 ? (
								<div className="text-center py-12">
									<CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">{t('admin.payouts.no_reports')}</p>
									<p className="text-xs text-gray-500 mt-2">{t('admin.payouts.select_month_year')}</p>
									</div>
								) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[900px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.workshop')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.month')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.year')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.total_jobs')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.total_amount')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.commission')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.workshop_amount')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.payouts.status')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('common.actions')}</th>
												</tr>
											</thead>
											<tbody>
												{payouts.map((payout, index) => (
													<tr key={payout.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm" style={{ color: '#05324f' }}>{payout.workshop?.companyName}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{payout.month}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{payout.year}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700">{payout.totalJobs}</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{formatPrice(payout.totalAmount)}</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm" style={{ color: '#34C759' }}>
															{formatPrice(payout.commission)}
														</td>
														<td className="p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{formatPrice(payout.workshopAmount)}</td>
														<td className="p-2 sm:p-4">
															<Badge
																className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
																style={
																	payout.isPaid
																		? { backgroundColor: '#34C759', color: '#FFFFFF' }
																		: { backgroundColor: '#E5E7EB', color: '#6B7280' }
																}
															>
																{payout.isPaid ? t('admin.payouts.paid') : t('admin.payouts.unpaid')}
															</Badge>
														</td>
														<td className="p-2 sm:p-4">
															{!payout.isPaid && (
																<Button
																	size="sm"
																	onClick={() => handleMarkPayoutPaid(payout.id)}
																	className="text-xs px-2 sm:px-3 py-1 sm:py-1.5"
																	style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
																>
																	<CheckCircle className="w-3 h-3 mr-0.5 sm:mr-1" />
																	<span className="hidden sm:inline">{t('admin.payouts.mark_paid')}</span>
																</Button>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									</div>
								)}
						</div>
					</div>
				)}

				{/* Wallet Tab */}
				{activeTab === 'wallet' && (
					<div className="space-y-6">
						<div>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
								<h2 className="text-lg sm:text-xl font-bold" style={{ color: '#05324f' }}>
									Wallet Transactions
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
											<SelectItem value="Pending">Pending</SelectItem>
											<SelectItem value="Completed">Completed</SelectItem>
											<SelectItem value="Failed">Failed</SelectItem>
											<SelectItem value="Cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="mb-4">
								<div className="flex gap-2">
									<div className="relative flex-1 min-w-0">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder="Search description..."
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
												<SelectItem value="Pending">Pending</SelectItem>
												<SelectItem value="Completed">Completed</SelectItem>
												<SelectItem value="Failed">Failed</SelectItem>
												<SelectItem value="Cancelled">Cancelled</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
							{listLoading ? (
								<div className="text-center py-12">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#34C759' }} />
									<p className="text-gray-600">{t('common.loading')}</p>
								</div>
							) : walletTransactions.length === 0 ? (
								<div className="text-center py-12">
									<CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
									<p className="text-gray-600">No wallet transactions found.</p>
								</div>
							) : (
								<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full min-w-[900px]">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">Date</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">{t('admin.customers.email')}</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">Description</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">Type</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700 text-right">Amount</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">Status</th>
													<th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm text-gray-700">Actions</th>
												</tr>
											</thead>
											<tbody>
												{walletTransactions.map((tx, index) => (
													<tr key={tx.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{formatDateTime(new Date(tx.createdAt))}</td>
														<td className="p-2 sm:p-4 font-medium text-xs sm:text-sm text-[#05324f] break-all">{tx.user?.name || tx.user?.email || 'Unknown User'}</td>
														<td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-700 max-w-xs break-all" title={tx.description}>{tx.description}</td>
														<td className="p-2 sm:p-4">
															<Badge className="bg-gray-100 text-gray-700 whitespace-nowrap">{tx.type}</Badge>
														</td>
														<td className={`p-2 sm:p-4 font-semibold text-xs sm:text-sm text-right whitespace-nowrap ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK</td>
														<td className="p-2 sm:p-4">
															<Badge
																style={
																	tx.status === 'Completed' ? { backgroundColor: '#34C759', color: '#FFFFFF' }
																	: tx.status === 'Pending' ? { backgroundColor: '#F59E0B', color: '#FFFFFF' }
																	: { backgroundColor: '#EF4444', color: '#FFFFFF' }
																}
															>
																{tx.status}
															</Badge>
														</td>
														<td className="p-2 sm:p-4">
															{tx.type === 'Withdrawal' && tx.status === 'Pending' && (
																<div className="flex gap-2">
																	<Button size="sm" onClick={() => handleUpdateWalletTransactionStatus(tx.id, 'Completed')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto font-semibold">
																		Approve
																	</Button>
																	<Button size="sm" variant="outline" onClick={() => handleUpdateWalletTransactionStatus(tx.id, 'Failed')} className="border-red-600 text-red-600 hover:bg-red-50 text-xs px-2 py-1 h-auto font-semibold">
																		Reject
																	</Button>
																</div>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
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
		{/* Workshop approve/reject confirmation dialog */}
		{workshopActionConfirm.open && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
				<div className="bg-white rounded-card border border-gray-200 p-6 max-w-sm w-full mx-4">
					<h3 className="text-lg font-bold text-gray-900 mb-2">
						{workshopActionConfirm.action === 'approve' ? 'Approve Workshop' : 'Reject Workshop'}
					</h3>
					<p className="text-sm text-gray-600 mb-6">
						{workshopActionConfirm.action === 'approve'
							? `Are you sure you want to approve "${workshopActionConfirm.workshopName}"? They will be publicly listed and able to submit offers.`
							: `Are you sure you want to reject "${workshopActionConfirm.workshopName}"? They will not be listed.`}
					</p>
					<div className="flex gap-3 justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setWorkshopActionConfirm({ open: false, workshopId: null, action: null, workshopName: '' })}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={() => handleWorkshopAction(workshopActionConfirm.workshopId, workshopActionConfirm.action)}
							className={workshopActionConfirm.action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
						>
							{workshopActionConfirm.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
						</Button>
					</div>
				</div>
			</div>
		)}
		</div>
	</div>
	)
}
