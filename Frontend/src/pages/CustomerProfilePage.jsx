import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PhoneInput } from '../components/ui/PhoneInput'
import { Label } from '../components/ui/Label'
import { ProfileMenuSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatCompactNumber } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '../components/ui/Dialog'
import {
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
	Settings,
	HelpCircle,
	LogOut,
	Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StatCard from '../components/ui/StatCard'

import { authAPI, requestsAPI, bookingsAPI, uploadAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import { formatSwedishPhone } from '../utils/swedishPhone'

export default function CustomerProfilePage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading, fetchUser, logout } = useAuth()
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [settingsOpen, setSettingsOpen] = useState(false)
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
		setShowInfoOnMobile(searchParams.get('view') === 'info')
	}, [searchParams])

	const openProfileInfo = () => {
		setShowInfoOnMobile(true)
		setSearchParams({ view: 'info' })
		setTimeout(() => {
			const el = document.getElementById('customer-profile-form')
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 50)
	}

	const closeProfileInfo = () => {
		setShowInfoOnMobile(false)
		setSearchParams({})
	}

	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const userId = user._id || user.id
			await authAPI.updateProfile(userId, {
				name: profileData.name,
				phone: profileData.phone,
				address: profileData.address,
				city: profileData.city,
				postalCode: profileData.postalCode,
			})

			toast.success(t('profile.update_success') || 'Profile updated successfully')
			setOriginalProfileData(profileData)
			setIsEditing(false)
			
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

	const handleCancel = () => {
		setProfileData(originalProfileData)
		setIsEditing(false)
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
				// Convert relative URL to absolute URL if needed
				imageUrl = getFullUrl(imageUrl)
				
				// Update profile with new image
				const userId = user._id || user.id
				const updateResponse = await authAPI.updateProfile(userId, { image: imageUrl })
				
				// Get the updated image URL from response (might be different format)
				const updatedImageUrl = updateResponse.data?.image || imageUrl
				
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
				<Footer />
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

	const menuItems = [
		{
			icon: <User className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.profile_info_title') || 'Profile information',
			desc: t('profile.profile_info_desc') || 'Name, contact details and address',
			onClick: openProfileInfo,
		},
		{
			icon: <FileText className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.contract_title') || 'Contract',
			desc: t('profile.contract_desc') || 'View your bookings and active contracts',
			onClick: () => navigate('/contract'),
		},
		{
			icon: <Settings className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.settings_title') || 'Settings',
			desc: t('profile.settings_desc') || 'Notifications, language and other settings',
			onClick: () => setSettingsOpen(true),
		},
		{
			icon: <HelpCircle className="w-5 h-5 text-[#05324f]" />,
			title: t('profile.help_title') || 'Help and support',
			desc: t('profile.help_desc') || 'FAQ and contact support',
			onClick: () => navigate('/support'),
		},
	]

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />

			<div className="list-page-main">
			{/* Profile menu — all breakpoints */}
			<div className={`app-page-container max-w-2xl md:max-w-5xl lg:max-w-7xl pt-24 md:pt-32 ${showInfoOnMobile ? 'hidden' : 'block'}`}>
				<div className="mb-6">
					<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-1.5">
						{t('profile.title') || 'Profile'}
					</h1>
					<p className="text-xs sm:text-sm text-gray-500 leading-snug">
						{t('profile.subtitle_mobile') || 'Manage your profile and your settings.'}
					</p>
				</div>

				<div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5 flex items-center gap-3">
					<div className="relative shrink-0">
						<div className="w-14 h-14 rounded-full bg-[#F0F2F5] flex items-center justify-center overflow-hidden border border-gray-100">
							{profileData.image ? (
								<img src={profileData.image} alt={profileData.name || 'Profile'} className="w-full h-full object-cover" />
							) : (
								<User className="text-[#ACB0B4] w-7 h-7" />
							)}
						</div>
						<button
							type="button"
							onClick={() => document.getElementById('customer-profile-image-input')?.click()}
							disabled={isUploadingImage}
							className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-full shadow-md transition-all disabled:opacity-50"
							title={t('profile.change_photo') || 'Change profile photo'}
						>
							{isUploadingImage ? (
								<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<Camera className="w-3 h-3" />
							)}
						</button>
						<input
							id="customer-profile-image-input"
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="hidden"
						/>
					</div>
					<button
						type="button"
						onClick={openProfileInfo}
						className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
					>
						<div className="flex-1 min-w-0">
							<h3 className="text-base font-semibold text-[#05324f] truncate">
								{profileData.name || t('profile.hi') || 'User'}
							</h3>
							{profileData.email && (
								<p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{profileData.email}</p>
							)}
						</div>
						<ChevronRight className="text-gray-300 shrink-0" size={20} />
					</button>
				</div>

				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
					{menuItems.map((item, i) => (
						<div key={item.title}>
							<button
								type="button"
								onClick={item.onClick}
								className="w-full p-4 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
							>
								<div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
									{item.icon}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-[#05324f]">{item.title}</p>
									<p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">{item.desc}</p>
								</div>
								<ChevronRight className="text-gray-300 shrink-0" size={20} />
							</button>
							{i < menuItems.length - 1 && <div className="border-b border-gray-100 mx-4" />}
						</div>
					))}
				</div>

				<button
					type="button"
					onClick={handleLogout}
					className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center gap-2 text-[#34C759] font-semibold text-sm active:scale-[0.99] transition-transform mb-3"
				>
					<LogOut className="w-5 h-5 text-[#34C759]" />
					{t('profile.logout') || 'Log out'}
				</button>

				<button
					type="button"
					onClick={handleDeleteAccount}
					className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center gap-2 text-[#34C759] font-semibold text-sm active:scale-[0.99] transition-transform"
				>
					<Trash2 className="w-5 h-5 text-[#34C759]" />
					{t('profile.delete_account') || 'Delete account'}
				</button>
			</div>

			<div
				id="customer-profile-form"
				className={`app-page-container max-w-2xl md:max-w-5xl lg:max-w-7xl pt-24 md:pt-32 ${showInfoOnMobile ? 'block' : 'hidden'}`}
				style={{ scrollMarginTop: '5rem' }}
			>
				{/* Profile header with photo upload */}
				<div className="mb-6">
					<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-1.5">
						{t('profile.profile_info_title') || 'Profile information'}
					</h1>
					<p className="text-xs sm:text-sm text-gray-500 leading-snug mb-5">
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
								className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-full shadow-md transition-all disabled:opacity-50"
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
						iconColor="#34C759"
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
										<Button
											size="sm"
											variant="outline"
											onClick={() => setIsEditing(true)}
											className="flex items-center gap-1.5 h-8 px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
										>
											<Edit className="w-3.5 h-3.5" />
											{t('profile.edit')}
										</Button>
									) : (
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => setIsEditing(false)}
												disabled={isSaving}
												className="flex items-center gap-1.5 h-8 px-3 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
											>
												<X className="w-3.5 h-3.5" />
												<span className="hidden sm:inline">{t('profile.cancel')}</span>
											</Button>
											<Button
												size="sm"
												onClick={handleSave}
												disabled={isSaving}
												className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs sm:text-sm shadow-sm"
											>
												<Save className="w-3.5 h-3.5" />
												{isSaving ? (
													<span className="hidden sm:inline">{t('profile.saving')}</span>
												) : (
													<span className="hidden sm:inline">{t('profile.save')}</span>
												)}
											</Button>
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
										<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
											{profileData.email || 'N/A'}
										</div>
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
			</div>

			<Footer />

			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent
					onClose={() => setSettingsOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('profile.settings_title') || 'Settings'}
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
									}}
									className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
										i18n.language === lang.code
											? 'border-[#34C759] bg-[#F2F9F4] text-[#34C759]'
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
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95"
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
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-[#34C759] hover:bg-[#2eb34f] text-white font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-60"
						>
							{isDeleting ? (t('profile.deleting_account') || 'Deleting...') : (t('profile.delete_account') || 'Delete account')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

