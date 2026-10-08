import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { Eye, EyeOff, Plus, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Input } from '../components/ui/Input'
import { PhoneInput } from '../components/ui/PhoneInput'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { validateFile } from '../utils/cn'
import { uploadAPI, workshopAPI } from '../services/api'

export default function WorkshopSignupPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const fieldLabel = 'block text-sm lg:text-base font-semibold text-brand-dark mb-2.5'
	const fieldInput =
		'h-12 lg:h-16 w-full min-w-0 rounded-xl lg:rounded-2xl border border-gray-200 bg-white text-sm lg:text-base shadow-none focus:ring-0 focus:border-[#008037] hover:bg-white'
	const timeLabel = 'block text-sm font-semibold text-brand-dark mb-1.5'
	
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

	const [dayEnabled, setDayEnabled] = useState({
		monday: true,
		tuesday: true,
		wednesday: true,
		thursday: true,
		friday: true,
		saturday: true,
		sunday: false,
	})
	const dayDefaults = {
		monday: { open: '08:00', close: '17:00' },
		tuesday: { open: '08:00', close: '17:00' },
		wednesday: { open: '08:00', close: '17:00' },
		thursday: { open: '08:00', close: '17:00' },
		friday: { open: '08:00', close: '17:00' },
		saturday: { open: '09:00', close: '15:00' },
		sunday: { open: '10:00', close: '14:00' },
	}

	const [documents, setDocuments] = useState([])
	const [profileImage, setProfileImage] = useState(null)
	const [profilePreview, setProfilePreview] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [fieldErrors, setFieldErrors] = useState({})

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

	const handleProfileImage = (event) => {
		const file = event.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith('image/')) {
			toast.error(t('errors.invalid_file_type') || 'Only JPG and PNG images are allowed')
			return
		}
		const validation = validateFile(file, t)
		if (!validation.isValid) {
			toast.error(validation.error || 'Invalid file')
			return
		}
		if (profilePreview) URL.revokeObjectURL(profilePreview)
		setProfileImage(file)
		setProfilePreview(URL.createObjectURL(file))
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
			let imageUrl = ''
			if (profileImage) {
				const imageFormData = new FormData()
				imageFormData.append('file', profileImage)
				const imageResponse = await uploadAPI.uploadFile(imageFormData)
				imageUrl = imageResponse.data?.fileUrl || ''
				if (!imageUrl) throw new Error('DOCUMENT_UPLOAD_FAILED')
			}

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
				name: (formData.name.trim() || formData.companyName.trim()),
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
				mondayOpen: dayEnabled.monday ? formData.mondayOpen || '' : '',
				mondayClose: dayEnabled.monday ? formData.mondayClose || '' : '',
				tuesdayOpen: dayEnabled.tuesday ? formData.tuesdayOpen || '' : '',
				tuesdayClose: dayEnabled.tuesday ? formData.tuesdayClose || '' : '',
				wednesdayOpen: dayEnabled.wednesday ? formData.wednesdayOpen || '' : '',
				wednesdayClose: dayEnabled.wednesday ? formData.wednesdayClose || '' : '',
				thursdayOpen: dayEnabled.thursday ? formData.thursdayOpen || '' : '',
				thursdayClose: dayEnabled.thursday ? formData.thursdayClose || '' : '',
				fridayOpen: dayEnabled.friday ? formData.fridayOpen || '' : '',
				fridayClose: dayEnabled.friday ? formData.fridayClose || '' : '',
				saturdayOpen: dayEnabled.saturday ? formData.saturdayOpen || '' : '',
				saturdayClose: dayEnabled.saturday ? formData.saturdayClose || '' : '',
				sundayOpen: dayEnabled.sunday ? formData.sundayOpen || '' : '',
				sundayClose: dayEnabled.sunday ? formData.sundayClose || '' : '',
				brands: formData.brands || [],
				documents: uploadedDocuments,
				image: imageUrl,
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
					navigate('/workshop/login')
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
		<div className="list-page-shell bg-[#F3F5F8]">
			<Navbar />
			<section id="signup-form" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-0" noValidate>
				<div className="grid gap-4 lg:gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-stretch">
					<div className="min-w-0 lg:h-full flex flex-col bg-white rounded-2xl lg:rounded-3xl border border-[#EEF1F4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-4 sm:p-5 lg:p-8">
						<h1 className="page-title !mt-0 lg:text-[2.75rem]">{t('workshop.signup.title')}</h1>
						<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-relaxed mt-3 lg:mt-4 mb-6 lg:mb-8">
							{t('workshop.signup.subtitle')}
						</p>

						<div className="flex justify-center mb-6">
							<label htmlFor="profileImage" className="relative h-28 w-28 cursor-pointer">
								<span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-[#F3F5F8]">
									{profilePreview ? (
										<img src={profilePreview} alt="" className="h-full w-full object-cover" />
									) : (
										<User className="w-10 h-10 text-[#9CA3AF]" strokeWidth={1.75} />
									)}
								</span>
								<span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-btn text-white shadow-sm">
									<Plus className="h-5 w-5" strokeWidth={2.5} />
								</span>
								<input
									id="profileImage"
									type="file"
									accept="image/jpeg,image/png,image/jpg"
									className="sr-only"
									onChange={handleProfileImage}
								/>
							</label>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
							<div className="min-w-0">
								<Label htmlFor="companyName" className={fieldLabel}>
									{t('workshop.signup.company_info.company_name')}
								</Label>
								<Input
									id="companyName"
									name="companyName"
									value={formData.companyName}
									onChange={handleInputChange}
									required
									placeholder={t('workshop.signup.company_info.company_name_placeholder')}
									className={fieldInput}
								/>
							</div>
							<div className="min-w-0">
								<Label htmlFor="organizationNumber" className={fieldLabel}>
									{t('workshop.signup.company_info.organization_number')}
								</Label>
								<Input
									id="organizationNumber"
									name="organizationNumber"
									value={formData.organizationNumber}
									onChange={(e) => {
										handleInputChange(e)
										if (fieldErrors.organizationNumber) setFieldErrors({ ...fieldErrors, organizationNumber: '' })
									}}
									required
									placeholder={t('workshop.signup.company_info.organization_number_placeholder')}
									className={`${fieldInput} ${fieldErrors.organizationNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
								/>
								{fieldErrors.organizationNumber && (
									<p className="mt-1 text-xs text-red-600">{fieldErrors.organizationNumber}</p>
								)}
							</div>
							<div className="min-w-0">
								<Label htmlFor="address" className={fieldLabel}>
									{t('workshop.signup.company_info.address')}
								</Label>
								<Input
									id="address"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
									required
									placeholder={t('workshop.signup.company_info.address_placeholder')}
									className={fieldInput}
								/>
							</div>
							<div className="min-w-0">
								<Label htmlFor="website" className={fieldLabel}>
									{t('workshop.signup.personal_info.website')}
								</Label>
								<Input
									id="website"
									name="website"
									type="url"
									value={formData.website}
									onChange={handleInputChange}
									placeholder={t('workshop.signup.personal_info.website_placeholder')}
									className={fieldInput}
								/>
							</div>
							<div className="min-w-0">
								<Label htmlFor="email" className={fieldLabel}>
									{t('workshop.signup.personal_info.email')}
								</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={(e) => {
										handleInputChange(e)
										if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
									}}
									required
									placeholder={t('workshop.signup.personal_info.email_placeholder')}
									className={`${fieldInput} ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
								/>
								{fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
							</div>
							<div className="min-w-0">
								<Label htmlFor="phone" className={fieldLabel}>
									{t('workshop.signup.personal_info.phone')}
								</Label>
								<PhoneInput
									id="phone"
									name="phone"
									value={formData.phone}
									onChange={handleInputChange}
									required
									placeholder={t('workshop.signup.personal_info.phone')}
									inputClassName={fieldInput}
									prefixClassName="h-12 lg:h-16 rounded-l-xl lg:rounded-l-2xl border border-gray-200 border-r-0 bg-white px-3.5 lg:px-4 text-sm lg:text-base font-medium text-brand-dark"
								/>
							</div>
							<div className="min-w-0">
								<Label htmlFor="password" className={fieldLabel}>
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
										className={`${fieldInput} pr-11`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
							</div>
							<div className="min-w-0">
								<Label htmlFor="confirmPassword" className={fieldLabel}>
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
										className={`${fieldInput} pr-11`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
									>
										{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
							</div>
						</div>

						<div className="mt-4">
							<Label htmlFor="description" className={fieldLabel}>
								{t('workshop.signup.company_info.description_label')}
							</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder={t('workshop.signup.company_info.description_placeholder')}
								rows={3}
								className={`${fieldInput} min-h-[7.5rem] py-3 h-auto`}
							/>
						</div>

						<div className="mt-4">
							<Label className={fieldLabel}>{t('workshop.signup.documents.title')}</Label>
							<div
								{...getRootProps()}
								className={`${fieldInput} flex items-center px-4 cursor-pointer text-[#6B7280] overflow-hidden ${
									isDragActive ? 'border-[#008037]' : ''
								}`}
							>
								<input {...getInputProps()} />
								<span className="truncate text-sm">
									{documents.length > 0
										? documents.map((file) => file.name).join(', ')
										: t('workshop.signup.documents.drag_drop')}
								</span>
							</div>
							{documents.length > 0 && (
								<ul className="mt-2 space-y-1">
									{documents.map((file, index) => (
										<li
											key={`${file.name}-${index}`}
											className="flex items-center justify-between gap-2 text-sm text-[#374151]"
										>
											<span className="truncate min-w-0">{file.name}</span>
											<button
												type="button"
												onClick={() => removeDocument(index)}
												className="shrink-0 text-gray-400 hover:text-gray-600"
											>
												<X className="w-4 h-4" />
											</button>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="mt-auto pt-6 max-lg:hidden">
							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full min-h-[52px] lg:min-h-[64px] rounded-xl bg-brand-btn text-white font-semibold text-base lg:text-lg"
							>
								{isSubmitting ? t('workshop.signup.submitting') : t('workshop.signup.submit')}
							</Button>
							<p className="text-sm text-gray-600 text-center mt-5">
								{t('workshop.signup.already_account')}{' '}
								<Link to="/workshop/login" className="font-medium text-[#008037] hover:underline">
									{t('workshop.signup.sign_in_here')}
								</Link>
							</p>
						</div>
					</div>

					<div className="min-w-0 lg:h-full flex flex-col bg-white rounded-2xl lg:rounded-3xl border border-[#EEF1F4] shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-4 sm:p-5 lg:p-8">
						<h2 className="page-title !mt-0 lg:text-[2.75rem] shrink-0">
							{t('workshop.signup.opening_hours.title')}
						</h2>
						<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-relaxed mt-2 lg:mt-4 mb-4 lg:mb-5 shrink-0">
							{t('workshop.signup.opening_hours.description')}
						</p>
						<div className="flex flex-col gap-3 lg:flex-1 lg:justify-between lg:min-h-0">
							{['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
								const enabled = Boolean(dayEnabled[day])
								return (
									<div
										key={day}
										className={`p-3 rounded-xl border border-gray-100 ${enabled ? '' : 'bg-[#F9FAFB]'}`}
									>
										<div className="flex items-center justify-between gap-3 mb-2">
											<Label className="text-sm font-semibold text-brand-dark">
												{t(`workshop.signup.opening_hours.days.${day}`)}
											</Label>
											<button
												type="button"
												role="switch"
												aria-checked={enabled}
												aria-label={`${t(`workshop.signup.opening_hours.days.${day}`)} ${
													enabled
														? t('workshop.signup.opening_hours.day_on')
														: t('workshop.signup.opening_hours.day_off')
												}`}
												onClick={() => {
													setDayEnabled((prev) => {
														const nextOn = !prev[day]
														if (nextOn) {
															const defaults = dayDefaults[day]
															setFormData((form) => ({
																...form,
																[`${day}Open`]: form[`${day}Open`] || defaults.open,
																[`${day}Close`]: form[`${day}Close`] || defaults.close,
															}))
														}
														return { ...prev, [day]: nextOn }
													})
												}}
												className={`relative w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
													enabled ? 'bg-[#008037]' : 'bg-gray-200'
												}`}
											>
												<span
													className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
														enabled ? 'translate-x-5' : 'translate-x-0'
													}`}
												/>
											</button>
										</div>
										{enabled ? (
											<div className="grid grid-cols-2 gap-4">
												<div className="min-w-0">
													<Label className={timeLabel}>{t('workshop.signup.opening_hours.open')}</Label>
													<Input
														type="time"
														value={formData[`${day}Open`]}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, [`${day}Open`]: e.target.value }))
														}
														className={`${fieldInput} !h-12 lg:!h-16 text-center px-2`}
													/>
												</div>
												<div className="min-w-0">
													<Label className={timeLabel}>{t('workshop.signup.opening_hours.close')}</Label>
													<Input
														type="time"
														value={formData[`${day}Close`]}
														onChange={(e) =>
															setFormData((prev) => ({ ...prev, [`${day}Close`]: e.target.value }))
														}
														className={`${fieldInput} !h-12 lg:!h-16 text-center px-2`}
													/>
												</div>
											</div>
										) : (
											<p className="text-sm text-[#9CA3AF] py-1">
												{t('workshop.signup.opening_hours.day_off')}
											</p>
										)}
									</div>
								)
							})}
						</div>
					</div>
				</div>

					<div className="lg:hidden w-full pt-1 pb-2">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="w-full min-h-[52px] rounded-xl bg-brand-btn text-white font-semibold text-base"
						>
							{isSubmitting ? t('workshop.signup.submitting') : t('workshop.signup.submit')}
						</Button>
						<p className="text-sm text-gray-600 text-center mt-5">
							{t('workshop.signup.already_account')}{' '}
							<Link to="/workshop/login" className="font-medium text-[#008037] hover:underline">
								{t('workshop.signup.sign_in_here')}
							</Link>
						</p>
					</div>
				</form>
			</section>
			<Footer />
		</div>
	)
}

