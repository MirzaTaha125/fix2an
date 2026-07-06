import { useTranslation } from 'react-i18next'
import VehicleImage from './VehicleImage'
import { cn, formatSwedishRegistrationNumber } from '../utils/cn'

export function getRequestVehicle(request) {
	if (!request) return null
	return request.vehicleId || request.vehicle || null
}

export function getRequestRegistrationNumber(request) {
	if (!request) return ''
	if (typeof request === 'string') return request.trim()
	return (request.registrationNumber || request.registration_number || '').trim()
}

export function formatRequestRegistration(requestOrNumber) {
	const registrationNumber = getRequestRegistrationNumber(requestOrNumber)
	return registrationNumber ? formatSwedishRegistrationNumber(registrationNumber) : '—'
}

export function formatVehicleDetailsLine(vehicle) {
	if (!vehicle) return ''

	const make = vehicle?.make?.trim()
	const model = vehicle?.model?.trim()
	const parts = []

	if (make && make !== '—') parts.push(make)
	if (model && model !== '—') parts.push(model)
	if (vehicle?.year) parts.push(vehicle.year)

	return parts.join(', ')
}

export function VehicleRequestInfoLines({
	request,
	vehicle: vehicleProp,
	showProblem = true,
	showDetails = true,
	showLocation = false,
	problemClassName,
	children,
}) {
	const { t } = useTranslation()
	const vehicle = vehicleProp || getRequestVehicle(request)
	const vehicleDetails = formatVehicleDetailsLine(vehicle)

	return (
		<div className="space-y-1">
			{showProblem && (
				<p className={cn('text-[11px] text-[#05324f]/80 leading-snug line-clamp-2', problemClassName)}>
					<span className="font-bold">{t('workshop.requests.problem_label') || 'Problem'}:</span>
					{request?.description?.trim() ? ` ${request.description.trim()}` : ' —'}
				</p>
			)}
			{showDetails && (
				<p className="text-[11px] text-[#05324f]/80 leading-snug line-clamp-2">
					<span className="font-bold">{t('workshop.requests.details_label') || 'Details'}:</span>{' '}
					{vehicleDetails || '—'}
				</p>
			)}
			{showLocation && request?.city && (
				<p className="text-[11px] text-[#05324f]/80">
					<span className="font-bold">{t('workshop.requests.location_label') || 'Location'}:</span> {request.city}
				</p>
			)}
			{children}
		</div>
	)
}

export default function VehicleRequestCard({
	request,
	vehicle: vehicleProp,
	imageWidth = 400,
	imageClassName = 'w-full max-h-32 md:max-h-[8rem]',
	imageFallbackClassName = 'w-full h-24 md:h-[7rem]',
	imageContainerClassName = 'w-28 md:w-32',
	className,
	contentClassName,
	titleWeight = 'black',
	headerEnd,
	showProblem = true,
	showDetails = true,
	showLocation = false,
	children,
	footer,
}) {
	const vehicle = vehicleProp || getRequestVehicle(request)
	const titleWeightClass = titleWeight === 'semibold' ? 'font-semibold' : 'font-black'

	return (
		<div className={cn('flex gap-3 md:gap-4 flex-1 items-stretch min-h-0', className)}>
			<div
				className={cn(
					'shrink-0 self-start rounded-xl overflow-hidden flex items-start justify-center',
					imageContainerClassName
				)}
			>
				<VehicleImage
					make={vehicle?.make}
					model={vehicle?.model}
					year={vehicle?.year}
					width={imageWidth}
					className={imageClassName}
					fallbackClassName={imageFallbackClassName}
					alt={formatVehicleDetailsLine(vehicle) || 'Vehicle'}
				/>
			</div>
			<div className={cn('flex-1 min-w-0 flex flex-col', contentClassName)}>
				<div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
					<h3
						className={cn(
							'text-sm text-[#05324f] leading-snug line-clamp-2 tracking-wide flex-1 min-w-0',
							titleWeightClass
						)}
					>
						{formatRequestRegistration(request)}
					</h3>
					{headerEnd}
				</div>
				<VehicleRequestInfoLines
					request={request}
					vehicle={vehicle}
					showProblem={showProblem}
					showDetails={showDetails}
					showLocation={showLocation}
				>
					{children}
				</VehicleRequestInfoLines>
				{footer}
			</div>
		</div>
	)
}
