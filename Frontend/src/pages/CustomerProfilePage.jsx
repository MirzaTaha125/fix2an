import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { formatPrice, formatCompactNumber } from '../utils/cn'
import { useTranslation } from 'react-i18next'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { authAPI, requestsAPI, bookingsAPI, uploadAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function CustomerProfilePage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, fetchUser } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
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
					phone: userData?.phone || '',
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
			<div className="min-h-screen bg-white flex flex-col">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 max-md:pb-24 w-full flex-1">
					{/* Skeleton Header */}
					<div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-4">
							<Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
							<Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
						</div>
					</div>

					{/* Skeleton Stats */}
					<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
						{[...Array(3)].map((_, i) => (
							<div key={i} className={`bg-white border border-gray-100 rounded-xl p-6 shadow-sm ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}>
								<div className="flex justify-between items-center mb-4">
									<Skeleton className="w-10 h-10 rounded-lg" />
									<Skeleton className="h-8 w-16" />
								</div>
								<Skeleton className="h-4 w-24 mb-2" />
								<Skeleton className="h-3 w-16" />
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Profile Details Skeleton */}
						<div className="lg:col-span-2">
							<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
								<div className="border-b border-gray-100 p-5 bg-gray-50/50 flex justify-between items-center">
									<div className="flex items-center gap-3">
										<Skeleton className="w-8 h-8 rounded-lg" />
										<Skeleton className="h-6 w-40" />
									</div>
								</div>
								<div className="p-6 space-y-8">
									<div>
										<Skeleton className="h-5 w-32 mb-4" />
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{[...Array(3)].map((_, i) => (
												<div key={`pd-${i}`} className="space-y-2">
													<Skeleton className="h-4 w-16" />
													<Skeleton className="h-10 w-full" />
												</div>
											))}
										</div>
									</div>
									<div>
										<Skeleton className="h-5 w-40 mb-4" />
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2 md:col-span-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-10 w-full" />
											</div>
											{[...Array(2)].map((_, i) => (
												<div key={`ad-${i}`} className="space-y-2">
													<Skeleton className="h-4 w-16" />
													<Skeleton className="h-10 w-full" />
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Sidebar Actions Skeleton */}
						<div className="space-y-6">
							<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
								<Skeleton className="h-5 w-32 mb-6" />
								<div className="space-y-3">
									<Skeleton className="h-10 w-full rounded-md" />
									<Skeleton className="h-10 w-full rounded-md" />
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<Footer />
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 max-md:pb-24">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="relative group">
							{profileData.image && profileData.image.trim() !== '' ? (
								<img 
									src={profileData.image} 
									alt={profileData.name || 'Profile'} 
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
								<User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
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
								<h1 className="text-xl sm:text-xl font-bold text-gray-900 mb-2">
									{profileData.name || 'User'}
								</h1>
							</div>
						</div>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-4 sm:p-6 text-center">
							<div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
								{stats.totalRequests}
							</div>
							<h3 className="text-[10px] sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
								{t('profile.my_cases') || 'Requests'}
							</h3>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-4 sm:p-6 text-center">
							<div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
								{stats.completedBookings}
							</div>
							<h3 className="text-[10px] sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
								{t('profile.completed_cases') || 'Finished'}
							</h3>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-4 sm:p-6 text-center">
							<div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
								{formatCompactNumber(stats.totalSpend)}
							</div>
							<h3 className="text-[10px] sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
								{t('profile.total_spend') || 'Spend'}
							</h3>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<div className="lg:col-span-2">
						<Card className="bg-white border border-gray-200 shadow-sm relative overflow-hidden">
							<CardHeader className="border-b border-gray-200 bg-white">
								<div className="flex items-center justify-between gap-4">
									<CardTitle className="text-xl font-bold text-gray-900">
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
							<CardContent className="p-6 space-y-6">
							{/* Personal Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<User className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('profile.personal_details')}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.name || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="text-sm font-medium text-gray-700">
											{t('profile.email') || 'Email'}
										</Label>
										<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
											{profileData.email || 'N/A'}
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-sm font-medium text-gray-700">
											{t('profile.phone') || 'Phone'}
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
												{profileData.phone || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<MapPin className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">{t('profile.address_information')}</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="address" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.address || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="city" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.city || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
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
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.postalCode || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
					</div>

					{/* Quick Actions Sidebar */}
					<div className="space-y-6">
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
										onClick={() => navigate('/my-cases')}
										className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
									>
										<FileText className="w-4 h-4 mr-2" />
										{t('profile.view_my_cases')}
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
			
			<Footer />
		</div>
	)
}

