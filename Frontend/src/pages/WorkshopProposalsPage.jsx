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
				className: 'bg-blue-50 text-blue-700 border-blue-100',
			},
			ACCEPTED: {
				label: t('workshop.proposals.status.accepted') || 'Accepted',
				className: 'bg-green-50 text-green-700 border-green-100',
			},
			DECLINED: {
				label: t('workshop.proposals.status.declined') || 'Declined',
				className: 'bg-gray-50 text-gray-600 border-gray-100',
			},
			EXPIRED: {
				label: t('workshop.proposals.status.expired') || 'Expired',
				className: 'bg-red-50 text-red-700 border-red-100',
			},
			CANCELLED: {
				label: t('workshop.proposals.status.cancelled') || 'Cancelled',
				className: 'bg-orange-50 text-orange-700 border-orange-100',
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
			case 'CANCELLED':
				return <XCircle className="w-4 h-4" />
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
			case 'CANCELLED':
				return '#f97316' // orange-500
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
				
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	const tabs = [
		{ key: 'all', label: t('workshop.proposals.tabs.all') || 'All' },
		{ key: 'sent', label: t('workshop.proposals.tabs.sent') || 'Sent' },
		{ key: 'accepted', label: t('workshop.proposals.tabs.accepted') || 'Accepted' },
		{ key: 'declined', label: t('workshop.proposals.tabs.declined') || 'Declined' },
		{ key: 'expired', label: t('workshop.proposals.tabs.expired') || 'Expired' },
		{ key: 'cancelled', label: t('workshop.proposals.tabs.cancelled') || 'Cancelled' },
	]

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

			{/* Navigation Tabs - Redesigned Segmented Control */}
			<div className="flex justify-center mb-8 animate-fade-in-up">
				<div className="inline-flex p-1 bg-white border border-gray-100 rounded-full shadow-sm max-md:rounded-2xl max-w-full gap-1 max-md:bg-transparent max-md:border-0 max-md:shadow-none max-md:p-0 max-md:gap-2 max-md:w-full max-md:grid max-md:grid-cols-3">
					{tabs.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap min-w-[70px] sm:min-w-[100px] max-md:flex-1 max-md:py-3.5 max-md:rounded-xl shadow-sm border border-transparent ${
								activeTab === key
									? 'bg-[#34C759] text-white shadow-md active:scale-95 border-[#34C759]'
									: 'text-gray-500 hover:text-[#05324f] hover:bg-gray-50 bg-white max-md:text-gray-600 max-md:border-gray-200'
							}`}
						>
							{label}
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
										? (t('workshop.proposals.no_proposals.description') || 'You haven\'t submitted any proposals yet. Check the jobs tab to find new opportunities.')
										: (t(`workshop.proposals.no_proposals.${activeTab}_description`) || `You don't have any ${activeTab} proposals at the moment.`)
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
															variant="outline"
															className="px-3 py-1 text-xs font-bold rounded-lg border-[#05324f] text-[#05324f]"
														>
															<Eye className="w-3 h-3 mr-1.5" />
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
														variant="outline"
														className="px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-[#05324f] text-[#05324f] hover:bg-[#05324f]/5"
													>
														<Eye className="w-3.5 h-3.5 mr-1.5" />
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

