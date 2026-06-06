import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogHeader,
} from './ui/Dialog'
import VehicleImage from './VehicleImage'
import { formatPrice, formatDate, parseInclusionItems } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'

function formatDuration(minutes) {
	if (!minutes) return null
	const mins = Number(minutes)
	if (Number.isNaN(mins)) return null
	if (mins >= 60) {
		const h = Math.floor(mins / 60)
		const m = mins % 60
		return m > 0 ? `~${h}h ${m}m` : `~${h}h`
	}
	return `~${mins} min`
}

function InfoRow({ label, value, className = '', valueClassName = '' }) {
	if (value == null || value === '') return null
	return (
		<div className={`flex justify-between items-start gap-4 py-2.5 border-b border-gray-100 last:border-0 ${className}`}>
			<span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
			<span className={`text-sm font-semibold text-right break-words ${valueClassName || 'text-[#05324f]'}`}>{value}</span>
		</div>
	)
}

function InfoBlock({ label, value }) {
	if (!value) return null
	return (
		<div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
			<p className="text-[11px] font-bold text-[#05324f] mb-1">{label}</p>
			<p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{value}</p>
		</div>
	)
}

export default function ViewOfferModal({ open, onOpenChange, offer }) {
	const { t } = useTranslation()

	if (!offer) return null

	const request = offer.requestId || offer.request
	const vehicle = request?.vehicleId || request?.vehicle
	const customer = request?.customerId || request?.customer
	const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim() : ''
	const inclusionItems = parseInclusionItems(offer.inclusions)

	const statusLabel =
		offer.status === 'SENT'
			? (t('workshop.proposals.status.sent') || 'Sent')
			: offer.status === 'ACCEPTED'
				? (t('workshop.proposals.status.accepted') || 'Accepted')
				: offer.status === 'DECLINED'
					? (t('workshop.proposals.status.declined') || 'Declined')
					: offer.status === 'EXPIRED'
						? (t('workshop.proposals.status.expired') || 'Expired')
						: offer.status === 'CANCELLED'
							? (t('workshop.proposals.status.cancelled') || 'Cancelled')
							: offer.status

	const sentDate = offer.createdAt ? formatDate(new Date(offer.createdAt)) : null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onClose={() => onOpenChange(false)}
				className="relative w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),400px)] md:w-[min(calc(100vw-2rem),480px)] lg:w-[min(calc(100vw-2rem),540px)] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-0 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[88vh] flex flex-col"
			>
				<div className="flex-1 overflow-y-auto min-h-0">
					<div className="px-4 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6 md:px-8 md:pt-8 md:pb-8 space-y-3">
						<DialogHeader className="text-center items-center sm:text-center pr-7 sm:pr-8">
							<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-0 text-center w-full">
								{t('workshop.proposals.offer_details') || 'Proposal Details'}
							</DialogTitle>
						</DialogHeader>

						<div className="flex items-start gap-2.5 sm:gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
							<div className="w-28 md:w-32 shrink-0 self-start rounded-xl overflow-hidden flex items-start justify-center">
								<VehicleImage
									make={vehicle?.make}
									model={vehicle?.model}
									year={vehicle?.year}
									width={400}
									className="w-full max-h-32 md:max-h-[8rem]"
									fallbackClassName="w-full h-24 md:h-[7rem]"
									alt={vehicleLabel}
								/>
							</div>
							<div className="flex-1 min-w-0 self-start">
								<h3 className="text-sm sm:text-base font-black text-[#05324f] leading-snug line-clamp-2 mb-1.5">
									{vehicleLabel || (t('workshop.offer.vehicle') || 'Vehicle')}
								</h3>
								<div className="space-y-1">
									{request?.description && (
										<p className="text-[11px] sm:text-xs text-[#05324f]/80 leading-snug">
											<span className="font-bold">{t('workshop.requests.problem_label') || 'Problem'}:</span>{' '}
											{request.description}
										</p>
									)}
									{customer?.name && (
										<p className="text-[11px] sm:text-xs text-[#05324f]/80 leading-snug">
											<span className="font-bold">{t('common.customer') || 'Customer'}:</span> {customer.name}
										</p>
									)}
									<p className="text-[11px] sm:text-xs text-[#05324f]/80 leading-snug">
										<span className="font-bold">{t('workshop.requests.status') || 'Status'}:</span> {statusLabel}
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
								<InfoRow label={t('workshop.requests.sent_label') || 'Sent'} value={sentDate} />
								<InfoRow label={t('offers_page.labor_cost') || 'Labor'} value={formatPrice(offer.laborCost)} />
								<InfoRow label={t('offers_page.material_cost') || 'Materials'} value={formatPrice(offer.partsCost)} />
								<InfoRow
									label={t('workshop.proposals.total_price') || 'Total Price'}
									value={formatPrice(offer.price)}
									valueClassName="text-[#38BC54] font-black"
								/>
								<InfoRow
									label={t('workshop.proposals.estimated_duration') || 'Estimated Duration'}
									value={formatDuration(offer.estimatedDuration)}
								/>
								{offer.validityDays && (
									<InfoRow
										label={t('workshop.offer.offer_valid_for') || 'Offer Valid For'}
										value={`${offer.validityDays} days`}
									/>
								)}
								<InfoRow label={t('workshop.proposals.warranty') || 'Warranty'} value={offer.warranty} />
								<InfoRow
									label={t('workshop.requests.location_label') || 'Location'}
									value={request?.city}
								/>
								{offer.expiresAt && (
									<InfoRow
										label={t('offers_page.offer_expires') || 'Expires'}
										value={formatDate(offer.expiresAt)}
										className="text-red-600"
									/>
								)}
							</div>


							{inclusionItems.length > 0 && (
								<div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
									<p className="text-[11px] font-bold text-[#05324f] mb-2">
										{t('offers_page.included_question') || "What's included in the price?"}
									</p>
									<div className="space-y-2">
										{inclusionItems.map((item, index) => (
											<div key={index} className="flex items-start gap-2">
												<Check size={14} className="text-[#38BC54] mt-0.5 shrink-0" strokeWidth={3} />
												<span className="text-xs text-[#05324f] font-medium leading-snug">{item}</span>
											</div>
										))}
									</div>
								</div>
							)}

							<InfoBlock label={t('common.note') || 'Note'} value={offer.note} />
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
