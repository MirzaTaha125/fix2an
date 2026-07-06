import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ChevronRight, Check, Instagram, Facebook, Linkedin } from 'lucide-react'

const HOME_PATHS = ['/', '/en', '/sv']

function FooterBrand() {
	return (
		<Link to="/" className="inline-flex items-end gap-0.5 group">
			<span className="text-[1.65rem] sm:text-[1.75rem] font-bold text-white leading-none tracking-tight">
				Fixa
			</span>
			<span className="relative pb-0.5 text-[1.65rem] sm:text-[1.75rem] font-bold text-[#38BC54] leading-none tracking-tight">
				<span className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-[#38BC54] flex items-center justify-center bg-[#05324f]">
					<Check className="w-2.5 h-2.5 text-[#38BC54]" strokeWidth={3} />
				</span>
				2an
			</span>
		</Link>
	)
}

function FooterLink({ to, label }) {
	const location = useLocation()
	const navigate = useNavigate()
	const linkClassName =
		'flex items-center justify-between gap-3 text-sm text-white/90 hover:text-white transition-colors group'

	if (to.startsWith('/#')) {
		const sectionId = to.slice(2)

		const scrollToSection = () => {
			document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		const handleClick = (event) => {
			event.preventDefault()
			const onHome = HOME_PATHS.includes(location.pathname)

			if (onHome) {
				window.history.replaceState(null, '', `${location.pathname}#${sectionId}`)
				scrollToSection()
				return
			}

			navigate(`/#${sectionId}`)
		}

		return (
			<a href={`/#${sectionId}`} onClick={handleClick} className={linkClassName}>
				<span>{label}</span>
				<ChevronRight className="w-4 h-4 shrink-0 text-white/50 group-hover:text-white/80 transition-colors" />
			</a>
		)
	}

	return (
		<Link to={to} className={linkClassName}>
			<span>{label}</span>
			<ChevronRight className="w-4 h-4 shrink-0 text-white/50 group-hover:text-white/80 transition-colors" />
		</Link>
	)
}

function FooterColumn({ title, links }) {
	return (
		<div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-0">
			<h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-2">
				{title}
			</h3>
			<div className="w-8 h-0.5 bg-[#38BC54] mb-4" />
			<ul className="space-y-3">
				{links.map(({ to, label }) => (
					<li key={to + label}>
						<FooterLink to={to} label={label} />
					</li>
				))}
			</ul>
		</div>
	)
}

function HomeFooter({ className = '' }) {
	const { t } = useTranslation()

	const carOwnerLinks = [
		{ to: '/#how-it-works', label: t('footer.how_it_works') },
		{ to: '/#faq', label: t('footer.faq') },
	]

	const workshopLinks = [
		{ to: '/workshop/signup', label: t('footer.become_partner') },
		{ to: '/auth/signin', label: t('footer.login') },
	]

	const companyLinks = [
		{ to: '/#hero', label: t('footer.about') },
		{ to: '/privacy', label: t('footer.privacy') },
		{ to: '/terms', label: t('footer.terms') },
		{ to: '/cookies', label: t('footer.cookies') },
	]

	const socialLinks = [
		{ href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
		{ href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
		{ href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
	]

	return (
		<footer className={`bg-[#05324f] text-white shrink-0 ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
					<div className="px-0 sm:px-2 lg:px-8 pb-8 lg:pb-0 border-b border-white/10 lg:border-b-0">
						<FooterBrand />
						<p className="mt-5 text-sm text-white/80 leading-loose max-w-xs">
							{t('footer.description')}
						</p>
						<a
							href={`mailto:${t('footer.email')}`}
							className="mt-5 inline-flex items-center gap-2.5 text-sm text-white/90 hover:text-white transition-colors"
						>
							<Mail className="w-4 h-4 text-[#38BC54] shrink-0" strokeWidth={2} />
							<span>{t('footer.email')}</span>
						</a>
					</div>

					<FooterColumn title={t('footer.car_owners')} links={carOwnerLinks} />
					<FooterColumn title={t('footer.workshops')} links={workshopLinks} />
					<FooterColumn title={t('footer.company')} links={companyLinks} />
				</div>
			</div>

			<div className="border-t border-white/10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-xs sm:text-sm text-white/70 text-center sm:text-left">
						{t('footer.copyright')}
					</p>
					<div className="flex items-center divide-x divide-white/20">
						{socialLinks.map(({ href, label, Icon }) => (
							<a
								key={label}
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={label}
								className="px-4 first:pl-0 last:pr-0 text-white/80 hover:text-white transition-colors"
							>
								<Icon className="w-5 h-5" strokeWidth={1.75} />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	)
}

function SimpleFooter({ className = '' }) {
	const { t } = useTranslation()

	return (
		<footer
			className={`bg-white pt-6 sm:pt-8 pb-6 sm:pb-8 max-lg:footer-scroll-inset lg:pb-8 border-t border-gray-200 shrink-0 ${className}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
					<p className="text-xs sm:text-sm text-center sm:text-left" style={{ color: '#05324f' }}>
						{t('homepage.footer.email')}
					</p>
					<div className="flex items-center gap-3 sm:gap-4">
						<Link to="/terms" className="text-xs sm:text-sm hover:underline" style={{ color: '#05324f' }}>
							{t('homepage.footer.terms')}
						</Link>
						<Link to="/privacy" className="text-xs sm:text-sm hover:underline" style={{ color: '#05324f' }}>
							{t('homepage.footer.privacy')}
						</Link>
					</div>
				</div>
			</div>
		</footer>
	)
}

export default function Footer({ className = '' }) {
	const { pathname } = useLocation()

	if (HOME_PATHS.includes(pathname)) {
		return <HomeFooter className={className} />
	}

	return <SimpleFooter className={className} />
}
