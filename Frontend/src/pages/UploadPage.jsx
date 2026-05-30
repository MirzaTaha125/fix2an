import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Upload, X, Car, MapPin, MessageSquare, ShieldCheck, Clock as ClockIcon, Lock, Check, ArrowRight } from 'lucide-react'
import { validateFile, getFileIcon } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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
	const [registrationNumber, setRegistrationNumber] = useState('')
	const [postalCode, setPostalCode] = useState('')
	const [description, setDescription] = useState('')
	const [currentStep, setCurrentStep] = useState('upload')
	const [searchParams] = useSearchParams()
	const editId = searchParams.get('edit') || searchParams.get('requestId')
	const [existingRequest, setExistingRequest] = useState(null)
	const [isUploading, setIsUploading] = useState(false)

	// Load existing request data if editing
	useEffect(() => {
		if (editId) {
			const fetchRequest = async () => {
				try {
					const response = await requestsAPI.getById(editId)
					const request = response.data
					setExistingRequest(request)
					
					if (request.vehicleId) {
						setVehicleData({
							make: request.vehicleId.make || '',
							model: request.vehicleId.model || '',
							year: request.vehicleId.year || new Date().getFullYear(),
						})
					}
					
					setDescription(request.description || '')
					// We don't pre-fill files for now as it's complex with dropzone/blob
				} catch (error) {
					console.error('Fetch request for edit error:', error)
					toast.error('Failed to load request data')
				}
			}
			fetchRequest()
		}
	}, [editId])

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
			'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
			'application/pdf': ['.pdf'],
		},
		maxFiles: 5,
		maxSize: 10 * 1024 * 1024, // 10MB
	})

	// Show loading state while checking auth
	if (authLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 max-md:pb-24">
					<div className="text-center mb-8">
						<Skeleton className="h-10 sm:h-12 w-64 md:w-80 mx-auto mb-4" />
						<Skeleton className="h-5 w-48 md:w-64 mx-auto" />
					</div>
					<div className="space-y-5 sm:space-y-6 md:space-y-8">
						{/* Upload Box Skeleton */}
						<Card>
							<CardHeader className="pb-3 sm:pb-4">
								<Skeleton className="h-6 w-40 mb-2" />
								<Skeleton className="h-4 w-64 max-w-[80%]" />
							</CardHeader>
							<CardContent className="px-4 sm:px-6">
								<Skeleton className="h-32 sm:h-40 md:h-48 w-full rounded-xl" />
							</CardContent>
						</Card>
						{/* Form Box Skeleton */}
						<Card>
							<CardHeader className="pb-3 sm:pb-4">
								<Skeleton className="h-6 w-48 mb-2" />
								<Skeleton className="h-4 w-72 max-w-[90%]" />
							</CardHeader>
							<CardContent className="px-4 sm:px-6 space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 lg:h-11 w-full rounded-md" /></div>
									<div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 lg:h-11 w-full rounded-md" /></div>
									<div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 lg:h-11 w-full rounded-md" /></div>
									<div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 lg:h-11 w-full rounded-md" /></div>
									<div className="space-y-2 sm:col-span-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-24 w-full rounded-md" /></div>
								</div>
								<div className="pt-4 border-t border-gray-100 flex justify-end">
									<Skeleton className="h-10 w-full sm:w-32 rounded-md" />
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
				
				<Footer />
			</div>
		)
	}

	// Redirect if not authenticated
	const userRole = user?.role?.toUpperCase()
	if (!user || userRole !== 'CUSTOMER') {
		navigate('/auth/signin', { replace: true })
		return null
	}

	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!vehicleData.make || !vehicleData.model) {
			toast.error(t('errors.vehicle_info_required'))
			return
		}

		setIsUploading(true)

		try {
			if (editId && existingRequest) {
				// Update existing request
				const updateBody = {
					description,
					// Only update vehicle if it changed
					...( (vehicleData.make !== existingRequest.vehicleId?.make || 
						  vehicleData.model !== existingRequest.vehicleId?.model || 
						  vehicleData.year !== existingRequest.vehicleId?.year) ? {
						vehicleId: (await vehiclesAPI.create(vehicleData)).data._id
					} : {} )
				}

				await requestsAPI.update(editId, updateBody)
				toast.success(t('success.request_updated') || 'Request updated successfully')
				navigate('/my-cases')
			} else {
				// Create new request
				if (files.length === 0) {
					toast.error(t('errors.file_required'))
					setIsUploading(false)
					return
				}

				// Upload files one by one
				const uploadedFiles = []
				for (const file of files) {
					const formData = new FormData()
					formData.append('file', file)

					try {
						const response = await uploadAPI.uploadFile(formData)
						uploadedFiles.push(response.data)
					} catch (error) {
						console.error('File upload error:', error)
						throw new Error(error.response?.data?.message || 'File upload failed')
					}
				}

				const reportIds = uploadedFiles.map(file => file.id || file._id)
				const vehicleResponse = await vehiclesAPI.create(vehicleData)
				const vehicleId = vehicleResponse.data._id || vehicleResponse.data.id

				// Geocode postal code to lat/lng (Nominatim — free, no key)
				let geoLat = user.latitude || 59.3293
				let geoLng = user.longitude || 18.0686
				let geoCity = user.city || 'Stockholm'
				const usePostal = (postalCode || user.postalCode || '').trim()
				if (usePostal) {
					try {
						const cleaned = usePostal.replace(/\s+/g, '')
						const resp = await fetch(
							`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleaned)}&country=Sweden&format=json&limit=1`,
							{ headers: { 'Accept-Language': 'sv' } }
						)
						const data = await resp.json()
						if (Array.isArray(data) && data[0]) {
							geoLat = parseFloat(data[0].lat) || geoLat
							geoLng = parseFloat(data[0].lon) || geoLng
							const display = (data[0].display_name || '').split(',')
							if (display.length > 1) geoCity = display[1].trim() || geoCity
						}
					} catch (geoErr) {
						console.warn('Geocoding failed, using defaults:', geoErr)
					}
				}

				const requestBody = {
					vehicleId: vehicleId,
					reportIds: reportIds,
					description,
					registrationNumber: registrationNumber || undefined,
					latitude: geoLat,
					longitude: geoLng,
					address: user.address || geoCity,
					city: geoCity,
					postalCode: usePostal || '111 22',
					country: user.country || 'SE',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				}

				await requestsAPI.create(requestBody)
				toast.success(t('success.request_sent'))
				navigate('/my-cases')
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

	const steps = [
		{
			key: 'step1',
			label: t('upload.form.step1') || 'Upload report',
			state: currentStep === 'upload' ? 'active' : 'done',
		},
		{
			key: 'step2',
			label: t('upload.form.step2') || 'Fill in details',
			state: currentStep === 'details' ? 'active' : 'pending',
		},
	]

	const handleNextStep = () => {
		if (files.length === 0) {
			toast.error(t('errors.file_required') || 'Please upload at least one file')
			return
		}
		setCurrentStep('details')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	return (
		<div className="min-h-screen bg-[#FAFBFC] flex flex-col">
			<Navbar />
			<div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-20 max-md:pb-24">
				{/* Step Indicator */}
				<div className="flex items-center justify-center mb-8">
					{steps.map((step, idx) => (
						<div key={step.key} className="flex items-center">
							<div className="flex flex-col items-center">
								<div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
									step.state === 'done' ? 'bg-[#38BC54] text-white' :
									step.state === 'active' ? 'bg-[#38BC54] text-white shadow-md shadow-green-200' :
									'bg-gray-200 text-gray-400'
								}`}>
									{step.state === 'done' ? <Check className="w-5 h-5" strokeWidth={3} /> : idx + 1}
								</div>
								<span className={`text-[11px] sm:text-xs font-bold mt-2 whitespace-nowrap ${
									step.state === 'pending' ? 'text-gray-400' : 'text-[#05324f]'
								}`}>
									{step.label}
								</span>
							</div>
							{idx < steps.length - 1 && (
								<div className={`h-[2px] w-10 sm:w-16 mx-1 sm:mx-2 -mt-6 ${
									steps[idx + 1].state !== 'pending' ? 'bg-[#38BC54]' : 'bg-gray-200'
								}`} />
							)}
						</div>
					))}
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Step 1: File Upload Card */}
					{currentStep === 'upload' && (
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
						<div className="mb-3">
							<h2 className="flex items-center gap-2 text-base font-black text-[#05324f]">
								<Upload className="w-5 h-5 text-[#38BC54]" />
								{t('upload.file_upload.title')}
							</h2>
						</div>
						<div
							{...getRootProps()}
							className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-colors ${
								isDragActive
									? 'border-[#38BC54] bg-[#F2F9F4]'
									: 'border-gray-200 hover:border-[#38BC54] hover:bg-[#F2F9F4]/50'
							}`}
						>
							<input {...getInputProps()} />
							<Upload className="w-9 h-9 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
							{isDragActive ? (
								<p className="text-sm font-semibold text-[#38BC54]">{t('upload.file_upload.drop_here')}</p>
							) : (
								<div>
									<p className="text-sm font-semibold text-[#05324f] mb-1">{t('upload.file_upload.drag_drop')}</p>
									<p className="text-xs text-gray-400">{t('upload.file_upload.file_types')}</p>
								</div>
							)}
						</div>

						{files.length > 0 && (
							<div className="mt-4 space-y-2">
								{files.map((file, index) => (
									<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<span className="text-xl flex-shrink-0">{getFileIcon(file.type)}</span>
											<div className="flex-1 min-w-0">
												<p className="font-semibold text-xs text-[#05324f] truncate">{file.name}</p>
												<p className="text-[11px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
											</div>
										</div>
										<Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)} className="flex-shrink-0">
											<X className="w-4 h-4" />
										</Button>
									</div>
								))}
							</div>
						)}

						{/* Next button */}
						<Button
							type="button"
							onClick={handleNextStep}
							disabled={files.length === 0}
							className="w-full h-13 mt-5 py-4 text-base font-black bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
						>
							{t('common.next') || 'Next'} <ArrowRight className="w-5 h-5" />
						</Button>
					</div>
					)}

					{/* Step 2: Form Card */}
					{currentStep === 'details' && (
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
						<div className="text-center mb-6">
							<h1 className="text-2xl sm:text-3xl font-black text-[#05324f] mb-2">
								{t('upload.form.title') || 'Fill in details'}
							</h1>
							<p className="text-sm text-gray-500 leading-relaxed">
								{t('upload.form.subtitle') || 'We need some information to match you with the right workshops.'}
							</p>
						</div>

						<div className="space-y-5">
							{/* Registration Number */}
							<div>
								<Label htmlFor="regnr" className="text-sm font-bold text-[#05324f] mb-2 block">
									{t('upload.form.regnr_label') || 'Registration number'}
								</Label>
								<div className="relative">
									<Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BC54]" />
									<Input
										id="regnr"
										value={registrationNumber}
										onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
										placeholder={t('upload.form.regnr_placeholder') || 'ABC123'}
										className="pl-10 h-12 text-sm border border-gray-200 rounded-xl focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54]"
									/>
								</div>
								<p className="text-xs text-gray-400 mt-1.5 ml-1">
									{t('upload.form.regnr_helper') || "We'll fetch your vehicle info automatically."}
								</p>
							</div>

							{/* Vehicle make/model/year (still required for backend) */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div>
									<Label htmlFor="make" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.make')}</Label>
									<Select value={vehicleData.make || ''} onValueChange={(value) => setVehicleData((prev) => ({ ...prev, make: value }))}>
										<SelectTrigger className="h-11 text-sm border border-gray-200 rounded-xl bg-white">
											<SelectValue placeholder={t('upload.vehicle_info.make_placeholder')} />
										</SelectTrigger>
										<SelectContent className="max-h-[300px] overflow-y-auto">
											{carMakes.filter((make) => make.trim() !== '').map((make) => (
												<SelectItem key={make} value={make} className="cursor-pointer text-sm py-2">{make}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="model" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.model')}</Label>
									<Input id="model" value={vehicleData.model} onChange={(e) => setVehicleData((prev) => ({ ...prev, model: e.target.value }))} placeholder={t('upload.vehicle_info.model_placeholder')} className="text-sm h-11 border border-gray-200 rounded-xl" />
								</div>
								<div>
									<Label htmlFor="year" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.year_label')}</Label>
									<Input id="year" type="number" min="1990" max={new Date().getFullYear() + 1} value={vehicleData.year} onChange={(e) => setVehicleData((prev) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))} className="text-sm h-11 border border-gray-200 rounded-xl" />
								</div>
							</div>

							{/* Postal Code */}
							<div>
								<Label htmlFor="postnr" className="text-sm font-bold text-[#05324f] mb-2 block">
									{t('upload.form.postnr_label') || 'Postal code'}
								</Label>
								<div className="relative">
									<MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BC54]" />
									<Input
										id="postnr"
										value={postalCode}
										onChange={(e) => setPostalCode(e.target.value)}
										placeholder={t('upload.form.postnr_placeholder') || '114 32'}
										className="pl-10 h-12 text-sm border border-gray-200 rounded-xl focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54]"
									/>
								</div>
								<p className="text-xs text-gray-400 mt-1.5 ml-1">
									{t('upload.form.postnr_helper') || 'To find workshops near you.'}
								</p>
							</div>

							{/* Description */}
							<div>
								<Label htmlFor="desc" className="text-sm font-bold text-[#05324f] mb-2 block">
									{t('upload.form.description_label') || 'Description (optional)'}
								</Label>
								<div className="relative">
									<MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#38BC54]" />
									<Textarea
										id="desc"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t('upload.form.description_placeholder') || 'Briefly describe what you need help with...'}
										rows={4}
										className="pl-10 pt-3 text-sm border border-gray-200 rounded-xl focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54] resize-none"
									/>
								</div>
								<p className="text-xs text-gray-400 mt-1.5 ml-1">
									{t('upload.form.description_helper') || 'E.g. brakes squeaking, AC not working, engine warning light on.'}
								</p>
							</div>

							{/* Back + Submit */}
							<div className="flex gap-2">
								<Button
									type="button"
									onClick={() => { setCurrentStep('upload'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
									disabled={isUploading}
									className="shrink-0 h-13 px-5 py-4 text-sm font-black bg-white hover:bg-gray-50 text-[#05324f] border border-gray-200 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
								>
									<ArrowRight className="w-5 h-5 rotate-180" />
									{t('common.back') || 'Back'}
								</Button>
								<Button
									type="submit"
									disabled={isUploading || files.length === 0}
									className="flex-1 h-13 py-4 text-base font-black bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
								>
									{isUploading ? t('upload.submitting') : (
										<>
											{t('upload.form.continue') || 'Continue'} <ArrowRight className="w-5 h-5" />
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
					)}

					{/* Trust signals */}
					<div className="grid grid-cols-3 gap-2 sm:gap-3 px-1 pt-2">
						<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center sm:text-left">
							<ShieldCheck className="w-5 h-5 text-[#38BC54] shrink-0" />
							<span className="text-[10px] sm:text-xs font-bold text-[#05324f] leading-tight">
								{t('upload.form.trust_verified') || 'Only verified workshops'}
							</span>
						</div>
						<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center sm:text-left">
							<ClockIcon className="w-5 h-5 text-[#38BC54] shrink-0" />
							<span className="text-[10px] sm:text-xs font-bold text-[#05324f] leading-tight">
								{t('upload.form.trust_fast') || 'Fast and easy'}
							</span>
						</div>
						<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center sm:text-left">
							<Lock className="w-5 h-5 text-[#38BC54] shrink-0" />
							<span className="text-[10px] sm:text-xs font-bold text-[#05324f] leading-tight">
								{t('upload.form.trust_secure') || 'Your data is secure'}
							</span>
						</div>
					</div>
				</form>
			</div>

			<Footer />
		</div>
	)
}
