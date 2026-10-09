import { useMemo, useState } from 'react'
import { Check, X, Star, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatPrice } from '../../utils/cn'
import WorkshopImage from '../WorkshopImage'

function hasLoaner(offer) {
	const text = `${offer?.inclusions || ''} ${offer?.note || ''} ${offer?.warranty || ''}`.toLowerCase()
	return /lånebil|loaner|loan car|replacement car/.test(text)
}

function hasOriginalParts(offer) {
	const text = `${offer?.inclusions || ''} ${offer?.note || ''}`.toLowerCase()
	return /original|oem|genuine/.test(text)
}

function durationLabel(offer, t) {
	const hours = Number(offer?.estimatedDuration)
	if (!hours) return '—'
	if (hours <= 2) return `1–2 ${t('quotes.flow.hours')}`
	if (hours <= 3) return `2–3 ${t('quotes.flow.hours')}`
	if (hours <= 4) return `3–4 ${t('quotes.flow.hours')}`
	return `${hours} ${t('quotes.flow.hours')}`
}

export default function QuoteCompareView({ offers, onShowDetails, onBack }) {
	const { t } = useTranslation()
	const top = useMemo(() => offers.slice(0, 3), [offers])

	if (top.length === 0) return null

	const rows = [
		{
			label: t('quotes.flow.compare_price'),
			render: (o) => <span className="font-bold text-[#05324f]">{formatPrice(o.price)}</span>,
		},
		{
			label: t('quotes.flow.compare_time'),
			render: (o) => durationLabel(o, t),
		},
		{
			label: t('quotes.flow.compare_warranty'),
			render: (o) => o.warranty || t('quotes.flow.warranty_default'),
		},
		{
			label: t('quotes.flow.compare_loaner'),
			render: (o) => (hasLoaner(o) ? <Check className="w-5 h-5 text-[#1B8F3E] mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />),
		},
		{
			label: t('quotes.flow.compare_parts'),
			render: (o) => (hasOriginalParts(o) ? <Check className="w-5 h-5 text-[#1B8F3E] mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />),
		},
		{
			label: t('quotes.flow.compare_rating'),
			render: (o) => (
				<span className="inline-flex items-center gap-1 justify-center text-sm">
					<Star className="w-3.5 h-3.5 text-[#FFB800] fill-[#FFB800]" />
					{(o.workshop?.rating || o.workshop?.averageRating || 0).toFixed(1)}
				</span>
			),
		},
		{
			label: t('quotes.flow.compare_distance'),
			render: (o) => (o.distance != null ? `${o.distance.toFixed(1)} km` : '—'),
		},
	]

	return (
		<div className="w-full">
			<button type="button" onClick={onBack} className="hidden lg:inline-flex text-sm font-medium text-[#05324f] mb-4 hover:opacity-70">
				← {t('common.back')}
			</button>
			<h1 className="text-2xl font-semibold text-[#05324f] mb-1">{t('quotes.flow.compare_title')}</h1>
			<p className="text-sm text-gray-500 mb-6">{t('quotes.flow.compare_subtitle')}</p>

			<div className="overflow-x-auto -mx-1 px-1">
				<table className="w-full min-w-[320px] text-sm border-separate border-spacing-0">
					<thead>
						<tr>
							<th className="text-left p-2 text-gray-400 font-medium w-28" />
							{top.map((o) => (
								<th key={o._id || o.id} className="p-2 text-center">
									<div className="w-12 h-12 mx-auto rounded-full overflow-hidden bg-[#F2F9F4] mb-1">
										<WorkshopImage workshop={o.workshop} className="w-full h-full" />
									</div>
									<p className="text-xs font-semibold text-[#05324f] line-clamp-2">
										{o.workshop?.companyName || t('offers_page.workshop')}
									</p>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.label} className="border-t border-gray-100">
								<td className="py-3 pr-2 text-xs text-gray-500 font-medium align-middle">{row.label}</td>
								{top.map((o) => (
									<td key={`${row.label}-${o._id || o.id}`} className="py-3 px-1 text-center align-middle">
										{row.render(o)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<button
				type="button"
				onClick={() => onShowDetails(top[0])}
				className="mt-8 w-full h-12 bg-brand-btn text-white rounded-xl font-medium flex items-center justify-center gap-2"
			>
				{t('quotes.flow.show_details')}
				<ArrowRight className="w-4 h-4" />
			</button>
		</div>
	)
}

export function QuoteConfirmView({ offer, onConfirm, onBack, confirming }) {
	const { t } = useTranslation()
	if (!offer) return null
	const name = offer.workshop?.companyName || t('offers_page.workshop')

	return (
		<div className="w-full max-w-md mx-auto text-center">
			<div className="w-16 h-16 rounded-full bg-[#F2F9F4] flex items-center justify-center mx-auto mb-4">
				<Check className="w-8 h-8 text-[#1B8F3E]" strokeWidth={3} />
			</div>
			<h1 className="text-xl font-semibold text-[#05324f] mb-2">
				{t('quotes.flow.confirm_title', { name, price: formatPrice(offer.price) })}
			</h1>
			<ul className="text-left space-y-3 my-6 bg-white rounded-2xl border border-gray-100 p-4">
				<li className="flex justify-between text-sm">
					<span className="text-gray-500">{t('quotes.flow.compare_time')}</span>
					<span className="font-medium text-[#05324f]">{durationLabel(offer, t)}</span>
				</li>
				<li className="flex justify-between text-sm">
					<span className="text-gray-500">{t('quotes.flow.compare_loaner')}</span>
					<span className="font-medium text-[#05324f]">{hasLoaner(offer) ? t('common.yes') : t('common.no')}</span>
				</li>
				<li className="flex justify-between text-sm">
					<span className="text-gray-500">{t('quotes.flow.compare_warranty')}</span>
					<span className="font-medium text-[#05324f]">{offer.warranty || t('quotes.flow.warranty_default')}</span>
				</li>
				{offer.distance != null && (
					<li className="flex justify-between text-sm">
						<span className="text-gray-500">{t('quotes.flow.compare_distance')}</span>
						<span className="font-medium text-[#05324f]">{offer.distance.toFixed(1)} km</span>
					</li>
				)}
			</ul>
			<p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1.5">
				🔒 {t('quotes.flow.can_change')}
			</p>
			<button
				type="button"
				disabled={confirming}
				onClick={onConfirm}
				className="w-full h-12 bg-brand-btn text-white rounded-xl font-medium mb-3"
			>
				{t('quotes.flow.confirm_continue')}
			</button>
			<button type="button" onClick={onBack} className="w-full h-12 border border-[#1B8F3E] text-[#1B8F3E] rounded-xl font-medium">
				{t('quotes.flow.back_to_quotes')}
			</button>
		</div>
	)
}
