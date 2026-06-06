import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getRoleHomePath } from '../utils/roleHome'

const SESSION_PREFIX = 'fixa2an-magic-link:'
const DONE_PREFIX = 'fixa2an-magic-link-done:'
const inflightVerifications = new Map()
const uiClaimedTokens = new Set()

function readCachedSession(token) {
	try {
		const raw = sessionStorage.getItem(`${SESSION_PREFIX}${token}`)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

function resolveRedirectPath(cached) {
	if (cached?.redirectTo) return cached.redirectTo
	return getRoleHomePath(cached?.user) || '/dashboard'
}

function cacheSession(token, authToken, user, redirectTo) {
	sessionStorage.setItem(
		`${SESSION_PREFIX}${token}`,
		JSON.stringify({ authToken, user, redirectTo })
	)
}

function isTokenHandled(token) {
	return sessionStorage.getItem(`${DONE_PREFIX}${token}`) === '1'
}

function markTokenHandled(token) {
	sessionStorage.setItem(`${DONE_PREFIX}${token}`, '1')
}

function claimTokenUi(token) {
	if (uiClaimedTokens.has(token) || isTokenHandled(token)) return false
	uiClaimedTokens.add(token)
	markTokenHandled(token)
	return true
}

function verifyMagicLinkOnce(token) {
	const cached = readCachedSession(token)
	if (cached?.authToken && cached?.user) {
		return Promise.resolve(cached)
	}

	if (inflightVerifications.has(token)) {
		return inflightVerifications.get(token)
	}

	const promise = authAPI.verifyMagicLink(token)
		.then((response) => {
			const result = {
				authToken: response.data.token,
				user: response.data.user,
				redirectTo: response.data.redirectTo,
			}
			cacheSession(token, result.authToken, result.user, result.redirectTo)
			return result
		})
		.finally(() => {
			inflightVerifications.delete(token)
		})

	inflightVerifications.set(token, promise)
	return promise
}

export default function MagicLinkVerifyPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { setSession } = useAuth()
	const [status, setStatus] = useState('loading')
	const token = searchParams.get('token')

	useEffect(() => {
		if (!token) {
			setStatus('error')
			return
		}

		if (isTokenHandled(token)) {
			const cached = readCachedSession(token)
			navigate(resolveRedirectPath(cached), { replace: true })
			return
		}

		let active = true

		verifyMagicLinkOnce(token)
			.then(async ({ authToken, user, redirectTo }) => {
				if (!active) return
				const destination = redirectTo || getRoleHomePath(user) || '/dashboard'
				if (!claimTokenUi(token)) {
					navigate(destination, { replace: true })
					return
				}

				await setSession(authToken, user)
				toast.success(t('success.login_successful') || 'Login successful')
				navigate(destination, { replace: true })
			})
			.catch((error) => {
				if (!active || isTokenHandled(token)) return

				console.error('Magic link verify error:', error)
				setStatus('error')
				const message = error.response?.data?.message || t('errors.generic_error')
				toast.error(message)
				if (error.response?.data?.requiresSignIn) {
					setTimeout(() => navigate('/auth/signin', { replace: true }), 1500)
				}
			})

		return () => {
			active = false
		}
	}, [token, setSession, navigate, t])

	return (
		<div className="list-page-shell bg-white">
			<Navbar />
			<div className="list-page-main list-page-main--center">
				<div className="max-w-md w-full text-center space-y-4">
					{status === 'loading' && (
						<>
							<div className="w-16 h-16 border-4 border-[#38BC54]/20 border-t-[#38BC54] rounded-full animate-spin mx-auto" />
							<p className="text-[#05324f] font-semibold">
								{t('upload.form.verifying_link') || 'Verifying your link...'}
							</p>
						</>
					)}
					{status === 'error' && (
						<>
							<p className="text-[#05324f] font-semibold text-lg">
								{t('upload.form.link_invalid_title') || 'This link is invalid or has expired'}
							</p>
							<p className="text-gray-500 text-sm">
								{t('upload.form.link_invalid_subtitle') || 'Go back to the upload page and request a new login link.'}
							</p>
							<button
								type="button"
								onClick={() => navigate('/upload')}
								className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#38BC54] px-5 py-3 text-white font-semibold hover:bg-[#2eb34f] transition-colors"
							>
								{t('upload.form.back_to_upload') || 'Back to upload'}
							</button>
						</>
					)}
				</div>
			</div>
			<Footer />
		</div>
	)
}
