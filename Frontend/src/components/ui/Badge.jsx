import * as React from 'react'
import { CheckCircle, Star, Shield } from 'lucide-react'
import { cn } from '../../utils/cn'

const badgeVariants = {
	default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
	secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
	destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
	outline: 'text-foreground border-gray-300',
	success: 'border-transparent bg-green-100 text-green-800',
	warning: 'border-transparent bg-yellow-100 text-yellow-800',
	info: 'border-transparent bg-blue-100 text-blue-800',
}

export function Badge({ className, variant = 'default', ...props }) {
	return (
		<div
			className={cn(
				'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
				badgeVariants[variant] || badgeVariants.default,
				className
			)}
			{...props}
		/>
	)
}

export function VerifiedBadge({ className }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700',
				className
			)}
		>
			<CheckCircle size={12} className="text-green-600" />
			Fix2an Verified
		</span>
	)
}

export function RatingBadge({ rating, count, className }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700',
				className
			)}
		>
			<Star size={11} className="fill-amber-500 text-amber-500" />
			{rating}
			{count != null && (
				<span className="text-amber-600 font-normal">({count})</span>
			)}
		</span>
	)
}

export function WarrantyBadge({ text = '12 month warranty', className }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700',
				className
			)}
		>
			<Shield size={11} className="text-blue-600" />
			{text}
		</span>
	)
}
