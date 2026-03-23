import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'

export default function Auth2FAVerifyPage() {
	const { t } = useTranslation()
	const [code, setCode] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { verify2FA, user, loading } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const { tempToken, email } = location.state || {}

	useEffect(() => {
		if (!loading && user) {
			navigate('/admin', { replace: true })
		}
	}, [user, loading, navigate])

	useEffect(() => {
		if (!tempToken && !loading) {
			toast.error(t('auth.twofa.session_expired'))
			navigate('/auth/signin', { replace: true })
		}
	}, [tempToken, loading, navigate, t])

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (!tempToken || !code || code.length !== 6) {
			toast.error(t('auth.twofa.invalid_code'))
			return
		}
		setIsLoading(true)
		try {
			const result = await verify2FA(tempToken, code)
			if (result.success) {
				toast.success(t('success.login_successful'))
				navigate('/admin', { replace: true })
			} else {
				toast.error(result.message || t('auth.twofa.invalid_code'))
			}
		} catch (err) {
			toast.error(t('errors.generic_error'))
		} finally {
			setIsLoading(false)
		}
	}

	const handleCodeChange = (e) => {
		const val = e.target.value.replace(/\D/g, '').slice(0, 6)
		setCode(val)
	}

	if (loading || !tempToken) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="w-20 h-20 border-4 border-[#34C759]/20 border-t-[#34C759] rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center px-4 py-20">
				<div className="max-w-md w-full space-y-6">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-card mb-5 shadow-card" style={{ backgroundColor: '#34C759' }}>
							<Shield className="w-8 h-8 text-white" />
						</div>
						<h2 className="text-xl font-bold mb-2" style={{ color: '#05324f' }}>{t('auth.twofa.title')}</h2>
						<p className="text-gray-600 text-sm">{t('auth.twofa.subtitle')}</p>
						{email && <p className="text-gray-500 text-sm mt-1 font-medium">{email}</p>}
					</div>

					<div className="bg-white rounded-card shadow-card p-8 border border-gray-100">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">{t('auth.twofa.code_label')}</label>
								<input
									type="text"
									inputMode="numeric"
									autoComplete="one-time-code"
									value={code}
									onChange={handleCodeChange}
									placeholder="000000"
									className="block w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] bg-gray-50/50"
									autoFocus
								/>
								<p className="text-xs text-gray-500 mt-2">{t('auth.twofa.hint')}</p>
							</div>
							<button
								type="submit"
								disabled={isLoading || code.length !== 6}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								style={{ backgroundColor: '#34C759' }}
							>
								{isLoading ? (
									<>
										<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('common.loading')}
									</>
								) : (
									t('auth.signin.submit')
								)}
							</button>
						</form>
					</div>

					<div className="text-center">
						<Link
							to="/auth/signin"
							className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#05324f] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							{t('auth.twofa.back_to_login')}
						</Link>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
