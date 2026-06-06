import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Textarea } from './ui/Textarea'
import { Skeleton } from './ui/Skeleton'
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogHeader,
	DialogFooter,
} from './ui/Dialog'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { requestsAPI, offersAPI } from '../services/api'
import InclusionChecklistEditor from './InclusionChecklistEditor'
import { parseInclusionItems, serializeInclusionItems } from '../utils/cn'

const initialFormData = {
	price: '',
	laborCost: '',
	partsCost: '',
	estimatedDuration: '',
	warranty: '',
	validityDays: '14',
	inclusions: '',
	note: '',
}

export default function CreateOfferModal({ open, onOpenChange, requestId, onSuccess }) {
	const { t } = useTranslation()
	const [request, setRequest] = useState(null)
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [existingOffer, setExistingOffer] = useState(null)
	const [formData, setFormData] = useState(initialFormData)
	const [inclusionItems, setInclusionItems] = useState([''])

	useEffect(() => {
		if (!open) {
			setRequest(null)
			setExistingOffer(null)
			setFormData(initialFormData)
			setInclusionItems([''])
			setLoading(false)
			setSubmitting(false)
			return
		}

		if (requestId) {
			fetchRequest()
		}
	}, [open, requestId])

	const fetchRequest = async () => {
		setLoading(true)
		try {
			const response = await requestsAPI.getById(requestId)
			if (response.data) {
				setRequest(response.data)

				try {
					const offersResponse = await offersAPI.getByWorkshop()
					if (offersResponse.data && Array.isArray(offersResponse.data)) {
						const workshopOffer = offersResponse.data.find((offer) => {
							const offerRequestId = offer.requestId?._id || offer.requestId?.id || offer.requestId
							return offerRequestId?.toString() === requestId?.toString()
						})

						if (workshopOffer) {
							setExistingOffer(workshopOffer)

							setFormData({
								price: workshopOffer.price?.toString() || '',
								laborCost: workshopOffer.laborCost?.toString() || '',
								partsCost: workshopOffer.partsCost?.toString() || '',
								estimatedDuration: workshopOffer.estimatedDuration?.toString() || '',
								warranty: workshopOffer.warranty || '',
								validityDays: workshopOffer.validityDays?.toString() || '14',
								inclusions: workshopOffer.inclusions || '',
								note: workshopOffer.note || '',
							})
							const parsedInclusions = parseInclusionItems(workshopOffer.inclusions)
							setInclusionItems(parsedInclusions.length > 0 ? parsedInclusions : [''])
						}
					}
				} catch (offerError) {
					console.error('Failed to fetch existing offer:', offerError)
				}
			}
		} catch (error) {
			console.error('Failed to fetch request:', error)
			toast.error(t('errors.request_not_found') || 'Request not found')
			onOpenChange(false)
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

		setSubmitting(true)

		try {
			let response
			const payload = {
				price: parseFloat(formData.price),
				laborCost: parseFloat(formData.laborCost) || 0,
				partsCost: parseFloat(formData.partsCost) || 0,
				estimatedDuration: parseInt(formData.estimatedDuration, 10),
				warranty: formData.warranty || '',
				validityDays: parseInt(formData.validityDays, 10),
				inclusions: serializeInclusionItems(inclusionItems),
				note: formData.note || '',
				availableDates: [],
			}

			if (existingOffer) {
				const offerId = existingOffer._id || existingOffer.id
				response = await offersAPI.update(offerId, payload)
			} else {
				response = await offersAPI.create({ requestId, ...payload })
			}

			if (response.data) {
				toast.success(
					existingOffer
						? (t('success.offer_updated') || 'Offer updated successfully!')
						: (t('success.offer_created') || 'Offer created successfully!')
				)
				onOpenChange(false)
				onSuccess?.()
			}
		} catch (error) {
			console.error('Failed to create/update offer:', error)
			toast.error(
				error.response?.data?.message ||
					(existingOffer ? t('errors.offer_update_failed') : t('errors.offer_creation_failed'))
			)
		} finally {
			setSubmitting(false)
		}
	}

	const vehicle = request?.vehicleId || request?.vehicle
	const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim() : ''

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="relative w-[min(calc(100vw-1rem),100%)] sm:w-[min(calc(100vw-1.5rem),520px)] md:w-[min(calc(100vw-2rem),680px)] lg:w-[min(calc(100vw-2rem),860px)] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-0 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
				<div className="p-4 pt-5 pb-3 sm:p-6 sm:pt-6 sm:pb-4 md:p-8 md:pt-8 shrink-0">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('workshop.requests.leave_a_quote') || 'Leave quote'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center mb-0">
							{loading
								? (t('common.loading') || 'Loading...')
								: vehicleLabel
									? `${t('workshop.offer.subtitle') || 'Submit your offer for'} ${vehicleLabel}`
									: (t('workshop.offer.subtitle') || 'Submit your competitive offer for this request')}
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 min-h-0">
					{loading ? (
						<div className="space-y-3 pb-4">
							<Skeleton className="h-11 w-full rounded-xl" />
							<Skeleton className="h-11 w-full rounded-xl" />
							<Skeleton className="h-11 w-full rounded-xl" />
							<Skeleton className="h-24 w-full rounded-xl" />
						</div>
					) : (
						<form id="create-offer-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
							{request?.description && (
								<div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
									<p className="text-[11px] font-bold text-[#05324f] mb-1">
										{t('workshop.requests.problem_label') || 'Problem'}
									</p>
									<p className="text-xs text-gray-600 leading-relaxed">{request.description}</p>
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="offer-price" className="text-sm font-semibold text-[#05324f]">
									{t('workshop.proposals.total_price') || 'Total Price'} (inkl. moms) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="offer-price"
									type="number"
									min="0"
									step="0.01"
									value={formData.price}
									onChange={(e) => setFormData({ ...formData, price: e.target.value })}
									placeholder="0.00"
									required
									className="h-11 rounded-xl border-gray-200"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label htmlFor="offer-labor" className="text-xs font-semibold text-gray-600">
										{t('offers_page.labor_cost') || 'Labor'}
									</Label>
									<Input
										id="offer-labor"
										type="number"
										min="0"
										value={formData.laborCost}
										onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
										placeholder="0.00"
										className="h-11 rounded-xl border-gray-200"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="offer-parts" className="text-xs font-semibold text-gray-600">
										{t('offers_page.material_cost') || 'Materials'}
									</Label>
									<Input
										id="offer-parts"
										type="number"
										min="0"
										value={formData.partsCost}
										onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
										placeholder="0.00"
										className="h-11 rounded-xl border-gray-200"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="offer-duration" className="text-sm font-semibold text-[#05324f]">
									{t('workshop.proposals.estimated_duration') || 'Estimated Duration'} (min) <span className="text-red-500">*</span>
								</Label>
								<Input
									id="offer-duration"
									type="number"
									min="1"
									value={formData.estimatedDuration}
									onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
									placeholder="60"
									required
									className="h-11 rounded-xl border-gray-200"
								/>
							</div>

							<InclusionChecklistEditor
								items={inclusionItems}
								onChange={setInclusionItems}
							/>

							<div className="space-y-2">
								<Label htmlFor="offer-note" className="text-sm font-semibold text-[#05324f]">
									{t('common.note') || 'Note'}
								</Label>
								<Textarea
									id="offer-note"
									value={formData.note}
									onChange={(e) => setFormData({ ...formData, note: e.target.value })}
									placeholder={t('workshop.offer.fill_details') || 'Add details about your offer...'}
									rows={3}
									className="resize-none rounded-xl border-gray-200 text-sm"
								/>
							</div>
						</form>
					)}
				</div>

				<div className="p-4 pt-3 sm:p-6 sm:pt-4 md:p-8 shrink-0 border-t border-gray-100">
					<DialogFooter className="mt-0 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
							disabled={submitting}
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							type="submit"
							form="create-offer-form"
							disabled={submitting || loading}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
						>
							{submitting ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
							) : (
								t('workshop.offer.submit_offer') || 'Submit Offer'
							)}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	)
}
