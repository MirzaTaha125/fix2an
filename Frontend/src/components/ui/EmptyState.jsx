import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { Button } from './Button'
import emptyFolderSearch from '../../assets/empty-folder-search.png'

/** Original folder + search empty-state image. */
export function EmptyFolderSearchIcon({ className }) {
	return (
		<img
			src={emptyFolderSearch}
			alt=""
			aria-hidden="true"
			draggable={false}
			className={cn('w-[104px] h-auto object-contain select-none', className)}
		/>
	)
}

/**
 * Shared empty state for lists / screens.
 * @param {string} title
 * @param {string} [description]
 * @param {string} [actionLabel]
 * @param {string} [actionTo] — react-router path
 * @param {() => void} [onAction]
 * @param {string} [className]
 * @param {boolean} [compact]
 */
export default function EmptyState({
	title,
	description,
	actionLabel,
	actionTo,
	onAction,
	className,
	compact = false,
}) {
	const showAction = Boolean(actionLabel && (actionTo || onAction))

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center text-center px-6',
				compact ? 'py-10' : 'py-14 sm:py-16',
				className
			)}
		>
			<EmptyFolderSearchIcon className={compact ? 'w-[88px] mb-5' : 'mb-6'} />
			<h3 className="text-lg sm:text-xl font-bold text-[#0B2540] leading-snug font-['Inter',sans-serif]">
				{title}
			</h3>
			{description ? (
				<p className="mt-2 text-sm text-[#5B6B7C] leading-relaxed max-w-[260px] whitespace-pre-line font-['Inter',sans-serif]">
					{description}
				</p>
			) : null}
			{showAction ? (
				actionTo ? (
					<Button asChild className="mt-6 min-w-[160px] rounded-xl px-8 font-semibold">
						<Link to={actionTo}>{actionLabel}</Link>
					</Button>
				) : (
					<Button
						type="button"
						onClick={onAction}
						className="mt-6 min-w-[160px] rounded-xl px-8 font-semibold"
					>
						{actionLabel}
					</Button>
				)
			) : null}
		</div>
	)
}
