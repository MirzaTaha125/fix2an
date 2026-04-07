import React from 'react'
import { cn } from '../../utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ 
	icon: Icon, 
	value, 
	label, 
	trend, 
	trendText = 'this week',
	prefix, 
	suffix, 
	className, 
	iconColor = '#34C759', 
	iconBg = 'bg-green-50/50' 
}) {
	const isPositive = trend >= 0

	return (
		<div
			className={cn(
				'rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden h-full min-w-[160px]',
				className
			)}
		>
			{/* Top Row: Label & Icon */}
			<div className="flex items-start justify-between w-full mb-3 gap-3">
				{label && (
					<p className="text-sm font-medium text-gray-500 leading-tight">
						{label}
					</p>
				)}
				{Icon && (
					<div className={cn(
						'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300',
						iconBg
					)}>
						<Icon size={20} style={{ color: iconColor }} strokeWidth={2.5} />
					</div>
				)}
			</div>
			
			{/* Middle Row: Value */}
			<div className="flex items-baseline gap-1 mb-2">
				{prefix && <span className="text-lg font-bold text-gray-400">{prefix}</span>}
				<p className="text-2xl sm:text-3xl font-black text-[#05324f] leading-none tracking-tight">
					{value ?? '0'}
				</p>
				{suffix && <span className="text-sm font-bold text-gray-400 ml-1">{suffix}</span>}
			</div>

			{/* Bottom Row: Trend indicator */}
			{trend != null && (
				<div className="flex items-center gap-1.5 mt-auto">
					<div className={cn(
						'flex items-center gap-0.5 text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md',
						isPositive
							? 'text-[#34C759]'
							: 'text-red-500'
					)}>
						{isPositive ? (
							<TrendingUp size={12} strokeWidth={3} />
						) : (
							<TrendingDown size={12} strokeWidth={3} />
						)}
						{isPositive ? '+' : ''}{trend}%
					</div>
					<span className="text-[11px] sm:text-xs text-gray-400 font-medium">
						{trendText}
					</span>
				</div>
			)}
		</div>
	)
}

export default StatCard
