import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	Car,
	Calendar,
	CheckCircle,
	XCircle,
	Clock,
	FileText,
	Eye,
	Edit,
	DollarSign,
	AlertCircle,
	Send,
	User,
	Mail,
	Phone,
	Inbox,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { offersAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function WorkshopProposalsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('all') // all, sent, accepted, declined, expired

	// Redirect if not authenticated or wrong role
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

	const fetchOffers = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			const response = await offersAPI.getByWorkshop()
			if (response.data) {
				setOffers(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch offers:', error)
			toast.error(t('workshop.proposals.fetch_error') || 'Failed to fetch proposals')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchOffers()
		}
	}, [user])

	const counts = {
		sent: offers.filter(o => o.status === 'SENT').length,
		accepted: offers.filter(o => o.status === 'ACCEPTED').length,
		declined: offers.filter(o => o.status === 'DECLINED').length,
		expired: offers.filter(o => o.status === 'EXPIRED').length,
		cancelled: offers.filter(o => o.status === 'CANCELLED').length,
	}

	const allTabs = [
		{ key: 'all', label: t('workshop.proposals.tabs.all') || 'All' },
		{ key: 'sent', label: t('workshop.proposals.tabs.sent') || 'Sent' },
		{ key: 'accepted', label: t('workshop.proposals.tabs.accepted') || 'Accepted' },
		{ key: 'declined', label: t('workshop.proposals.tabs.declined') || 'Declined' },
		{ key: 'expired', label: t('workshop.proposals.tabs.expired') || 'Expired' },
		{ key: 'cancelled', label: t('workshop.proposals.tabs.cancelled') || 'Cancelled' },
	]

	const visibleTabs = allTabs.filter(tab => tab.key === 'all' || counts[tab.key] > 0)

	// Auto-reset tab if it becomes hidden
	useEffect(() => {
		if (activeTab !== 'all' && !visibleTabs.find(t => t.key === activeTab)) {
			setActiveTab('all')
		}
	}, [visibleTabs, activeTab])

	const getStatusBadge = (status) => {
		const statusMap = {
			SENT: {
				label: t('workshop.proposals.status.sent') || 'Sent',
				className: 'bg-green-50 text-green-800 border-green-200',
			},
			ACCEPTED: {
				label: t('workshop.proposals.status.accepted') || 'Accepted',
				className: 'bg-green-50 text-green-800 border-green-200',
			},
			DECLINED: {
				label: t('workshop.proposals.status.declined') || 'Declined',
				className: 'bg-gray-50 text-gray-600 border-gray-100',
			},
			EXPIRED: {
				label: t('workshop.proposals.status.expired') || 'Expired',
				className: 'bg-green-50 text-green-800 border-green-200',
			},
			CANCELLED: {
				label: t('workshop.proposals.status.cancelled') || 'Cancelled',
				className: 'bg-red-50 text-red-600 border-red-200',
			},
		}

		const statusInfo = statusMap[status] || statusMap.SENT
		return (
			<Badge variant="outline" className={`${statusInfo.className} border font-semibold !transition-none`}>
				{statusInfo.label}
			</Badge>
		)
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'SENT':
				return <Send className="w-4 h-4" />
			case 'ACCEPTED':
				return <CheckCircle className="w-4 h-4" />
			case 'DECLINED':
				return <XCircle className="w-4 h-4" />
			case 'EXPIRED':
				return <Clock className="w-4 h-4" />
			case 'CANCELLED':
				return <AlertCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	const getStatusIconColor = (status) => {
		switch (status) {
			case 'SENT':
			case 'ACCEPTED':
			case 'EXPIRED':
				return '#166534' // green-800
			case 'DECLINED':
				return '#4b5563' // gray-600
			case 'CANCELLED':
				return '#dc2626' // red-600 (full red)
			default:
				return '#34C759' // default green
		}
	}

	const filteredOffers = offers.filter((offer) => {
		if (activeTab === 'all') return true
		return offer.status === activeTab.toUpperCase()
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

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
					{/* Header Skeleton */}
					<div className="mb-8">
						<Skeleton className="h-8 md:h-10 w-48" />
					</div>
					{/* Tabs Skeleton */}
					<div className="flex flex-wrap gap-2 mb-6">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={`tab-${i}`} className="h-9 w-20 rounded-md" />
						))}
					</div>
					{/* Proposals List Skeleton */}
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<Card key={`skel-prop-${i}`}>
								<CardContent className="p-4 sm:p-6">
									<div className="flex flex-col sm:flex-row justify-between gap-4">
										<div className="space-y-3 flex-1">
											<div className="flex items-center gap-3">
												<Skeleton className="h-5 w-48" />
												<Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
											</div>
											<Skeleton className="h-4 w-3/4 max-w-[400px]" />
											<Skeleton className="h-4 w-1/2 max-w-[300px]" />
										</div>
										<div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
											<Skeleton className="h-6 w-24" />
											<Skeleton className="h-4 w-20" />
										</div>
									</div>
									<div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
										<Skeleton className="h-9 w-full sm:w-28 rounded-md" />
										<Skeleton className="h-9 w-full sm:w-28 rounded-md" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
				
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}



	return (
	<div className="min-h-screen bg-gray-50 flex flex-col">
		<Navbar />
		<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-xl md:text-xl font-bold text-[#05324f] mb-1">
					{t('workshop.proposals.title') || 'Proposals'}
				</h1>
				<p className="text-sm text-gray-500">
					{t('workshop.proposals.subtitle') || 'Track and manage your submitted offers'}
				</p>
			</div>

			{/* Navigation Tabs - Synchronized & Refined Mobile Styling */}
			<div className="flex justify-start mb-8 animate-fade-in-up overflow-x-auto no-scrollbar pb-2">
				<div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1 max-md:w-full max-md:bg-gray-100 max-md:border-0 max-md:shadow-none max-md:p-0 max-md:gap-2 max-md:rounded-xl">
					{visibleTabs.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[100px] max-md:flex-1 max-md:py-2 max-md:rounded-lg max-md:text-[11px] shadow-sm border border-transparent flex items-center justify-center gap-2 ${
								activeTab === key
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:bg-gray-200 max-md:border-0'
							}`}
						>
							<span>{label}</span>
						</button>
					))}
				</div>
			</div>

				{/* Proposals List */}
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{filteredOffers.length === 0 ? (
						<Card className="border-0 shadow-xl overflow-hidden rounded-3xl animate-fade-in-up">
							<CardContent className="text-center py-20 sm:py-24 px-6 bg-white">
								<div className="relative inline-block mb-8">
									<div className="w-24 h-24 bg-[#34C759]/10 rounded-3xl flex items-center justify-center mb-0 rotate-3 transition-transform hover:rotate-0">
										<FileText className="w-12 h-12 text-[#34C759]" />
									</div>
								</div>
								<h3 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: '#05324f' }}>
									{t('workshop.proposals.no_proposals.title') || 'No Proposals Found'}
								</h3>
								<p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed" style={{ color: 'inherit' }}>
									{activeTab === 'all' 
										? (t('workshop.proposals.no_proposals.description', { defaultValue: "You haven't submitted any proposals yet. Check the jobs tab to find new opportunities." }))
										: (t(`workshop.proposals.no_proposals.${activeTab}_description`, { defaultValue: `You don't have any ${activeTab} proposals at the moment.` }))
									}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-0">
							{filteredOffers.map((offer, index) => {
								const offerId = offer._id || offer.id
								const request = offer.requestId || offer.request
								const vehicle = request?.vehicleId || request?.vehicle
								const customer = request?.customerId || request?.customer
								const offerDate = offer.createdAt ? new Date(offer.createdAt).toLocaleString('en-US', { 
									month: 'short', 
									day: 'numeric', 
									year: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								}) : ''

								return (
									<div
										key={offerId}
										className={`grid grid-cols-1 md:grid-cols-3 items-start py-4 px-4 sm:px-6 gap-3 sm:gap-4 ${index !== filteredOffers.length - 1 ? 'border-b border-gray-200' : ''}`}
									>
										<div className="min-w-0 md:col-span-2">
											{/* Date (Desktop & Mobile) at the top */}
											{offerDate && (
												<div className="mb-1">
													<p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">{offerDate}</p>
												</div>
											)}
											{/* Title (Vehicle Name) with Status Badge (Mobile) */}
											<div className="flex items-start justify-between gap-2 mb-1">
												<h3 className="text-base font-bold flex-1" style={{ color: '#05324f' }}>
													{vehicle?.make} {vehicle?.model}-{vehicle?.year}
												</h3>
												{/* Mobile: Badge next to title */}
												<div className="flex-shrink-0 md:hidden">
													{getStatusBadge(offer.status)}
												</div>
											</div>
											<div className="flex items-center gap-2 mb-1 flex-wrap">
												{customer?.name && (
													<div className="flex items-center gap-1.5">
														<User className="w-3 h-3" style={{ color: '#05324f' }} />
														<p className="text-xs font-semibold" style={{ color: '#05324f' }}>{customer.name}</p>
													</div>
												)}
											</div>
											{/* Description/Note or Price with Edit Button (Mobile) */}
											<div className="flex flex-col gap-1">
												<p className="text-sm" style={{ color: '#05324f' }}>
													{offer.note}
												</p>
												<div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 font-medium">
													<span>{t('offers_page.labor_cost') || 'Labor'}: {formatPrice(offer.laborCost)}</span>
													<span>{t('offers_page.material_cost') || 'Materials'}: {formatPrice(offer.partsCost)}</span>
													{offer.inclusions && <span className="text-[#34C759]">{t('offers_page.included_services') || 'Included'}: {offer.inclusions}</span>}
												</div>
											</div>
											
											<div className="flex items-center justify-between gap-2 mt-2">
												<div className="flex flex-col">
													<p className="text-base font-bold text-[#34C759]">
														{formatPrice(offer.price)}
													</p>
													{offer.expiresAt && (
														<p className="text-[10px] text-red-500 italic">
															{t('offers_page.offer_expires') || 'Expires'}: {formatDate(offer.expiresAt)}
														</p>
													)}
												</div>

												{/* Mobile: View button for all, Edit only if draft (if we had drafts) */}
												<div className="flex-shrink-0 md:hidden flex gap-2">
													<Link to={`/workshop/requests/${request?._id || request?.id || request}/offer?view=true`}>
														<Button
															size="sm"
															className="px-4 py-1 text-xs font-semibold rounded-lg bg-[#05324f] text-white hover:bg-[#05324f]/90 transition-colors"
														>
															{t('common.view') || 'View'}
														</Button>
													</Link>
												</div>
											</div>
										</div>

										{/* Right: Status Badge and Action Buttons (Desktop) */}
										<div className="hidden md:flex flex-col justify-between items-end gap-3 min-h-[60px]">
											<div className="flex-shrink-0">
												{getStatusBadge(offer.status)}
											</div>
											<div className="flex-shrink-0 flex gap-2">
												<Link to={`/workshop/requests/${request?._id || request?.id || request}/offer?view=true`}>
													<Button
														size="sm"
														className="px-6 py-1.5 text-xs font-semibold rounded-lg bg-[#05324f] text-white hover:bg-[#05324f]/90 transition-colors"
													>
														{t('common.view') || 'View'}
													</Button>
												</Link>
												{/* We can add an 'Duplicate' or 'New Version' button here later if needed */}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</div>
			
			<Footer />
		</div>
	)
}

