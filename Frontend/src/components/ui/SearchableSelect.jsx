import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

export default function SearchableSelect({
	value,
	onValueChange,
	options = [],
	placeholder = 'Select...',
	searchPlaceholder = 'Search...',
	emptyText = 'No results',
	disabled = false,
	triggerClassName,
	allowCustom = false,
	selectedLabel,
}) {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const containerRef = useRef(null)
	const searchRef = useRef(null)

	const selectedOption = options.find((option) => option.value === value)
	const displayText = selectedOption?.label || selectedLabel || (allowCustom && value ? value : '') || ''

	const filteredOptions = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()
		if (!normalizedQuery) return options
		return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
	}, [options, query])

	const trimmedQuery = query.trim()
	const exactMatch = options.some(
		(option) => option.label.toLowerCase() === trimmedQuery.toLowerCase()
	)
	const showCustomOption = allowCustom && trimmedQuery.length > 0 && !exactMatch

	useEffect(() => {
		if (!open) setQuery('')
	}, [open])

	useEffect(() => {
		if (open) searchRef.current?.focus()
	}, [open])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (containerRef.current && !containerRef.current.contains(event.target)) {
				setOpen(false)
			}
		}

		if (open) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [open])

	const pick = (nextValue, label) => {
		onValueChange?.(nextValue, label)
		setOpen(false)
	}

	const commitCustom = () => {
		if (!trimmedQuery) return
		pick(trimmedQuery, trimmedQuery)
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				disabled={disabled}
				onClick={() => !disabled && setOpen((prev) => !prev)}
				className={cn(
					'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
					triggerClassName
				)}
			>
				<span className={cn('line-clamp-1 text-left', !displayText && 'text-gray-400')}>
					{displayText || placeholder}
				</span>
				<ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
			</button>

			{open && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
					<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
						<div className="p-2 border-b border-gray-100">
							<div className="relative">
								<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<input
									ref={searchRef}
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && showCustomOption) {
											e.preventDefault()
											commitCustom()
										}
									}}
									placeholder={
										allowCustom
											? t('common.search_or_type') || 'Search or type...'
											: searchPlaceholder
									}
									className="h-9 w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-[#1B8F3E] focus:ring-1 focus:ring-[#1B8F3E]"
								/>
							</div>
						</div>
						<div className="max-h-[240px] overflow-y-auto p-1">
							{showCustomOption && (
								<button
									type="button"
									onClick={commitCustom}
									className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 px-3 text-left text-sm outline-none hover:bg-[#E8F5EC] text-[#1B8F3E] font-semibold"
								>
									{t('common.use_custom', { value: trimmedQuery }) || `Use "${trimmedQuery}"`}
								</button>
							)}
							{filteredOptions.length === 0 && !showCustomOption ? (
								<p className="px-3 py-2 text-xs text-gray-400">{emptyText}</p>
							) : (
								filteredOptions.map((option) => {
									const isSelected = option.value === value
									return (
										<button
											key={option.value}
											type="button"
											onClick={() => pick(option.value, option.label)}
											className={cn(
												'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-left text-sm outline-none hover:bg-gray-100',
												isSelected && 'bg-gray-100 text-[#05324f] font-medium'
											)}
										>
											{isSelected && (
												<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
													<Check className="h-4 w-4 text-[#1B8F3E]" />
												</span>
											)}
											{option.label}
										</button>
									)
								})
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}
