import { useTranslation } from 'react-i18next'

export default function ExtraActionCard({ extra, onDecide }) {
	const { t } = useTranslation()
	return (
		<div className="rounded-md border border-gray-200 bg-white px-4 py-4">
			<p className="text-sm font-bold text-brand-dark mb-2">{t('my_cases.flow.repair_extra')}</p>
			{extra.description && <p className="text-sm text-[#374151] leading-snug">{extra.description}</p>}
			{extra.price != null && (
				<p className="text-sm text-[#374151] mt-1">
					{t('my_cases.flow.chat_extra_cost', { price: Number(extra.price).toLocaleString('sv-SE') })}
				</p>
			)}
			<div className="flex flex-row gap-2 mt-3">
				<button
					type="button"
					onClick={() => onDecide?.(extra.booking, extra.index, 'APPROVED')}
					className="flex-1 h-9 rounded-sm bg-brand-btn text-white text-xs font-semibold"
				>
					{t('my_cases.flow.repair_approve')}
				</button>
				<button
					type="button"
					onClick={() => onDecide?.(extra.booking, extra.index, 'DECLINED')}
					className="flex-1 h-9 rounded-sm border border-[#1B8F3E] text-[#1B8F3E] text-xs font-semibold bg-white"
				>
					{t('my_cases.flow.repair_decline')}
				</button>
			</div>
		</div>
	)
}

export function pendingBookingExtras(booking) {
	if (!booking) return []
	return (booking.extraApprovals || [])
		.map((extra, index) => ({
			...extra,
			index,
			booking,
			bookingId: booking._id || booking.id,
		}))
		.filter((extra) => extra.status === 'PENDING')
}

export function approvedBookingExtras(booking) {
	if (!booking) return []
	return (booking.extraApprovals || []).filter(
		(extra) => String(extra.status).toUpperCase() === 'APPROVED'
	)
}
