import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import VehicleImage from '../components/VehicleImage'
import ViewOfferModal from '../components/ViewOfferModal'

import { offersAPI } from '../services/api'

export default function WorkshopProposalsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('all') // all, sent, accepted, declined, expired
	const [viewModalOpen, setViewModalOpen] = useState(false)
	const [selectedOffer, setSelectedOffer] = useState(null)

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
					navigate('/contract', { replace: true })
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
		all: offers.length,
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

	const getStatusLabel = (status) => {
		const statusMap = {
			SENT: t('workshop.proposals.status.sent') || 'Sent',
			ACCEPTED: t('workshop.proposals.status.accepted') || 'Accepted',
			DECLINED: t('workshop.proposals.status.declined') || 'Declined',
			EXPIRED: t('workshop.proposals.status.expired') || 'Expired',
			CANCELLED: t('workshop.proposals.status.cancelled') || 'Cancelled',
		}
		return statusMap[status] || statusMap.SENT
	}

	const filteredOffers = offers.filter((offer) => {
		if (activeTab === 'all') return true
		return offer.status === activeTab.toUpperCase()
	})

	if (authLoading || loading) {
		return (
			<div className="list-page-shell bg-gray-50">
				<Navbar />
				<div className="list-page-content">
					<div className="mb-6 md:mb-7">
						<Skeleton className="h-9 w-40 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
					<div className="list-tabs-row">
						<div className="workshop-pill-tabs-skeleton workshop-pill-tabs-skeleton-scroll">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={`tab-skel-${i}`} className="h-10 w-24 shrink-0 rounded-lg" />
							))}
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
						{[...Array(4)].map((_, i) => (
							<div key={`skel-prop-${i}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4">
								<div className="flex gap-3 md:gap-4">
									<Skeleton className="w-28 h-16 md:w-32 md:h-20 rounded-xl shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-2/3" />
										<Skeleton className="h-10 w-full rounded-xl mt-4" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
				<Footer className="max-lg:hidden" />
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}



	return (
	<div className="list-page-shell bg-gray-50">
		<Navbar />
		<div className="list-page-content">
			<div className="mb-6 md:mb-7">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#05324f] leading-tight mb-1.5 lg:mb-2">
					{t('workshop.proposals.title') || 'Proposals'}
				</h1>
				<p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
					{t('workshop.proposals.subtitle') || 'Track and manage your submitted offers'}
				</p>
			</div>

			<div className="list-tabs-row">
				<div className="workshop-pill-tabs workshop-pill-tabs-multi">
					{allTabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`workshop-pill-tab ${activeTab === tab.key ? 'workshop-pill-tab-active' : 'workshop-pill-tab-inactive'}`}
						>
							{tab.label} ({counts[tab.key]})
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8 max-lg:pb-2">
				{filteredOffers.length === 0 ? (
					<div className="col-span-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center">
						<div className="w-16 h-16 bg-[#34C759]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<FileText className="w-8 h-8 text-[#34C759]" />
						</div>
						<h3 className="text-base font-black text-[#05324f] mb-2">
							{t('workshop.proposals.no_proposals.title') || 'No Proposals Found'}
						</h3>
						<p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
							{activeTab === 'all'
								? (t('workshop.proposals.no_proposals.description', { defaultValue: "You haven't submitted any proposals yet. Check the jobs tab to find new opportunities." }))
								: (t(`workshop.proposals.no_proposals.${activeTab}_description`, { defaultValue: `You don't have any ${activeTab} proposals at the moment.` }))
							}
						</p>
					</div>
				) : (
					filteredOffers.map((offer) => {
						const offerId = offer._id || offer.id
						const request = offer.requestId || offer.request
						const vehicle = request?.vehicleId || request?.vehicle
						const customer = request?.customerId || request?.customer
						const offerDate = offer.createdAt ? formatDateTime(new Date(offer.createdAt)) : ''

						return (
							<div
								key={offerId}
								className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 md:p-4 flex flex-col h-full"
							>
								<div className="flex gap-3 md:gap-4 flex-1 items-start">
									<div className="w-28 md:w-32 shrink-0 self-start rounded-xl overflow-hidden flex items-start justify-center">
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
									<div className="flex-1 min-w-0 self-start">
										<div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
											<h3 className="text-sm font-black text-[#05324f] leading-snug line-clamp-2 flex-1 min-w-0">
												{vehicle?.make} {vehicle?.model} {vehicle?.year}
											</h3>
											<p className="text-base font-black text-[#38BC54] shrink-0 leading-tight">
												{formatPrice(offer.price)}
											</p>
										</div>
										<div className="space-y-1">
											{customer?.name && (
												<p className="text-[11px] text-[#05324f]/80 leading-snug">
													<span className="font-bold">{t('common.customer') || 'Customer'}:</span> {customer.name}
												</p>
											)}
											<p className="text-[11px] text-[#05324f]/80 leading-snug">
												<span className="font-bold">{t('workshop.requests.status') || 'Status'}:</span> {getStatusLabel(offer.status)}
											</p>
											{offerDate && (
												<p className="text-[11px] text-[#05324f]/80">
													<span className="font-bold">{t('workshop.requests.sent_label') || 'Sent'}:</span> {offerDate}
												</p>
											)}
											{offer.expiresAt && (
												<p className="text-[10px] text-red-500">
													{t('offers_page.offer_expires') || 'Valid until'}: {formatDate(offer.expiresAt)}
												</p>
											)}
										</div>
										<div className="mt-4 flex items-center gap-3.5">
											<Button
												onClick={() => {
													setSelectedOffer(offer)
													setViewModalOpen(true)
												}}
												className="flex-1 min-w-0 h-10 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl font-semibold text-xs flex items-center justify-center shadow-sm"
											>
												{t('common.view') || 'View'}
											</Button>
											<ChevronRight className="w-5 h-5 text-black shrink-0" strokeWidth={2} />
										</div>
									</div>
								</div>
							</div>
						)
					})
				)}
			</div>
		</div>

		<ViewOfferModal
			open={viewModalOpen}
			onOpenChange={setViewModalOpen}
			offer={selectedOffer}
		/>

		<Footer className="max-lg:hidden" />
	</div>
	)
}

