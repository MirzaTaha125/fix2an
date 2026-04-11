import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle, LogOut, RefreshCw, Mail } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function WorkshopRejectedPage() {
	const { t } = useTranslation()
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

	const handleLogout = () => {
		setIsLogoutConfirmOpen(true)
	}

	const confirmLogout = () => {
		setIsLogoutConfirmOpen(false)
		logout()
		navigate('/auth/signin')
	}

	const handleContactSupport = () => {
		window.location.href = 'mailto:support@fixa2an.se'
	}

	const handleReApply = async () => {
		try {
			await authAPI.deleteAccount()
			logout()
			toast.success(t('workshop.rejected.account_reset') || 'Account reset. You can now register again.')
			navigate('/workshop/signup', { replace: true })
		} catch (error) {
			console.error('Re-apply error:', error)
			toast.error(t('errors.generic_error'))
		}
	}

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
			{/* Immersive Background Elements */}
			<div className="absolute inset-0 z-0 pointer-events-none scale-110">
				<div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-500/5 rounded-full blur-[120px]"></div>
				<div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#05324f]/5 rounded-full blur-[120px]"></div>
				<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#05324f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
			</div>

			<div className="max-w-2xl w-full relative z-10 text-center space-y-10 animate-fade-in-up">
				{/* Rejection Icon */}
				<div className="relative inline-flex items-center justify-center">
					<div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl"></div>
					<div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border border-red-50 shadow-xl flex items-center justify-center relative overflow-hidden">
						<XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" strokeWidth={1.5} />
					</div>
				</div>

				<div className="space-y-6">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#05324f] leading-[1.1]">
						{t('workshop.rejected.title') || 'Application Rejected'}
					</h1>
					<p className="text-gray-500 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
						{t('workshop.rejected.message') || 'Unfortunately, your workshop registration has been rejected by our administrators.'}
					</p>
				</div>

				{/* Rejection Reason Box */}
				{user?.workshop?.rejectionReason && (
					<div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 max-w-lg mx-auto text-left relative overflow-hidden">
						<div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
						<h3 className="text-red-900 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
							Reason for Rejection
						</h3>
						<p className="text-red-800 text-lg leading-relaxed italic">
							"{user.workshop.rejectionReason}"
						</p>
					</div>
				)}

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
					<Button
						onClick={handleReApply}
						className="w-full sm:w-auto bg-[#34C759] hover:bg-[#2eb34f] text-white px-8 py-7 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-[#34C759]/20 transition-all hover:scale-[1.02]"
					>
						<RefreshCw className="w-5 h-5" />
						{t('workshop.rejected.reapply') || 'Re-apply Now'}
					</Button>
					
					<Button
						onClick={handleContactSupport}
						variant="outline"
						className="w-full sm:w-auto border-gray-200 text-gray-600 px-8 py-7 rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-50 transition-all"
					>
						<Mail className="w-5 h-5" />
						{t('common.contact_support') || 'Contact Support'}
					</Button>
				</div>

				<div className="pt-4">
					<Button
						onClick={handleLogout}
						variant="ghost"
						className="group flex items-center gap-3 mx-auto text-gray-400 hover:text-[#05324f] transition-all duration-300 px-8 py-4 rounded-xl text-base font-medium"
					>
						<LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
						{t('common.logout')}
					</Button>
				</div>
			</div>

			{/* Logout Confirmation Modal */}
			<Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
				<DialogContent className="max-w-[400px] w-[90%] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
					<DialogHeader className="text-left items-start">
						<DialogTitle className="text-2xl font-black text-[#05324f] leading-tight mb-2">
							{t('navigation.logout_confirm_title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-base leading-relaxed">
							{t('navigation.logout_confirm_desc')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
						<Button
							variant="outline"
							onClick={() => setIsLogoutConfirmOpen(false)}
							className="flex-1 h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={confirmLogout}
							className="flex-1 h-11 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold transition-all shadow-md active:scale-95"
						>
							{t('navigation.logout') || 'Log Out'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
