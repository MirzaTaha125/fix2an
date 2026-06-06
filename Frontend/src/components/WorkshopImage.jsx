import { useEffect, useState } from 'react'
import { cn } from '../utils/cn'
import { getFullUrl } from '../config/api'
import workshopPlaceholder from '../assets/workshop-placeholder.png'

export function resolveWorkshopImagePath(workshop, src) {
	if (src?.trim()) return src.trim()
	if (workshop?.logo?.trim()) return workshop.logo.trim()
	if (workshop?.image?.trim()) return workshop.image.trim()
	if (typeof workshop?.userId === 'object' && workshop.userId?.image?.trim()) {
		return workshop.userId.image.trim()
	}
	return null
}

export function getWorkshopImageSrc(workshop) {
	const image = resolveWorkshopImagePath(workshop)
	return image ? getFullUrl(image) : workshopPlaceholder
}

export default function WorkshopImage({
	workshop,
	src,
	alt,
	className,
	imgClassName,
	fallbackClassName,
}) {
	const imagePath = resolveWorkshopImagePath(workshop, src)
	const hasUploadedImage = Boolean(imagePath)
	const [loadFailed, setLoadFailed] = useState(false)

	useEffect(() => {
		setLoadFailed(false)
	}, [imagePath])

	const isPlaceholder = !hasUploadedImage || loadFailed
	const label = alt || workshop?.companyName || 'Workshop'

	if (isPlaceholder) {
		return (
			<div
				className={cn(
					'w-full h-full bg-[#38BC54] flex items-center justify-center',
					className,
					fallbackClassName
				)}
			>
				<img
					src={workshopPlaceholder}
					alt={label}
					className={cn('w-[96%] h-[96%] object-contain workshop-placeholder-icon', imgClassName)}
				/>
			</div>
		)
	}

	return (
		<img
			src={getFullUrl(imagePath)}
			alt={label}
			className={cn('w-full h-full object-cover', className, imgClassName)}
			onError={() => setLoadFailed(true)}
		/>
	)
}
