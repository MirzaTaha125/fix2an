import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
	Building2,
	FileText,
	CheckCircle,
	XCircle,
	ArrowLeft,
	Mail,
	Phone,
	Globe,
	MapPin,
	Clock,
	Car,
} from 'lucide-react'

export default function WorkshopDetailsPage() {
	const navigate = useNavigate()
	const { id } = useParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [workshop, setWorkshop] = useState(null)
	const [loading, setLoading] = useState(true)

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

	useEffect(() => {
		if (id && user && user.role === 'ADMIN') {
			fetchWorkshopDetails()
		}
	}, [id, user])

	const fetchWorkshopDetails = async () => {
		try {
			setLoading(true)
			// Try to fetch workshop by ID first
			try {
				const response = await adminAPI.getWorkshopById(id)
				if (response.data) {
					setWorkshop(response.data)
					return
				}
			} catch (idError) {
				console.log('Workshop not found by ID, trying list...', idError)
			}

			// Fallback: Fetch all workshops and find the one with matching id
			const response = await adminAPI.getWorkshops({ page: 1, limit: 1000 })
			if (response.data && response.data.workshops) {
				const foundWorkshop = response.data.workshops.find(w => (w.id || w._id) === id)
				if (foundWorkshop) {
					setWorkshop(foundWorkshop)
					return
				}
			}

			// Try pending workshops
			const pendingResponse = await adminAPI.getPendingWorkshops()
			const foundPending = pendingResponse.data.find(w => (w.id || w._id) === id)
			if (foundPending) {
				setWorkshop(foundPending)
			} else {
				toast.error(t('admin.workshops.details.workshop_not_found'))
				navigate('/admin')
			}
		} catch (error) {
			console.error('Failed to fetch workshop details:', error)
			toast.error(t('admin.workshops.details.failed_load_details'))
			navigate('/admin')
		} finally {
			setLoading(false)
		}
	}

	const handleWorkshopAction = async (action) => {
		try {
			const updateData = {}
			if (action === 'approve') {
				updateData.isVerified = true
			} else if (action === 'reject') {
				updateData.isVerified = false
			} else if (action === 'block') {
				updateData.isActive = false
			} else if (action === 'unblock') {
				updateData.isActive = true
			}

			await adminAPI.updateWorkshop({ id: workshop.id || workshop._id, ...updateData })
			
			const actionKey = action === 'approve' ? 'workshop_approved' : action === 'reject' ? 'workshop_rejected' : action === 'block' ? 'workshop_blocked' : 'workshop_unblocked'
			toast.success(t(`admin.workshops.${actionKey}`) || `Workshop ${action}ed successfully`)
			
			// Navigate back to admin page
			navigate('/admin')
		} catch (error) {
			console.error('Failed to update workshop:', error)
			toast.error(t('common.failed_update_workshop') || 'Failed to update workshop')
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-white flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 w-full">
					{/* Header Skeleton */}
					<div className="mb-6">
						<Skeleton className="h-4 w-32 mb-4" />
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
							<div>
								<Skeleton className="h-8 sm:h-10 w-64 mb-2" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-28 rounded-md" />
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
					</div>
					{/* Main Grid Skeleton */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Basic Info */}
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<Skeleton className="h-6 w-40 mb-4 pb-2 border-b border-gray-200" />
										<div className="space-y-4">
											{[...Array(6)].map((_, i) => (
												<div key={i}>
													<Skeleton className="h-3 w-24 mb-1" />
													<Skeleton className="h-4 w-48" />
												</div>
											))}
										</div>
									</CardContent>
								</Card>
								{/* Address Info */}
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<Skeleton className="h-6 w-40 mb-4 pb-2 border-b border-gray-200" />
										<div className="space-y-4">
											{[...Array(4)].map((_, i) => (
												<div key={i}>
													<Skeleton className="h-3 w-24 mb-1" />
													<Skeleton className="h-4 w-48" />
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>
							{/* Description */}
							<Card className="border border-gray-200 shadow-sm">
								<CardContent className="p-5">
									<Skeleton className="h-6 w-40 mb-4 pb-2 border-b border-gray-200" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-[90%]" />
										<Skeleton className="h-4 w-[80%]" />
									</div>
								</CardContent>
							</Card>
							{/* Brands & Hours */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<Skeleton className="h-6 w-40 mb-4 pb-2 border-b border-gray-200" />
										<Skeleton className="h-4 w-[90%]" />
									</CardContent>
								</Card>
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<Skeleton className="h-6 w-40 mb-4 pb-2 border-b border-gray-200" />
										<div className="space-y-3">
											{[...Array(7)].map((_, i) => (
												<div key={i} className="flex justify-between items-center py-1 border-b border-gray-100">
													<Skeleton className="h-3 w-16" />
													<Skeleton className="h-3 w-24" />
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
						{/* Documents */}
						<div className="lg:col-span-1">
							<Card className="border border-gray-200 shadow-sm">
								<CardContent className="p-5">
									<Skeleton className="h-6 w-48 mb-4 pb-2 border-b border-gray-200" />
									<div className="space-y-4">
										{[...Array(2)].map((_, i) => (
											<div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col items-center">
												<Skeleton className="w-full h-32 rounded-lg mb-2" />
												<Skeleton className="h-3 w-24" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'ADMIN' || !workshop) {
		return null
	}

	return (
		<div className="min-h-screen bg-white flex flex-col">
			<Navbar />
			<div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 w-full">
				{/* Header */}
				<div className="mb-6">
					<Link to="/admin" className="inline-flex items-center gap-2 mb-4 text-sm text-gray-600 hover:text-[#05324f] transition-colors">
						<ArrowLeft className="w-4 h-4" />
						{t('admin.workshops.details.back_to_admin')}
					</Link>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
						<div>
							<h1 className="text-xl sm:text-xl font-bold mb-1" style={{ color: '#05324f' }}>
								{t('admin.workshops.details.title')}
							</h1>
							<p className="text-sm text-gray-600">
								{t('admin.workshops.details.subtitle')}
							</p>
						</div>
						<div className="flex gap-2">
							{!workshop.isVerified && (
								<Button
									onClick={() => handleWorkshopAction('approve')}
									size="sm"
									className="font-semibold"
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									<CheckCircle className="w-4 h-4 mr-2" />
									{t('admin.workshops.approve')}
								</Button>
							)}
							{workshop.isActive ? (
								<Button
									onClick={() => handleWorkshopAction('block')}
									size="sm"
									variant="destructive"
									className="font-semibold"
								>
									<XCircle className="w-4 h-4 mr-2" />
									{t('admin.workshops.block')}
								</Button>
							) : (
								<Button
									onClick={() => handleWorkshopAction('unblock')}
									size="sm"
									className="font-semibold"
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									<CheckCircle className="w-4 h-4 mr-2" />
									{t('admin.workshops.unblock')}
								</Button>
							)}
						</div>
					</div>

					{/* Status Badges */}
					<div className="flex flex-wrap gap-2">
						{workshop.isVerified ? (
							<Badge className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
								{t('admin.workshops.details.verified')}
							</Badge>
						) : (
							<Badge className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
								{t('admin.workshops.details.pending_verification')}
							</Badge>
						)}
						{workshop.isActive ? (
							<Badge className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
								{t('admin.workshops.details.active')}
							</Badge>
						) : (
							<Badge className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>
								{t('admin.workshops.details.blocked')}
							</Badge>
						)}
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column - Workshop Information (2 columns) */}
					<div className="lg:col-span-2 space-y-6">
						{/* Basic Information & Address - Side by Side */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Basic Information */}
							<Card className="border border-gray-200 shadow-sm">
								<CardContent className="p-5">
									<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200" style={{ color: '#05324f' }}>
										{t('admin.workshops.details.basic_information')}
									</h2>
									<div className="space-y-3">
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.company_name')}</p>
											<p className="text-sm font-semibold" style={{ color: '#05324f' }}>{workshop.companyName}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.organization_number')}</p>
											<p className="text-sm font-semibold" style={{ color: '#05324f' }}>{workshop.organizationNumber}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
												<Mail className="w-3.5 h-3.5" />
												{t('admin.workshops.details.email')}
											</p>
											<p className="text-sm break-all" style={{ color: '#05324f' }}>{workshop.email}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
												<Phone className="w-3.5 h-3.5" />
												{t('admin.workshops.details.phone')}
											</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{workshop.phone || t('common.no_data')}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
												<Globe className="w-3.5 h-3.5" />
												{t('admin.workshops.details.website')}
											</p>
											<p className="text-sm" style={{ color: '#05324f' }}>
												{workshop.website ? (
													<a href={workshop.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
														{workshop.website}
													</a>
												) : t('common.no_data')}
											</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.registered_date')}</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{formatDate(new Date(workshop.createdAt))}</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Address Information */}
							<Card className="border border-gray-200 shadow-sm">
								<CardContent className="p-5">
									<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200" style={{ color: '#05324f' }}>
										{t('admin.workshops.details.address')}
									</h2>
									<div className="space-y-3">
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
												<MapPin className="w-3.5 h-3.5" />
												{t('admin.workshops.details.street_address')}
											</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{workshop.address}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.city')}</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{workshop.city}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.postal_code')}</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{workshop.postalCode}</p>
										</div>
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">{t('admin.workshops.details.country')}</p>
											<p className="text-sm" style={{ color: '#05324f' }}>{workshop.country || 'SE'}</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Description - Full Width */}
						{workshop.description && (
							<Card className="border border-gray-200 shadow-sm">
								<CardContent className="p-5">
									<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200" style={{ color: '#05324f' }}>
										{t('admin.workshops.details.description')}
									</h2>
									<p className="text-sm leading-relaxed" style={{ color: '#05324f' }}>{workshop.description}</p>
								</CardContent>
							</Card>
						)}

						{/* Brands Handled & Opening Hours - Side by Side */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Brands Handled */}
							{workshop.brandsHandled && (
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2" style={{ color: '#05324f' }}>
											<Car className="w-4 h-4" />
											{t('admin.workshops.details.brands_handled')}
										</h2>
										<p className="text-sm" style={{ color: '#05324f' }}>{workshop.brandsHandled}</p>
									</CardContent>
								</Card>
							)}

							{/* Opening Hours */}
							{workshop.openingHours && (
								<Card className="border border-gray-200 shadow-sm">
									<CardContent className="p-5">
										<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2" style={{ color: '#05324f' }}>
											<Clock className="w-4 h-4" />
											{t('admin.workshops.details.opening_hours')}
										</h2>
										<div className="space-y-1.5">
											{(() => {
												try {
													const hours = typeof workshop.openingHours === 'string' 
														? JSON.parse(workshop.openingHours) 
														: workshop.openingHours
													const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
													return days.map((day) => {
														const dayHours = hours[day]
														if (!dayHours || (!dayHours.open && !dayHours.close)) return null
														return (
															<div key={day} className="flex justify-between items-center py-1 text-xs border-b border-gray-100 last:border-0">
																<span className="font-medium capitalize" style={{ color: '#05324f' }}>
																	{day}:
																</span>
																<span style={{ color: '#05324f' }}>
																	{dayHours.open && dayHours.close ? `${dayHours.open} - ${dayHours.close}` : t('admin.workshops.details.closed')}
																</span>
															</div>
														)
													})
												} catch {
													return <p className="text-sm" style={{ color: '#05324f' }}>{workshop.openingHours}</p>
												}
											})()}
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</div>

					{/* Right Column - Documents (1 column) */}
					<div className="lg:col-span-1">
						{workshop.documents && workshop.documents.length > 0 && (
							<Card className="border border-gray-200 shadow-sm sticky top-24">
								<CardContent className="p-5">
									<h2 className="text-xl text-lg font-bold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2" style={{ color: '#05324f' }}>
										<FileText className="w-4 h-4" />
										{t('admin.workshops.details.documents_certifications')}
									</h2>
									<div className="space-y-4">
										{workshop.documents.map((doc, index) => (
											<div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
												{doc.mimeType && doc.mimeType.startsWith('image/') ? (
													<>
														<img 
															src={getFullUrl(doc.fileUrl)} 
															alt="Document"
															className="w-full h-auto rounded-lg border border-gray-200 mb-2 max-h-48 object-contain"
															onError={(e) => {
																e.target.style.display = 'none'
															}}
														/>
														<a 
															href={getFullUrl(doc.fileUrl)} 
															target="_blank" 
															rel="noopener noreferrer"
															className="inline-block text-xs text-blue-600 hover:underline w-full text-center"
														>
															{t('admin.workshops.details.view_full_size')}
														</a>
													</>
												) : (
													<>
														<div className="flex items-center justify-center p-6 bg-white rounded-lg mb-2 border border-gray-200">
															<FileText className="w-10 h-10 text-gray-400" />
														</div>
														<a 
															href={getFullUrl(doc.fileUrl)} 
															target="_blank" 
															rel="noopener noreferrer"
															className="inline-block text-xs text-blue-600 hover:underline w-full text-center"
														>
															{t('admin.workshops.details.view_document')}
														</a>
													</>
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
