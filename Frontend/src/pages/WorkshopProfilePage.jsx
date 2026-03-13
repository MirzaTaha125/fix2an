import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
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
	Star,
	Calendar,
	Send,
	FileCheck,
	Briefcase,
	Camera,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { workshopAPI, authAPI, uploadAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function WorkshopProfilePage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, fetchUser } = useAuth()
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
					navigate('/my-cases', { replace: true })
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
					phone: userData?.phone || workshopData?.phone || '',
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
			<div className="min-h-screen bg-white flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto"></div>
						<User className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32 pb-12">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-4 flex-1">
						<div className="relative group">
							{profileData.image && profileData.image.trim() !== '' ? (
								<img 
									src={profileData.image} 
									alt={profileData.name || profileData.companyName || 'Profile'} 
									className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-green-100 shadow-lg"
									onError={(e) => {
										// If image fails to load, hide image and show default
										const parent = e.target.parentElement
										e.target.style.display = 'none'
										const fallback = parent.querySelector('.profile-image-fallback')
										if (fallback) {
											fallback.style.display = 'flex'
										}
									}}
									onLoad={(e) => {
										// Hide fallback when image loads successfully
										const parent = e.target.parentElement
										const fallback = parent.querySelector('.profile-image-fallback')
										if (fallback) {
											fallback.style.display = 'none'
										}
									}}
								/>
							) : null}
							<div 
								className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center border-4 border-green-100 shadow-lg profile-image-fallback ${profileData.image && profileData.image.trim() !== '' ? 'hidden' : ''}`}
							>
								<Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							</div>
							<button
								type="button"
								onClick={() => document.getElementById('profile-image-input')?.click()}
								disabled={isUploadingImage}
								className="absolute bottom-0 right-0 p-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								title="Change profile image"
							>
								{isUploadingImage ? (
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<Camera className="w-4 h-4" />
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
						<div>
							<div className="flex items-center gap-3 flex-wrap">
								<h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-2">
									{profileData.companyName || profileData.name || t('workshop.profile.workshop')}
								</h1>
								<Badge 
									variant={profileData.isVerified ? 'default' : 'outline'}
									className={profileData.isVerified 
										? 'bg-green-600 text-white border-green-600' 
										: 'bg-gray-100 text-gray-600 border-gray-300'
									}
								>
									{t(`workshop.profile.${profileData.isVerified ? 'verified' : 'unverified'}`) || (profileData.isVerified ? 'Verified' : 'Unverified')}
								</Badge>
							</div>
						</div>
						</div>
						<div className="flex justify-end">
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									size="sm"
									className="flex items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
								>
									<Edit className="w-3 h-3 sm:w-4 sm:h-4" />
									<span className="hidden sm:inline">{t('workshop.profile.edit') || 'Edit Profile'}</span>
									<span className="sm:hidden">{t('workshop.profile.edit') || 'Edit'}</span>
								</Button>
							) : (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancel}
										disabled={isSaving}
										className="flex items-center gap-2"
									>
										<X className="w-4 h-4" />
										{t('workshop.profile.cancel') || 'Cancel'}
									</Button>
									<Button
										size="sm"
										onClick={handleSave}
										disabled={isSaving}
										className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
									>
										<Save className="w-4 h-4" />
										{isSaving ? (t('workshop.profile.saving') || 'Saving...') : (t('workshop.profile.save') || 'Save')}
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
						<CardHeader className="border-b border-gray-200 bg-white">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-600 rounded-lg">
									<Briefcase className="w-5 h-5 text-white" />
								</div>
								<CardTitle className="text-xl font-bold text-gray-900">
									{t('workshop.profile.profile_info') || 'Profile Information'}
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent className="p-6 space-y-8">
							{/* Personal Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<User className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('workshop.profile.personal_details') || 'Personal Details'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.name || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.email || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.phone') || 'Phone'}
										</Label>
										{isEditing ? (
											<Input
												id="phone"
												type="tel"
												value={profileData.phone}
												onChange={(e) => handleInputChange('phone', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.phone || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Company Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<Building2 className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('workshop.profile.company_details') || 'Company Details'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.companyName || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="organizationNumber" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.organizationNumber || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<MapPin className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('workshop.profile.address_information') || 'Address Information'}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="address" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.address || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="city" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.city || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.postalCode || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Additional Information */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<Globe className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('workshop.profile.additional_information') || 'Additional Information'}</h3>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="website" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.website || t('workshop.profile.not_available') || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="description" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
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
						<Card className="bg-white border border-gray-200 shadow-sm">
							<CardHeader className="border-b border-gray-200 bg-white">
								<CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
									<Star className="w-5 h-5 text-green-500" />
									{t('workshop.profile.quick_stats') || 'Quick Stats'}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-6">
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-600">{t('workshop.profile.rating')}</span>
											<span className="text-2xl font-bold text-gray-900">
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
										className="block pt-4 border-t border-gray-200 hover:bg-gray-50 -mx-2 -mb-2 px-2 py-2 rounded-lg transition-colors cursor-pointer"
									>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-600">{t('workshop.profile.reviews')}</span>
											<span className="text-xl font-bold text-gray-900">{stats.reviewCount}</span>
										</div>
										<span className="text-xs text-green-600 font-medium mt-1 block">
											{t('workshop.profile.view_all_reviews') || 'View all reviews →'}
										</span>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
