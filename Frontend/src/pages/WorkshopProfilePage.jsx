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
import { SHOW_PROFILE_LANGUAGE_SETTINGS } from '../config/language.js'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import WorkshopShell from '../components/workshop/WorkshopShell'

import { workshopAPI, authAPI, uploadAPI } from '../services/api'
import { getFullUrl, toStorageUrl } from '../config/api.js'
import { formatSwedishPhone } from '../utils/swedishPhone'

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_DEFAULTS = {
	monday: { open: '08:00', close: '17:00' },
	tuesday: { open: '08:00', close: '17:00' },
	wednesday: { open: '08:00', close: '17:00' },
	thursday: { open: '08:00', close: '17:00' },
	friday: { open: '08:00', close: '17:00' },
	saturday: { open: '09:00', close: '15:00' },
	sunday: { open: '10:00', close: '14:00' },
}

function parseOpeningHours(raw) {
	const hours = {}
	const enabled = {}
	WEEK_DAYS.forEach((day) => {
		hours[day] = { open: DAY_DEFAULTS[day].open, close: DAY_DEFAULTS[day].close }
		enabled[day] = day !== 'sunday'
	})
	if (!raw) return { hours, enabled }
	try {
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
		if (!parsed || typeof parsed !== 'object') return { hours, enabled }
		WEEK_DAYS.forEach((day) => {
			const entry = parsed[day] || {}
			const open = entry.open || entry.opens || ''
			const close = entry.close || entry.closes || ''
			const isOpen = Boolean(open && close)
			enabled[day] = isOpen
			hours[day] = {
				open: open || DAY_DEFAULTS[day].open,
				close: close || DAY_DEFAULTS[day].close,
			}
		})
	} catch {
		/* keep defaults */
	}
	return { hours, enabled }
}

function serializeOpeningHours(hours, enabled) {
	const next = {}
	WEEK_DAYS.forEach((day) => {
		next[day] = enabled[day]
			? { open: hours[day]?.open || '', close: hours[day]?.close || '' }
			: { open: '', close: '' }
	})
	return next
}

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
		openingHours: '',
		image: '',
		isVerified: false,
	})
	const [originalProfileData, setOriginalProfileData] = useState({})
	const [openingHours, setOpeningHours] = useState(() => parseOpeningHours('').hours)
	const [dayEnabled, setDayEnabled] = useState(() => parseOpeningHours('').enabled)
	const [originalOpeningHours, setOriginalOpeningHours] = useState(() => parseOpeningHours('').hours)
	const [originalDayEnabled, setOriginalDayEnabled] = useState(() => parseOpeningHours('').enabled)
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
	const [showInfoOnMobile, setShowInfoOnMobile] = useState(false)
	const { i18n } = useTranslation()

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/workshop/login', { replace: true })
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
					openingHours: workshopData?.openingHours || '',
				}
				const parsedHours = parseOpeningHours(workshopData?.openingHours || '')
				setProfileData(profile)
				setOriginalProfileData(profile)
				setOpeningHours(parsedHours.hours)
				setDayEnabled(parsedHours.enabled)
				setOriginalOpeningHours(parsedHours.hours)
				setOriginalDayEnabled(parsedHours.enabled)
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

	useRegisterMobileBack(closeProfileInfo, showInfoOnMobile)

	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const hoursPayload = serializeOpeningHours(openingHours, dayEnabled)
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
				openingHours: hoursPayload,
			})

			toast.success(t('workshop.profile.update_success') || 'Profile updated successfully')
			setOriginalProfileData(profileData)
			setOriginalOpeningHours(openingHours)
			setOriginalDayEnabled(dayEnabled)
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
		setOpeningHours(originalOpeningHours)
		setDayEnabled(originalDayEnabled)
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
			<WorkshopShell>
			<div className="list-page-shell bg-transparent">
				<div className="list-page-main">
					<ProfileMenuSkeleton menuRows={3} avatarClassName="rounded-xl" />
				</div>
			</div>
			</WorkshopShell>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	const confirmLogout = () => {
		setIsLogoutConfirmOpen(false)
		logout()
		navigate('/workshop/login', { replace: true })
	}

	return (
		<WorkshopShell>
		<div className="list-page-shell bg-transparent">

			<div className="list-page-main">
			{/* Profile menu — all breakpoints */}
			<div className={`list-page-content !max-w-none ${showInfoOnMobile ? 'hidden' : 'block'}`}>
				<div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
					<div className="w-28 h-28 rounded-full bg-[#0B2540] text-white text-2xl font-bold flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-white shadow-sm">
						{profileData.image ? (
							<img src={profileData.image} alt="" className="w-full h-full object-cover" />
						) : (
							(profileData.companyName || 'W').slice(0, 2).toUpperCase()
						)}
					</div>
					<div className="min-w-0">
						<h1 className="page-title">
							{profileData.companyName || profileData.name || t('workshop.profile.workshop')}
						</h1>
						<p className="text-sm text-[#6B7280] mt-1.5">
							{[profileData.address, [profileData.postalCode, profileData.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'}
						</p>
						<div className="flex items-center gap-2 mt-2">
							<div className="flex items-center gap-0.5">
								{[...Array(5)].map((_, index) => (
									<Star
										key={index}
										className={`w-4 h-4 ${index < Math.round(Number(stats.rating) || 0) ? 'text-[#1B8F3E] fill-[#1B8F3E]' : 'text-[#D1D5DB]'}`}
									/>
								))}
							</div>
							<span className="text-sm font-semibold text-[#1B8F3E]">{Number(stats.rating || 0).toFixed(1)}</span>
							<span className="text-sm text-[#9CA3AF]">{t('workshop.panel.review_count', { count: stats.reviewCount || 0 })}</span>
						</div>
						<div className="flex flex-wrap gap-3 mt-5">
							<Link
								to="/workshop/reviews"
								className="min-h-[44px] px-6 rounded-full border border-[#E5E7EB] bg-white text-sm font-semibold text-[#111827] inline-flex items-center justify-center"
							>
								{t('workshop.panel.view_public')}
							</Link>
							<button
								type="button"
								onClick={openProfileInfo}
								className="min-h-[44px] px-6 rounded-full bg-brand-btn text-white text-sm font-semibold"
							>
								{t('workshop.panel.edit_profile')}
							</button>
						</div>
					</div>
				</div>
			</div>

			<div
				id="workshop-info-form"
				className={`app-page-container w-full pt-6 ${showInfoOnMobile ? 'block' : 'hidden'}`}
				style={{ scrollMarginTop: '5rem' }}
			>

				{/* Header Section */}
				<div className="mb-6">
					<h1 className="page-title">
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
								className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-brand-btn text-white rounded-full shadow-md transition-all disabled:opacity-50"
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

							{/* Opening hours / slots */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Calendar className="w-4 h-4 text-gray-400" />
									<h3 className="text-sm font-semibold text-[#05324f]">
										{t('workshop.signup.opening_hours.title') || t('workshop.profile.opening_hours') || 'Opening hours'}
									</h3>
								</div>
								<p className="text-xs text-gray-500 mb-3 leading-relaxed">
									{t('workshop.signup.opening_hours.description') || 'Enter your opening hours'}
								</p>
								<div className="flex flex-col gap-3">
									{WEEK_DAYS.map((day) => {
										const enabled = Boolean(dayEnabled[day])
										const open = openingHours[day]?.open || ''
										const close = openingHours[day]?.close || ''
										return (
											<div
												key={day}
												className={`p-3 rounded-xl border border-gray-100 ${enabled ? '' : 'bg-[#F9FAFB]'}`}
											>
												<div className="flex items-center justify-between gap-3 mb-3">
													<Label className="text-sm font-semibold text-brand-dark">
														{t(`workshop.signup.opening_hours.days.${day}`)}
													</Label>
													{isEditing ? (
														<button
															type="button"
															role="switch"
															aria-checked={enabled}
															disabled={isSaving}
															aria-label={`${t(`workshop.signup.opening_hours.days.${day}`)} ${
																enabled
																	? t('workshop.signup.opening_hours.day_on')
																	: t('workshop.signup.opening_hours.day_off')
															}`}
															onClick={() => {
																setDayEnabled((prev) => {
																	const nextOn = !prev[day]
																	if (nextOn) {
																		setOpeningHours((form) => ({
																			...form,
																			[day]: {
																				open: form[day]?.open || DAY_DEFAULTS[day].open,
																				close: form[day]?.close || DAY_DEFAULTS[day].close,
																			},
																		}))
																	}
																	return { ...prev, [day]: nextOn }
																})
															}}
															className={`relative w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 disabled:opacity-50 ${
																enabled ? 'bg-[#1B8F3E]' : 'bg-gray-200'
															}`}
														>
															<span
																className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
																	enabled ? 'translate-x-5' : 'translate-x-0'
																}`}
															/>
														</button>
													) : (
														<span className={`text-xs font-semibold ${enabled ? 'text-[#1B8F3E]' : 'text-gray-400'}`}>
															{enabled
																? t('workshop.signup.opening_hours.day_on')
																: t('workshop.signup.opening_hours.day_off')}
														</span>
													)}
												</div>
												{enabled ? (
													isEditing ? (
														<div className="grid w-full grid-cols-2 gap-3">
															<div className="min-w-0">
																<Label className="block text-[11px] font-semibold text-brand-dark mb-1">
																	{t('workshop.signup.opening_hours.open')}
																</Label>
																<div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
																	<input
																		type="time"
																		value={open}
																		disabled={isSaving}
																		onChange={(e) =>
																			setOpeningHours((prev) => ({
																				...prev,
																				[day]: { ...prev[day], open: e.target.value },
																			}))
																		}
																		className="h-9 w-full max-w-full bg-transparent border-0 px-1.5 text-xs text-center text-brand-dark outline-none focus:ring-0 disabled:opacity-50"
																	/>
																</div>
															</div>
															<div className="min-w-0">
																<Label className="block text-[11px] font-semibold text-brand-dark mb-1">
																	{t('workshop.signup.opening_hours.close')}
																</Label>
																<div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
																	<input
																		type="time"
																		value={close}
																		disabled={isSaving}
																		onChange={(e) =>
																			setOpeningHours((prev) => ({
																				...prev,
																				[day]: { ...prev[day], close: e.target.value },
																			}))
																		}
																		className="h-9 w-full max-w-full bg-transparent border-0 px-1.5 text-xs text-center text-brand-dark outline-none focus:ring-0 disabled:opacity-50"
																	/>
																</div>
															</div>
														</div>
													) : (
														<p className="text-sm font-medium text-[#05324f]">
															{open} – {close}
														</p>
													)
												) : (
													<p className="text-sm text-gray-400">
														{t('workshop.signup.opening_hours.day_off')}
													</p>
												)}
											</div>
										)
									})}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Stats Sidebar */}
					<div className="space-y-6">
						<Card className="bg-white border border-gray-100 shadow-sm rounded-2xl">
							<CardHeader className="border-b border-gray-100 bg-white px-4 py-3">
								<CardTitle className="text-sm font-semibold text-[#05324f] flex items-center gap-2">
									<Star className="w-4 h-4 text-[#1B8F3E] fill-[#1B8F3E]" />
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
																? 'text-[#1B8F3E] fill-[#1B8F3E]'
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
										<span className="text-[11px] text-[#1B8F3E] font-medium mt-0.5 block">
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

			{SHOW_PROFILE_LANGUAGE_SETTINGS && (
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
			)}

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
		</div>
		</WorkshopShell>
	)
}
