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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WorkshopBottomNav from '../components/WorkshopBottomNav'
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

	const getStatusBadge = (status) => {
		const statusMap = {
			SENT: {
				label: t('workshop.proposals.status.sent') || 'Sent',
				className: 'bg-blue-100 text-blue-800 border-blue-200',
			},
			ACCEPTED: {
				label: t('workshop.proposals.status.accepted') || 'Accepted',
				className: 'bg-green-100 text-green-800 border-green-200',
			},
			DECLINED: {
				label: t('workshop.proposals.status.declined') || 'Declined',
				className: 'bg-red-100 text-red-800 border-red-200',
			},
			EXPIRED: {
				label: t('workshop.proposals.status.expired') || 'Expired',
				className: 'bg-gray-100 text-gray-800 border-gray-200',
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
				return <AlertCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	const getStatusIconColor = (status) => {
		switch (status) {
			case 'SENT':
				return '#3b82f6' // blue-500
			case 'ACCEPTED':
				return '#34C759' // green
			case 'DECLINED':
				return '#ef4444' // red-500
			case 'EXPIRED':
				return '#6b7280' // gray-500
			default:
				return '#34C759' // green
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
				<WorkshopBottomNav />
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
				<h1 className="text-xl md:text-h1 font-bold text-[#05324f]">
					{t('workshop.proposals.title') || 'Proposals'}
				</h1>
			</div>

				{/* Tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					<Button
						variant={activeTab === 'all' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('all')}
						className={activeTab === 'all' ? 'bg-[#34C759] text-white' : ''}
					>
						{t('workshop.proposals.tabs.all') || 'All'}
					</Button>
					<Button
						variant={activeTab === 'sent' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('sent')}
						className={activeTab === 'sent' ? 'bg-[#34C759] text-white' : ''}
					>
						{t('workshop.proposals.tabs.sent') || 'Sent'}
					</Button>
					<Button
						variant={activeTab === 'accepted' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('accepted')}
						className={activeTab === 'accepted' ? 'bg-[#34C759] text-white' : ''}
					>
						{t('workshop.proposals.tabs.accepted') || 'Accepted'}
					</Button>
					<Button
						variant={activeTab === 'declined' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('declined')}
						className={activeTab === 'declined' ? 'bg-[#34C759] text-white' : ''}
					>
						{t('workshop.proposals.tabs.declined') || 'Declined'}
					</Button>
					<Button
						variant={activeTab === 'expired' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('expired')}
						className={activeTab === 'expired' ? 'bg-[#34C759] text-white' : ''}
					>
						{t('workshop.proposals.tabs.expired') || 'Expired'}
					</Button>
				</div>

				{/* Proposals List */}
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					{filteredOffers.length === 0 ? (
						<Card className="border-0 shadow-2xl overflow-hidden">
							<CardContent className="text-center py-20 sm:py-24 px-6 bg-white">
								<div className="relative inline-block mb-8">
									<div className="relative p-10 sm:p-12 rounded-3xl border-2 border-gray-200">
										<FileText className="w-24 h-24 sm:w-28 sm:h-28 mx-auto" style={{ color: '#34C759' }} />
									</div>
								</div>
								<h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#05324f' }}>
									{t('workshop.proposals.no_proposals.title') || 'No Proposals'}
								</h3>
								<p className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed" style={{ color: '#05324f' }}>
									{t('workshop.proposals.no_proposals.description') || 'You haven\'t submitted any proposals yet.'}
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
										{/* Left: Title, Name with Date, Description/Price */}
										<div className="min-w-0 md:col-span-2">
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
											{/* Username with Date and Time */}
											<div className="flex items-center gap-2 mb-1 flex-wrap">
												{customer?.name && (
													<div className="flex items-center gap-1.5">
														<User className="w-3 h-3" style={{ color: '#05324f' }} />
														<p className="text-xs font-semibold" style={{ color: '#05324f' }}>{customer.name}</p>
													</div>
												)}
												{customer?.name && offerDate && (
													<span style={{ color: '#05324f' }}>•</span>
												)}
												{offerDate && (
													<p className="text-xs" style={{ color: '#05324f' }}>{offerDate}</p>
												)}
											</div>
											{/* Description/Note or Price with Edit Button (Mobile) */}
											<div className="flex items-center justify-between gap-2">
												<p className="text-sm" style={{ color: '#05324f' }}>
													{offer.note || formatK(offer.price)}
												</p>
												{/* Mobile: Edit button next to price */}
												{offer.status === 'SENT' && (
													<div className="flex-shrink-0 md:hidden">
														<Link to={`/workshop/requests/${request?._id || request?.id}/offer`}>
															<Button
																size="sm"
																className="px-3 py-1 text-xs font-semibold rounded-md"
																style={{ 
																	backgroundColor: '#34C759',
																	color: '#FFFFFF'
																}}
															>
																<Edit className="w-3 h-3 mr-1.5" />
																{t('workshop.proposals.edit') || 'Edit'}
															</Button>
														</Link>
													</div>
												)}
											</div>
										</div>

										{/* Right: Status Badge and Edit Button (Desktop) */}
										<div className="hidden md:flex flex-col justify-between items-end gap-3 min-h-[60px]">
											<div className="flex-shrink-0">
												{getStatusBadge(offer.status)}
											</div>
											{offer.status === 'SENT' && (
												<div className="flex-shrink-0">
													<Link to={`/workshop/requests/${request?._id || request?.id}/offer`}>
														<Button
															size="sm"
															className="px-3 py-1 text-xs font-semibold rounded-md"
															style={{ 
																backgroundColor: '#34C759',
																color: '#FFFFFF'
															}}
														>
															<Edit className="w-3 h-3 mr-1.5" />
															{t('workshop.proposals.edit') || 'Edit'}
														</Button>
													</Link>
												</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</div>
			<WorkshopBottomNav />
			<Footer />
		</div>
	)
}

