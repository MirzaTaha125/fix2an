import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatDate, parseInclusionItems, serializeInclusionItems } from '../utils/cn'
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import InclusionChecklistEditor from '../components/InclusionChecklistEditor'
import { requestsAPI, offersAPI, workshopAPI } from '../services/api'
import {
	DEFAULT_COMMISSION_RATE,
	DEFAULT_VAT_RATE,
	quoteTotalsFromCosts,
	vatFactor,
} from '../utils/platformRates'

function money(value) {
	const number = Number(value)
	return Number.isFinite(number) ? Math.round(number) : 0
}

function durationSelectValue(raw) {
	const n = Number(raw)
	if (!n) return ''
	const hours = n >= 15 ? n / 60 : n
	const options = [2, 3, 4, 5, 8]
	return String(options.reduce((best, cur) => (Math.abs(cur - hours) < Math.abs(best - hours) ? cur : best)))
}

function quoteTotals(laborCost, partsCost, otherCost, vatRate = DEFAULT_VAT_RATE) {
	return quoteTotalsFromCosts(laborCost, partsCost, otherCost, vatRate)
}

function formatKr(value) {
	return `${new Intl.NumberFormat('sv-SE').format(value)} kr`
}

export function CreateQuotePanel({ requestId, onBack }) {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const viewMode = searchParams.get('view') === 'true'
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [request, setRequest] = useState(null)
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [existingOffer, setExistingOffer] = useState(null)

	const handleBack = onBack || (() => navigate(`/workshop/requests?case=${requestId}`))
	useRegisterMobileBack(handleBack, true)

	const [formData, setFormData] = useState({
		price: '',
		laborCost: '',
		partsCost: '',
		estimatedDuration: '',
		warranty: '12 months',
		validityDays: '14',
		inclusions: '',
		note: '',
		otherCost: '',
		loanerCar: false,
		originalParts: false,
	})
	const [inclusionItems, setInclusionItems] = useState([''])
	const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE)
	const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE)

	// Redirect if not authenticated or not workshop
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/workshop/login', { replace: true })
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

	useEffect(() => {
		if (!user || user.role !== 'WORKSHOP') return
		let stop = false
		workshopAPI.getPlatformSettings()
			.then((res) => {
				if (stop) return
				if (res.data?.commissionRate != null) setCommissionRate(Number(res.data.commissionRate))
				if (res.data?.vatRate != null) setVatRate(Number(res.data.vatRate))
			})
			.catch(() => {})
		return () => { stop = true }
	}, [user])

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
							const labor = money(workshopOffer.laborCost)
							const parts = money(workshopOffer.partsCost)
							const offerVat = workshopOffer.vatRate != null ? Number(workshopOffer.vatRate) : vatRate
							if (workshopOffer.vatRate != null) setVatRate(Number(workshopOffer.vatRate))
							if (workshopOffer.commissionRate != null) setCommissionRate(Number(workshopOffer.commissionRate))
							const other = Math.max(0, Math.round((money(workshopOffer.price) / vatFactor(offerVat)) - labor - parts))

							setFormData({
								price: workshopOffer.price?.toString() || '',
								laborCost: labor ? String(labor) : '',
								partsCost: parts ? String(parts) : '',
								otherCost: other ? String(other) : '',
								estimatedDuration: durationSelectValue(workshopOffer.estimatedDuration),
								warranty: workshopOffer.warranty || '12 months',
								validityDays: workshopOffer.validityDays?.toString() || '14',
								inclusions: workshopOffer.inclusions || '',
								note: workshopOffer.note || '',
								loanerCar: Boolean(workshopOffer.loanerCar),
								originalParts: Boolean(workshopOffer.originalParts),
							})
							const parsedInclusions = parseInclusionItems(workshopOffer.inclusions)
							setInclusionItems(parsedInclusions.length > 0 ? parsedInclusions : [''])
						} else {
							const raw = sessionStorage.getItem(`offer-draft-${requestId}`)
							if (raw) {
								const draft = JSON.parse(raw)
								setFormData((prev) => ({ ...prev, ...draft, note: draft.note || '' }))
							}
						}
					}
				} catch (offerError) {
					console.error('Failed to fetch existing offer:', offerError)
				}
			}
		} catch (error) {
			console.error('Failed to fetch request:', error)
			toast.error(t('errors.request_not_found') || 'Request not found')
			if (onBack) onBack()
			else navigate('/workshop/requests')
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		const totals = quoteTotals(formData.laborCost, formData.partsCost, formData.otherCost, vatRate)
		if (totals.subtotal <= 0) {
			toast.error(t('errors.required_fields') || 'Please fill in all required fields')
			return
		}
		if (!formData.estimatedDuration) {
			toast.error(t('workshop.offer.duration_required') || 'Please select estimated time')
			return
		}

		setSubmitting(true)

		const payload = {
			price: totals.total,
			laborCost: money(formData.laborCost),
			partsCost: money(formData.partsCost),
			vatRate,
			commissionRate,
			warranty: formData.warranty || '',
			validityDays: parseInt(formData.validityDays, 10) || 14,
			inclusions: serializeInclusionItems(inclusionItems),
			note: formData.note || '',
			availableDates: [],
			estimatedDuration: parseInt(formData.estimatedDuration, 10),
			loanerCar: Boolean(formData.loanerCar),
			originalParts: Boolean(formData.originalParts),
		}

		try {
			let response
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
			<div className="w-full space-y-4">
				<Skeleton className="h-8 w-48 max-w-full" />
				<Skeleton className="h-4 w-64 max-w-full" />
				<Skeleton className="h-28 w-full rounded-xl" />
				<Skeleton className="h-11 w-full rounded-xl" />
				<Skeleton className="h-11 w-full rounded-xl" />
				<Skeleton className="h-11 w-full rounded-xl" />
			</div>
		)
	}

	if (!request) {
		return null
	}

	// Block editing if offer was already SENT, ACCEPTED, EXPIRED or CANCELLED (unless in viewMode)
	if (!viewMode && existingOffer && (['SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].includes(existingOffer.status))) {
		return (
			<div className="w-full py-8 text-center">
					<div className="mb-6 flex justify-center">
						<div className="p-4 bg-gray-50 rounded-full">
							<Shield className="w-12 h-12 text-[#1B8F3E]" />
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
						<Button variant="outline" onClick={onBack || (() => navigate('/workshop/requests'))}>
							{t('common.back_to_requests') || 'Back to Requests'}
						</Button>
					</div>
			</div>
		)
	}

	const vehicle = request.vehicleId || request.vehicle
	const vehicleName = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ')
	const caseNo = String(request._id || request.id || requestId).slice(-5).toUpperCase()
	const totals = quoteTotals(formData.laborCost, formData.partsCost, formData.otherCost, vatRate)
	const commissionAmount = Math.round(totals.total * commissionRate) / 100
	const priceRows = [
		['laborCost', t('workshop.offer.labor')],
		['partsCost', t('workshop.offer.spare_parts')],
		['otherCost', t('workshop.offer.other')],
	]

	return (
				<div className="w-full max-w-none">
				<button type="button" onClick={handleBack} className="hidden lg:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B8F3E] mb-5">
					<ArrowLeft className="w-4 h-4" strokeWidth={2.25} />
					{t('workshop.panel.back')}
				</button>
				<h1 className="page-title !mt-0">
					{existingOffer ? t('workshop.offer.edit_title') : t('workshop.offer.title')}
				</h1>
				<p className="text-sm text-[#6B7280] mt-2 mb-6">
					{t('workshop.panel.case_no', { id: caseNo })}
					{vehicleName ? ` · ${vehicleName}` : ''}
				</p>

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

				<form onSubmit={handleSubmit}>
					<label htmlFor="note" className="block text-sm font-semibold text-[#1F2937] mb-2">
						{t('workshop.offer.work_description')}
					</label>
					<textarea
						id="note"
						value={formData.note}
						disabled={viewMode}
						onChange={(e) => setFormData({ ...formData, note: e.target.value })}
						rows={4}
						className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm text-[#374151] leading-relaxed outline-none focus:border-[#1B8F3E] resize-y min-h-[108px]"
					/>

					<div className="mt-8 space-y-4">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
							<label htmlFor="estimatedDuration" className="text-sm font-semibold text-[#1F2937]">
								{t('quotes.flow.compare_time')} <span className="text-red-500">*</span>
							</label>
							<div className="relative w-full sm:w-52 sm:shrink-0">
								<select
									id="estimatedDuration"
									disabled={viewMode}
									value={formData.estimatedDuration}
									onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
									className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-8 text-sm text-[#111827] outline-none focus:border-[#1B8F3E] appearance-none"
								>
									<option value="">{t('common.select') || 'Select'}</option>
									<option value="2">1–2 {t('quotes.flow.hours')}</option>
									<option value="3">2–3 {t('quotes.flow.hours')}</option>
									<option value="4">3–4 {t('quotes.flow.hours')}</option>
									<option value="5">4–5 {t('quotes.flow.hours')}</option>
									<option value="8">6–8 {t('quotes.flow.hours')}</option>
								</select>
							</div>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
							<label htmlFor="warranty" className="text-sm font-semibold text-[#1F2937]">
								{t('quotes.flow.compare_warranty')}
							</label>
							<div className="relative w-full sm:w-52 sm:shrink-0">
								<select
									id="warranty"
									disabled={viewMode}
									value={formData.warranty}
									onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
									className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-8 text-sm text-[#111827] outline-none focus:border-[#1B8F3E] appearance-none"
								>
									<option value="">{t('common.select') || 'Select'}</option>
									<option value="3 months">{t('workshop.offer.warranty_3m') || '3 months'}</option>
									<option value="6 months">{t('workshop.offer.warranty_6m') || '6 months'}</option>
									<option value="12 months">{t('workshop.offer.warranty_12m') || '12 months'}</option>
									<option value="24 months">{t('workshop.offer.warranty_24m') || '24 months'}</option>
									<option value="36 months">{t('workshop.offer.warranty_36m') || '36 months'}</option>
								</select>
							</div>
						</div>

						<div className="flex items-center justify-between gap-6">
							<span className="text-sm font-semibold text-[#1F2937]">{t('quotes.flow.compare_loaner')}</span>
							<button
								type="button"
								role="switch"
								aria-checked={formData.loanerCar}
								disabled={viewMode}
								onClick={() => setFormData({ ...formData, loanerCar: !formData.loanerCar })}
								className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
									formData.loanerCar ? 'bg-[#1B8F3E]' : 'bg-[#D1D5DB]'
								} disabled:opacity-60`}
							>
								<span
									className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
										formData.loanerCar ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>

						<div className="flex items-center justify-between gap-6">
							<span className="text-sm font-semibold text-[#1F2937]">{t('quotes.flow.compare_parts')}</span>
							<button
								type="button"
								role="switch"
								aria-checked={formData.originalParts}
								disabled={viewMode}
								onClick={() => setFormData({ ...formData, originalParts: !formData.originalParts })}
								className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
									formData.originalParts ? 'bg-[#1B8F3E]' : 'bg-[#D1D5DB]'
								} disabled:opacity-60`}
							>
								<span
									className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
										formData.originalParts ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>
					</div>

					<div className="mt-8 space-y-4">
						{priceRows.map(([key, label]) => (
							<div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
								<label htmlFor={key} className="text-sm font-semibold text-[#1F2937]">{label}</label>
								<div className="relative w-full sm:w-52 sm:shrink-0">
									<input
										id={key}
										type="number"
										min="0"
										step="1"
										inputMode="numeric"
										disabled={viewMode}
										value={formData[key]}
										onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
										placeholder="0"
										className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-10 text-right text-sm text-[#111827] outline-none focus:border-[#1B8F3E]"
									/>
									<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">kr</span>
								</div>
							</div>
						))}
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
							<span className="text-sm font-semibold text-[#1F2937]">
								{t('workshop.offer.vat_rate', { rate: vatRate })}
							</span>
							<div className="relative w-full sm:w-52 sm:shrink-0">
								<input
									readOnly
									value={new Intl.NumberFormat('sv-SE').format(totals.vat)}
									className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white pl-3 pr-10 text-right text-sm text-[#111827] outline-none"
								/>
								<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">kr</span>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-6 border-t border-[#E5E7EB] mt-6 pt-5">
						<p className="text-base font-bold text-[#0B2540]">{t('workshop.offer.total_price')}</p>
						<p className="text-[1.65rem] font-semibold text-[#1B8F3E] leading-none">{formatKr(totals.total)}</p>
					</div>

					{totals.total > 0 && (
						<p className="mt-3 text-xs text-[#6B7280] leading-relaxed">
							{t('workshop.contracts.commission_note', {
								rate: commissionRate,
								amount: formatKr(commissionAmount),
							})}
						</p>
					)}

					<div className="mt-8">
						<InclusionChecklistEditor
							items={inclusionItems}
							onChange={setInclusionItems}
							disabled={viewMode}
						/>
					</div>

					<div className="flex flex-col gap-3 mt-8 lg:flex-row">
						{viewMode ? (
							<button type="button" onClick={onBack || (() => navigate('/workshop/requests'))} className="w-full lg:flex-1 min-h-[48px] rounded-lg border border-[#1B8F3E] text-[#1B8F3E] text-sm font-semibold inline-flex items-center justify-center">
								{t('common.close') || 'Close'}
							</button>
						) : (
							<button
								type="button"
								className="w-full lg:flex-1 min-h-[48px] rounded-lg border border-[#1B8F3E] text-[#1B8F3E] text-sm font-semibold bg-white"
								onClick={() => {
									sessionStorage.setItem(`offer-draft-${requestId}`, JSON.stringify(formData))
									toast.success(t('workshop.panel.draft_saved'))
								}}
							>
								{t('workshop.panel.save_draft')}
							</button>
						)}
						{!viewMode && (
							<button
								type="submit"
								disabled={submitting}
								className="w-full lg:flex-1 min-h-[48px] rounded-lg bg-brand-btn text-white text-sm font-semibold disabled:opacity-60"
							>
								{submitting
									? (existingOffer ? t('workshop.offer.updating') : t('workshop.offer.submitting'))
									: (existingOffer ? t('workshop.offer.update_offer') : t('workshop.panel.send_quote'))}
							</button>
						)}
					</div>
				</form>
				</div>
	)
}

export default function CreateOfferPage() {
	const { id } = useParams()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	useEffect(() => {
		const next = new URLSearchParams()
		if (id) next.set('case', id)
		next.set('panel', 'quote')
		if (searchParams.get('view') === 'true') next.set('view', 'true')
		navigate(`/workshop/requests?${next.toString()}`, { replace: true })
	}, [id, navigate, searchParams])

	return null
}
