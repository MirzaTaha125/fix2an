import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, KeyRound, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

export default function ForgotPasswordPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [step, setStep] = useState(1) // 1: Email, 2: Code, 3: New Password
	const [isLoading, setIsLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [code, setCode] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	const requestResetCode = async (e) => {
		e.preventDefault()
		const trimmedEmail = email.trim()
		if (!trimmedEmail) {
			toast.error(t('auth.signin.email', 'Email is required'))
			return
		}
		setIsLoading(true)
		try {
			const { data } = await api.post('/api/auth/forgot-password', { email: trimmedEmail })
			toast.success(data.message || t('auth.forgot_password.code_sent', 'If an account exists, a code was sent.'))
			setStep(2)
		} catch (error) {
			console.error('Forgot password error:', error)
			toast.success(t('auth.forgot_password.code_sent', 'If an account exists, a code was sent.')) // Don't leak user existence
			setStep(2)
		} finally {
			setIsLoading(false)
		}
	}

	const verifyResetCode = async (e) => {
		e.preventDefault()
		const trimmedCode = code.trim()
		if (!trimmedCode || trimmedCode.length !== 6) {
			toast.error(t('auth.verify.code', 'Valid 6-digit code is required'))
			return
		}
		setIsLoading(true)
		try {
			await api.post('/api/auth/verify-reset-code', { email: email.trim(), code: trimmedCode })
			toast.success(t('auth.forgot_password.code_verified', 'Code verified. Please set a new password.'))
			setStep(3)
		} catch (error) {
			console.error('Verify code error:', error)
			toast.error(error.response?.data?.message || t('errors.generic_error', 'Invalid code or expired'))
		} finally {
			setIsLoading(false)
		}
	}

	const resetPassword = async (e) => {
		e.preventDefault()
		if (!newPassword || newPassword.length < 8) {
			toast.error(t('auth.signup.password_length', 'Password must be at least 8 characters long'))
			return
		}
		if (newPassword !== confirmPassword) {
			toast.error(t('auth.signup.password_mismatch', 'Passwords do not match'))
			return
		}
		setIsLoading(true)
		try {
			const { data } = await api.post('/api/auth/reset-password', {
				email: email.trim(),
				code: code.trim(),
				newPassword,
			})
			toast.success(data.message || t('auth.forgot_password.success', 'Password reset successfully'))
			navigate('/auth/signin', { replace: true })
		} catch (error) {
			console.error('Reset password error:', error)
			toast.error(error.response?.data?.message || t('errors.generic_error', 'Something went wrong'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
			<Navbar />
			<div className="flex-1 flex items-center justify-center px-4 py-20 relative z-10">
				<div className="max-w-md w-full space-y-8 animate-fade-in-up">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-card mb-5 shadow-card" style={{ backgroundColor: '#34C759' }}>
							<KeyRound className="w-8 h-8 text-white" />
						</div>
						<h2 className="text-h2 font-bold mb-2" style={{ color: '#05324f' }}>
							{t('auth.forgot_password.title', 'Reset Password')}
						</h2>
						<p style={{ color: '#05324f' }}>
							{step === 1 && t('auth.forgot_password.subtitle_1', "Enter your email address and we'll send you a recovery code.")}
							{step === 2 && t('auth.forgot_password.subtitle_2', 'Enter the 6-digit code sent to your email.')}
							{step === 3 && t('auth.forgot_password.subtitle_3', 'Enter your new password below.')}
						</p>
					</div>

					<div className="bg-white rounded-card shadow-card p-8 border border-gray-100" style={{ position: 'relative', zIndex: 1 }}>
						{step === 1 && (
							<form onSubmit={requestResetCode} className="space-y-6" noValidate>
								<div>
									<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-gray-500" />
											{t('auth.signin.email', 'Email Address')}
										</div>
									</label>
									<input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all bg-gray-50/50 hover:bg-white"
										placeholder="name@example.com"
									/>
								</div>
								<button
									type="submit"
									disabled={isLoading}
									style={{
										cursor: isLoading ? 'not-allowed' : 'pointer',
										zIndex: 10,
										position: 'relative',
										backgroundColor: '#34C759',
									}}
									className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
									onMouseEnter={(e) => (e.target.style.backgroundColor = '#2db04a')}
									onMouseLeave={(e) => (e.target.style.backgroundColor = '#34C759')}
								>
									{isLoading ? (
										<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
									) : (
										<>
											{t('auth.forgot_password.send_code', 'Send Code')}
											<ArrowRight className="w-5 h-5" />
										</>
									)}
								</button>
							</form>
						)}

						{step === 2 && (
							<form onSubmit={verifyResetCode} className="space-y-6" noValidate>
								<div>
									<label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
										{t('auth.verify.code', 'Verification Code')}
									</label>
									<input
										id="code"
										type="text"
										maxLength="6"
										value={code}
										onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
										className="mt-1 block w-full text-center tracking-widest text-2xl px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all bg-gray-50/50 hover:bg-white"
										placeholder="000000"
										required
									/>
								</div>
								<button
									type="submit"
									disabled={isLoading || code.length !== 6}
									style={{ backgroundColor: '#34C759' }}
									className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
									onMouseEnter={(e) => (e.target.style.backgroundColor = '#2db04a')}
									onMouseLeave={(e) => (e.target.style.backgroundColor = '#34C759')}
								>
									{isLoading ? (
										<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
									) : (
										t('auth.verify.submit', 'Verify Code')
									)}
								</button>
								<div className="text-center">
									<button
										type="button"
										onClick={() => setStep(1)}
										className="text-sm font-medium text-gray-500 hover:text-[#05324f] hover:underline transition-colors"
									>
										{t('auth.forgot_password.back_to_email', 'Try another email')}
									</button>
								</div>
							</form>
						)}

						{step === 3 && (
							<form onSubmit={resetPassword} className="space-y-6" noValidate>
								<div>
									<label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.password_label', 'New Password')}
										</div>
									</label>
									<div className="relative">
										<input
											id="newPassword"
											type={showPassword ? 'text' : 'password'}
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											required
											className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all pr-12 bg-gray-50/50 hover:bg-white"
											placeholder="••••••••"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
								</div>

								<div>
									<label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.confirm_password', 'Confirm New Password')}
										</div>
									</label>
									<div className="relative">
										<input
											id="confirmPassword"
											type={showConfirmPassword ? 'text' : 'password'}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											required
											className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all pr-12 bg-gray-50/50 hover:bg-white"
											placeholder="••••••••"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									style={{ backgroundColor: '#34C759' }}
									className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
									onMouseEnter={(e) => (e.target.style.backgroundColor = '#2db04a')}
									onMouseLeave={(e) => (e.target.style.backgroundColor = '#34C759')}
								>
									{isLoading ? (
										<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
									) : (
										t('auth.forgot_password.set_password', 'Update Password')
									)}
								</button>
							</form>
						)}
					</div>
					
					<div className="text-center" style={{ position: 'relative', zIndex: 1 }}>
						<Link to="/auth/signin" className="text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#05324f' }}>
							{t('auth.forgot_password.back_to_login', '← Back to Sign In')}
						</Link>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
