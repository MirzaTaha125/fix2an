import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/Select'
import toast from 'react-hot-toast'
import { Upload, X, Car } from 'lucide-react'
import { validateFile, getFileIcon } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CustomerBottomNav from '../components/CustomerBottomNav'
import { uploadAPI, vehiclesAPI, requestsAPI } from '../services/api'

export default function UploadPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()

	const [files, setFiles] = useState([])
	const [vehicleData, setVehicleData] = useState({
		make: '',
		model: '',
		year: new Date().getFullYear(),
	})
	const [description, setDescription] = useState('')
	const [isUploading, setIsUploading] = useState(false)

	const onDrop = useCallback(
		(acceptedFiles) => {
			const validFiles = []

			acceptedFiles.forEach((file) => {
				const validation = validateFile(file, t)
				if (validation.isValid) {
					validFiles.push(file)
				} else {
					toast.error(validation.error)
				}
			})

			if (validFiles.length > 0) {
				setFiles((prev) => {
					const newFiles = [...prev, ...validFiles].slice(0, 5) // Max 5 files
					return newFiles
				})
			}
		},
		[t]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png'],
			'application/pdf': ['.pdf'],
		},
		maxFiles: 5,
		maxSize: 10 * 1024 * 1024, // 10MB
	})

	// Show loading state while checking auth
	if (authLoading) {
		return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>
	}

	// Redirect if not authenticated
	if (!user || user.role !== 'CUSTOMER') {
		navigate('/auth/signin', { replace: true })
		return null
	}

	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (files.length === 0) {
			toast.error(t('errors.file_required'))
			return
		}

		if (!vehicleData.make || !vehicleData.model) {
			toast.error(t('errors.vehicle_info_required'))
			return
		}

		setIsUploading(true)

		try {
			// Upload files one by one
			const uploadedFiles = []
			for (const file of files) {
				const formData = new FormData()
				formData.append('file', file)

				try {
					const response = await uploadAPI.uploadFile(formData)
					// Backend returns: { id, fileName, fileUrl, fileSize, mimeType }
					uploadedFiles.push(response.data)
				} catch (error) {
					console.error('File upload error:', error)
					throw new Error(error.response?.data?.message || 'File upload failed')
				}
			}

			// Use the first uploaded file's report ID
			// In the new backend, each upload creates an InspectionReport
			const reportId = uploadedFiles[0]?.id || uploadedFiles[0]?._id

			if (!reportId) {
				throw new Error('No report ID received from file upload')
			}

			// Create vehicle
			let vehicle
			try {
				const vehicleResponse = await vehiclesAPI.create(vehicleData)
				vehicle = vehicleResponse.data
			} catch (error) {
				console.error('Vehicle creation error:', error)
				throw new Error(error.response?.data?.message || 'Vehicle creation failed')
			}

			// Get vehicle ID (backend may return _id or id)
			const vehicleId = vehicle._id || vehicle.id
			if (!vehicleId) {
				throw new Error('No vehicle ID received from vehicle creation')
			}

			// Create request with default values if not provided
			// Backend will set customerId from authenticated user
			const requestBody = {
				vehicleId: vehicleId,
				reportId: reportId,
				description,
				latitude: user.latitude || 59.3293, // Default to Stockholm
				longitude: user.longitude || 18.0686,
				address: user.address || 'Stockholm',
				city: user.city || 'Stockholm',
				postalCode: user.postalCode || '111 22',
				country: user.country || 'SE',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
			}

			try {
				await requestsAPI.create(requestBody)
				toast.success(t('success.request_sent'))
				navigate('/my-cases')
			} catch (error) {
				console.error('Request creation error:', error)
				throw new Error(error.response?.data?.message || 'Request creation failed')
			}
		} catch (error) {
			console.error('Upload error:', error)
			const errorMessage = error?.message || t('errors.upload_failed')
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	const carMakes = [
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

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-24">
			<div className="text-center mb-8">
				<h1 className="text-h1 font-bold text-[#05324f] mb-2">{t('upload.title')}</h1>
				<p className="text-base text-gray-500">{t('upload.subtitle')}</p>
			</div>

				<form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">
					{/* File Upload */}
					<Card>
						<CardHeader className="pb-3 sm:pb-4">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<Upload className="w-4 h-4 sm:w-5 sm:h-5" />
								{t('upload.file_upload.title')}
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">{t('upload.file_upload.description')}</CardDescription>
						</CardHeader>
						<CardContent className="px-4 sm:px-6">
							<div
								{...getRootProps()}
								className={`border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer transition-colors ${
									isDragActive
										? 'border-primary bg-primary/5'
										: 'border-gray-300 hover:border-primary hover:bg-gray-50'
								}`}
							>
								<input {...getInputProps()} />
								<Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
								{isDragActive ? (
									<p className="text-sm sm:text-base md:text-lg text-primary">{t('upload.file_upload.drop_here')}</p>
								) : (
									<div>
										<p className="text-sm sm:text-base md:text-lg text-gray-600 mb-2">{t('upload.file_upload.drag_drop')}</p>
										<p className="text-xs sm:text-sm text-gray-500">{t('upload.file_upload.file_types')}</p>
									</div>
								)}
							</div>

							{files.length > 0 && (
								<div className="mt-4 sm:mt-6 space-y-2">
									<h4 className="font-medium text-sm sm:text-base">{t('upload.file_upload.uploaded_files')}</h4>
									{files.map((file, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
										>
											<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
												<span className="text-xl sm:text-2xl flex-shrink-0">{getFileIcon(file.type)}</span>
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
												onClick={() => removeFile(index)}
												className="flex-shrink-0"
											>
												<X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Vehicle Information */}
					<Card>
						<CardHeader className="pb-3 sm:pb-4">
							<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
								<Car className="w-4 h-4 sm:w-5 sm:h-5" />
								{t('upload.vehicle_info.title')}
							</CardTitle>
							<CardDescription className="text-xs sm:text-sm">{t('upload.vehicle_info.description')}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
								<div>
									<Label htmlFor="make" className="text-sm sm:text-base mb-2 block">{t('upload.vehicle_info.make')}</Label>
									<Select
										value={vehicleData.make || ''}
										onValueChange={(value) => setVehicleData((prev) => ({ ...prev, make: value }))}
									>
										<SelectTrigger className="h-10 sm:h-11 w-full text-sm sm:text-base border-2 hover:border-primary/50 focus:border-primary transition-colors shadow-sm hover:shadow-md bg-white">
											<SelectValue placeholder={t('upload.vehicle_info.make_placeholder')} />
										</SelectTrigger>
										<SelectContent className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
											{carMakes
												.filter((make) => make.trim() !== '')
												.map((make) => (
													<SelectItem 
														key={make} 
														value={make}
														className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 text-sm sm:text-base py-2"
													>
														{make}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="model" className="text-sm sm:text-base mb-2 block">{t('upload.vehicle_info.model')}</Label>
									<Input
										id="model"
										value={vehicleData.model}
										onChange={(e) => setVehicleData((prev) => ({ ...prev, model: e.target.value }))}
										placeholder={t('upload.vehicle_info.model_placeholder')}
										className="text-sm sm:text-base h-10 sm:h-11 border-2 hover:border-primary/50 focus:border-primary transition-colors shadow-sm hover:shadow-md"
									/>
								</div>
								<div>
									<Label htmlFor="year" className="text-sm sm:text-base mb-2 block">{t('upload.vehicle_info.year_label')}</Label>
									<Input
										id="year"
										type="number"
										min="1990"
										max={new Date().getFullYear() + 1}
										value={vehicleData.year}
										onChange={(e) =>
											setVehicleData((prev) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
										}
										className="text-sm sm:text-base h-10 sm:h-11 border-2 hover:border-primary/50 focus:border-primary transition-colors shadow-sm hover:shadow-md"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Description */}
					<Card>
						<CardHeader className="pb-3 sm:pb-4">
							<CardTitle className="text-base sm:text-lg">{t('upload.description.title')}</CardTitle>
							<CardDescription className="text-xs sm:text-sm">{t('upload.description.description')}</CardDescription>
						</CardHeader>
						<CardContent className="px-4 sm:px-6">
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('upload.description.placeholder')}
								rows={4}
								className="text-sm sm:text-base"
							/>
						</CardContent>
					</Card>

					{/* Submit */}
					<div className="flex justify-end">
						<Button type="submit" size="default" className="w-full sm:w-auto text-sm sm:text-base" disabled={isUploading || files.length === 0}>
							{isUploading ? t('upload.submitting') : t('upload.submit')}
						</Button>
					</div>
				</form>
			</div>
			<CustomerBottomNav />
			<Footer />
		</div>
	)
}
