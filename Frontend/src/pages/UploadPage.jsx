import { useState, useCallback, useEffect, useMemo } from 'react'
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
import SearchableSelect from '../components/ui/SearchableSelect'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'
import { Upload, X, Car, MapPin, MessageSquare, ShieldCheck, Clock as ClockIcon, Lock, Check, ArrowRight, Mail, Link2, Send, Bell } from 'lucide-react'
import { validateFile, getFileIcon, formatSwedishRegistrationNumber, normalizeSwedishRegistrationNumber } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { uploadAPI, vehiclesAPI, requestsAPI, authAPI } from '../services/api'
import { fetchCarMakes, fetchCarModels, findMakeByName, findModelByName } from '../services/carImages'
const MIN_VEHICLE_YEAR = 1990
const VEHICLE_YEARS = Array.from(
	{ length: new Date().getFullYear() + 1 - MIN_VEHICLE_YEAR + 1 },
	(_, index) => new Date().getFullYear() + 1 - index
)

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
	const noImageMode = searchParams.get('mode') === 'no-image'
	const [skipUpload, setSkipUpload] = useState(noImageMode)
	const [existingRequest, setExistingRequest] = useState(null)
	const [isUploading, setIsUploading] = useState(false)
	const [carMakes, setCarMakes] = useState([])
	const [carModels, setCarModels] = useState([])
	const [makeSlug, setMakeSlug] = useState('')
	const [modelSlug, setModelSlug] = useState('')
	const [loadingMakes, setLoadingMakes] = useState(true)
	const [loadingModels, setLoadingModels] = useState(false)
	const [email, setEmail] = useState('')
	const [linkSent, setLinkSent] = useState(false)
	const [devMagicLinkUrl, setDevMagicLinkUrl] = useState('')
	const [pendingRequestData, setPendingRequestData] = useState(null)
	const [isSendingLink, setIsSendingLink] = useState(false)

	const userRole = user?.role?.toUpperCase()
	const isLoggedInCustomer = Boolean(user && userRole === 'CUSTOMER')

	useEffect(() => {
		let active = true
		setLoadingMakes(true)
		fetchCarMakes()
			.then((makes) => {
				if (active) setCarMakes(makes)
			})
			.catch((err) => {
				console.error('Failed to load car brands:', err)
			})
			.finally(() => {
				if (active) setLoadingMakes(false)
			})
		return () => {
			active = false
		}
	}, [t])

	useEffect(() => {
		if (!makeSlug) {
			setCarModels([])
			return
		}

		let active = true
		setLoadingModels(true)

		fetchCarModels(makeSlug)
			.then((models) => {
				if (active) setCarModels(models)
			})
			.catch((err) => {
				console.error('Failed to load car models:', err)
				if (active) setCarModels([])
			})
			.finally(() => {
				if (active) setLoadingModels(false)
			})

		return () => {
			active = false
		}
	}, [makeSlug])

	useEffect(() => {
		if (noImageMode && !editId) {
			setSkipUpload(true)
			setCurrentStep('details')
		}
	}, [noImageMode, editId])

	const handleMakeChange = (slug) => {
		const selected = carMakes.find((m) => m.slug === slug)
		setMakeSlug(slug)
		setModelSlug('')
		setVehicleData((prev) => ({
			...prev,
			make: selected?.name || slug,
			model: '',
		}))
	}

	const handleModelChange = (slug) => {
		const selected = carModels.find((m) => m.slug === slug)
		setModelSlug(slug)
		setVehicleData((prev) => ({
			...prev,
			model: selected?.name || slug,
		}))
	}

	const makeOptions = useMemo(
		() => carMakes.map((make) => ({ value: make.slug, label: make.name })),
		[carMakes]
	)

	const modelOptions = useMemo(
		() => carModels.map((model) => ({ value: model.slug, label: model.name })),
		[carModels]
	)

	const buildVehiclePayload = () => ({
		make: vehicleData.make,
		model: vehicleData.model,
		year: vehicleData.year,
		...(makeSlug && { makeSlug }),
		...(modelSlug && { modelSlug }),
	})

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
						if (request.vehicleId.makeSlug) {
							setMakeSlug(request.vehicleId.makeSlug)
						}
						if (request.vehicleId.modelSlug) {
							setModelSlug(request.vehicleId.modelSlug)
						}
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

	useEffect(() => {
		if (!editId || !existingRequest?.vehicleId || carMakes.length === 0 || makeSlug) return
		const vehicle = existingRequest.vehicleId
		const matchedMake = findMakeByName(carMakes, vehicle.make)
		if (matchedMake) {
			setMakeSlug(matchedMake.slug)
		}
	}, [editId, existingRequest, carMakes, makeSlug])

	useEffect(() => {
		if (!editId || !existingRequest?.vehicleId || carModels.length === 0 || modelSlug) return
		const vehicle = existingRequest.vehicleId
		const matchedModel = findModelByName(carModels, vehicle.model)
		if (matchedModel) {
			setModelSlug(matchedModel.slug)
		}
	}, [editId, existingRequest, carModels, modelSlug])

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

	// Redirect edit flow if not authenticated
	if (!authLoading && editId && !isLoggedInCustomer) {
		navigate('/auth/signin', { replace: true })
		return null
	}

	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const geocodePostalCode = async (usePostal) => {
		let geoLat = user?.latitude || 59.3293
		let geoLng = user?.longitude || 18.0686
		let geoCity = user?.city || 'Stockholm'

		if (!usePostal) {
			return { geoLat, geoLng, geoCity }
		}

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

		return { geoLat, geoLng, geoCity }
	}

	const uploadFiles = async () => {
		const uploadedFiles = []
		for (const file of files) {
			const formData = new FormData()
			formData.append('file', file)
			const response = await uploadAPI.uploadFile(formData)
			uploadedFiles.push(response.data)
		}
		return uploadedFiles.map((file) => file.id || file._id).filter(Boolean)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (!vehicleData.make || !vehicleData.model) {
			toast.error(t('errors.vehicle_info_required'))
			return
		}

		if (!description.trim()) {
			toast.error(t('errors.description_required'))
			return
		}

		setIsUploading(true)

		try {
			if (editId && existingRequest) {
				const updateBody = {
					description: description.trim(),
					...( (vehicleData.make !== existingRequest.vehicleId?.make || 
						  vehicleData.model !== existingRequest.vehicleId?.model || 
						  vehicleData.year !== existingRequest.vehicleId?.year) ? {
						vehicleId: (await vehiclesAPI.create(buildVehiclePayload())).data._id
					} : {} )
				}

				await requestsAPI.update(editId, updateBody)
				toast.success(t('success.request_updated') || 'Request updated successfully')
				navigate('/contract')
				return
			}

			if (files.length === 0 && !skipUpload) {
				toast.error(t('errors.file_required'))
				return
			}

			const usePostal = (postalCode || user?.postalCode || '').trim()
			const { geoLat, geoLng, geoCity } = await geocodePostalCode(usePostal)

			if (isLoggedInCustomer) {
				const reportIds = files.length > 0 ? await uploadFiles() : []
				const vehicleResponse = await vehiclesAPI.create(buildVehiclePayload())
				const vehicleId = vehicleResponse.data._id || vehicleResponse.data.id

				const requestBody = {
					vehicleId,
					reportIds,
					description: description.trim(),
					registrationNumber: normalizeSwedishRegistrationNumber(registrationNumber) || undefined,
					latitude: geoLat,
					longitude: geoLng,
					address: user?.address || geoCity,
					city: geoCity,
					postalCode: usePostal || '111 22',
					country: user?.country || 'SE',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				}

				await requestsAPI.create(requestBody)
				toast.success(t('success.request_sent'))
				navigate('/contract')
				return
			}

			const reportIds = files.length > 0 ? await uploadFiles() : []
			setPendingRequestData({
				reportIds,
				description: description.trim(),
				registrationNumber: normalizeSwedishRegistrationNumber(registrationNumber) || '',
				latitude: geoLat,
				longitude: geoLng,
				address: geoCity,
				city: geoCity,
				postalCode: usePostal || '111 22',
				country: 'SE',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				vehicle: buildVehiclePayload(),
			})
			setCurrentStep('email')
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} catch (error) {
			console.error('Upload error:', error)
			const errorMessage = error?.message || error.response?.data?.message || t('errors.upload_failed')
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	const handleSendMagicLink = async (e) => {
		e.preventDefault()

		const trimmedEmail = email.trim().toLowerCase()
		if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
			toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
			return
		}

		if (!pendingRequestData) {
			toast.error(t('errors.generic_error') || 'Something went wrong. Please go back and try again.')
			return
		}

		setIsSendingLink(true)
		setDevMagicLinkUrl('')
		try {
			const response = await authAPI.sendMagicLink({
				email: trimmedEmail,
				requestData: pendingRequestData,
				frontendUrl: window.location.origin,
			})
			const data = response.data || {}
			if (data.magicLinkUrl) {
				setDevMagicLinkUrl(data.magicLinkUrl)
			}
			setLinkSent(true)
			if (data.emailSent === false) {
				toast.success(t('upload.form.link_ready_dev') || 'Login link ready — open it below.')
			} else {
				toast.success(t('upload.form.link_sent_toast') || 'Login link sent! Check your inbox.')
			}
		} catch (error) {
			console.error('Magic link error:', error)
			const message = error.response?.data?.message || t('errors.generic_error')
			toast.error(message)
			if (error.response?.status === 409 || error.response?.data?.requiresSignIn) {
				setTimeout(() => navigate('/auth/signin'), 1500)
			}
		} finally {
			setIsSendingLink(false)
		}
	}

	const steps = [
		{
			key: 'step1',
			label: t('upload.form.step1') || 'Upload report',
			state: skipUpload ? 'done' : currentStep === 'upload' ? 'active' : 'done',
		},
		{
			key: 'step2',
			label: t('upload.form.step2') || 'Fill in details',
			state: currentStep === 'details' ? 'active' : currentStep === 'email' ? 'done' : 'pending',
		},
		...(isLoggedInCustomer ? [] : [{
			key: 'step3',
			label: t('upload.form.step3') || 'Your email',
			state: currentStep === 'email' ? 'active' : 'pending',
		}]),
	]

	const handleNextStep = () => {
		if (files.length === 0) {
			toast.error(t('errors.file_required') || 'Please upload at least one file')
			return
		}
		setCurrentStep('details')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleSkipUpload = () => {
		setSkipUpload(true)
		setCurrentStep('details')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />
			<div className="list-page-content">
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
								<span className={`text-[11px] sm:text-xs font-medium mt-2 whitespace-nowrap ${
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

				<div className="space-y-5">
					{/* Step 1: File Upload Card */}
					{currentStep === 'upload' && (
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
						<div className="mb-3">
							<h2 className="flex items-center gap-2 text-base font-semibold text-[#05324f]">
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
									<p className="text-sm font-medium text-[#05324f] mb-1">{t('upload.file_upload.drag_drop')}</p>
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
							className="w-full h-13 mt-5 py-4 text-base font-medium bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
						>
							{t('common.next') || 'Next'} <ArrowRight className="w-5 h-5" />
						</Button>

						<div className="flex items-center justify-center gap-4 mt-5">
							<div className="h-px bg-gray-200 flex-1" />
							<span className="text-gray-400 font-medium text-sm">{t('common.or')}</span>
							<div className="h-px bg-gray-200 flex-1" />
						</div>

						<button
							type="button"
							onClick={handleSkipUpload}
							className="w-full mt-4 text-[#05324f] font-medium text-sm underline underline-offset-4 inline-flex items-center justify-center gap-2 active:opacity-70 transition-opacity hover:opacity-80"
						>
							{t('homepage.mobile.no_image')} <ArrowRight className="w-4 h-4" />
						</button>
					</div>
					)}

					{/* Step 2: Form Card */}
					{currentStep === 'details' && (
					<form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
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
										onChange={(e) => setRegistrationNumber(formatSwedishRegistrationNumber(e.target.value))}
										placeholder={t('upload.form.regnr_placeholder') || 'ABC 123'}
										maxLength={7}
										autoComplete="off"
										spellCheck={false}
										className="pl-10 h-12 text-sm border border-gray-200 rounded-xl focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54] uppercase tracking-wide"
									/>
								</div>
								<p className="text-xs text-gray-400 mt-1.5 ml-1">
									{t('upload.form.regnr_helper') || "We'll fetch your vehicle info automatically."}
								</p>
							</div>

							{/* Vehicle make/model/year */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div>
									<Label htmlFor="make" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.make')}</Label>
									<SearchableSelect
										value={makeSlug || ''}
										onValueChange={handleMakeChange}
										options={makeOptions}
										disabled={loadingMakes}
										placeholder={loadingMakes ? (t('common.loading') || 'Loading...') : t('upload.vehicle_info.make_placeholder')}
										searchPlaceholder={t('common.search')}
										emptyText={t('common.no_results')}
										triggerClassName="h-11 text-sm border border-gray-200 rounded-xl bg-white"
									/>
								</div>
								<div>
									<Label htmlFor="model" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.model')}</Label>
									{makeSlug && !loadingModels && carModels.length === 0 ? (
										<Input
											id="model"
											value={vehicleData.model}
											onChange={(e) => {
												setModelSlug('')
												setVehicleData((prev) => ({ ...prev, model: e.target.value }))
											}}
											placeholder={t('upload.vehicle_info.model_placeholder')}
											className="h-11 text-sm border border-gray-200 rounded-xl bg-white"
										/>
									) : (
										<SearchableSelect
											value={modelSlug || ''}
											onValueChange={handleModelChange}
											options={modelOptions}
											disabled={!makeSlug || loadingModels}
											placeholder={
												!makeSlug
													? (t('upload.vehicle_info.select_make_first') || 'Select brand first')
													: loadingModels
														? (t('common.loading') || 'Loading...')
														: t('upload.vehicle_info.model_placeholder')
											}
											searchPlaceholder={t('common.search')}
											emptyText={t('common.no_results')}
											triggerClassName="h-11 text-sm border border-gray-200 rounded-xl bg-white"
										/>
									)}
								</div>
								<div>
									<Label htmlFor="year" className="text-xs font-bold text-[#05324f] mb-1.5 block">{t('upload.vehicle_info.year_label')}</Label>
									<Select
										value={String(vehicleData.year)}
										onValueChange={(value) =>
											setVehicleData((prev) => ({ ...prev, year: parseInt(value, 10) }))
										}
									>
										<SelectTrigger id="year" className="h-11 text-sm border border-gray-200 rounded-xl bg-white">
											<SelectValue placeholder={t('upload.vehicle_info.year_placeholder') || 'Select year'} />
										</SelectTrigger>
										<SelectContent className="max-h-[300px] overflow-y-auto">
											{VEHICLE_YEARS.map((year) => (
												<SelectItem key={year} value={String(year)} className="cursor-pointer text-sm py-2">
													{year}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
									{t('upload.form.description_label_required')}{' '}
									<span className="text-red-500">*</span>
								</Label>
								<div className="relative">
									<MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#38BC54]" />
									<Textarea
										id="desc"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t('upload.form.description_placeholder') || 'Briefly describe what you need help with...'}
										rows={4}
										required
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
									onClick={() => {
										if (skipUpload) {
											setSkipUpload(false)
											navigate('/upload', { replace: true })
										}
										setCurrentStep('upload')
										window.scrollTo({ top: 0, behavior: 'smooth' })
									}}
									disabled={isUploading}
									className="shrink-0 h-13 px-5 py-4 text-sm font-medium bg-white hover:bg-gray-50 text-[#05324f] border border-gray-200 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
								>
									<ArrowRight className="w-5 h-5 rotate-180" />
									{t('common.back') || 'Back'}
								</Button>
								<Button
									type="submit"
									disabled={isUploading || !description.trim() || (!skipUpload && files.length === 0)}
									className="flex-1 h-13 py-4 text-base font-medium bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
								>
									{isUploading ? t('upload.submitting') : (
										<>
											{t('upload.form.continue') || 'Continue'} <ArrowRight className="w-5 h-5" />
										</>
									)}
								</Button>
							</div>
						</div>
					</form>
					)}

					{/* Step 3: Email / Magic link */}
					{currentStep === 'email' && (
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
						<div className="text-center mb-6">
							<div className="relative inline-flex mb-5">
								<div className="w-16 h-16 rounded-full bg-[#F2F9F4] flex items-center justify-center">
									<Mail className="w-8 h-8 text-[#38BC54]" strokeWidth={2} />
								</div>
								<div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#38BC54] flex items-center justify-center border-2 border-white">
									<Link2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
								</div>
							</div>
							<h1 className="text-2xl sm:text-3xl font-black text-[#05324f] mb-2">
								{linkSent
									? (t('upload.form.link_sent_title') || 'Check your inbox')
									: (t('upload.form.email_title') || 'Enter your email address')}
							</h1>
							<p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
								{linkSent
									? (t('upload.form.link_sent_subtitle') || `We sent a login link to ${email}. Click it to submit your request and receive offers.`)
									: (t('upload.form.email_subtitle') || 'We will send a magic link so you can follow your case and receive offers.')}
							</p>
						</div>

						{!linkSent ? (
							<form onSubmit={handleSendMagicLink} className="space-y-5">
								<div>
									<Label htmlFor="email" className="text-sm font-bold text-[#05324f] mb-2 block">
										{t('upload.form.email_label') || 'Email address'}
									</Label>
									<div className="relative">
										<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BC54]" />
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder={t('upload.form.email_placeholder') || 'name@example.com'}
											autoComplete="email"
											required
											className="pl-10 h-12 text-sm border border-gray-200 rounded-xl focus:border-[#38BC54] focus:ring-1 focus:ring-[#38BC54]"
										/>
									</div>
								</div>

								<div className="rounded-2xl border border-gray-100 overflow-hidden">
									<div className="flex items-center gap-3 px-4 py-3.5">
										<div className="w-9 h-9 rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
											<Send className="w-4 h-4 text-[#38BC54]" strokeWidth={2} />
										</div>
										<p className="text-sm text-[#05324f]">
											{t('upload.form.email_hint_inbox') || 'You get a link directly to your inbox'}
										</p>
									</div>
									<div className="h-px bg-gray-100" />
									<div className="flex items-center gap-3 px-4 py-3.5">
										<div className="w-9 h-9 rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
											<Bell className="w-4 h-4 text-[#38BC54]" strokeWidth={2} />
										</div>
										<p className="text-sm text-[#05324f]">
											{t('upload.form.email_hint_offers') || 'We notify you when you receive offers'}
										</p>
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										type="button"
										onClick={() => {
											setCurrentStep('details')
											window.scrollTo({ top: 0, behavior: 'smooth' })
										}}
										disabled={isSendingLink}
										className="shrink-0 h-13 px-5 py-4 text-sm font-medium bg-white hover:bg-gray-50 text-[#05324f] border border-gray-200 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
									>
										<ArrowRight className="w-5 h-5 rotate-180" />
										{t('common.back') || 'Back'}
									</Button>
									<Button
										type="submit"
										disabled={isSendingLink || !email.trim()}
										className="flex-1 h-13 py-4 text-base font-medium bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
									>
										{isSendingLink
											? (t('upload.form.sending_link') || 'Sending...')
											: (
												<>
													{t('upload.form.send_link') || 'Send link'} <ArrowRight className="w-5 h-5" />
												</>
											)}
									</Button>
								</div>

								<p className="text-center text-sm text-gray-500">
									{t('upload.form.email_spam_hint') || "Can't find the email?"}{' '}
									<span className="text-[#38BC54] font-semibold">
										{t('upload.form.email_spam_action') || 'Check your spam folder.'}
									</span>
								</p>
							</form>
						) : (
							<div className="space-y-5">
								<div className="rounded-2xl border border-[#38BC54]/20 bg-[#F2F9F4] px-4 py-4 text-center">
									<p className="text-sm text-[#05324f] leading-relaxed">
										{devMagicLinkUrl
											? (t('upload.form.link_dev_body') || 'Email could not be sent. Use the button below to open your login link.')
											: (t('upload.form.link_sent_body') || 'Open the link in your email to log in and submit your request. You can close this page.')}
									</p>
								</div>
								{devMagicLinkUrl && (
									<a
										href={devMagicLinkUrl}
										className="w-full h-13 py-4 text-base font-medium bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
									>
										{t('upload.form.open_magic_link') || 'Open login link'} <ArrowRight className="w-5 h-5" />
									</a>
								)}
								<p className="text-center text-sm text-gray-500">
									{t('upload.form.email_spam_hint') || "Can't find the email?"}{' '}
									<span className="text-[#38BC54] font-semibold">
										{t('upload.form.email_spam_action') || 'Check your spam folder.'}
									</span>
								</p>
							</div>
						)}
					</div>
					)}

					{/* Trust signals */}
					<div className="rounded-2xl bg-[#F2F9F4] border border-[#38BC54]/10 flex items-stretch overflow-hidden mt-2">
						{[
							{
								icon: ShieldCheck,
								line1: t('upload.form.trust_verified_line1') || 'Only verified',
								line2: t('upload.form.trust_verified_line2') || 'workshops',
							},
							{
								icon: ClockIcon,
								line1: t('upload.form.trust_fast_line1') || 'Fast and',
								line2: t('upload.form.trust_fast_line2') || 'easy',
							},
							{
								icon: Lock,
								line1: t('upload.form.trust_secure_line1') || 'Your data',
								line2: t('upload.form.trust_secure_line2') || 'is secure',
							},
						].map(({ icon: Icon, line1, line2 }, index, arr) => (
							<div key={line1} className="flex flex-1 min-w-0 items-stretch">
								<div className="flex flex-1 items-center gap-2 px-2.5 sm:px-3 py-3 min-w-0">
									<Icon className="w-5 h-5 text-[#38BC54] shrink-0" strokeWidth={1.75} />
									<div className="min-w-0">
										<p className="text-[10px] sm:text-[11px] text-gray-600 leading-tight">{line1}</p>
										<p className="text-[10px] sm:text-[11px] text-gray-600 leading-tight">{line2}</p>
									</div>
								</div>
								{index < arr.length - 1 && <div className="w-px bg-[#38BC54]/15 shrink-0 my-2.5" aria-hidden />}
							</div>
						))}
					</div>
				</div>
			</div>

			<Footer />
		</div>
	)
}
