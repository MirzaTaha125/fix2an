import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

const SelectContext = React.createContext(null)

export function Select({ value, onValueChange, children }) {
	const [open, setOpen] = React.useState(false)
	const [selectedValue, setSelectedValue] = React.useState(value || '')
	const [displayText, setDisplayText] = React.useState('')
	const [placeholder, setPlaceholder] = React.useState('')

	React.useEffect(() => {
		setSelectedValue(value || '')
		if (!value) setDisplayText('')
	}, [value])

	const handleSelect = (newValue, newText) => {
		setSelectedValue(newValue)
		setDisplayText(typeof newText === 'string' ? newText : String(newText ?? ''))
		setOpen(false)
		if (onValueChange) {
			onValueChange(newValue)
		}
	}

	return (
		<SelectContext.Provider
			value={{ selectedValue, displayText, open, setOpen, handleSelect, placeholder, setPlaceholder }}
		>
			<div className="relative">{children}</div>
		</SelectContext.Provider>
	)
}

export function SelectTrigger({ className, children, placeholder: triggerPlaceholder, ...props }) {
	const { t } = useTranslation()
	const { selectedValue, displayText, open, setOpen, placeholder: contextPlaceholder } =
		React.useContext(SelectContext)
	const placeholder = triggerPlaceholder || contextPlaceholder || t('common.select_placeholder')
	const hasValue = Boolean(displayText || selectedValue)
	const displayValue = hasValue ? displayText || selectedValue : placeholder

	return (
		<button
			type="button"
			className={cn(
				'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			onClick={() => setOpen(!open)}
			{...props}
		>
			<span className={cn('line-clamp-1 text-left', !hasValue && 'text-[#9CA3AF]')}>{displayValue}</span>
			{children}
			<ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
		</button>
	)
}

export function SelectValue({ placeholder }) {
	const { setPlaceholder } = React.useContext(SelectContext)

	React.useEffect(() => {
		if (placeholder != null) setPlaceholder(placeholder)
	}, [placeholder, setPlaceholder])

	return null
}

export function SelectContent({ className, children, ...props }) {
	const { open, setOpen, handleSelect, selectedValue } = React.useContext(SelectContext)
	const contentRef = React.useRef(null)

	React.useEffect(() => {
		const handleClickOutside = (event) => {
			if (contentRef.current && !contentRef.current.contains(event.target)) {
				setOpen(false)
			}
		}

		if (open) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [open, setOpen])

	if (!open) return null

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
			<div
				ref={contentRef}
				className={cn(
					'absolute z-50 max-h-96 min-w-[8rem] w-full overflow-hidden rounded-md border bg-white text-gray-900 shadow-md',
					className
				)}
				{...props}
			>
				<div className="p-1 max-h-96 overflow-y-auto">
					{React.Children.map(children, (child) => {
						if (React.isValidElement(child) && child.type === SelectItem) {
							const label =
								typeof child.props.children === 'string' || typeof child.props.children === 'number'
									? String(child.props.children)
									: child.props.children
							return React.cloneElement(child, {
								onClick: () => handleSelect(child.props.value, label),
								isSelected: child.props.value === selectedValue,
							})
						}
						return child
					})}
				</div>
			</div>
		</>
	)
}

export function SelectItem({ className, children, value, onClick, isSelected, ...props }) {
	return (
		<div
			className={cn(
				'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 hover:bg-gray-100 hover:text-gray-900',
				isSelected && 'bg-gray-100 text-gray-900',
				className
			)}
			onClick={onClick}
			{...props}
		>
			{isSelected && (
				<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
					<Check className="h-4 w-4" />
				</span>
			)}
			{children}
		</div>
	)
}

export function SelectGroup({ children }) {
	return <div>{children}</div>
}

export function SelectLabel({ className, ...props }) {
	return <div className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)} {...props} />
}

export function SelectSeparator({ className, ...props }) {
	return <div className={cn('-mx-1 my-1 h-px bg-gray-200', className)} {...props} />
}
