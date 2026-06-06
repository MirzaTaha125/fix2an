import React from 'react'
import { Input } from './Input'
import { cn } from '../../utils/cn'
import { formatSwedishPhone, SWEDISH_COUNTRY_CODE, toNationalPhoneInput } from '../../utils/swedishPhone'

export const PhoneInput = React.forwardRef(function PhoneInput(
	{ onChange, value, placeholder = 'Phone number', className, ...props },
	ref,
) {
	const nationalValue = toNationalPhoneInput(value)

	const handleChange = (e) => {
		const formatted = formatSwedishPhone(e.target.value)
		onChange?.({
			...e,
			target: { ...e.target, value: formatted, name: e.target.name },
		})
	}

	return (
		<div className={cn('flex w-full items-stretch', className)}>
			<span className="inline-flex h-12 items-center rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-100 px-3 text-sm font-medium text-[#05324f] shrink-0">
				{SWEDISH_COUNTRY_CODE}
			</span>
			<Input
				ref={ref}
				type="tel"
				inputMode="tel"
				autoComplete="tel-national"
				value={nationalValue}
				onChange={handleChange}
				placeholder={placeholder}
				className="rounded-l-none border-l-0 flex-1 min-w-0 focus:border-l-0"
				{...props}
			/>
		</div>
	)
})
