import { useEffect, useState } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { Check, Info, X } from 'lucide-react'

const VARIANTS = {
	success: {
		bg: '#E8F5EC',
		border: '#C6E5D0',
		iconBg: '#1B8F3E',
		Icon: Check,
	},
	error: {
		bg: '#FDECEC',
		border: '#F5C6C6',
		iconBg: '#DC2626',
		Icon: X,
	},
	info: {
		bg: '#E8F1FB',
		border: '#C5D8F0',
		iconBg: '#2563EB',
		Icon: Info,
	},
}

function resolveVariant(type) {
	if (type === 'success') return VARIANTS.success
	if (type === 'error') return VARIANTS.error
	return VARIANTS.info
}

function useIsDesktop() {
	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
	)

	useEffect(() => {
		const media = window.matchMedia('(min-width: 1024px)')
		const onChange = () => setIsDesktop(media.matches)
		onChange()
		media.addEventListener('change', onChange)
		return () => media.removeEventListener('change', onChange)
	}, [])

	return isDesktop
}

export default function AppToaster() {
	const isDesktop = useIsDesktop()

	return (
		<Toaster
			position={isDesktop ? 'top-right' : 'top-center'}
			gutter={10}
			containerStyle={isDesktop ? { top: 20, right: 20 } : { top: 16, left: 12, right: 12 }}
			toastOptions={{
				duration: 4000,
				className: 'fixa-toast',
				style: {
					background: 'transparent',
					boxShadow: 'none',
					padding: 0,
					border: 'none',
					maxWidth: isDesktop ? 420 : 'min(420px, calc(100vw - 24px))',
					width: isDesktop ? 420 : '100%',
				},
			}}
		>
			{(t) => {
				const variant = resolveVariant(t.type)
				const Icon = variant.Icon

				return (
					<ToastBar
						toast={t}
						style={{
							background: 'transparent',
							boxShadow: 'none',
							padding: 0,
							border: 'none',
							maxWidth: isDesktop ? 420 : 'min(420px, calc(100vw - 24px))',
							width: isDesktop ? 420 : '100%',
						}}
					>
						{({ message }) => (
							<div
								className="flex w-full items-center gap-3.5 rounded-xl"
								style={{
									background: variant.bg,
									border: `1px solid ${variant.border}`,
									boxShadow: '0 4px 14px rgba(5, 50, 79, 0.08)',
									padding: '16px 18px',
								}}
							>
								<div
									className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
									style={{ backgroundColor: variant.iconBg }}
									aria-hidden
								>
									<Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
								</div>
								<div className="min-w-0 flex-1 py-0.5 text-left text-sm font-medium leading-snug text-[#05324f] [&_div]:!m-0 [&_div]:!justify-start [&_div]:!text-[#05324f]">
									{message}
								</div>
								{t.type !== 'loading' ? (
									<button
										type="button"
										onClick={() => toast.dismiss(t.id)}
										className="shrink-0 rounded-full p-1.5 text-[#05324f]/55 transition-colors hover:bg-black/5 hover:text-[#05324f]"
										aria-label="Close"
									>
										<X className="h-4 w-4" strokeWidth={2} />
									</button>
								) : null}
							</div>
						)}
					</ToastBar>
				)
			}}
		</Toaster>
	)
}
