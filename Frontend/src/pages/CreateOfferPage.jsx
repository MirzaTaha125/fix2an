import { useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { Car, Send, Clock, DollarSign, FileText, Shield, Calendar, User, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { requestsAPI, offersAPI } from '../services/api'

export default function CreateOfferPage() {
	const navigate = useNavigate()
	const { id: requestId } = useParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [request, setRequest] = useState(null)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [existingOffer, setExistingOffer] = useState(null)

	const [formData, setFormData] = useState({
		price: '',
		estimatedDuration: '',
		warranty: '',
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
								estimatedDuration: workshopOffer.estimatedDuration?.toString() || '',
								warranty: workshopOffer.warranty || '',
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
					estimatedDuration: parseInt(formData.estimatedDuration),
					warranty: formData.warranty || '',
					note: formData.note || '',
					availableDates: validDates,
				})
			} else {
				// Create new offer
				response = await offersAPI.create({
					requestId,
					price: parseFloat(formData.price),
					estimatedDuration: parseInt(formData.estimatedDuration),
					warranty: formData.warranty || '',
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

	// Block editing if offer was already accepted (booking created)
	if (existingOffer && existingOffer.status === 'ACCEPTED') {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="max-w-5xl mx-auto px-4 py-24 text-center">
					<p className="text-gray-600 mb-4">
						{t('workshop.offer.already_accepted') || 'This offer has been accepted and cannot be edited.'}
					</p>
					<Link to="/workshop/requests">
						<Button>{t('common.back') || 'Back to Requests'}</Button>
					</Link>
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
							{/* Price and Duration Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
								{/* Price */}
								<div className="space-y-2 sm:space-y-3">
									<Label htmlFor="price" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
										<div className="p-1 sm:p-1.5 bg-green-50 rounded-md flex-shrink-0">
											<DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#34C759' }} />
										</div>
										<span>
											{t('workshop.offer.price') || 'Price (SEK)'} <span className="text-red-500">*</span>
										</span>
									</Label>
									<div className="relative">
										<Input
											id="price"
											type="number"
											min="0"
											step="0.01"
											value={formData.price}
											onChange={(e) => setFormData({ ...formData, price: e.target.value })}
											placeholder="0.00"
											required
											className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base font-semibold"
										/>
										<div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">kr</div>
									</div>
									<p className="text-xs text-gray-500 ml-6 sm:ml-7">
										{t('workshop.offer.including_vat') || 'Including VAT'}
									</p>
								</div>

								{/* Estimated Duration */}
								<div className="space-y-2 sm:space-y-3">
									<Label htmlFor="estimatedDuration" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
										<div className="p-1 sm:p-1.5 bg-green-50 rounded-md flex-shrink-0">
											<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#34C759' }} />
										</div>
										<span className="break-words">
											{t('workshop.offer.estimated_duration') || 'Estimated Duration (minutes)'} <span className="text-red-500">*</span>
										</span>
									</Label>
									<Input
										id="estimatedDuration"
										type="number"
										min="1"
										value={formData.estimatedDuration}
										onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
										placeholder="60"
										required
										className="h-10 sm:h-12 text-sm sm:text-base font-semibold"
									/>
									<p className="text-xs text-gray-500 ml-6 sm:ml-7">
										{t('workshop.offer.duration_minutes') || 'Duration in minutes'}
									</p>
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
													onChange={(e) => {
														const newDates = [...formData.availableDates]
														// Convert datetime-local value to ISO string
														newDates[index] = e.target.value ? new Date(e.target.value).toISOString() : ''
														setFormData({ ...formData, availableDates: newDates })
													}}
													className="h-10 sm:h-12 text-xs sm:text-sm flex-1"
													required
												/>
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
											</div>
										)
									})}
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
								</div>
								<p className="text-xs text-gray-500 ml-6 sm:ml-7">
									{t('workshop.offer.add_at_least_one') || 'Add at least one available time slot for the customer to choose from'}
								</p>
							</div>

							{/* Note */}
							<div className="space-y-2 sm:space-y-3">
								<Label htmlFor="note" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
									<div className="p-1 sm:p-1.5 bg-green-50 rounded-md flex-shrink-0">
										<FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#34C759' }} />
									</div>
									<span>{t('workshop.offer.additional_notes') || 'Additional Notes'}</span>
								</Label>
								<Textarea
									id="note"
									value={formData.note}
									onChange={(e) => setFormData({ ...formData, note: e.target.value })}
									placeholder={t('workshop.offer.note_placeholder') || 'Add any additional information that might help your offer stand out. For example: \'We specialize in this type of repair\' or \'Free pickup and delivery available\'...'}
									rows={4}
									className="resize-none text-sm sm:text-base"
								/>
								<p className="text-xs text-gray-500 ml-6 sm:ml-7">
									{t('workshop.offer.note_optional') || 'Optional: Share additional details about your services or approach'}
								</p>
							</div>

							{/* Submit Buttons */}
							<div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-5 pt-6 sm:pt-8 border-t border-gray-100">
								<Link to="/workshop/requests" className="w-full sm:w-auto">
									<Button type="button" variant="outline" size="default" className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base">
										{t('common.cancel') || 'Cancel'}
									</Button>
								</Link>
								<Button
									type="submit"
									disabled={submitting}
									size="default"
									className="w-full sm:w-auto px-6 sm:px-8 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
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
											<Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
											{existingOffer
												? (t('workshop.offer.update_offer') || 'Update Offer')
												: (t('workshop.offer.submit_offer') || 'Submit Offer')
											}
										</>
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
			
			<Footer />
		</div>
	)
}

