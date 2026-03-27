import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { Eye, EyeOff, Upload, X, Building2, Clock, Plus, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { validateFile, getFileIcon } from '../utils/cn'
import { uploadAPI, workshopAPI } from '../services/api'

export default function WorkshopSignupPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	
	const [formData, setFormData] = useState({
		// User info
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
		website: '',

		// Workshop info
		companyName: '',
		organizationNumber: '',
		address: '',
		city: '',
		postalCode: '',
		description: '',

		// Opening hours
		mondayOpen: '08:00',
		mondayClose: '17:00',
		tuesdayOpen: '08:00',
		tuesdayClose: '17:00',
		wednesdayOpen: '08:00',
		wednesdayClose: '17:00',
		thursdayOpen: '08:00',
		thursdayClose: '17:00',
		fridayOpen: '08:00',
		fridayClose: '17:00',
		saturdayOpen: '09:00',
		saturdayClose: '15:00',
		sundayOpen: '',
		sundayClose: '',

		// Brands
		brands: [],
	})

	const [documents, setDocuments] = useState([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [fieldErrors, setFieldErrors] = useState({})

	const carBrands = [
		'Volvo',
		'Saab',
		'BMW',
		'Mercedes-Benz',
		'Audi',
		'Volkswagen',
		'Toyota',
		'Honda',
		'Ford',
		'Opel',
		'Peugeot',
		'Renault',
		'Citroën',
		'Fiat',
		'Nissan',
		'Mazda',
		'Hyundai',
		'Kia',
		'Skoda',
		'Seat',
		'Alfa Romeo',
		'Jaguar',
		'Land Rover',
		'Mini',
		'Smart',
		'Subaru',
		'Suzuki',
		'Mitsubishi',
		'Lexus',
		'Infiniti',
		'Andra',
	]

	const onDrop = (acceptedFiles) => {
		const validFiles = []

		acceptedFiles.forEach((file) => {
			const validation = validateFile(file, null)
			if (validation.isValid) {
				validFiles.push(file)
			} else {
				toast.error(validation.error || 'Invalid file type')
			}
		})

		if (validFiles.length > 0) {
			setDocuments((prev) => [...prev, ...validFiles])
		}
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png'],
			'application/pdf': ['.pdf'],
		},
		maxFiles: 10,
		maxSize: 10 * 1024 * 1024, // 10MB
	})

	const removeDocument = (index) => {
		setDocuments((prev) => prev.filter((_, i) => i !== index))
	}

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
		// Clear error for this field when user starts typing
		if (fieldErrors[name]) {
			setFieldErrors({
				...fieldErrors,
				[name]: '',
			})
		}
	}

	const handleBrandToggle = (brand) => {
		setFormData((prev) => ({
			...prev,
			brands: prev.brands.includes(brand)
				? prev.brands.filter((b) => b !== brand)
				: [...prev.brands, brand],
		}))
	}

	const handleAddBrand = (e) => {
		const selectedBrand = e.target.value
		if (selectedBrand && !formData.brands.includes(selectedBrand)) {
			setFormData((prev) => ({
				...prev,
				brands: [...prev.brands, selectedBrand],
			}))
			// Reset dropdown
			e.target.value = ''
		}
	}

	const handleRemoveBrand = (brandToRemove) => {
		setFormData((prev) => ({
			...prev,
			brands: prev.brands.filter((b) => b !== brandToRemove),
		}))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsSubmitting(true)
		setFieldErrors({}) // Clear previous errors

		if (formData.password !== formData.confirmPassword) {
			toast.error(t('errors.password_mismatch') || 'Passwords do not match')
			setIsSubmitting(false)
			return
		}

		if (documents.length === 0) {
			toast.error(t('errors.documents_required') || 'At least one document is required')
			setIsSubmitting(false)
			return
		}

		try {
			// Upload documents
			const uploadedDocuments = []
			for (const file of documents) {
				const docFormData = new FormData()
				docFormData.append('file', file)

				try {
					console.log('Uploading document:', file.name, file.type, file.size)
					const response = await uploadAPI.uploadFile(docFormData)
					console.log('Upload response:', response.data)
					
					if (response.data && response.data.fileName) {
						uploadedDocuments.push({
							fileName: response.data.fileName,
							fileUrl: response.data.fileUrl,
							mimeType: response.data.mimeType,
						})
					} else {
						throw new Error('Invalid response from upload server')
					}
				} catch (uploadError) {
					console.error('Document upload error:', uploadError)
					console.error('Upload error response:', uploadError.response?.data)
					
					const errorMessage = uploadError.response?.data?.message || uploadError.message || 'Failed to upload document'
					toast.error(`Failed to upload ${file.name}: ${errorMessage}`)
					throw new Error('DOCUMENT_UPLOAD_FAILED')
				}
			}

			// Prepare registration data
			const registrationData = {
				name: formData.name.trim(),
				email: formData.email.trim().toLowerCase(),
				password: formData.password,
				phone: formData.phone?.trim() || '',
				website: formData.website?.trim() || '',
				companyName: formData.companyName.trim(),
				organizationNumber: formData.organizationNumber.trim(),
				address: formData.address.trim(),
				city: formData.city.trim(),
				postalCode: formData.postalCode.trim(),
				description: formData.description?.trim() || '',
				mondayOpen: formData.mondayOpen || '',
				mondayClose: formData.mondayClose || '',
				tuesdayOpen: formData.tuesdayOpen || '',
				tuesdayClose: formData.tuesdayClose || '',
				wednesdayOpen: formData.wednesdayOpen || '',
				wednesdayClose: formData.wednesdayClose || '',
				thursdayOpen: formData.thursdayOpen || '',
				thursdayClose: formData.thursdayClose || '',
				fridayOpen: formData.fridayOpen || '',
				fridayClose: formData.fridayClose || '',
				saturdayOpen: formData.saturdayOpen || '',
				saturdayClose: formData.saturdayClose || '',
				sundayOpen: formData.sundayOpen || '',
				sundayClose: formData.sundayClose || '',
				brands: formData.brands || [],
				documents: uploadedDocuments,
			}

			console.log('Submitting workshop registration...', { 
				email: registrationData.email,
				hasPassword: !!registrationData.password,
				hasName: !!registrationData.name 
			})

			// Create workshop registration
			const response = await workshopAPI.register(registrationData)

			console.log('Registration response:', response)

			if (response.status === 201 || response.data) {
				toast.success(t('workshop.signup.registration_sent') || 'Registration submitted successfully!')
				setTimeout(() => {
					navigate('/auth/signin')
				}, 1500)
			}
		} catch (error) {
			console.error('Registration error:', error)
			console.error('Error response:', error.response?.data)
			
			// Handle field-specific errors
			if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
				const mappedErrors = {}
				Object.keys(error.response.data.errors).forEach((field) => {
					const errorMsg = error.response.data.errors[field]
					// Map backend error messages to translation keys
					if (errorMsg === 'A user with this email address already exists') {
						mappedErrors[field] = t('errors.email_exists') || errorMsg
					} else if (errorMsg === 'A workshop with this organization number already exists') {
						mappedErrors[field] = t('errors.organization_number_exists') || errorMsg
					} else if (errorMsg === 'Email is required') {
						mappedErrors[field] = t('errors.email_required') || errorMsg
					} else if (errorMsg === 'Invalid email format') {
						mappedErrors[field] = t('errors.invalid_email_format') || errorMsg
					} else if (errorMsg === 'Organization number is required') {
						mappedErrors[field] = t('errors.organization_number_required') || errorMsg
					} else {
						mappedErrors[field] = errorMsg
					}
				})
				setFieldErrors(mappedErrors)
				
				// Show first error in toast
				const firstError = Object.values(mappedErrors)[0]
				if (firstError) {
					toast.error(firstError)
				}
			} else {
				// Handle general error message
				let errorMessage = error.response?.data?.message || t('errors.registration_failed') || 'Registration failed'
				if (error.message === 'DOCUMENT_UPLOAD_FAILED') {
					errorMessage = t('errors.document_upload_failed') || 'Failed to upload documents'
				}
				// Show detailed error if available
				if (error.response?.data?.message) {
					errorMessage = error.response.data.message
				}
				console.error('Registration failed:', errorMessage)
				console.error('Full error response:', error.response?.data)
				toast.error(errorMessage)
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="min-h-screen bg-white">
			<Navbar />

			{/* Signup Form */}
			<section id="signup-form" className="bg-white pt-16 sm:pt-20 md:pt-24 pb-12">
				<div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
					<div className="text-center mb-8 sm:mb-10">
						<h1 className="text-xl sm:text-xl md:text-xl font-bold mb-2" style={{ color: '#05324f' }}>
							{t('workshop.signup.title')}
						</h1>
						<p className="text-sm sm:text-base md:text-lg" style={{ color: '#05324f' }}>
							{t('workshop.signup.subtitle')}
						</p>
					</div>

				<form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
					{/* Personal Information */}
					<Card className="rounded-card shadow-card border border-gray-100 bg-white">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-bold" style={{ color: '#05324f' }}>
								{t('workshop.signup.personal_info.title')}
							</CardTitle>
							<CardDescription style={{ color: '#05324f' }}>
								{t('workshop.signup.personal_info.description')}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="name" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.name')}
									</Label>
									<Input
										id="name"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										required
										placeholder={t('workshop.signup.personal_info.name_placeholder')}
									/>
								</div>
								<div>
									<Label htmlFor="email" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.email')}
									</Label>
									<Input
										id="email"
										name="email"
										type="email"
										value={formData.email}
										onChange={(e) => {
											handleInputChange(e)
											if (fieldErrors.email) {
												setFieldErrors({ ...fieldErrors, email: '' })
											}
										}}
										required
										placeholder={t('workshop.signup.personal_info.email_placeholder')}
										className={fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}
									/>
									{fieldErrors.email && (
										<p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
									)}
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="phone" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.phone')}
									</Label>
									<Input
										id="phone"
										name="phone"
										type="tel"
										value={formData.phone}
										onChange={handleInputChange}
										required
										placeholder={t('workshop.signup.personal_info.phone_placeholder')}
									/>
								</div>
								<div>
									<Label htmlFor="website" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.website')}
									</Label>
									<Input
										id="website"
										name="website"
										type="url"
										value={formData.website}
										onChange={handleInputChange}
										placeholder={t('workshop.signup.personal_info.website_placeholder')}
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="password" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.password')}
									</Label>
									<div className="relative">
										<Input
											id="password"
											name="password"
											type={showPassword ? 'text' : 'password'}
											value={formData.password}
											onChange={handleInputChange}
											required
											placeholder={t('workshop.signup.personal_info.password_placeholder')}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
										>
											{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
								</div>
								<div>
									<Label htmlFor="confirmPassword" className="text-sm sm:text-base">
										{t('workshop.signup.personal_info.confirm_password')}
									</Label>
									<div className="relative">
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type={showConfirmPassword ? 'text' : 'password'}
											value={formData.confirmPassword}
											onChange={handleInputChange}
											required
											placeholder={t('workshop.signup.personal_info.confirm_password_placeholder')}
											className="pr-10"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
										>
											{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Company Information */}
					<Card className="rounded-card shadow-card border border-gray-100 bg-white">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: '#05324f' }}>
								<Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#34C759]" />
								{t('workshop.signup.company_info.title')}
							</CardTitle>
							<CardDescription style={{ color: '#05324f' }}>
								{t('workshop.signup.company_info.description')}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="companyName" className="text-sm sm:text-base">
										{t('workshop.signup.company_info.company_name')}
									</Label>
									<Input
										id="companyName"
										name="companyName"
										value={formData.companyName}
										onChange={handleInputChange}
										required
										placeholder={t('workshop.signup.company_info.company_name_placeholder')}
									/>
								</div>
								<div>
									<Label htmlFor="organizationNumber" className="text-sm sm:text-base">
										{t('workshop.signup.company_info.organization_number')}
									</Label>
									<Input
										id="organizationNumber"
										name="organizationNumber"
										value={formData.organizationNumber}
										onChange={(e) => {
											handleInputChange(e)
											if (fieldErrors.organizationNumber) {
												setFieldErrors({ ...fieldErrors, organizationNumber: '' })
											}
										}}
										required
										placeholder={t('workshop.signup.company_info.organization_number_placeholder')}
										className={fieldErrors.organizationNumber ? 'border-red-500 focus:ring-red-500' : ''}
									/>
									{fieldErrors.organizationNumber && (
										<p className="mt-1 text-sm text-red-600">{fieldErrors.organizationNumber}</p>
									)}
								</div>
							</div>
							<div>
								<Label htmlFor="address" className="text-sm sm:text-base">
									{t('workshop.signup.company_info.address')}
								</Label>
								<Input
									id="address"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
									required
									placeholder={t('workshop.signup.company_info.address_placeholder')}
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="city" className="text-sm sm:text-base">
										{t('workshop.signup.company_info.city')}
									</Label>
									<Input
										id="city"
										name="city"
										value={formData.city}
										onChange={handleInputChange}
										required
										placeholder={t('workshop.signup.company_info.city_placeholder')}
									/>
								</div>
								<div>
									<Label htmlFor="postalCode" className="text-sm sm:text-base">
										{t('workshop.signup.company_info.postal_code')}
									</Label>
									<Input
										id="postalCode"
										name="postalCode"
										value={formData.postalCode}
										onChange={handleInputChange}
										required
										placeholder={t('workshop.signup.company_info.postal_code_placeholder')}
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="description" className="text-sm sm:text-base">
									{t('workshop.signup.company_info.description_label')}
								</Label>
								<Textarea
									id="description"
									name="description"
									value={formData.description}
									onChange={handleInputChange}
									placeholder={t('workshop.signup.company_info.description_placeholder')}
									rows={3}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Opening Hours */}
					<Card className="rounded-card shadow-card border border-gray-100 bg-white">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-bold" style={{ color: '#05324f' }}>
								{t('workshop.signup.opening_hours.title')}
							</CardTitle>
							<CardDescription style={{ color: '#05324f' }}>
								{t('workshop.signup.opening_hours.description')}
							</CardDescription>
						</CardHeader>
						<CardContent className="px-3 sm:px-6 pt-0">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
								{['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
									(day) => (
										<div key={day} className="p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/30">
											<Label className="text-xs sm:text-sm font-bold text-[#05324f] mb-2 sm:mb-3 block capitalize">
												{t(`workshop.signup.opening_hours.days.${day}`)}
											</Label>
											<div className="grid grid-cols-2 gap-2 sm:gap-4">
												<div className="space-y-1">
													<Label className="text-[10px] sm:text-xs text-gray-500 block uppercase tracking-wider font-medium">
														{t('workshop.signup.opening_hours.open') || 'Open'}
													</Label>
													<Input
														type="time"
														value={formData[`${day}Open`]}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, [`${day}Open`]: e.target.value }))
														}
														className="h-9 sm:h-12 w-full px-3 text-xs sm:text-sm bg-white"
													/>
												</div>
												<div className="space-y-1">
													<Label className="text-[10px] sm:text-xs text-gray-500 block uppercase tracking-wider font-medium">
														{t('workshop.signup.opening_hours.close') || 'Close'}
													</Label>
													<Input
														type="time"
														value={formData[`${day}Close`]}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, [`${day}Close`]: e.target.value }))
														}
														className="h-9 sm:h-12 w-full px-3 text-xs sm:text-sm bg-white"
													/>
												</div>
											</div>
										</div>
									),
								)}
							</div>
						</CardContent>
					</Card>

					{/* Brands */}
					<Card className="rounded-card shadow-card border border-gray-100 bg-white">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-bold" style={{ color: '#05324f' }}>
								{t('workshop.signup.brands.title')}
							</CardTitle>
							<CardDescription style={{ color: '#05324f' }}>
								{t('workshop.signup.brands.description')}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Dropdown to add brands */}
							<div className="space-y-2">
								<Label htmlFor="brandSelect" className="text-sm sm:text-base font-semibold text-gray-700 block">
									{t('workshop.signup.brands.select_brand') || 'Select car brand'}
								</Label>
								<div className="relative">
									<select
										id="brandSelect"
										onChange={handleAddBrand}
										className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3 pr-10 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-[#34C759] hover:bg-white transition-all appearance-none cursor-pointer"
										defaultValue=""
									>
										<option value="" disabled hidden>
											{t('workshop.signup.brands.select_placeholder') || 'Select a brand...'}
										</option>
										{carBrands
											.filter((brand) => !formData.brands.includes(brand))
											.map((brand) => (
												<option key={brand} value={brand}>
													{brand}
												</option>
											))}
									</select>
									<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
										<ChevronDown className="w-5 h-5 text-gray-400" />
									</div>
								</div>
							</div>

							{/* Selected brands list */}
							{formData.brands.length > 0 && (
								<div>
									<Label className="text-sm sm:text-base mb-2 block">
										{t('workshop.signup.brands.selected_brands') || 'Selected brands:'}
									</Label>
									<div className="flex flex-wrap gap-2">
										{formData.brands.map((brand) => (
											<div
												key={brand}
												className="inline-flex items-center gap-2 px-4 py-2 bg-[#34C759]/10 text-[#34C759] rounded-full text-sm font-medium border border-[#34C759]/20 hover:bg-[#34C759]/20 transition-colors"
											>
												<span>{brand}</span>
												<button
													type="button"
													onClick={() => handleRemoveBrand(brand)}
													className="hover:bg-[#34C759]/30 rounded-full p-0.5 transition-colors"
													aria-label={`${t('workshop.signup.brands.remove')} ${brand}`}
												>
													<X className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Documents */}
					<Card className="rounded-card shadow-card border border-gray-100 bg-white">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-bold" style={{ color: '#05324f' }}>
								{t('workshop.signup.documents.title')}
							</CardTitle>
							<CardDescription style={{ color: '#05324f' }}>
								{t('workshop.signup.documents.description')}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div
								{...getRootProps()}
								className={`border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-all ${
									isDragActive
										? 'border-[#34C759] bg-[#34C759]/10 shadow-lg scale-[1.02]'
										: 'border-gray-300 hover:border-[#34C759] hover:bg-[#34C759]/5 hover:shadow-md'
								}`}
							>
								<input {...getInputProps()} />
								<Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
								{isDragActive ? (
									<p className="text-sm sm:text-base md:text-lg text-[#34C759] font-semibold">
										{t('workshop.signup.documents.drop_here')}
									</p>
								) : (
									<div>
										<p className="text-sm sm:text-base md:text-lg text-gray-600 mb-2">
											{t('workshop.signup.documents.drag_drop')}
										</p>
										<p className="text-xs sm:text-sm text-gray-500">
											{t('workshop.signup.documents.file_types')}
										</p>
									</div>
								)}
							</div>

							{documents.length > 0 && (
								<div className="mt-4 sm:mt-6 space-y-2">
									<h4 className="font-medium text-sm sm:text-base">
										{t('workshop.signup.documents.uploaded_documents')}
									</h4>
									{documents.map((file, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
										>
											<div className="flex items-center gap-2 sm:gap-3">
												<span className="text-xl sm:text-2xl">{getFileIcon(file.type)}</span>
												<div className="flex-1 min-w-0">
													<p className="font-medium text-xs sm:text-sm truncate">{file.name}</p>
													<p className="text-xs text-gray-500">
														{(file.size / 1024 / 1024).toFixed(2)} MB
													</p>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeDocument(index)}
												className="flex-shrink-0"
											>
												<X className="w-3 h-3 sm:w-4 sm:h-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Submit */}
					<div className="flex justify-end pt-4">
						<Button 
							type="submit" 
							size="default" 
							className="w-full sm:w-auto text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:ring-4 disabled:opacity-50" 
							style={{ 
								backgroundColor: '#34C759',
								backgroundImage: 'none',
							}}
							onMouseEnter={(e) => e.target.style.backgroundColor = '#2db04a'}
							onMouseLeave={(e) => e.target.style.backgroundColor = '#34C759'}
							onFocus={(e) => e.target.style.boxShadow = '0 0 0 4px rgba(52, 199, 89, 0.3)'}
							onBlur={(e) => e.target.style.boxShadow = ''}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									{t('workshop.signup.submitting')}
								</>
							) : (
								t('workshop.signup.submit')
							)}
						</Button>
					</div>
				</form>

				<div className="text-center mt-6 sm:mt-8">
					<p className="text-xs sm:text-sm text-gray-600">
						{t('workshop.signup.already_account')}{' '}
						<Link to="/auth/signin" className="font-medium text-green-600 hover:text-green-800">
							{t('workshop.signup.sign_in_here')}
						</Link>
					</p>
				</div>
				</div>
			</section>
			<Footer />
		</div>
	)
}

