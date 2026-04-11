import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog'

export default function WorkshopPendingPage() {
	const { t } = useTranslation()
	const { logout } = useAuth()
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

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
			{/* Immersive Background Elements */}
			<div className="absolute inset-0 z-0 pointer-events-none scale-110">
				<div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#34C759]/5 rounded-full blur-[120px] animate-pulse duration-[10000ms]"></div>
				<div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#05324f]/5 rounded-full blur-[120px] animate-pulse duration-[8000ms]"></div>
				
				{/* Grid Pattern */}
				<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#05324f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
			</div>

			<div className="max-w-2xl w-full relative z-10 text-center space-y-12 animate-fade-in-up">
				{/* Success-like Icon Branding */}
				<div className="relative inline-flex items-center justify-center">
					<div className="absolute inset-0 bg-[#34C759]/10 rounded-full blur-2xl animate-ping duration-[4000ms]"></div>
					<div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center relative overflow-hidden group">
						<div className="absolute inset-0 bg-gradient-to-tr from-[#34C759]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
						<ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-[#34C759]" strokeWidth={1.5} />
					</div>
				</div>

				<div className="space-y-6">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#05324f] leading-[1.1]">
						{t('workshop.pending.title')}
					</h1>
					<p className="text-gray-500 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
						{t('workshop.pending.message')}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
					<div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 mb-4 sm:mb-0">
						<Clock className="w-4 h-4 text-[#34C759]" />
						<span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estimated: 24-48 Hours</span>
					</div>
				</div>

				<div className="pt-4">
					<Button
						onClick={handleLogout}
						variant="ghost"
						className="group flex items-center gap-3 mx-auto text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300 px-8 py-4 rounded-xl text-base font-medium"
					>
						<LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
						{t('workshop.pending.logout')}
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
