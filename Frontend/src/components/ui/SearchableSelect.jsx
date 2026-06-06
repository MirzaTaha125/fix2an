import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
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
}) {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const containerRef = useRef(null)
	const searchRef = useRef(null)

	const selectedOption = options.find((option) => option.value === value)

	const filteredOptions = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()
		if (!normalizedQuery) return options
		return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
	}, [options, query])

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
				<span className={cn('line-clamp-1 text-left', !selectedOption && 'text-gray-400')}>
					{selectedOption?.label || placeholder}
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
									placeholder={searchPlaceholder}
									className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54]"
								/>
							</div>
						</div>
						<div className="max-h-[240px] overflow-y-auto p-1">
							{filteredOptions.length === 0 ? (
								<p className="px-3 py-2 text-xs text-gray-400">{emptyText}</p>
							) : (
								filteredOptions.map((option) => {
									const isSelected = option.value === value
									return (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												onValueChange(option.value)
												setOpen(false)
											}}
											className={cn(
												'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-left text-sm outline-none hover:bg-gray-100',
												isSelected && 'bg-gray-100 text-[#05324f] font-medium'
											)}
										>
											{isSelected && (
												<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
													<Check className="h-4 w-4 text-[#38BC54]" />
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
