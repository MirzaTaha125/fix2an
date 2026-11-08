import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import loginEmail from '../assets/login-email-clear.png'
import mainLogo from '../assets/main_logo.png'
import toast from 'react-hot-toast'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import { getRoleHomePath } from '../utils/roleHome'
import { getAdminHomePath } from '../utils/adminHost'
import { AuthPageSkeleton } from '../components/ui/Skeleton'

export default function AdminLoginPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login, user, loading, logout } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (loading || !user) return
		if (user.role?.toUpperCase() !== 'ADMIN') {
			logout()
			return
		}
		navigate(getAdminHomePath(), { replace: true })
	}, [user, loading, navigate, logout])

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
				if (result.user?.role?.toUpperCase() !== 'ADMIN') {
					logout()
					toast.error(t('errors.unauthorized') || 'Admin access only')
					setIsLoading(false)
					return
				}
				toast.success(t('success.login_successful'))
				navigate(getRoleHomePath(result.user), { replace: true })
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
	if (user?.role?.toUpperCase() === 'ADMIN') return null

	return (
		<div className="list-page-shell bg-[#F3F5F8]">
			<div className="flex justify-center pt-6 sm:pt-8 px-4">
				<img src={mainLogo} alt="Fixa2an" className="h-11 sm:h-12 w-auto object-contain" />
			</div>
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 lg:pt-16 pb-12">
				<div className="grid gap-6 lg:gap-8 lg:grid-cols-2 lg:items-center">
					<div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none px-2 sm:px-5 lg:px-8 text-center flex flex-col items-center justify-center">
						<img
							src={loginEmail}
							alt=""
							className="w-36 h-36 sm:w-48 sm:h-48 lg:w-[28rem] lg:h-[28rem] max-w-full object-contain -mb-4 sm:-mb-6 lg:-mb-12"
						/>
						<h2 className="text-2xl lg:text-[2rem] font-semibold text-brand-dark">
							{t('auth.signin.admin_direct_title')}
						</h2>
						<p className="text-[0.95rem] lg:text-lg text-[#6B7280] mt-2 lg:mt-5 leading-relaxed max-w-md">
							{t('auth.signin.admin_direct_body')}
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="order-2 lg:order-1 lg:translate-y-8 w-full max-w-md mx-auto lg:max-w-none bg-white rounded-2xl lg:rounded-3xl border border-[#EEF1F4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] px-5 py-4 sm:p-6 lg:px-8 lg:py-9 flex flex-col justify-center"
						noValidate
					>
						<h1 className="page-title !mt-0 text-left">{t('auth.signin.magic_title')}</h1>
						<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-relaxed mt-2 lg:mt-3 mb-3 lg:mb-6 text-left">
							{t('auth.signin.admin_direct_subtitle')}
						</p>
						<label htmlFor="admin-email" className="block text-sm lg:text-base font-medium text-[#111827] mb-2.5 leading-normal">
							{t('auth.signin.email')}
						</label>
						<input
							id="admin-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="username"
							placeholder={t('auth.signin.email_placeholder')}
							className="w-full h-12 lg:h-16 !rounded-md border border-gray-200 bg-white px-4 text-sm lg:text-base outline-none focus:border-[#1B8F3E] placeholder:text-[#C4C9D1]"
						/>
						<div className="flex items-center justify-between gap-3 mt-3 lg:mt-5 mb-2.5">
							<label htmlFor="admin-password" className="text-sm lg:text-base font-medium text-[#111827] leading-normal">
								{t('auth.signin.password')}
							</label>
							<Link to="/auth/forgot-password" className="text-sm font-medium text-brand-dark hover:underline shrink-0">
								{t('auth.signin.forgot_password')}
							</Link>
						</div>
						<div className="relative w-full">
							<input
								id="admin-password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="current-password"
								placeholder={t('auth.signin.password')}
								className="w-full h-12 lg:h-16 !rounded-md border border-gray-200 bg-white px-4 pr-12 text-sm lg:text-base outline-none focus:border-[#1B8F3E] placeholder:text-[#C4C9D1]"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
							</button>
						</div>
						<button
							type="submit"
							disabled={isLoading}
							className="w-full min-h-[44px] lg:min-h-[64px] mt-4 lg:mt-6 !rounded-md bg-brand-btn text-white font-medium lg:font-semibold text-sm lg:text-lg leading-normal disabled:opacity-60"
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
