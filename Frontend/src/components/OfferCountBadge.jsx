export default function OfferCountBadge({ count, className = '' }) {
	if (!count || count <= 0) return null

	return (
		<span
			className={`inline-flex items-center justify-center bg-brand-btn text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full shrink-0 ${className}`}
		>
			{count > 99 ? '99+' : count}
		</span>
	)
}
