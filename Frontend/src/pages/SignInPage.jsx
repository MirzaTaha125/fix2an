import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'

export default function SignInPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login, user, loading } = useAuth()
	const navigate = useNavigate()

	// Redirect if already logged in
	useEffect(() => {
		if (!loading && user) {
			const role = user.role?.toUpperCase()
			if (role === 'ADMIN') {
				navigate('/admin', { replace: true })
			} else if (role === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
			} else {
				navigate('/my-cases', { replace: true })
			}
		}
	}, [user, loading, navigate])

	const handleSubmit = async (e) => {
		e.preventDefault()
		e.stopPropagation()
		
		// Trim email and password
		const trimmedEmail = email.trim()
		const trimmedPassword = password.trim()
		
		if (!trimmedEmail || !trimmedPassword) {
			toast.error(t('errors.fill_all_fields'))
			return
		}
		
		setIsLoading(true)

		try {
			const result = await login(trimmedEmail, trimmedPassword)
			
			if (result.success) {
				toast.success(t('success.login_successful'))
				const role = result.user?.role?.toUpperCase()
				if (role === 'ADMIN') navigate('/admin')
				else if (role === 'WORKSHOP') navigate('/workshop/requests')
				else navigate('/my-cases')
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
	<div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
		<Navbar />
		<div className="flex-1 flex items-center justify-center px-4 py-20 relative z-10">
			<div className="max-w-md w-full space-y-8 animate-fade-in-up">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-card mb-5 shadow-card" style={{ backgroundColor: '#34C759' }}>
						<LogIn className="w-8 h-8 text-white" />
					</div>
					<h2 className="text-h2 font-bold mb-2" style={{ color: '#05324f' }}>{t('auth.signin.title')}</h2>
						<p style={{ color: '#05324f' }}>
							{t('auth.signin.subtitle')}{' '}
							<Link to="/auth/signup" className="font-semibold hover:opacity-80 transition-colors underline-offset-4 hover:underline" style={{ color: '#05324f' }}>
								{t('navigation.register')}
							</Link>
						</p>
					</div>

					<div className="bg-white rounded-card shadow-card p-8 border border-gray-100" style={{ position: 'relative', zIndex: 1 }}>
						<form 
							onSubmit={handleSubmit} 
							className="space-y-6"
							noValidate
						>
							<div>
								<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Mail className="w-4 h-4 text-gray-500" />
										{t('auth.signin.email')}
									</div>
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all bg-gray-50/50 hover:bg-white"
									placeholder={t('auth.signin.email')}
								/>
							</div>
							<div>
								<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Lock className="w-4 h-4 text-gray-500" />
										{t('auth.signin.password')}
									</div>
								</label>
								<div className="relative">
									<input
										id="password"
										type={showPassword ? 'text' : 'password'}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] transition-all pr-12 bg-gray-50/50 hover:bg-white"
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
								className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
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
										<LogIn className="w-5 h-5" />
										{t('auth.signin.submit')}
									</>
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
