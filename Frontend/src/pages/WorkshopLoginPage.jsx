import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import loginEmail from '../assets/login-email-clear.png'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import { getRoleHomePath } from '../utils/roleHome'
import { AuthPageSkeleton } from '../components/ui/Skeleton'

export default function WorkshopLoginPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login, user, loading } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!loading && user) {
			navigate(getRoleHomePath(user), { replace: true })
		}
	}, [user, loading, navigate])

	const handleSubmit = async (e) => {
		e.preventDefault()
		const trimmedEmail = email.trim()
		const trimmedPassword = password.trim()
		if (!trimmedEmail) {
			toast.error(t('errors.email_required') || 'Please enter your email address')
			return
		}
		if (!trimmedPassword) {
			toast.error(t('errors.fill_all_fields'))
			return
		}
		setIsLoading(true)
		try {
			const result = await login(trimmedEmail, trimmedPassword)
			if (result.success) {
				toast.success(t('success.login_successful'))
				navigate(getRoleHomePath(result.user))
			} else if (result.requiresTwoFactor && result.tempToken) {
				navigate('/auth/2fa-verify', { state: { tempToken: result.tempToken, email: result.email } })
				setIsLoading(false)
			} else {
				toast.error(result.message || t('errors.invalid_credentials'))
				setIsLoading(false)
			}
		} catch (error) {
			toast.error(error.message || t('errors.generic_error'))
			setIsLoading(false)
		}
	}

	if (loading) {
		return <AuthPageSkeleton />
	}
	if (user) return null

	return (
		<div className="list-page-shell bg-[#F3F5F8] min-h-dvh flex flex-col">
			<Navbar />
			<div className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-10">
				<div className="w-full max-w-7xl mx-auto grid gap-6 lg:gap-8 lg:grid-cols-2 lg:items-center items-start">
					{/* Mobile: image on top; Desktop: image on right */}
					<div className="order-1 lg:order-2 px-2 sm:px-5 lg:px-8 text-center flex flex-col items-center justify-center">
						<img
							src={loginEmail}
							alt=""
							className="w-44 h-44 sm:w-56 sm:h-56 lg:w-[28rem] lg:h-[28rem] max-w-full object-contain -mb-6 sm:-mb-8 lg:-mb-12"
						/>
						<h2 className="text-xl sm:text-2xl lg:text-[2rem] font-semibold text-brand-dark">
							{t('auth.signin.workshop_direct_title')}
						</h2>
						<p className="text-sm sm:text-base lg:text-lg text-[#6B7280] mt-3 lg:mt-5 leading-relaxed max-w-md">
							{t('auth.signin.workshop_direct_body')}
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="order-2 lg:order-1 bg-white rounded-2xl lg:rounded-3xl border border-[#EEF1F4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] px-5 py-6 sm:p-6 lg:px-8 lg:py-9 flex flex-col justify-center text-left w-full"
						noValidate
					>
						<h1 className="page-title !mt-0 text-left">{t('auth.signin.title')}</h1>
						<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-relaxed mt-2 lg:mt-3 mb-5 lg:mb-6 text-left">
							{t('navigation.for_workshops')}
						</p>
						<label htmlFor="email" className="block text-sm lg:text-base font-semibold text-brand-dark mb-2.5">
							{t('auth.signin.email')}
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder={t('auth.signin.email')}
							className="w-full h-12 lg:h-16 !rounded-md border border-gray-200 bg-white px-4 text-sm lg:text-base outline-none focus:border-[#1B8F3E]"
						/>
						<label htmlFor="password" className="block text-sm lg:text-base font-semibold text-brand-dark mt-5 mb-2.5">
							{t('auth.signin.password')}
						</label>
						<div className="relative w-full">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder={t('auth.signin.password')}
								className="w-full h-12 lg:h-16 !rounded-md border border-gray-200 bg-white px-4 pr-12 text-sm lg:text-base outline-none focus:border-[#1B8F3E]"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
							>
								{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
							</button>
						</div>
						<div className="flex justify-end mt-3">
							<Link to="/auth/forgot-password" className="text-sm font-medium text-brand-dark hover:underline">
								{t('auth.signin.forgot_password')}
							</Link>
						</div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full min-h-[52px] lg:min-h-[64px] mt-5 !rounded-md bg-brand-btn text-white font-semibold text-base lg:text-lg disabled:opacity-60"
						>
							{isLoading ? t('auth.signin.submitting') : t('auth.signin.submit')}
						</button>
					</form>
				</div>
			</div>
			<Footer />
		</div>
	)
}
