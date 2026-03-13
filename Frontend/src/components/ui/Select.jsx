import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

const SelectContext = React.createContext(null)

export function Select({ value, onValueChange, children }) {
	const [open, setOpen] = React.useState(false)
	const [selectedValue, setSelectedValue] = React.useState(value || '')
	const [displayText, setDisplayText] = React.useState('')

	React.useEffect(() => {
		setSelectedValue(value || '')
	}, [value])

	const handleSelect = (newValue, newText) => {
		setSelectedValue(newValue)
		setDisplayText(newText)
		setOpen(false)
		if (onValueChange) {
			onValueChange(newValue)
		}
	}

	return (
		<SelectContext.Provider value={{ selectedValue, displayText, open, setOpen, handleSelect }}>
			<div className="relative">{children}</div>
		</SelectContext.Provider>
	)
}

export function SelectTrigger({ className, children, placeholder, ...props }) {
	const { t } = useTranslation()
	const { selectedValue, displayText, open, setOpen } = React.useContext(SelectContext)
	const displayValue = displayText || selectedValue || placeholder || t('common.select_placeholder')

	return (
		<button
			type="button"
			className={cn(
				'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			onClick={() => setOpen(!open)}
			{...props}
		>
			<span className="line-clamp-1">{displayValue}</span>
			<ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
		</button>
	)
}

export function SelectValue({ placeholder }) {
	const { selectedValue, displayText } = React.useContext(SelectContext)
	// This component is used to set the placeholder, but the actual display is handled by SelectTrigger
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
			<div
				className="fixed inset-0 z-40"
				onClick={() => setOpen(false)}
			/>
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
							return React.cloneElement(child, {
								onClick: () => handleSelect(child.props.value, child.props.children),
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
	return (
		<div
			className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
			{...props}
		/>
	)
}

export function SelectSeparator({ className, ...props }) {
	return (
		<div
			className={cn('-mx-1 my-1 h-px bg-gray-200', className)}
			{...props}
		/>
	)
}

