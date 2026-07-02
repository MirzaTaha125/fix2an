import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PhoneInput } from '../components/ui/PhoneInput'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge, VerifiedBadge } from '../components/ui/Badge'
import { ProfileMenuSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '../components/ui/Dialog'
import {
	User,
	Building2,
	Mail,
	Phone,
	MapPin,
	Globe,
	FileText,
	Edit,
	Save,
	X,
	Users,
	DollarSign,
	CheckCircle,
	Check,
	Star,
	Calendar,
	Send,
	FileCheck,
	Briefcase,
	Camera,
	ChevronRight,
	ShieldCheck,
	Settings,
	HelpCircle,
	LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { workshopAPI, authAPI, uploadAPI } from '../services/api'
import { getFullUrl, toStorageUrl } from '../config/api.js'
import { formatSwedishPhone } from '../utils/swedishPhone'

export default function WorkshopProfilePage() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const { user, loading: authLoading, fetchUser, logout } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeOffers: 0,
		completedJobs: 0,
		totalRevenue: 0,
		completedContracts: 0,
		proposalsSent: 0,
		rating: 0,
		reviewCount: 0,
	})
	const [profileData, setProfileData] = useState({
		name: '',
		email: '',
		phone: '',
		companyName: '',
		organizationNumber: '',
		address: '',
		city: '',
		postalCode: '',
		website: '',
		description: '',
		image: '',
		isVerified: false,
	})
	const [originalProfileData, setOriginalProfileData] = useState({})
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
	const [showInfoOnMobile, setShowInfoOnMobile] = useState(false)
	const { i18n } = useTranslation()

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/contract', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchData = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			// Fetch stats
			const statsResponse = await workshopAPI.getStats()
			if (statsResponse.data) {
				setStats({
					totalRequests: statsResponse.data.totalRequests || 0,
					activeOffers: statsResponse.data.activeOffers || 0,
					completedJobs: statsResponse.data.completedJobs || 0,
					totalRevenue: statsResponse.data.totalRevenue || 0,
					completedContracts: statsResponse.data.completedContracts || 0,
					proposalsSent: statsResponse.data.proposalsSent || 0,
					rating: statsResponse.data.rating || 0,
					reviewCount: statsResponse.data.reviewCount || 0,
				})
			}

			// Fetch workshop profile data
			const profileResponse = await workshopAPI.getProfile()
			if (profileResponse.data) {
				const { user: userData, workshop: workshopData } = profileResponse.data
				let imageUrl = userData?.image || ''
				
				// Convert relative URL to absolute URL if needed
				if (imageUrl) {
					imageUrl = getFullUrl(imageUrl)
				}
				
				const profile = {
					name: userData?.name || '',
					email: userData?.email || workshopData?.email || '',
					phone: formatSwedishPhone(userData?.phone || workshopData?.phone || ''),
					companyName: workshopData?.companyName || '',
					organizationNumber: workshopData?.organizationNumber || '',
					address: workshopData?.address || '',
					city: workshopData?.city || '',
					postalCode: workshopData?.postalCode || '',
					website: workshopData?.website || '',
					description: workshopData?.description || '',
					image: imageUrl,
					isVerified: workshopData?.isVerified || false,
				}
				setProfileData(profile)
				setOriginalProfileData(profile)
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('workshop.profile.fetch_error') || 'Failed to fetch profile data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
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
			const el = document.getElementById('workshop-info-form')
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
			// Update workshop profile
			await workshopAPI.updateProfile({
				name: profileData.name,
				phone: profileData.phone,
				email: profileData.email,
				companyName: profileData.companyName,
				organizationNumber: profileData.organizationNumber,
				address: profileData.address,
				city: profileData.city,
				postalCode: profileData.postalCode,
				website: profileData.website,
				description: profileData.description,
			})

			toast.success(t('workshop.profile.update_success') || 'Profile updated successfully')
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
			toast.error(t('workshop.profile.update_error') || 'Failed to update profile')
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
				const storageUrl = toStorageUrl(imageUrl)
				
				// Store relative path only — getFullUrl resolves it at display time
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
					<ProfileMenuSkeleton menuRows={3} avatarClassName="rounded-xl" />
				</div>
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
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

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />

			<div className="list-page-main">
			{/* Profile menu — all breakpoints */}
			<div className={`app-page-container max-w-2xl md:max-w-5xl lg:max-w-7xl pt-24 md:pt-32 ${showInfoOnMobile ? 'hidden' : 'block'}`}>
				<div className="mb-6">
					<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-1.5">
						{t('workshop.profile.title') || 'Profile'}
					</h1>
					<p className="text-xs sm:text-sm text-gray-500 leading-snug">
						{t('workshop.profile.subtitle_mobile') || 'Manage your workshop and your settings.'}
					</p>
				</div>

				{/* Workshop hero card */}
				<button
					type="button"
					onClick={openProfileInfo}
					className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5 flex items-center gap-3 active:scale-[0.99] transition-transform"
				>
					<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
						{profileData.image ? (
							<img src={profileData.image} alt={profileData.companyName || 'Workshop'} className="w-full h-full object-cover" />
						) : (
							<Building2 className="text-white/30 w-6 h-6" />
						)}
					</div>
					<div className="flex-1 min-w-0 text-left">
						<h3 className="text-base font-semibold text-[#05324f] truncate">
							{profileData.companyName || profileData.name || t('workshop.profile.workshop')}
						</h3>
						{profileData.isVerified ? (
							<VerifiedBadge className="mt-1" />
						) : (
							<Badge
								variant="outline"
								className="mt-1 bg-gray-100 text-gray-600 border-gray-300"
							>
								{t('workshop.profile.unverified') || 'Unverified'}
							</Badge>
						)}
					</div>
					<ChevronRight className="text-gray-300 shrink-0" size={20} />
				</button>

				{/* Menu items */}
				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
					{[
						{
							icon: <Building2 className="w-5 h-5 text-[#05324f]" />,
							title: t('workshop.profile.workshop_info_title') || 'Workshop information',
							desc: t('workshop.profile.workshop_info_desc') || 'Address, contact details and opening hours',
							onClick: openProfileInfo,
						},
						{
							icon: <Settings className="w-5 h-5 text-[#05324f]" />,
							title: t('workshop.profile.settings_title') || 'Settings',
							desc: t('workshop.profile.settings_desc') || 'Notifications, language and other settings',
							onClick: () => setSettingsOpen(true),
						},
						{
							icon: <HelpCircle className="w-5 h-5 text-[#05324f]" />,
							title: t('workshop.profile.help_title') || 'Help and support',
							desc: t('workshop.profile.help_desc') || 'FAQ and contact support',
							onClick: () => navigate('/support'),
						},
					].map((item, i, arr) => (
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
							{i < arr.length - 1 && <div className="border-b border-gray-100 mx-4" />}
						</div>
					))}
				</div>

				{/* Logout button */}
				<button
					type="button"
					onClick={handleLogout}
					className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-center gap-2 text-red-600 font-semibold text-sm active:scale-[0.99] transition-transform"
				>
					<LogOut className="w-5 h-5" />
					{t('workshop.profile.logout') || 'Log out'}
				</button>

			</div>

			<div
				id="workshop-info-form"
				className={`app-page-container max-w-2xl md:max-w-5xl lg:max-w-7xl pt-24 md:pt-32 ${showInfoOnMobile ? 'block' : 'hidden'}`}
				style={{ scrollMarginTop: '5rem' }}
			>

				{/* Header Section */}
				<div className="mb-6">
					<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-1.5">
						{t('workshop.profile.workshop_info_title') || 'Workshop information'}
					</h1>
					<p className="text-xs sm:text-sm text-gray-500 leading-snug mb-5">
						{t('workshop.profile.workshop_info_desc') || 'Address, contact details and opening hours'}
					</p>
					<div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
						<div className="relative shrink-0">
							<div className="w-14 h-14 rounded-xl bg-[#1a1a1a] flex items-center justify-center overflow-hidden border border-gray-100">
								{profileData.image && profileData.image.trim() !== '' ? (
									<img
										src={profileData.image}
										alt={profileData.name || profileData.companyName || 'Profile'}
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
									<Building2 className="text-white/30 w-6 h-6" />
								</div>
							</div>
							<button
								type="button"
								onClick={() => document.getElementById('profile-image-input')?.click()}
								disabled={isUploadingImage}
								className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-full shadow-md transition-all disabled:opacity-50"
								title="Change profile image"
							>
								{isUploadingImage ? (
									<div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									<Camera className="w-3 h-3" />
								)}
							</button>
							<input
								id="profile-image-input"
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								className="hidden"
							/>
						</div>
						<div className="flex-1 min-w-0 text-left">
							<h3 className="text-base font-semibold text-[#05324f] truncate">
								{profileData.companyName || profileData.name || t('workshop.profile.workshop')}
							</h3>
							{profileData.isVerified ? (
								<VerifiedBadge className="mt-1" />
							) : (
								<Badge variant="outline" className="mt-1 bg-gray-100 text-gray-600 border-gray-300">
									{t('workshop.profile.unverified') || 'Unverified'}
								</Badge>
							)}
						</div>
					</div>
				</div>
				
			{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<Card className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl">
						<CardHeader className="border-b border-gray-100 bg-white px-4 py-3">
							<div className="flex items-center justify-between gap-4">
								<CardTitle className="text-sm font-semibold text-[#05324f]">
									{t('workshop.profile.profile_info') || 'Profile Information'}
								</CardTitle>
								
								{!isEditing ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setIsEditing(true)}
										className="flex items-center gap-1.5 h-8 px-3 text-xs sm:text-sm border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
									>
										<Edit className="w-3.5 h-3.5" />
										{t('workshop.profile.edit') || 'Edit'}
									</Button>
								) : (
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={handleCancel}
											disabled={isSaving}
											className="flex items-center gap-1.5 h-8 px-3 text-xs sm:text-sm text-gray-600 hover:text-gray-900"
										>
											<X className="w-3.5 h-3.5" />
											<span className="hidden sm:inline">{t('workshop.profile.cancel') || 'Cancel'}</span>
										</Button>
										<Button
											size="sm"
											onClick={handleSave}
											disabled={isSaving}
											className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs sm:text-sm shadow-sm"
										>
											<Save className="w-3.5 h-3.5" />
											{isSaving ? (
												<span className="hidden sm:inline">{t('workshop.profile.saving') || 'Saving...'}</span>
											) : (
												<span className="hidden sm:inline">{t('workshop.profile.save') || 'Save'}</span>
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
									<h3 className="text-sm font-semibold text-[#05324f]">{t('workshop.profile.personal_details') || 'Personal Details'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.name') || 'Name'}
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
												{profileData.name || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.email') || 'Email'}
										</Label>
										{isEditing ? (
											<Input
												id="email"
												type="email"
												value={profileData.email}
												onChange={(e) => handleInputChange('email', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.email || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.phone') || 'Phone'}
										</Label>
										{isEditing ? (
											<PhoneInput
												id="phone"
												value={profileData.phone}
												onChange={(e) => handleInputChange('phone', e.target.value)}
												disabled={isSaving}
												className="w-full"
												placeholder={t('workshop.profile.phone') || 'Phone number'}
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{formatSwedishPhone(profileData.phone) || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Company Details */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<h3 className="text-sm font-semibold text-[#05324f]">{t('workshop.profile.company_details') || 'Company Details'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="companyName" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.company_name') || 'Company Name'}
										</Label>
										{isEditing ? (
											<Input
												id="companyName"
												value={profileData.companyName}
												onChange={(e) => handleInputChange('companyName', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.companyName || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="organizationNumber" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.organization_number') || 'Organization Number'}
										</Label>
										{isEditing ? (
											<Input
												id="organizationNumber"
												value={profileData.organizationNumber}
												onChange={(e) => handleInputChange('organizationNumber', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.organizationNumber || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<MapPin className="w-4 h-4 text-gray-400" />
									<h3 className="text-sm font-semibold text-[#05324f]">{t('workshop.profile.address_information') || 'Address Information'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="address" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.address') || 'Address'}
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
												{profileData.address || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="city" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.city') || 'City'}
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
												{profileData.city || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postalCode" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.postal_code') || 'Postal Code'}
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
												{profileData.postalCode || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Additional Information */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Globe className="w-4 h-4 text-gray-400" />
									<h3 className="text-sm font-semibold text-[#05324f]">{t('workshop.profile.additional_information') || 'Additional Information'}</h3>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="website" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.website') || 'Website'}
										</Label>
										{isEditing ? (
											<Input
												id="website"
												type="url"
												value={profileData.website}
												onChange={(e) => handleInputChange('website', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f]">
												{profileData.website || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="description" className="text-[11px] font-semibold text-gray-400">
											{t('workshop.profile.description') || 'Description'}
										</Label>
										{isEditing ? (
											<Textarea
												id="description"
												value={profileData.description}
												onChange={(e) => handleInputChange('description', e.target.value)}
												disabled={isSaving}
												rows={4}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-[#05324f] whitespace-pre-wrap min-h-[80px]">
												{profileData.description || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Stats Sidebar */}
					<div className="space-y-6">
						<Card className="bg-white border border-gray-100 shadow-sm rounded-2xl">
							<CardHeader className="border-b border-gray-100 bg-white px-4 py-3">
								<CardTitle className="text-sm font-semibold text-[#05324f] flex items-center gap-2">
									<Star className="w-4 h-4 text-green-500" />
									{t('workshop.profile.quick_stats') || 'Quick Stats'}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-4">
								<div className="space-y-4">
									<div>
										<div className="flex items-center justify-between mb-1">
											<span className="text-[11px] font-semibold text-gray-400">{t('workshop.profile.rating')}</span>
											<span className="text-base font-semibold text-[#05324f]">
												{stats.rating > 0 ? stats.rating.toFixed(1) : (t('workshop.profile.not_available') || 'N/A')}
											</span>
										</div>
										{stats.rating > 0 && (
											<div className="flex items-center gap-1">
												{[...Array(5)].map((_, i) => (
													<Star
														key={i}
														className={`w-4 h-4 ${
															i < Math.round(stats.rating)
																? 'text-green-400 fill-green-400'
																: 'text-gray-300'
														}`}
													/>
												))}
											</div>
										)}
									</div>
									<Link
										to="/workshop/reviews"
										className="block pt-3 border-t border-gray-100 hover:bg-gray-50 -mx-1 px-1 py-1.5 rounded-lg transition-colors cursor-pointer"
									>
										<div className="flex items-center justify-between">
											<span className="text-[11px] font-semibold text-gray-400">{t('workshop.profile.reviews')}</span>
											<span className="text-sm font-semibold text-[#05324f]">{stats.reviewCount}</span>
										</div>
										<span className="text-[11px] text-[#38BC54] font-medium mt-0.5 block">
											{t('workshop.profile.view_all_reviews') || 'View all reviews →'}
										</span>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			</div>

			<Footer />

			{/* Settings Dialog */}
			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent
					onClose={() => setSettingsOpen(false)}
					className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
				>
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('workshop.profile.settings_title') || 'Settings'}
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
		</div>
	)
}
