import React from 'react'
import { cn } from '../../utils/cn'

export function StatCard({ icon: Icon, value, label, trend, className }) {
	return (
		<div
			className={cn(
				'rounded-card border border-gray-100 bg-white shadow-card p-6 flex flex-col gap-3',
				className
			)}
		>
			<div className="flex items-center justify-between">
				{Icon && (
					<div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
						<Icon size={22} className="text-[#34C759]" strokeWidth={2} />
					</div>
				)}
				{trend != null && (
					<span
						className={cn(
							'text-xs font-semibold px-2 py-0.5 rounded-full',
							trend >= 0
								? 'bg-green-50 text-green-700'
								: 'bg-red-50 text-red-600'
						)}
					>
						{trend >= 0 ? '+' : ''}{trend}%
					</span>
				)}
			</div>
			<div>
				<p className="text-4xl font-bold text-[#05324f] leading-none tracking-tight">
					{value ?? '—'}
				</p>
				{label && (
					<p className="text-small text-gray-500 mt-1.5 font-medium">{label}</p>
				)}
			</div>
		</div>
	)
}

export default StatCard
