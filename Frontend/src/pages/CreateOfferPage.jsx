import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { Car, Send, Clock, DollarSign, FileText, Shield, Calendar, User, MessageSquare, CheckCircle, ArrowLeft, Eye, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, offersAPI } from '../services/api'

export default function CreateOfferPage() {
	const navigate = useNavigate()
	const { id: requestId } = useParams()
	const [searchParams] = useSearchParams()
	const viewMode = searchParams.get('view') === 'true'
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [request, setRequest] = useState(null)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [existingOffer, setExistingOffer] = useState(null)

	const [formData, setFormData] = useState({
		price: '',
		laborCost: '',
		partsCost: '',
		estimatedDuration: '',
		warranty: '',
		validityDays: '14',
		inclusions: '',
		note: '',
		availableDates: [''],
	})

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

	useEffect(() => {
		if (requestId && user && user.role === 'WORKSHOP') {
			fetchRequest()
		}
	}, [requestId, user])

	const fetchRequest = async () => {
		try {
			const response = await requestsAPI.getById(requestId)

			if (response.data) {
				setRequest(response.data)

				// Check if this workshop has already submitted an offer for this request
				try {
					const offersResponse = await offersAPI.getByWorkshop()
					if (offersResponse.data && Array.isArray(offersResponse.data)) {
						const workshopOffer = offersResponse.data.find((offer) => {
							const offerRequestId = offer.requestId?._id || offer.requestId?.id || offer.requestId
							return offerRequestId?.toString() === requestId?.toString()
						})

						if (workshopOffer) {
							setExistingOffer(workshopOffer)

							let parsedDates = ['']
							if (workshopOffer.availableDates) {
								try {
									parsedDates = typeof workshopOffer.availableDates === 'string'
										? JSON.parse(workshopOffer.availableDates)
										: workshopOffer.availableDates
									if (!Array.isArray(parsedDates) || parsedDates.length === 0) parsedDates = ['']
								} catch {
									parsedDates = ['']
								}
							}

							setFormData({
								price: workshopOffer.price?.toString() || '',
								laborCost: workshopOffer.laborCost?.toString() || '',
								partsCost: workshopOffer.partsCost?.toString() || '',
								estimatedDuration: workshopOffer.estimatedDuration?.toString() || '',
								warranty: workshopOffer.warranty || '',
								validityDays: workshopOffer.validityDays?.toString() || '14',
								inclusions: workshopOffer.inclusions || '',
								note: workshopOffer.note || '',
								availableDates: parsedDates,
							})
						}
					}
				} catch (offerError) {
					console.error('Failed to fetch existing offer:', offerError)
				}
			}
		} catch (error) {
			console.error('Failed to fetch request:', error)
			toast.error(t('errors.request_not_found') || 'Request not found')
			navigate('/workshop/requests')
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!formData.price || !formData.estimatedDuration) {
			toast.error(t('errors.required_fields') || 'Please fill in all required fields')
			return
		}

		// Filter out empty dates and validate
		const validDates = formData.availableDates.filter((date) => date && date.trim() !== '')
		if (validDates.length === 0) {
			toast.error(t('errors.at_least_one_date') || 'Please add at least one available time slot')
			return
		}

		setSubmitting(true)

		try {
			let response
			if (existingOffer) {
				// Update existing offer
				const offerId = existingOffer._id || existingOffer.id
				response = await offersAPI.update(offerId, {
					price: parseFloat(formData.price),
					laborCost: parseFloat(formData.laborCost),
					partsCost: parseFloat(formData.partsCost),
					estimatedDuration: parseInt(formData.estimatedDuration),
					warranty: formData.warranty || '',
					validityDays: parseInt(formData.validityDays),
					inclusions: formData.inclusions || '',
					note: formData.note || '',
					availableDates: validDates,
				})
			} else {
				// Create new offer
				response = await offersAPI.create({
					requestId,
					price: parseFloat(formData.price),
					laborCost: parseFloat(formData.laborCost),
					partsCost: parseFloat(formData.partsCost),
					estimatedDuration: parseInt(formData.estimatedDuration),
					warranty: formData.warranty || '',
					validityDays: parseInt(formData.validityDays),
					inclusions: formData.inclusions || '',
					note: formData.note || '',
					availableDates: validDates,
				})
			}

			if (response.data) {
				toast.success(
					existingOffer 
						? (t('success.offer_updated') || 'Offer updated successfully!')
						: (t('success.offer_created') || 'Offer created successfully!')
				)
				navigate('/workshop/requests')
			}
		} catch (error) {
			console.error('Failed to create/update offer:', error)
			toast.error(error.response?.data?.message || (existingOffer ? t('errors.offer_update_failed') : t('errors.offer_creation_failed')))
		} finally {
			setSubmitting(false)
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
					{/* Header Skeleton */}
					<div className="mb-8 space-y-2">
						<Skeleton className="h-8 md:h-10 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					
					{/* Request Info Card Skeleton */}
					<Card className="mb-8 sm:mb-10 md:mb-12 shadow-lg border border-gray-200 bg-white">
						<CardHeader className="pb-4 sm:pb-5 px-5 sm:px-7 pt-5 sm:pt-7">
							<Skeleton className="h-6 w-40" />
							<Skeleton className="h-4 w-full mt-2" />
						</CardHeader>
						<CardContent className="pt-0 px-5 sm:px-7 pb-5 sm:pb-7 flex flex-col md:flex-row gap-6">
							<div className="flex-1 space-y-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
							<div className="flex-1 space-y-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</CardContent>
					</Card>

					{/* Form Skeleton */}
					<Card className="shadow-lg border border-gray-200 bg-white">
						<CardHeader className="pb-4 sm:pb-5 px-5 sm:px-7 pt-5 sm:pt-7">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-full mt-2" />
						</CardHeader>
						<CardContent className="pt-0 px-5 sm:px-7 pb-5 sm:pb-7 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-24 w-full" />
							<div className="flex justify-end gap-4 pt-6">
								<Skeleton className="h-10 w-24" />
								<Skeleton className="h-10 w-32" />
							</div>
						</CardContent>
					</Card>
				</div>
				<Footer />
			</div>
		)
	}

	if (!request) {
		return null
	}

	// Block editing if offer was already SENT, ACCEPTED, EXPIRED or CANCELLED (unless in viewMode)
	if (!viewMode && existingOffer && (['SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].includes(existingOffer.status))) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="max-w-5xl mx-auto px-4 py-24 text-center">
					<div className="mb-6 flex justify-center">
						<div className="p-4 bg-gray-50 rounded-full">
							<Shield className="w-12 h-12 text-[#34C759]" />
						</div>
					</div>
					<h2 className="text-2xl font-bold text-[#05324f] mb-4">
						{existingOffer.status === 'SENT' 
							? (t('workshop.offer.locked_title') || 'Offer Sent & Locked')
							: existingOffer.status === 'ACCEPTED' 
							? (t('workshop.offer.already_accepted_title') || 'Offer Accepted')
							: existingOffer.status === 'CANCELLED'
							? (t('workshop.offer.cancelled_title') || 'Offer Cancelled')
							: (t('workshop.offer.expired_title') || 'Offer Expired')
						}
					</h2>
					<p className="text-gray-600 mb-8 max-w-md mx-auto">
						{existingOffer.status === 'SENT'
							? (t('workshop.offer.locked_desc') || 'Sent offers are locked to ensure pricing trust with the customer. To make changes, please create a new version.')
							: existingOffer.status === 'ACCEPTED'
							? (t('workshop.offer.already_accepted') || 'This offer has been accepted and cannot be edited.')
							: existingOffer.status === 'CANCELLED'
							? (t('workshop.offer.cancelled_desc') || 'This booking was cancelled. See details for the reason.')
							: (t('workshop.offer.expired_description') || 'This offer has expired because the customer chose another workshop for this request.')
						}
					</p>
					<div className="flex justify-center gap-4">
						<Link to="/workshop/requests">
							<Button variant="outline">
								{t('common.back_to_requests') || 'Back to Requests'}
							</Button>
						</Link>
					</div>
				</div>
			</div>
		)
	}

	const vehicle = request.vehicleId || request.vehicle
	const customer = request.customerId || request.customer

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16">
				{/* Header */}
				<div className="mb-8 sm:mb-10 md:mb-12">
					<div className="mb-2">
						<h1 className="text-xl sm:text-xl md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							{existingOffer 
								? (t('workshop.offer.edit_title') || 'Edit Offer')
								: (t('workshop.offer.title') || 'Create Offer')
							}
						</h1>
						<p className="text-sm sm:text-base text-gray-600 mt-1">
							{existingOffer
								? (t('workshop.offer.edit_subtitle') || 'Update your offer for this request')
								: (t('workshop.offer.subtitle') || 'Submit your competitive offer for this request')
							}
						</p>
					</div>
				</div>

				{/* Simplified Cancellation Notice */}
				{existingOffer && existingOffer.status === 'CANCELLED' && (
					<div className="mb-8 p-5 bg-red-50/50 border-l-4 border-red-500 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
						<div className="flex items-center gap-4">
							<div className="bg-red-100 p-2.5 rounded-xl shrink-0">
								<AlertTriangle className="w-6 h-6 text-red-600" />
							</div>
							<div className="flex-1">
								<p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">
									{existingOffer.cancelledBy === 'WORKSHOP' ? 'Cancelled by You' : 'Cancelled by Customer'}
								</p>
								<p className="text-base text-red-800 font-medium italic italic leading-relaxed">
									"{existingOffer.cancellationReason || 'No reason provided'}"
								</p>
								{existingOffer.cancelledAt && (
									<p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-widest">
										{formatDate(new Date(existingOffer.cancelledAt))}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Info Notice for other states */}
				{existingOffer && existingOffer.status === 'EXPIRED' && (
					<div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3">
						<Clock className="w-5 h-5 text-gray-400" />
						<p className="text-sm text-gray-600">
							{t('workshop.offer.expired_description') || 'This offer has expired because the customer chose another workshop.'}
						</p>
					</div>
				)}

				{existingOffer && existingOffer.status === 'ACCEPTED' && (
					<div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
						<CheckCircle className="w-5 h-5 text-green-600" />
						<p className="text-sm text-green-700">
							{t('workshop.offer.already_accepted') || 'Great news! Your offer was accepted.'}
						</p>
					</div>
				)}

				{/* Request Info */}
				<Card className="mb-8 sm:mb-10 md:mb-12 shadow-lg border border-gray-200 bg-white">
					<CardHeader className="pb-4 sm:pb-5 px-5 sm:px-7 pt-5 sm:pt-7">
						<CardTitle className="text-lg sm:text-xl text-gray-900">
							<span>{t('workshop.offer.request_details') || 'Request Details'}</span>
						</CardTitle>
						<CardDescription className="text-gray-600 mt-2 text-xs sm:text-sm">
							{t('workshop.offer.review_request') || 'Review the customer\'s request before submitting your offer'}
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0 px-5 sm:px-7 pb-5 sm:pb-7">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
							<div>
								<div className="flex items-start gap-3 sm:gap-4">
									<div className="p-2 sm:p-2.5 bg-green-50 rounded-lg flex-shrink-0">
										<Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#34C759' }} />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
											{t('workshop.offer.vehicle') || 'Vehicle'}
										</p>
										<p className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
											{vehicle?.make} {vehicle?.model}
										</p>
										<p className="text-xs sm:text-sm text-gray-600">{t('workshop.offer.year') || 'Year'}: {vehicle?.year}</p>
									</div>
								</div>
							</div>

							<div>
								<div className="flex items-start gap-3 sm:gap-4">
									<div className="p-2 sm:p-2.5 bg-green-50 rounded-lg flex-shrink-0">
										<User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#34C759' }} />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
											{t('workshop.offer.customer') || 'Customer'}
										</p>
										<p className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">{customer?.name || 'Customer'}</p>
									</div>
								</div>
							</div>
						</div>

						{request.description && (
							<div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
								<div className="flex items-start gap-3 sm:gap-4">
									<div className="p-2 sm:p-2.5 bg-green-50 rounded-lg flex-shrink-0">
										<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#34C759' }} />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">
											{t('workshop.offer.customer_description') || 'Customer\'s Description'}
										</p>
										<p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg leading-relaxed">
											{request.description}
										</p>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Offer Form */}
				<Card className="shadow-lg border border-gray-200 bg-white">
					<CardHeader className="pb-4 sm:pb-5 px-5 sm:px-7 pt-5 sm:pt-7">
						<CardTitle className="text-lg sm:text-xl text-gray-900">
							<span>{t('workshop.offer.your_offer_details') || 'Your Offer Details'}</span>
						</CardTitle>
						<CardDescription className="text-gray-600 mt-2 text-xs sm:text-sm">
							{t('workshop.offer.fill_details') || 'Fill in all the details to make your offer competitive'}
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-0 px-5 sm:px-7 pb-5 sm:pb-7">
						<form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
							{/* Price and Duration Structure */}
							<div className="space-y-8">
								{/* Top Section: Price and Validity */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-start">
									<div className="space-y-6">
										{/* Total Price */}
										<div className="space-y-2 bg-[#05324f]/5 p-5 rounded-2xl border border-[#05324f]/10 shadow-sm transition-all hover:shadow-md">
											<Label htmlFor="price" className="flex items-center gap-2 text-sm font-bold text-[#05324f]">
												<DollarSign className="w-5 h-5 text-[#34C759]" />
												<span>
													Total Price (VAT Included) <span className="text-red-500">*</span>
												</span>
											</Label>
											<div className="relative mt-3">
												<Input
													id="price"
													type="number"
													min="0"
													step="0.01"
													value={formData.price}
													disabled={viewMode}
													onChange={(e) => setFormData({ ...formData, price: e.target.value })}
													placeholder="0.00"
													required
													className="pl-12 h-14 text-2xl font-bold text-[#05324f] border-[#05324f]/20 focus:border-[#34C759] bg-white rounded-xl shadow-inner transition-all"
												/>
												<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05324f] font-bold text-xl">kr</div>
											</div>
										</div>

										{/* Offer Validity */}
										<div className="space-y-3 px-1">
											<Label className="flex items-center gap-2 text-sm font-bold text-gray-700">
												<Clock className="w-4 h-4 text-[#34C759]" />
												<span>Offer Valid For</span>
											</Label>
											<div className="flex gap-3">
												{['7', '14', '30'].map((days) => (
													<button
														key={days}
														type="button"
														disabled={viewMode}
														onClick={() => setFormData({ ...formData, validityDays: days })}
														className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
															formData.validityDays === days
																? 'bg-[#05324f] border-[#05324f] text-white shadow-lg scale-[1.02]'
																: 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
														} ${viewMode ? 'cursor-default' : 'hover:shadow-md active:scale-95'}`}
													>
														{days} Days
													</button>
												))}
											</div>
										</div>
									</div>

									{/* Right side spacer for desktop, can be used for extra info if needed later */}
									<div className="hidden md:block"></div>
								</div>

								{/* Inline Costs and Duration Breakdown */}
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-2">
									{/* Labor Cost */}
									<div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
										<Label htmlFor="laborCost" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Labor Cost (SEK)
										</Label>
										<Input
											id="laborCost"
											type="number"
											disabled={viewMode}
											value={formData.laborCost}
											onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
											placeholder="0.00"
											className="h-11 text-base font-medium border-gray-200 focus:border-[#34C759] focus:ring--[#34C759]/10 rounded-lg bg-white"
										/>
									</div>

									{/* Parts Cost */}
									<div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
										<Label htmlFor="partsCost" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
											Materials & Parts (SEK)
										</Label>
										<Input
											id="partsCost"
											type="number"
											disabled={viewMode}
											value={formData.partsCost}
											onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
											placeholder="0.00"
											className="h-11 text-base font-medium border-gray-200 focus:border-[#34C759] focus:ring--[#34C759]/10 rounded-lg bg-white"
										/>
									</div>

									{/* Estimated Duration */}
									<div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100 col-span-1 sm:col-span-2 md:col-span-1">
										<Label htmlFor="estimatedDuration" className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
											<Clock className="w-3.5 h-3.5 text-[#34C759]" />
											<span>Estimated Duration (mins)</span>
										</Label>
										<Input
											id="estimatedDuration"
											type="number"
											min="1"
											value={formData.estimatedDuration}
											disabled={viewMode}
											onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
											placeholder="60"
											required
											className="h-11 text-base font-bold text-[#05324f] border-gray-200 focus:border-[#34C759] focus:ring--[#34C759]/10 rounded-lg bg-white"
										/>
									</div>
								</div>
							</div>

							{/* Warranty */}
							<div className="space-y-2 sm:space-y-3">
								<Label htmlFor="warranty" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
									<div className="p-1 sm:p-1.5 bg-green-50 rounded-md flex-shrink-0">
										<Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#34C759' }} />
									</div>
									<span>{t('workshop.offer.warranty_period') || 'Warranty Period'}</span>
								</Label>
								<Input
									id="warranty"
									type="text"
									value={formData.warranty}
									disabled={viewMode}
									onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
									placeholder={t('workshop.offer.warranty_placeholder') || 'e.g., 1 year, 12 months, 2 years'}
									className="h-10 sm:h-12 text-sm sm:text-base"
								/>
								<p className="text-xs text-gray-500 ml-6 sm:ml-7">
									{t('workshop.offer.warranty_optional') || 'Optional: Add warranty information to make your offer more attractive'}
								</p>
							</div>

							{/* Available Dates */}
							<div className="space-y-2 sm:space-y-3">
								<Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
									<div className="p-1 sm:p-1.5 bg-indigo-50 rounded-md flex-shrink-0">
										<Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#34C759' }} />
									</div>
									<span>
										{t('workshop.offer.available_times') || 'Available Times'} <span className="text-red-500">*</span>
									</span>
								</Label>
								<div className="space-y-2 sm:space-y-3">
									{formData.availableDates.map((date, index) => {
										// Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
										const getLocalDateTime = (isoString) => {
											if (!isoString) return ''
											try {
												const dateObj = new Date(isoString)
												// Get local date/time in YYYY-MM-DDTHH:mm format
												const year = dateObj.getFullYear()
												const month = String(dateObj.getMonth() + 1).padStart(2, '0')
												const day = String(dateObj.getDate()).padStart(2, '0')
												const hours = String(dateObj.getHours()).padStart(2, '0')
												const minutes = String(dateObj.getMinutes()).padStart(2, '0')
												return `${year}-${month}-${day}T${hours}:${minutes}`
											} catch {
												return ''
											}
										}

										return (
											<div key={index} className="flex items-center gap-2">
												<Input
													type="datetime-local"
													value={getLocalDateTime(date)}
													disabled={viewMode}
													onChange={(e) => {
														const newDates = [...formData.availableDates]
														// Convert datetime-local value to ISO string
														newDates[index] = e.target.value ? new Date(e.target.value).toISOString() : ''
														setFormData({ ...formData, availableDates: newDates })
													}}
													className="h-10 sm:h-12 text-xs sm:text-sm flex-1"
													required
												/>
												{!viewMode && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															const newDates = formData.availableDates.filter((_, i) => i !== index)
															setFormData({ ...formData, availableDates: newDates })
														}}
														className="px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0"
													>
														{t('common.delete') || 'Remove'}
													</Button>
												)}
											</div>
										)
									})}
									{!viewMode && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setFormData({ ...formData, availableDates: [...formData.availableDates, ''] })
											}}
											className="w-full text-xs sm:text-sm"
										>
											+ {t('workshop.offer.add_available_time') || 'Add Available Time'}
										</Button>
									)}
								</div>
								<p className="text-xs text-gray-500 ml-6 sm:ml-7">
									{t('workshop.offer.add_at_least_one') || 'Add at least one available time slot for the customer to choose from'}
								</p>
							</div>

							{/* Inclusions & Highlights */}
							<div className="space-y-3">
								<Label htmlFor="inclusions" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
									<CheckCircle className="w-4 h-4 text-[#34C759]" />
									<span>Included Services (e.g., Free wash, loaner car)</span>
								</Label>
								<Input
									id="inclusions"
									value={formData.inclusions}
									disabled={viewMode}
									onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
									placeholder="Wash included, 2 years warranty on parts..."
									className="h-10 text-sm"
								/>
							</div>

							{/* Note */}
							<div className="space-y-3">
								<Label htmlFor="note" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
									<FileText className="w-4 h-4 text-[#34C759]" />
									<span>Message to Customer</span>
								</Label>
								<Textarea
									id="note"
									value={formData.note}
									disabled={viewMode}
									onChange={(e) => setFormData({ ...formData, note: e.target.value })}
									placeholder="Describe your approach or additional details about the repair..."
									rows={4}
									className="resize-none text-sm leading-relaxed"
								/>
							</div>

							{/* Submit Buttons */}
							<div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-5 pt-6 sm:pt-8 border-t border-gray-100">
								<Link to="/workshop/requests" className="w-full sm:w-auto">
									<Button type="button" variant="outline" size="default" className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base">
										{viewMode ? (t('common.close') || 'Close') : (t('common.cancel') || 'Cancel')}
									</Button>
								</Link>
								{!viewMode && (
									<Button
										type="submit"
										disabled={submitting}
										size="default"
										className="w-full sm:w-auto px-6 sm:px-8 shadow-md hover:shadow-lg transition-all text-sm sm:text-base font-normal"
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{submitting ? (
											<>
												<div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
												{existingOffer 
													? (t('workshop.offer.updating') || 'Updating...')
													: (t('workshop.offer.submitting') || 'Submitting...')
												}
											</>
										) : (
											<>
												{existingOffer
													? (t('workshop.offer.update_offer') || 'Update Offer')
													: (t('workshop.offer.submit_offer') || 'Submit Offer')
												}
											</>
										)}
									</Button>
								)}
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
			
			<Footer />
		</div>
	)
}

