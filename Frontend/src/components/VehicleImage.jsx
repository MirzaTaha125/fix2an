import { useEffect, useState } from 'react'
import { cn } from '../utils/cn'
import { vehiclesAPI } from '../services/api'
import carPlaceholder from '../assets/car-placeholder.png'

const clientCache = new Map()

/**
 * Vehicle photo via backend: Wikipedia (free, no watermark) → brand logo → icon.
 */
export default function VehicleImage({
	make,
	model,
	year,
	className,
	imgClassName,
	fallbackClassName,
	alt,
	width = 500,
}) {
	const [imageUrl, setImageUrl] = useState(null)
	const [isLogo, setIsLogo] = useState(false)
	const [loading, setLoading] = useState(false)

	const label = alt || [make, model, year].filter(Boolean).join(' ')

	useEffect(() => {
		if (!make) {
			setImageUrl(null)
			setIsLogo(false)
			return
		}

		const cacheKey = `${make}|${model || ''}|${year || ''}|${width}`
		const cached = clientCache.get(cacheKey)
		if (cached) {
			setImageUrl(cached.url)
			setIsLogo(cached.source === 'logo')
			return
		}

		let active = true
		setLoading(true)

		vehiclesAPI
			.getVehicleImageUrl({ make, model, year, width })
			.then((res) => {
				if (!active) return
				const url = res.data?.url || null
				const source = res.data?.source || null
				clientCache.set(cacheKey, { url, source })
				setImageUrl(url)
				setIsLogo(source === 'logo')
			})
			.catch(() => {
				if (active) {
					setImageUrl(null)
				}
			})
			.finally(() => {
				if (active) setLoading(false)
			})

		return () => {
			active = false
		}
	}, [make, model, year, width])

	if (!make) {
		return (
			<div className={cn('flex items-center justify-center bg-gray-100', className, fallbackClassName)}>
				<img
					src={carPlaceholder}
					alt={label || 'Vehicle'}
					className={cn('w-[70%] h-[70%] object-contain opacity-80', imgClassName)}
				/>
			</div>
		)
	}

	if (imageUrl) {
		return (
			<div className={cn('w-full h-full flex items-start justify-center rounded-xl', isLogo && 'pt-0.5 px-1', className)}>
				<img
					src={imageUrl}
					alt={label}
					className={cn('block max-w-full max-h-full object-contain object-top rounded-xl', imgClassName)}
					onError={() => {
						setImageUrl(null)
					}}
				/>
			</div>
		)
	}

	if (loading) {
		return (
			<div className={cn('animate-pulse bg-gray-100', className, fallbackClassName)} />
		)
	}

	return (
		<div className={cn('flex items-center justify-center bg-gray-100', className, fallbackClassName)}>
			<img
				src={carPlaceholder}
				alt={label || 'Vehicle'}
				className={cn('w-[70%] h-[70%] object-contain opacity-80', imgClassName)}
			/>
		</div>
	)
}
