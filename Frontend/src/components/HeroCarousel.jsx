import { useState, useEffect } from 'react'

const images = [
	'/assets/hero1.jpg',
	'/assets/hero2.jpeg',
	'/assets/hero3.jpg'
]

export function HeroCarousel() {
	const [currentIndex, setCurrentIndex] = useState(0)

	// Auto-play functionality
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
		}, 5000) // Change slide every 5 seconds

		return () => clearInterval(interval)
	}, [])

	const goToSlide = (index) => {
		setCurrentIndex(index)
	}

	return (
		<div className="relative w-full h-screen overflow-hidden min-h-[600px] sm:min-h-screen">
			{/* Carousel Images */}
			<div className="relative w-full h-full">
				{images.map((image, index) => (
					<div
						key={index}
						className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
							index === currentIndex ? 'opacity-100' : 'opacity-0'
						}`}
					>
						<img
							src={image}
							alt={`Hero image ${index + 1}`}
							className="w-full h-full object-cover object-center"
							style={{ objectPosition: 'center center' }}
						/>
						{/* Dark overlay for better text readability */}
						<div className="absolute inset-0 bg-black/50 md:bg-black/40"></div>
						{/* Dark gradient on left and right sides */}
						<div 
							className="absolute inset-0 pointer-events-none hidden md:block"
							style={{
								background: 'linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, transparent 20%, transparent 80%, rgba(0, 0, 0, 0.8) 100%)'
							}}
						></div>
						{/* Subtle dark gradient on top and bottom */}
						<div 
							className="absolute inset-0 pointer-events-none"
							style={{
								background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.6) 100%)'
							}}
						></div>
					</div>
				))}
			</div>

			{/* Dots Indicator */}
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
				{images.map((_, index) => (
					<button
						key={index}
						onClick={() => goToSlide(index)}
						className={`h-3 rounded-full transition-all duration-300 ${
							index === currentIndex
								? 'w-8 bg-white'
								: 'w-3 bg-white/50 hover:bg-white/75'
						}`}
						aria-label={`Go to slide ${index + 1}`}
					/>
				))}
			</div>
		</div>
	)
}

