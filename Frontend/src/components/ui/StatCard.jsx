import React from 'react'
import { cn } from '../../utils/cn'

export function StatCard({ icon: Icon, value, label, trend, className }) {
	return (
		<div
			className={cn(
				'rounded-card border border-gray-100 bg-white shadow-card p-6 flex flex-col gap-3',
				'max-md:rounded-lg max-md:border-gray-200 max-md:shadow-none max-md:p-3 max-md:gap-1',
				className
			)}
		>
			<div className="flex items-center justify-between max-md:justify-center">
				{Icon && (
					<div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 max-md:w-8 max-md:h-8 max-md:rounded-md">
						<Icon size={22} className="text-[#34C759] max-md:w-3 max-md:h-3" strokeWidth={2} />
					</div>
				)}
				{trend != null && (
					<span
						className={cn(
							'text-xs font-semibold px-2 py-0.5 rounded-full max-md:hidden',
							trend >= 0
								? 'bg-green-50 text-green-700'
								: 'bg-red-50 text-red-600'
						)}
					>
						{trend >= 0 ? '+' : ''}{trend}%
					</span>
				)}
			</div>
			<div className="max-md:text-center">
				<p className="text-4xl font-bold text-[#05324f] leading-none tracking-tight max-md:text-lg">
					{value ?? '—'}
				</p>
				{label && (
					<p className="text-small text-gray-500 mt-1.5 font-medium max-md:text-[10px] max-md:mt-0.5 max-md:leading-tight">{label}</p>
				)}
			</div>
		</div>
	)
}

export default StatCard
