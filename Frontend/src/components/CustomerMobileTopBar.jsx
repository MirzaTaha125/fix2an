import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMobileBack } from '../context/MobileBackContext'
import WorkshopImage from './WorkshopImage'
import mainLogo from '../assets/main_logo.png'

function useRouteMobileBack() {
	const navigate = useNavigate()
	const { pathname, search } = useLocation()
	const params = new URLSearchParams(search)

	if (pathname === '/contract') {
		const caseId = params.get('case')
		const panel = params.get('panel')

		if (caseId) {
			if (panel && panel !== 'details') {
				return () => {
					const next = new URLSearchParams(search)
					;['panel', 'bookingId', 'offerId', 'step'].forEach((key) => next.delete(key))
					next.set('panel', 'details')
					navigate(`/contract?${next.toString()}`)
				}
			}
			return () => {
				const next = new URLSearchParams(search)
				;['case', 'panel', 'bookingId', 'offerId', 'step', 'view'].forEach((key) => next.delete(key))
				const qs = next.toString()
				navigate(qs ? `/contract?${qs}` : '/contract')
			}
		}

		return null
	}

	if (pathname === '/dashboard' || pathname === '/profile') return null

	const isUploadFlowStep =
		pathname === '/upload' &&
		Boolean(
			params.get('path') ||
			params.get('edit') ||
			params.get('requestId') ||
			params.get('mode') === 'no-image' ||
			params.get('sent') === '1'
		)

	if (
		isUploadFlowStep ||
		pathname === '/how-it-works' ||
		pathname === '/about' ||
		pathname.startsWith('/offers') ||
		pathname.startsWith('/book-appointment') ||
		pathname.startsWith('/payment') ||
		pathname.startsWith('/support') ||
		pathname === '/privacy' ||
		pathname === '/terms' ||
		pathname === '/cookies' ||
		(/^\/workshop\/[^/]+\/reviews/).test(pathname)
	) {
		return () => navigate(-1)
	}

	return null
}

export default function CustomerMobileTopBar() {
	const { t } = useTranslation()
	const { handler, title, avatar } = useMobileBack()
	const routeBack = useRouteMobileBack()
	const onBack = handler || routeBack
	const showTitle = Boolean(onBack && title)

	return (
		<header className="customer-mobile-topbar lg:hidden fixed top-0 left-0 right-0 z-40 bg-white pt-[env(safe-area-inset-top,0px)]">
			<div className={`relative flex items-center h-14 px-3 ${showTitle ? '' : 'justify-center'}`}>
				{onBack ? (
					<button
						type="button"
						onClick={onBack}
						className={`${showTitle ? 'relative shrink-0' : 'absolute left-3 top-1/2 -translate-y-1/2'} flex items-center justify-center h-11 w-11 text-brand-dark hover:opacity-70`}
						aria-label={t('common.back')}
					>
						<ArrowLeft className="w-5 h-5" strokeWidth={2} />
					</button>
				) : null}
				{showTitle ? (
					<div className="min-w-0 flex-1 flex items-center gap-2.5 pl-0.5">
						{avatar ? (
							<div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
								<WorkshopImage
									workshop={{ companyName: title, logo: avatar }}
									alt={title}
									className="w-full h-full"
								/>
							</div>
						) : null}
						<p className="min-w-0 flex-1 text-base font-bold text-[#05324f] truncate font-['Inter',sans-serif]">
							{title}
						</p>
					</div>
				) : (
					<Link to="/dashboard" className="flex items-center justify-center h-11" aria-label="Fixa2an">
						<img src={mainLogo} alt="Fixa2an" className="h-11 w-auto object-contain" />
					</Link>
				)}
			</div>
		</header>
	)
}
