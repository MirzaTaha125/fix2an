import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import OfferCountBadge from '../OfferCountBadge'

export default function DashboardQuickAction({
	to,
	icon: Icon,
	label,
	description,
	badge,
	className,
	iconClassName,
	iconBgClassName = 'bg-[#F2F9F4]',
}) {
	return (
		<Link
			to={to}
			className={cn(
				'group flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-gray-100 bg-white shadow-sm',
				'hover:shadow-md hover:border-[#38BC54]/25 transition-all duration-200 active:scale-[0.98]',
				className
			)}
		>
			<div
				className={cn(
					'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
					iconBgClassName
				)}
			>
				<Icon className={cn('w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#38BC54]', iconClassName)} strokeWidth={2} />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="text-sm sm:text-base font-bold text-[#05324f] leading-tight">{label}</p>
					<OfferCountBadge count={badge} />
				</div>
				{description && (
					<p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">{description}</p>
				)}
			</div>
			<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#38BC54] shrink-0 transition-colors" />
		</Link>
	)
}
