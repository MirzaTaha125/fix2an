import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { useAuth } from '../context/AuthContext'
import { workshopAPI } from '../services/api'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog'

const PREFS_KEY = 'fixa2an-workshop-prefs'

const DEFAULT_PREFS = {
	newCases: true,
	messages: true,
	bookings: true,
	reviews: false,
	payouts: true,
	receipts: true,
}

export default function WorkshopSettingsPage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { logout } = useAuth()
	const [profile, setProfile] = useState(null)
	const [prefs, setPrefs] = useState(DEFAULT_PREFS)
	const [tab, setTab] = useState('account')
	const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

	useEffect(() => {
		workshopAPI.getProfile().then((response) => setProfile(response.data || null)).catch(() => {})
		try {
			const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
			setPrefs({ ...DEFAULT_PREFS, ...saved })
		} catch {
			setPrefs(DEFAULT_PREFS)
		}
	}, [])

	const toggle = (key) => {
		setPrefs((prev) => {
			const next = { ...prev, [key]: !prev[key] }
			localStorage.setItem(PREFS_KEY, JSON.stringify(next))
			return next
		})
	}

	const user = profile?.user
	const workshop = profile?.workshop

	return (
		<WorkshopShell>
			<div className="list-page-shell bg-transparent">
				<div className="list-page-content !max-w-none">
					<h1 className="page-title !mb-2">{t('workshop.panel.settings_title')}</h1>
					<div className="flex w-full border-b border-gray-200 mt-5 mb-2">
						{[
							['account', t('workshop.panel.settings.account')],
							['notifications', t('workshop.panel.settings.notifications')],
							['payment', t('workshop.panel.settings.payment')],
							['integrations', t('workshop.panel.settings.integrations')],
						].map(([key, label]) => (
							<button
								key={key}
								type="button"
								onClick={() => setTab(key)}
								className={`flex-1 min-w-0 pb-3 text-sm font-semibold text-center border-b-2 -mb-px truncate ${tab === key ? 'text-[#008037] border-[#008037]' : 'text-[#9CA3AF] border-transparent'}`}
							>
								{label}
							</button>
						))}
					</div>
					<div className="max-w-xl">
						{tab === 'account' && (
							<div>
								<Row label={t('workshop.panel.contact')} value={user?.name} action={<Link to="/workshop/profile?view=info" className="text-[#008037] text-xs font-semibold">{t('workshop.panel.change')}</Link>} />
								<Row label={t('my_cases.email')} value={user?.email || workshop?.email} />
								<Row label={t('my_cases.phone')} value={user?.phone || workshop?.phone} />
								<button
									type="button"
									onClick={() => setLogoutConfirmOpen(true)}
									className="mt-8 w-full min-h-[48px] rounded-lg border border-[#008037] text-[#008037] text-sm font-semibold inline-flex items-center justify-center gap-2"
								>
									<LogOut className="w-4 h-4" strokeWidth={2} />
									{t('workshop.panel.nav.logout')}
								</button>
							</div>
						)}
						{tab === 'notifications' && (
							<div>
								<Toggle label={t('workshop.panel.prefs.new_cases')} on={prefs.newCases} onClick={() => toggle('newCases')} />
								<Toggle label={t('workshop.panel.prefs.messages')} on={prefs.messages} onClick={() => toggle('messages')} />
								<Toggle label={t('workshop.panel.prefs.bookings')} on={prefs.bookings} onClick={() => toggle('bookings')} />
								<Toggle label={t('workshop.panel.prefs.reviews')} on={prefs.reviews} onClick={() => toggle('reviews')} />
							</div>
						)}
						{tab === 'payment' && (
							<div>
								<Toggle label={t('workshop.panel.prefs.payouts')} on={prefs.payouts} onClick={() => toggle('payouts')} />
								<Toggle label={t('workshop.panel.prefs.receipts')} on={prefs.receipts} onClick={() => toggle('receipts')} />
							</div>
						)}
						{tab === 'integrations' && (
							<p className="text-sm text-[#6B7280] py-5">{t('workshop.panel.integrations_body')}</p>
						)}
					</div>
				</div>
			</div>

			<Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('navigation.logout_confirm_title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('navigation.logout_confirm_desc')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setLogoutConfirmOpen(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={() => {
								setLogoutConfirmOpen(false)
								logout()
								navigate('/workshop/login', { replace: true })
							}}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95"
						>
							{t('navigation.logout') || 'Log Out'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</WorkshopShell>
	)
}

function Row({ label, value, action }) {
	return (
		<div className="flex items-center justify-between gap-3 py-4 border-b border-[#F3F4F6]">
			<div>
				<p className="text-xs text-gray-400">{label}</p>
				<p className="text-sm font-semibold text-[#0B2540]">{value || '—'}</p>
			</div>
			{action}
		</div>
	)
}

function Toggle({ label, on, onClick }) {
	return (
		<button type="button" onClick={onClick} className="w-full flex items-center justify-between gap-3 py-4 border-b border-[#F3F4F6] text-left">
			<span className="text-sm font-medium text-[#0B2540]">{label}</span>
			<span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-[#008037]' : 'bg-gray-200'}`}>
				<span className={`block w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
			</span>
		</button>
	)
}
