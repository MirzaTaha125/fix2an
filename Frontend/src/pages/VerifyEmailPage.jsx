import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../services/api'

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
	const { t } = useTranslation()
	const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
	const [isLoading, setIsLoading] = useState(false)
	const inputRefs = useRef([])
	const navigate = useNavigate()
	const location = useLocation()
	const email = location.state?.email || ''

	useEffect(() => {
		if (!email) {
			toast.error(t('auth.verify_email.no_email'))
			navigate('/auth/signup', { replace: true })
		}
	}, [email, navigate, t])

	const handleChange = (index, value) => {
		if (value.length > 1) {
			const pasted = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('')
			const newDigits = [...digits]
			pasted.forEach((d, i) => {
				if (index + i < CODE_LENGTH) newDigits[index + i] = d
			})
			setDigits(newDigits)
			const next = Math.min(index + pasted.length, CODE_LENGTH - 1)
			inputRefs.current[next]?.focus()
			return
		}
		const d = value.replace(/\D/g, '')
		if (d.length > 1) return
		const newDigits = [...digits]
		newDigits[index] = d
		setDigits(newDigits)
		if (d && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus()
	}

	const handleKeyDown = (index, e) => {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus()
		}
	}

	const code = digits.join('')

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (code.length !== CODE_LENGTH) {
			toast.error(t('auth.verify_email.enter_full_code'))
			return
		}
		setIsLoading(true)
		try {
			await authAPI.verifyEmail({ email, code })
			toast.success(t('auth.verify_email.success'))
			navigate('/auth/signin', { replace: true })
		} catch (err) {
			toast.error(err.response?.data?.message || t('auth.verify_email.invalid_code'))
		} finally {
			setIsLoading(false)
		}
	}

	if (!email) return null

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />
			<div className="flex-1 flex items-center justify-center px-4 py-20">
				<div className="max-w-md w-full space-y-6">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-card mb-5 shadow-card" style={{ backgroundColor: '#34C759' }}>
							<Mail className="w-8 h-8 text-white" />
						</div>
						<h2 className="text-h2 font-bold mb-2" style={{ color: '#05324f' }}>{t('auth.verify_email.title')}</h2>
						<p className="text-gray-600 text-sm">{t('auth.verify_email.subtitle')}</p>
						<p className="text-gray-700 font-medium mt-2">{email}</p>
					</div>

					<div className="bg-white rounded-card shadow-card p-8 border border-gray-100">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="flex justify-center gap-2 sm:gap-3">
								{Array.from({ length: CODE_LENGTH }).map((_, i) => (
									<input
										key={i}
										ref={(el) => (inputRefs.current[i] = el)}
										type="text"
										inputMode="numeric"
										maxLength={6}
										value={digits[i]}
										onChange={(e) => handleChange(i, e.target.value)}
										onKeyDown={(e) => handleKeyDown(i, e)}
										className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759]"
									/>
								))}
							</div>
							<p className="text-xs text-gray-500 text-center">{t('auth.verify_email.hint')}</p>
							<button
								type="submit"
								disabled={isLoading || code.length !== CODE_LENGTH}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								style={{ backgroundColor: '#34C759' }}
							>
								{isLoading ? t('common.loading') : t('auth.verify_email.submit')}
							</button>
						</form>
					</div>

					<div className="text-center">
						<Link
							to="/auth/signin"
							className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#05324f] transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							{t('auth.verify_email.back_to_login')}
						</Link>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
