import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RegisterTypeModal from '../components/RegisterTypeModal'
import { useTranslation } from 'react-i18next'
import { getRoleHomePath } from '../utils/roleHome'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { authAPI } from '../services/api'

export default function SignInPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const [isSendingMagicLink, setIsSendingMagicLink] = useState(false)
	const [magicLinkSent, setMagicLinkSent] = useState(false)
	const [devMagicLinkUrl, setDevMagicLinkUrl] = useState('')
	const { login, user, loading } = useAuth()
	const navigate = useNavigate()

	// Redirect if already logged in
	useEffect(() => {
		if (!loading && user) {
			navigate(getRoleHomePath(user), { replace: true })
		}
	}, [user, loading, navigate])

	const handleSubmit = async (e) => {
		e.preventDefault()
		e.stopPropagation()
		
		// Trim email and password
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
			console.error('Login exception:', error)
			toast.error(error.message || t('errors.generic_error'))
			setIsLoading(false)
		}
	}

	const handleSendMagicLink = async () => {
		const trimmedEmail = email.trim().toLowerCase()

		if (!trimmedEmail) {
			toast.error(t('errors.email_required') || 'Please enter your email address')
			return
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
			return
		}

		setIsSendingMagicLink(true)
		setDevMagicLinkUrl('')
		setMagicLinkSent(false)

		try {
			const response = await authAPI.sendLoginMagicLink({
				email: trimmedEmail,
				frontendUrl: window.location.origin,
			})
			const data = response.data || {}
			if (data.magicLinkUrl) {
				setDevMagicLinkUrl(data.magicLinkUrl)
			}
			setMagicLinkSent(true)
			if (data.emailSent === false) {
				toast.success(t('auth.signin.magic_link_ready_dev') || 'Login link ready — open it below.')
			} else {
				toast.success(t('auth.signin.magic_link_sent') || 'Login link sent! Check your inbox.')
			}
		} catch (error) {
			console.error('Login magic link error:', error)
			const message = error.response?.data?.message || t('errors.generic_error')
			toast.error(message)
		} finally {
			setIsSendingMagicLink(false)
		}
	}

	// Show loading while checking auth
	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="w-20 h-20 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	// Don't render if user is logged in (will redirect)
	if (user) {
		return null
	}

	return (
	<div className="list-page-shell bg-white">
		<Navbar />
		<div className="list-page-main list-page-main--scroll relative z-10">
			<div className="max-w-md w-full space-y-8 animate-fade-in-up">
				<div className="text-center">
					<h2 className="text-2xl md:text-5xl font-bold mb-6" style={{ color: '#05324f' }}>{t('auth.signin.title')}</h2>
						<p style={{ color: '#05324f' }}>
							{t('auth.signin.subtitle')}{' '}
							<button onClick={() => setRegisterModalOpen(true)} className="font-semibold hover:opacity-80 transition-colors underline-offset-4 hover:underline" style={{ color: '#05324f' }}>
								{t('navigation.register')}
							</button>
						</p>
					</div>

					<div className="bg-white rounded-card shadow-card p-8 border border-gray-100" style={{ position: 'relative', zIndex: 1 }}>
						<form 
							onSubmit={handleSubmit} 
							className="space-y-6"
							noValidate
						>
							<div>
								<Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Mail className="w-4 h-4 text-gray-500" />
										{t('auth.signin.email')}
									</div>
								</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									placeholder={t('auth.signin.email')}
								/>
							</div>
							<div>
								<Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Lock className="w-4 h-4 text-gray-500" />
										{t('auth.signin.password')}
									</div>
								</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? 'text' : 'password'}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="pr-12"
										placeholder={t('auth.signin.password')}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
								<div className="flex justify-end mt-2">
									<Link tabIndex="-1" to="/auth/forgot-password" className="text-sm font-medium hover:underline text-[#05324f]" style={{ color: '#05324f' }}>
										{t('auth.signin.forgot_password', 'Forgot your password?')}
									</Link>
								</div>
							</div>
							<button
								type="submit"
								disabled={isLoading}
								style={{ 
									cursor: isLoading ? 'not-allowed' : 'pointer',
									zIndex: 10,
									position: 'relative',
									backgroundColor: '#34C759',
									backgroundImage: 'none',
								}}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-normal text-white focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
								onMouseEnter={(e) => e.target.style.backgroundColor = '#2db04a'}
								onMouseLeave={(e) => e.target.style.backgroundColor = '#34C759'}
								onFocus={(e) => e.target.style.boxShadow = '0 0 0 4px rgba(52, 199, 89, 0.3)'}
								onBlur={(e) => e.target.style.boxShadow = ''}
							>
								{isLoading ? (
									<>
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('auth.signin.submitting') || 'Signing in...'}
									</>
								) : (
									<>
										{t('auth.signin.submit')}
									</>
								)}
							</button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="bg-white px-3 text-gray-500">
										{t('auth.signin.or_divider') || 'Or'}
									</span>
								</div>
							</div>

							{!magicLinkSent ? (
								<button
									type="button"
									disabled={isSendingMagicLink || isLoading}
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleSendMagicLink()
									}}
									className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-gray-200 rounded-xl text-base font-medium text-[#05324f] bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-[#34C759]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								>
									{isSendingMagicLink ? (
										t('auth.signin.magic_link_sending') || 'Sending link...'
									) : (
										t('auth.signin.magic_link')
									)}
								</button>
							) : (
								<div className="space-y-4">
									<div className="rounded-2xl border border-[#34C759]/20 bg-[#F2F9F4] px-4 py-4 text-center">
										<p className="text-sm text-[#05324f] leading-relaxed">
											{devMagicLinkUrl
												? (t('auth.signin.magic_link_dev_body') || 'Email could not be sent. Use the button below to open your login link.')
												: (t('auth.signin.magic_link_sent_body') || 'Open the link in your email to sign in. You can close this page.')}
										</p>
									</div>
									{devMagicLinkUrl && (
										<a
											href={devMagicLinkUrl}
											className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-base font-medium text-white bg-[#34C759] hover:bg-[#2db04a] transition-all"
										>
											{t('auth.signin.magic_link_open') || 'Open login link'} <ArrowRight className="w-5 h-5" />
										</a>
									)}
									<p className="text-center text-sm text-gray-500">
										{t('upload.form.email_spam_hint') || "Can't find the email?"}{' '}
										<span className="text-[#34C759] font-semibold">
											{t('upload.form.email_spam_action') || 'Check your spam folder.'}
										</span>
									</p>
									<button
										type="button"
										onClick={() => {
											setMagicLinkSent(false)
											setDevMagicLinkUrl('')
										}}
										className="w-full text-sm font-medium text-[#05324f] hover:underline"
									>
										{t('auth.signin.magic_link_resend') || 'Send another link'}
									</button>
								</div>
							)}
						</form>
					</div>
				</div>
			</div>
			<Footer />
			<RegisterTypeModal 
				isOpen={registerModalOpen} 
				onClose={() => setRegisterModalOpen(false)} 
			/>
		</div>
	)
}
