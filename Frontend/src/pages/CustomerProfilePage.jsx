import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PhoneInput } from '../components/ui/PhoneInput'
import { Label } from '../components/ui/Label'
import { ProfileMenuSkeleton, Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import VehicleImage from '../components/VehicleImage'
import toast from 'react-hot-toast'
import { formatPrice, formatCompactNumber } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '../components/ui/Dialog'
import {
	Car,
	User,
	Mail,
	Phone,
	MapPin,
	Edit,
	Save,
	X,
	FileText,
	CheckCircle,
	Clock,
	XCircle,
	Calendar,
	DollarSign,
	Star,
	Camera,
	ChevronRight,
	HelpCircle,
	LogOut,
	Trash2,
	Lock,
	Eye,
	EyeOff,
	Bell,
	Globe,
	MessageCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import Navbar from '../components/Navbar'
import StatCard from '../components/ui/StatCard'

import { authAPI, requestsAPI, bookingsAPI, uploadAPI, getAuthToken } from '../services/api'
import { getFullUrl, toStorageUrl } from '../config/api.js'
import { formatSwedishPhone } from '../utils/swedishPhone'
import { FaqPanel, ContactPanel, PolicyPanel } from './HelpSupportPage'
import { LegalContent } from './LegalPage'

export default function CustomerProfilePage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading, fetchUser, logout } = useAuth()
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [languageOpen, setLanguageOpen] = useState(false)
	const [notificationsOpen, setNotificationsOpen] = useState(false)
	const [carsOpen, setCarsOpen] = useState(false)
	const [supportView, setSupportView] = useState(null)
	const [cars, setCars] = useState([])
	const [carsLoading, setCarsLoading] = useState(false)
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showInfoOnMobile, setShowInfoOnMobile] = useState(false)
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeRequests: 0,
		completedBookings: 0,
		cancelledBookings: 0,
		totalSpend: 0,
	})
	const [profileData, setProfileData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		postalCode: '',
		image: '',
	})
	const [originalProfileData, setOriginalProfileData] = useState({})
	const [hasPassword, setHasPassword] = useState(false)
	const [isSavingPassword, setIsSavingPassword] = useState(false)
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else if (user.role === 'WORKSHOP') {
					navigate('/workshop/profile', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchData = async () => {
		if (!user || user.role !== 'CUSTOMER') return

		try {
			// Fetch user profile
			const userResponse = await authAPI.getMe()
			if (userResponse.data) {
				const userData = userResponse.data
				let imageUrl = userData?.image || ''
				
				// Convert relative URL to absolute URL if needed
				if (imageUrl) {
					imageUrl = getFullUrl(imageUrl)
				}
				
				const profile = {
					name: userData?.name || '',
					email: userData?.email || '',
					phone: formatSwedishPhone(userData?.phone || ''),
					address: userData?.address || '',
					city: userData?.city || '',
					postalCode: userData?.postalCode || '',
					image: imageUrl,
				}
				setProfileData(profile)
				setOriginalProfileData(profile)
				setHasPassword(Boolean(userData?.hasPassword))
			}

			// Fetch customer stats
			const userId = user._id || user.id
			
			// Fetch requests
			const requestsResponse = await requestsAPI.getByCustomer(userId)
			const requests = requestsResponse.data || []
			
			// Fetch bookings
			const bookingsResponse = await bookingsAPI.getByCustomer(userId)
			const bookings = bookingsResponse.data || []

			// Calculate stats
			const totalRequests = requests.length
			const activeRequests = requests.filter(r => r.status === 'NEW' || r.status === 'IN_BIDDING' || r.status === 'ACCEPTED').length
			const completedBookings = bookings.filter(b => b.status === 'DONE').length
			const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length
			const totalSpend = bookings
				.filter(b => b.status === 'DONE')
				.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)

			setStats({
				totalRequests,
				activeRequests,
				completedBookings,
				cancelledBookings,
				totalSpend,
			})
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('profile.fetch_error') || 'Failed to fetch profile data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'CUSTOMER') {
			fetchData()
		}
	}, [user])

	useEffect(() => {
		const isInfoView = searchParams.get('view') === 'info'
		setShowInfoOnMobile(isInfoView)
		if (isInfoView) setIsEditing(true)
	}, [searchParams])

	const openProfileInfo = () => {
		setCarsOpen(false)
		setSupportView(null)
		setShowInfoOnMobile(true)
		setIsEditing(true)
		setSearchParams({ view: 'info' })
		setTimeout(() => {
			const el = document.getElementById('customer-profile-form')
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 50)
	}

	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleCancel = () => {
		setProfileData(originalProfileData)
		setIsEditing(false)
	}

	const closeProfileInfo = () => {
		handleCancel()
		setShowInfoOnMobile(false)
		setSearchParams({})
	}

	const closeCars = () => {
		setCarsOpen(false)
	}

	const openSupportView = (view) => {
		setCarsOpen(false)
		setShowInfoOnMobile(false)
		setIsEditing(false)
		setSearchParams({})
		setSupportView(view)
	}

	const closeSupportView = () => {
		setSupportView(null)
	}

	const handleProfileBack = () => {
		if (supportView === 'privacy' || supportView === 'terms' || supportView === 'cookies') {
			setSupportView('policy')
			return
		}
		if (supportView) {
			closeSupportView()
			return
		}
		if (carsOpen) {
			closeCars()
			return
		}
		closeProfileInfo()
	}

	useRegisterMobileBack(handleProfileBack, showInfoOnMobile || carsOpen || Boolean(supportView))

	const handlePasswordInputChange = (field, value) => {
		setPasswordData((prev) => ({ ...prev, [field]: value }))
	}

	const ensureAuthenticated = () => {
		if (!getAuthToken()) {
			toast.error(t('errors.session_expired') || t('auth.session_expired') || 'Your session has expired. Please sign in again.')
			navigate('/auth/signin', { replace: true })
			return false
		}
		return true
	}

	const handleSavePassword = async () => {
		if (!ensureAuthenticated()) return
		if (passwordData.newPassword.length < 8) {
			toast.error(t('profile.password_min_length') || 'Password must be at least 8 characters')
			return
		}
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error(t('errors.password_mismatch') || 'Passwords do not match')
			return
		}
		if (hasPassword && !passwordData.currentPassword) {
			toast.error(t('profile.current_password_required') || 'Current password is required')
			return
		}

		setIsSavingPassword(true)
		const isCreatingPassword = !hasPassword
		try {
			const payload = { newPassword: passwordData.newPassword }
			if (hasPassword) payload.currentPassword = passwordData.currentPassword

			await authAPI.updatePassword(payload)
			setHasPassword(true)
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
			toast.success(
				isCreatingPassword
					? (t('profile.password_create_success') || 'Password created successfully')
					: (t('profile.password_update_success') || 'Password updated successfully')
			)
			if (fetchUser) await fetchUser()
		} catch (error) {
			console.error('Failed to update password:', error)
			toast.error(error.response?.data?.message || t('profile.password_update_error') || 'Failed to update password')
		} finally {
			setIsSavingPassword(false)
		}
	}

	const handleSave = async () => {
		if (!ensureAuthenticated()) return

		const userId = String(user._id || user.id || '')
		if (!userId) {
			toast.error(t('errors.generic_error') || 'Something went wrong')
			return
		}

		const trimmedEmail = profileData.email?.trim().toLowerCase() || ''
		if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
			return
		}

		setIsSaving(true)
		try {
			await authAPI.updateProfile(userId, {
				name: profileData.name,
				email: trimmedEmail || undefined,
				phone: profileData.phone,
				address: profileData.address,
				city: profileData.city,
				postalCode: profileData.postalCode,
			})

			toast.success(t('profile.update_success') || 'Profile updated successfully')
			setOriginalProfileData(profileData)
			setIsEditing(true)
			
			// Refresh user data
			if (fetchUser) {
				await fetchUser()
			}
			
			// Refresh profile data
			await fetchData()
		} catch (error) {
			console.error('Failed to update profile:', error)
			toast.error(t('profile.update_error') || 'Failed to update profile')
		} finally {
			setIsSaving(false)
		}
	}

	const handleImageChange = async (e) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Please select a valid image file')
			return
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image size should be less than 5MB')
			return
		}

		setIsUploadingImage(true)
		try {
			const formData = new FormData()
			formData.append('file', file)

			const response = await uploadAPI.uploadFile(formData)
			let imageUrl = response.data?.fileUrl || response.data?.url || response.data?.location

			if (imageUrl) {
				const storageUrl = toStorageUrl(imageUrl)
				
				const userId = user._id || user.id
				const updateResponse = await authAPI.updateProfile(userId, { image: storageUrl })
				
				const updatedImageUrl = getFullUrl(updateResponse.data?.image || storageUrl)
				
				// Update local state immediately
				setProfileData((prev) => ({ ...prev, image: updatedImageUrl }))
				setOriginalProfileData((prev) => ({ ...prev, image: updatedImageUrl }))
				toast.success('Profile image updated successfully')
				
				// Refresh user data (this will update the user context)
				if (fetchUser) {
					await fetchUser()
				}
				
				// Refresh profile data but preserve the image we just set
				// We'll update fetchData to preserve existing image if it exists
				const currentImage = updatedImageUrl
				await fetchData()
				// Ensure image is preserved after fetch
				setProfileData((prev) => ({ ...prev, image: currentImage }))
			} else {
				toast.error('Failed to get image URL from upload response')
			}
		} catch (error) {
			console.error('Failed to upload image:', error)
			toast.error('Failed to upload image. Please try again.')
		} finally {
			setIsUploadingImage(false)
			// Reset file input
			if (e.target) {
				e.target.value = ''
			}
		}
	}

	if (authLoading || loading) {
		return (
			<div className="list-page-shell bg-[#FAFBFC]">
				<Navbar />
				<div className="list-page-main">
					<ProfileMenuSkeleton menuRows={3} />
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	const handleLogout = () => {
		setIsLogoutConfirmOpen(true)
	}

	const confirmLogout = () => {
		setIsLogoutConfirmOpen(false)
		logout()
		navigate('/auth/signin', { replace: true })
	}

	const handleDeleteAccount = () => {
		setIsDeleteConfirmOpen(true)
	}

	const confirmDeleteAccount = async () => {
		setIsDeleting(true)
		try {
			await authAPI.deleteAccount()
			setIsDeleteConfirmOpen(false)
			logout()
			toast.success(t('profile.delete_account_success') || 'Account deleted successfully')
			navigate('/', { replace: true })
		} catch (error) {
			console.error('Delete account error:', error)
			toast.error(error.response?.data?.message || t('errors.generic_error'))
		} finally {
			setIsDeleting(false)
		}
	}

	const openCars = async () => {
		setSupportView(null)
		setShowInfoOnMobile(false)
		setIsEditing(false)
		setSearchParams({})
		setCarsOpen(true)
		if (!user) return
		setCarsLoading(true)
		try {
			const response = await requestsAPI.getByCustomer(user.id || user._id)
			const seen = new Set()
			const list = []
			for (const request of response.data || []) {
				const vehicle = request.vehicleId || {}
				const registration = request.registrationNumber || ''
				const key = `${vehicle.make || ''}|${vehicle.model || ''}|${registration}`
				if (seen.has(key)) continue
				seen.add(key)
				if (!vehicle.make && !registration) continue
				list.push({
					make: vehicle.make,
					model: vehicle.model,
					year: vehicle.year,
					registration,
				})
			}
			setCars(list)
		} catch (error) {
			toast.error(error.response?.data?.message || t('errors.fetch_failed'))
		} finally {
			setCarsLoading(false)
		}
	}

	const languageLabel = i18n.language?.startsWith('sv') ? 'Svenska' : 'English'

	const menuItems = [
		{
			icon: <User className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.menu_profile') || 'Profile',
			desc: t('profile.menu_profile_desc') || 'Manage your preferences',
			onClick: openProfileInfo,
		},
		{
			icon: <Car className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.my_cars_title'),
			desc: t('profile.my_cars_desc'),
			onClick: openCars,
		},
		{
			icon: <Globe className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.language') || 'Language',
			desc: languageLabel,
			onClick: () => setLanguageOpen(true),
		},
		{
			icon: <HelpCircle className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.faq_title') || 'Frequently asked questions',
			desc: t('profile.faq_desc') || 'Answers to common questions',
			onClick: () => openSupportView('faq'),
		},
		{
			icon: <MessageCircle className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.help_contact_title') || 'Help and contact',
			desc: t('profile.help_contact_desc') || 'Send a query to support',
			onClick: () => openSupportView('contact'),
		},
		{
			icon: <FileText className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.policy_title') || 'Policy and terms',
			desc: t('profile.policy_desc') || 'Privacy, terms and cookies',
			onClick: () => openSupportView('policy'),
		},
		{
			icon: <Trash2 className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.delete_account') || 'Delete account',
			desc: t('profile.delete_account_menu_desc') || 'Delete account',
			onClick: handleDeleteAccount,
		},
	]

	const showSettingsHome = !showInfoOnMobile && !carsOpen && !supportView

	const isLegalView = supportView === 'privacy' || supportView === 'terms' || supportView === 'cookies'

	const supportTitle =
		supportView === 'faq'
			? (t('help.faq_page_title') || 'Frequently asked questions')
			: supportView === 'contact'
				? (t('help.contact_page_title') || 'Help & contact')
				: supportView === 'policy'
					? (t('help.policy_page_title') || 'Policy & terms')
					: ''

	const supportSubtitle =
		supportView === 'faq'
			? (t('help.faq_page_subtitle') || 'Answers to common questions.')
			: supportView === 'contact'
				? (t('help.contact_page_subtitle') || 'We are here if you need help.')
				: supportView === 'policy'
					? (t('help.policy_page_subtitle') || 'Important information about your data and rights.')
					: ''

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />

			<div className="list-page-main">
			{/* Settings menu — list scrolls, logout at end of list */}
			{showSettingsHome && (
				<div className="list-page-content settings-home-panel max-w-none">
					<div className="mb-5">
						<h1 className="page-title">
							{t('navigation.settings') || 'Settings'}
						</h1>
						<p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
							{t('profile.settings_page_subtitle') || 'Manage your preferences and account.'}
						</p>
					</div>

					<div className="space-y-3 mb-5">
						{menuItems.map((item) => (
							<button
								key={item.title}
								type="button"
								onClick={item.onClick}
								className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
							>
								<div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
									{item.icon}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-[15px] font-semibold text-[#05324f]">{item.title}</p>
									<p className="text-sm text-[#9CA3AF] font-medium leading-tight mt-0.5">{item.desc}</p>
								</div>
								<ChevronRight className="text-gray-300 shrink-0" size={20} />
							</button>
						))}
					</div>

					<Button
						type="button"
						onClick={handleLogout}
						className="w-full !rounded-xl lg:!min-h-[52px] gap-2 mb-2"
					>
						<LogOut className="w-5 h-5" />
						{t('profile.logout') || 'Log out'}
					</Button>
				</div>
			)}

			{supportView && (
				<div className="list-page-content max-w-none">
					{isLegalView ? (
						<LegalContent pageKey={supportView} />
					) : (
						<>
							<div className="mb-5">
								<h1 className="page-title">{supportTitle}</h1>
								<p className="text-sm text-[#6B7280] leading-relaxed">{supportSubtitle}</p>
							</div>
							{supportView === 'faq' && <FaqPanel />}
							{supportView === 'contact' && <ContactPanel />}
							{supportView === 'policy' && <PolicyPanel onSelect={setSupportView} />}
						</>
					)}
				</div>
			)}

			{/* My cars — full page (mock layout) */}
			{carsOpen && (
			<div className="list-page-content max-w-none">
				<div className="mb-5">
					<h1 className="page-title">
						{t('profile.my_cars_title')}
					</h1>
					<p className="text-sm text-[#6B7280] leading-relaxed">
						{t('profile.my_cars_desc')}
					</p>
				</div>

				<div className="space-y-3 mb-6">
					{carsLoading ? (
						<div className="space-y-3">
							{[1, 2].map((i) => (
								<div key={i} className="rounded-2xl border border-gray-100 p-4 flex gap-3">
									<Skeleton className="w-16 h-12 rounded-xl shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-40" />
										<Skeleton className="h-3 w-28" />
									</div>
								</div>
							))}
						</div>
					) : cars.length === 0 ? (
						<EmptyState
							compact
							title={t('common.empty.cars_title')}
							description={t('common.empty.cars_desc')}
							actionLabel={t('navigation.create_case')}
							actionTo="/upload"
						/>
					) : (
						cars.map((car) => {
							const title = [car.make, car.model].filter((part) => part && part !== '—').join(' ') || t('profile.my_cars_title')
							return (
								<button
									key={`${car.make}-${car.model}-${car.registration}`}
									type="button"
									onClick={() => navigate('/upload')}
									className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
								>
									<div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center overflow-hidden shrink-0">
										<VehicleImage
											make={car.make}
											model={car.model}
											year={car.year}
											width={120}
											className="w-10 h-10"
											imgClassName="rounded-full"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-body font-semibold text-[#05324f] truncate leading-snug">{title}</p>
										<p className="text-sm text-[#9CA3AF] mt-0.5 truncate">
											{car.registration || '—'}
											{car.year ? ` · ${car.year}` : ''}
										</p>
									</div>
									<ChevronRight className="text-gray-300 shrink-0" size={20} />
								</button>
							)
						})
					)}
				</div>

				<div className="rounded-2xl bg-[#E8F5EC] px-5 py-4 flex items-center gap-4">
					<div className="min-w-0 flex-1">
						<p className="text-[15px] font-bold text-[#05324f] leading-snug">
							{t('profile.why_save_cars_title') || 'Why save your cars?'}
						</p>
						<p className="text-sm text-[#374151] mt-1 leading-snug">
							{t('profile.why_save_cars_desc') || 'It makes it easier to create new cases.'}
						</p>
					</div>
					<Car className="w-10 h-10 text-[#1B8F3E] shrink-0" strokeWidth={1.5} />
				</div>
			</div>
			)}

			{showInfoOnMobile && (
			<div
				id="customer-profile-form"
				className="list-page-content max-w-none"
				style={{ scrollMarginTop: '5rem' }}
			>
				{/* Profile header with photo upload */}
				<div className="mb-6">
					<h1 className="page-title">
						{t('profile.profile_info_title') || 'Profile information'}
					</h1>
					<p className="text-sm sm:text-base text-[#6B7280] leading-relaxed mb-5">
						{t('profile.profile_info_desc') || 'Name, contact details and address'}
					</p>
					<div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 mb-5">
						<div className="relative shrink-0">
							<div className="w-14 h-14 rounded-full bg-[#F0F2F5] flex items-center justify-center overflow-hidden border border-gray-100">
								{profileData.image && profileData.image.trim() !== '' ? (
									<img
										src={profileData.image}
										alt={profileData.name || 'Profile'}
										className="w-full h-full object-cover"
										onError={(e) => {
											e.target.style.display = 'none'
											const fallback = e.target.parentElement?.querySelector('.profile-image-fallback')
											if (fallback) fallback.style.display = 'flex'
										}}
										onLoad={(e) => {
											const fallback = e.target.parentElement?.querySelector('.profile-image-fallback')
											if (fallback) fallback.style.display = 'none'
										}}
									/>
								) : null}
								<div
									className={`profile-image-fallback w-full h-full items-center justify-center ${profileData.image && profileData.image.trim() !== '' ? 'hidden' : 'flex'}`}
								>
									<User className="text-[#ACB0B4] w-7 h-7" />
								</div>
							</div>
							<button
								type="button"
								onClick={() => document.getElementById('customer-profile-form-image-input')?.click()}
								disabled={isUploadingImage}
								className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-brand-btn text-white rounded-full shadow-md transition-all disabled:opacity-50"
								title={t('profile.change_photo') || 'Change profile photo'}
							>
								{isUploadingImage ? (
									<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									<Camera className="w-3 h-3" />
								)}
							</button>
							<input
								id="customer-profile-form-image-input"
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="hidden"
							/>
						</div>
						<div className="flex-1 min-w-0 text-left">
							<h3 className="text-base font-semibold text-[#05324f] truncate">
								{profileData.name || t('profile.hi') || 'User'}
							</h3>
							{profileData.email && (
								<p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{profileData.email}</p>
							)}
						</div>
					</div>
				</div>

				<div className="hidden grid-cols-3 gap-2 sm:gap-6 mb-8">
					<StatCard
						value={stats.totalRequests}
						label={t('profile.contract_title') || t('navigation.contract') || 'Contract'}
						iconColor="#05324f"
						iconBg="bg-blue-50"
					/>

					<StatCard
						value={stats.completedBookings}
						label={t('profile.completed_cases') || 'Finished'}
						iconColor="#1B8F3E"
						iconBg="bg-green-50"
					/>

					<StatCard
						value={formatCompactNumber(stats.totalSpend)}
						label={t('profile.total_spend') || 'Spend'}
						iconColor="#05324f"
						iconBg="bg-blue-50"
					/>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<div className="lg:col-span-2">
						<Card className="bg-white border border-gray-100 shadow-sm relative overflow-hidden rounded-2xl">
							<CardHeader className="border-b border-gray-100 bg-white px-4 py-3">
								<div className="flex items-center justify-between gap-4">
									<CardTitle className="text-sm font-semibold text-[#05324f]">
										{t('profile.profile_info')}
									</CardTitle>
									
									{!isEditing ? (
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-gray-200 bg-white text-[11px] font-medium text-gray-700 hover:bg-gray-50"
										>
											<Edit className="w-3 h-3" />
											{t('profile.edit')}
										</button>
									) : (
										<div className="flex items-center gap-1.5">
											<button
												type="button"
												onClick={handleCancel}
												disabled={isSaving}
												className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
											>
												<X className="w-3 h-3" />
												{t('profile.cancel')}
											</button>
											<button
												type="button"
												onClick={handleSave}
												disabled={isSaving}
												className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-brand-btn text-[11px] font-medium text-white disabled:opacity-50"
											>
												<Save className="w-3 h-3" />
												{isSaving ? t('profile.saving') : t('profile.save')}
											</button>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent className="p-4 space-y-5">
							{/* Personal Details */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<User className="w-4 h-4 text-gray-400" />
									<h3 className="text-sm font-semibold text-[#05324f]">{t('profile.personal_details')}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-[11px] font-semibold text-gray-400">
											{t('profile.name') || 'Name'}
										</Label>
										{isEditing ? (
											<Input
												id="name"
												value={profileData.name}
												onChange={(e) => handleInputChange('name', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.name || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="text-[11px] font-semibold text-gray-400">
											{t('profile.email') || 'Email'}
										</Label>
										{isEditing ? (
											<Input
												id="email"
												type="email"
												value={profileData.email}
												onChange={(e) => handleInputChange('email', e.target.value)}
												disabled={isSaving}
												className="w-full"
												autoComplete="email"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.email || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-[11px] font-semibold text-gray-400">
											{t('profile.phone') || 'Phone'}
										</Label>
										{isEditing ? (
											<PhoneInput
												id="phone"
												value={profileData.phone}
												onChange={(e) => handleInputChange('phone', e.target.value)}
												disabled={isSaving}
												className="w-full"
												placeholder={t('profile.phone') || 'Phone number'}
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{formatSwedishPhone(profileData.phone) || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<MapPin className="w-4 h-4 text-gray-400" />
									<h3 className="text-sm font-semibold text-[#05324f]">{t('profile.address_information')}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="address" className="text-[11px] font-semibold text-gray-400">
											{t('profile.address') || 'Address'}
										</Label>
										{isEditing ? (
											<Input
												id="address"
												value={profileData.address}
												onChange={(e) => handleInputChange('address', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.address || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="city" className="text-[11px] font-semibold text-gray-400">
											{t('profile.city') || 'City'}
										</Label>
										{isEditing ? (
											<Input
												id="city"
												value={profileData.city}
												onChange={(e) => handleInputChange('city', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.city || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postalCode" className="text-[11px] font-semibold text-gray-400">
											{t('profile.postal_code') || 'Postal Code'}
										</Label>
										{isEditing ? (
											<Input
												id="postalCode"
												value={profileData.postalCode}
												onChange={(e) => handleInputChange('postalCode', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.postalCode || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{hasPassword && (
					<Card className="bg-white border border-gray-100 shadow-sm relative overflow-hidden rounded-2xl mt-6">
						<CardHeader className="border-b border-gray-100 bg-white px-4 py-3">
							<CardTitle className="text-sm font-semibold text-[#05324f] flex items-center gap-2">
								<Lock className="w-4 h-4" />
								{t('profile.change_password_title') || 'Change password'}
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 space-y-4">
							<div className="space-y-2">
								<Label htmlFor="currentPassword" className="text-[11px] font-semibold text-gray-400">
									{t('profile.current_password') || 'Current password'}
								</Label>
								<div className="relative">
									<Input
										id="currentPassword"
										type={showCurrentPassword ? 'text' : 'password'}
										value={passwordData.currentPassword}
										onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
										disabled={isSavingPassword}
										className="pr-10"
										autoComplete="current-password"
									/>
									<button
										type="button"
										onClick={() => setShowCurrentPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										tabIndex={-1}
									>
										{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="newPassword" className="text-[11px] font-semibold text-gray-400">
									{t('profile.new_password') || 'New password'}
								</Label>
								<div className="relative">
									<Input
										id="newPassword"
										type={showNewPassword ? 'text' : 'password'}
										value={passwordData.newPassword}
										onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
										disabled={isSavingPassword}
										className="pr-10"
										autoComplete="new-password"
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										tabIndex={-1}
									>
										{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword" className="text-[11px] font-semibold text-gray-400">
									{t('profile.confirm_password') || 'Confirm password'}
								</Label>
								<div className="relative">
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										value={passwordData.confirmPassword}
										onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
										disabled={isSavingPassword}
										className="pr-10"
										autoComplete="new-password"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										tabIndex={-1}
									>
										{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<Button
								type="button"
								onClick={handleSavePassword}
								disabled={isSavingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
								className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
							>
								{isSavingPassword
									? (t('profile.saving') || 'Saving...')
									: (t('profile.save_password') || 'Save password')}
							</Button>
						</CardContent>
					</Card>
					)}
					</div>

					<div className="space-y-6 hidden">
						<Card className="bg-white border border-gray-200 shadow-sm">
							<CardHeader className="border-b border-gray-200 bg-white">
								<CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
									<Calendar className="w-5 h-5 text-green-500" />
									{t('profile.quick_actions')}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-3">
									<Button
										onClick={() => navigate('/contract')}
										className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
									>
										<FileText className="w-4 h-4 mr-2" />
										{t('profile.view_my_cases') || t('profile.contract_title') || 'View Contract'}
									</Button>
									<Button
										onClick={() => navigate('/upload')}
										variant="outline"
										className="w-full justify-start"
									>
										<FileText className="w-4 h-4 mr-2" />
										{t('profile.create_new_request')}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			)}
			</div>

			<Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
				<DialogContent
					onClose={() => setLanguageOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('profile.language') || 'Language'}
						</DialogTitle>
					</DialogHeader>

					<div>
						<div className="grid grid-cols-2 gap-2 sm:gap-3">
							{[
								{ code: 'sv', name: 'Svenska', flag: '🇸🇪' },
								{ code: 'en', name: 'English', flag: '🇺🇸' },
							].map((lang) => (
								<button
									key={lang.code}
									type="button"
									onClick={() => {
										i18n.changeLanguage(lang.code)
										localStorage.setItem('language', lang.code)
										setLanguageOpen(false)
									}}
									className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
										i18n.language === lang.code
											? 'border-[#1B8F3E] bg-[#F2F9F4] text-[#1B8F3E]'
											: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
									}`}
								>
									<span className="text-base">{lang.flag}</span>
									{lang.name}
								</button>
							))}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
				<DialogContent
					onClose={() => setNotificationsOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('profile.notifications') || 'Notifications'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('profile.notifications_managed_by_email')}
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>

			<Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('navigation.logout_confirm_title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('navigation.logout_confirm_desc')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setIsLogoutConfirmOpen(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={confirmLogout}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95"
						>
							{t('navigation.logout') || 'Log Out'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('profile.delete_account_confirm_title') || 'Delete account?'}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('profile.delete_account_confirm_desc') || 'This will permanently delete your account and all associated data. This action cannot be undone.'}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setIsDeleteConfirmOpen(false)}
							disabled={isDeleting}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={confirmDeleteAccount}
							disabled={isDeleting}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-60"
						>
							{isDeleting ? (t('profile.deleting_account') || 'Deleting...') : (t('profile.delete_account') || 'Delete account')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

