import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'

export default function SignUpPage() {
	const { t } = useTranslation()
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
		address: '',
		city: '',
		postalCode: '',
	})
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [fieldErrors, setFieldErrors] = useState({})
	const { register, user, loading } = useAuth()
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
		setIsLoading(true)
		setFieldErrors({})

		if (formData.password !== formData.confirmPassword) {
			setFieldErrors({ confirmPassword: t('errors.password_mismatch') })
			toast.error(t('errors.password_mismatch'))
			setIsLoading(false)
			return
		}

		try {
			const result = await register({
				name: formData.name,
				email: formData.email,
				password: formData.password,
				phone: formData.phone,
				address: formData.address,
				city: formData.city,
				postalCode: formData.postalCode,
				role: 'CUSTOMER',
			})

			if (result.success) {
				toast.success(t('success.registration_sent'))
				navigate('/auth/verify-email', { state: { email: formData.email.trim().toLowerCase() } })
			} else {
				if (result.errors) {
					setFieldErrors(result.errors)
					const firstError = Object.values(result.errors)[0]
					if (firstError) {
						toast.error(firstError)
					}
				} else {
					toast.error(result.message || t('errors.registration_failed'))
				}
			}
		} catch (error) {
			toast.error(t('errors.generic_error'))
		} finally {
			setIsLoading(false)
		}
	}

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
		// Clear error for this field when user starts typing
		if (fieldErrors[e.target.name]) {
			setFieldErrors({
				...fieldErrors,
				[e.target.name]: '',
			})
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
	<div className="min-h-screen bg-gray-50 flex flex-col">
		<Navbar />
		<div className="flex-1 flex items-center justify-center px-4 py-20">
			<div className="max-w-2xl w-full space-y-8 animate-fade-in-up">
				<div className="text-center">
					<h2 className="text-xl font-bold mb-2" style={{ color: '#05324f' }}>{t('auth.signup.title')}</h2>
						<p style={{ color: '#05324f' }}>
							{t('auth.signup.subtitle')}{' '}
							<Link to="/auth/signin" className="font-semibold hover:opacity-80 transition-colors underline-offset-4 hover:underline" style={{ color: '#05324f' }}>
								{t('navigation.login')}
							</Link>
						</p>
						<p className="mt-3 text-sm" style={{ color: '#05324f' }}>
							{t('auth.signup.workshop_signup_text')}{' '}
							<Link to="/workshop/signup" className="font-semibold hover:opacity-80 transition-colors underline-offset-4 hover:underline" style={{ color: '#05324f' }}>
								{t('auth.signup.workshop_signup_link')}
							</Link>
						</p>
					</div>

					<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-200/50">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<Label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4 text-gray-500" />
											{t('auth.signup.name')}
										</div>
									</Label>
									<Input
										id="name"
										name="name"
										type="text"
										value={formData.name}
										onChange={handleChange}
										placeholder={t('auth.signup.name')}
									/>
									{fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
								</div>

								<div>
									<Label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-gray-500" />
											{t('auth.signup.email')} *
										</div>
									</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={formData.email}
										onChange={handleChange}
										required
										placeholder={t('auth.signup.email')}
									/>
									{fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<Label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.password')} *
										</div>
									</Label>
									<div className="relative">
										<Input
											id="password"
											name="password"
											type={showPassword ? 'text' : 'password'}
											value={formData.password}
											onChange={handleChange}
											required
											className="pr-12"
											placeholder={t('auth.signup.password')}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
									{fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
								</div>

								<div>
									<Label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.confirm_password')} *
										</div>
									</Label>
									<div className="relative">
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type={showConfirmPassword ? 'text' : 'password'}
											value={formData.confirmPassword}
											onChange={handleChange}
											required
											className="pr-12"
											placeholder={t('auth.signup.confirm_password')}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
									{fieldErrors.confirmPassword && (
										<p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
									)}
								</div>
							</div>

							<div>
								<Label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Phone className="w-4 h-4 text-gray-500" />
										{t('auth.signup.phone')}
									</div>
								</Label>
								<Input
									id="phone"
									name="phone"
									type="tel"
									value={formData.phone}
									onChange={handleChange}
									placeholder={t('auth.signup.phone')}
								/>
							</div>

							<div>
								<Label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<MapPin className="w-4 h-4 text-gray-500" />
										{t('auth.signup.address')}
									</div>
								</Label>
								<Input
									id="address"
									name="address"
									type="text"
									value={formData.address}
									onChange={handleChange}
									placeholder={t('auth.signup.address')}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Building2 className="w-4 h-4 text-gray-500" />
											{t('auth.signup.city')}
										</div>
									</Label>
									<Input
										id="city"
										name="city"
										type="text"
										value={formData.city}
										onChange={handleChange}
										placeholder={t('auth.signup.city')}
									/>
								</div>
								<div>
									<Label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4 text-gray-500" />
											{t('auth.signup.postal_code')}
										</div>
									</Label>
									<Input
										id="postalCode"
										name="postalCode"
										type="text"
										value={formData.postalCode}
										onChange={handleChange}
										placeholder={t('auth.signup.postal_code')}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-normal text-white focus:outline-none focus:ring-4 disabled:opacity-50 transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
								style={{ 
									backgroundColor: '#34C759',
									backgroundImage: 'none',
								}}
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
										{t('auth.signup.submitting')}
									</>
								) : (
									<>
										{t('auth.signup.submit')}
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
