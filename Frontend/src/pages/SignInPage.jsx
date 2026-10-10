import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import loginEmail from '../assets/login-email-clear.png'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getRoleHomePath } from '../utils/roleHome'
import { authAPI } from '../services/api'
import { AuthPageSkeleton } from '../components/ui/Skeleton'

export default function SignInPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [sentEmail, setSentEmail] = useState('')
	const [devMagicLinkUrl, setDevMagicLinkUrl] = useState('')
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user) {
			navigate(getRoleHomePath(user), { replace: true })
		}
	}, [user, loading, navigate])

	const handleSend = async (event) => {
		event.preventDefault()
		const trimmedEmail = email.trim().toLowerCase()
		if (!trimmedEmail) {
			toast.error(t('errors.email_required') || 'Please enter your email address')
			return
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
			return
		}
		setIsSending(true)
		setDevMagicLinkUrl('')
		try {
			const response = await authAPI.sendLoginMagicLink({
				email: trimmedEmail,
				frontendUrl: window.location.origin,
			})
			const data = response.data || {}
			setSentEmail(trimmedEmail)
			if (data.magicLinkUrl) setDevMagicLinkUrl(data.magicLinkUrl)
			if (data.emailSent === false) {
				toast.success(t('auth.signin.magic_link_ready_dev'))
			} else {
				toast.success(t('auth.signin.magic_link_sent'))
			}
		} catch (error) {
			toast.error(error.response?.data?.message || t('errors.generic_error'))
		} finally {
			setIsSending(false)
		}
	}

	if (loading) {
		return <AuthPageSkeleton />
	}
	if (user) return null

	return (
		<div className="list-page-shell bg-[#F3F5F8]">
			<Navbar />
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 lg:pt-40 pb-12">
				<div className="grid gap-6 lg:gap-8 lg:grid-cols-2 lg:items-center">
					{/* Mobile: image on top; Desktop: image on right */}
					<div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none px-2 sm:px-5 lg:px-8 text-center flex flex-col items-center justify-center">
						<img
							src={loginEmail}
							alt=""
							className="w-36 h-36 sm:w-48 sm:h-48 lg:w-[28rem] lg:h-[28rem] max-w-full object-contain -mb-4 sm:-mb-6 lg:-mb-12"
						/>
						<h2 className="text-lg sm:text-xl lg:text-[2rem] font-semibold text-brand-dark">
							{t('auth.signin.check_email')}
						</h2>
						<p className="text-sm sm:text-base lg:text-lg text-[#6B7280] mt-2 lg:mt-5 leading-relaxed max-w-md">
							{t('auth.signin.link_sent_to')}
						</p>
						<p className="text-sm sm:text-base lg:text-lg text-[#1B8F3E] font-semibold mt-1 max-w-md">
							{sentEmail || t('footer.email')}
						</p>
						<p className="text-sm sm:text-base lg:text-lg text-[#9CA3AF] mt-1.5 leading-relaxed max-w-md">
							{t('auth.signin.link_valid')}
						</p>
						{devMagicLinkUrl && (
							<a
								href={devMagicLinkUrl}
								className="mt-4 lg:mt-5 inline-flex min-h-[40px] items-center px-5 rounded-lg bg-brand-btn text-white text-sm font-semibold"
							>
								{t('auth.signin.magic_link_open')}
							</a>
						)}
					</div>

					<form
						onSubmit={handleSend}
						className="order-2 lg:order-1 w-full max-w-md mx-auto lg:max-w-none bg-white rounded-2xl lg:rounded-3xl border border-[#EEF1F4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] px-5 py-5 sm:p-6 lg:px-8 lg:py-9 flex flex-col justify-center"
					>
						<h1 className="page-title !mt-0 text-left">{t('auth.signin.magic_title')}</h1>
						<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-relaxed mt-2 lg:mt-3 mb-5 lg:mb-6 text-left">
							{t('auth.signin.magic_subtitle')}
						</p>
						<label htmlFor="email" className="block text-sm lg:text-base font-medium text-[#111827] mb-2.5 leading-normal">
							{t('auth.signin.email')}
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t('auth.signin.email_placeholder')}
							className="w-full h-12 lg:h-16 !rounded-md border border-gray-200 bg-white px-4 text-sm lg:text-base outline-none focus:border-[#1B8F3E] placeholder:text-[#C4C9D1]"
						/>
						<button
							type="submit"
							disabled={isSending}
							className="w-full min-h-[52px] lg:min-h-[64px] mt-5 lg:mt-6 !rounded-md bg-brand-btn text-white font-semibold text-base lg:text-lg leading-normal disabled:opacity-60"
						>
							{isSending ? t('auth.signin.magic_link_sending') : t('auth.signin.send_login_link')}
						</button>
						<p className="mt-5 lg:mt-6 w-full inline-flex items-center justify-start gap-2 text-xs lg:text-sm leading-relaxed text-[#9CA3AF]">
							<ShieldCheck className="w-4 h-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.75} />
							{t('auth.signin.no_password')}
						</p>
					</form>
				</div>
			</div>
			<Footer />
		</div>
	)
}
