import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
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
import {
	X,
	Car,
	MapPin,
	FileDown,
	Check,
	ArrowRight,
	Bell,
	Camera,
	Clock,
	Plus,
	Image as ImageIcon,
	Lock,
	User,
	Wrench,
} from 'lucide-react'
import {
	validateFile,
	getFileIcon,
	formatSwedishRegistrationNumber,
	normalizeSwedishRegistrationNumber,
	isValidSwedishRegistrationNumber,
} from '../utils/cn'
import { formatSwedishPhone } from '../utils/swedishPhone'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CreateCaseStart from '../components/CreateCaseStart'
import { uploadAPI, vehiclesAPI, requestsAPI, authAPI } from '../services/api'
import { fetchCarMakes, fetchCarModels, findMakeByName, findModelByName } from '../services/carImages'

const MIN_VEHICLE_YEAR = 1990
const VEHICLE_YEARS = Array.from(
	{ length: new Date().getFullYear() + 1 - MIN_VEHICLE_YEAR + 1 },
	(_, index) => new Date().getFullYear() + 1 - index
)

const PROBLEM_STEPS = new Set(['protocol', 'known', 'unknown'])

function scrollTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

function PhotoThumb({ file, onRemove }) {
	const [previewUrl, setPreviewUrl] = useState(null)

	useEffect(() => {
		if (!file?.type?.startsWith('image/')) {
			setPreviewUrl(null)
			return undefined
		}
		const url = URL.createObjectURL(file)
		setPreviewUrl(url)
		return () => URL.revokeObjectURL(url)
	}, [file])

	return (
		<div className="relative w-[76px] h-[76px] lg:w-28 lg:h-28 rounded-xl lg:rounded-2xl overflow-hidden bg-[#1a1a1a] shrink-0">
			{previewUrl ? (
				<img src={previewUrl} alt="" className="w-full h-full object-cover" />
			) : (
				<div className="w-full h-full flex items-center justify-center bg-gray-100">
					<span className="text-lg">{getFileIcon(file.type)}</span>
				</div>
			)}
			<button
				type="button"
				onClick={onRemove}
				className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-brand-navy flex items-center justify-center shadow-sm"
				aria-label="Remove"
			>
				<X className="w-3 h-3" strokeWidth={2.5} />
			</button>
		</div>
	)
}

function PhotoGrid({ files, onRemove, onAddFiles, addLabel, addFirst = true }) {
	const inputRef = useRef(null)

	const addTileClass = addFirst
		? 'w-[76px] h-[76px] lg:w-28 lg:h-28 rounded-xl lg:rounded-2xl border border-brand-navy/35 bg-white text-brand-navy flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-navy hover:bg-slate-50 shrink-0'
		: 'w-[76px] h-[76px] lg:w-28 lg:h-28 rounded-xl lg:rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand-navy/40 hover:text-brand-navy shrink-0'

	const handlePick = () => {
		inputRef.current?.click()
	}

	const handleChange = (e) => {
		const selected = Array.from(e.target.files || [])
		e.target.value = ''
		if (selected.length > 0) onAddFiles(selected)
	}

	const addTile = (
		<button type="button" onClick={handlePick} className={addTileClass}>
			{addFirst ? (
				<Camera className="w-5 h-5 lg:w-7 lg:h-7" strokeWidth={1.75} />
			) : (
				<Plus className="w-5 h-5 lg:w-7 lg:h-7" strokeWidth={2} />
			)}
			<span className="text-[10px] lg:text-xs leading-tight text-center px-1 font-medium">{addLabel}</span>
		</button>
	)

	return (
		<div className="flex gap-2.5 overflow-x-auto pb-1">
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
				multiple
				className="hidden"
				onChange={handleChange}
			/>
			{addFirst && addTile}
			{files.map((file, index) => (
				<PhotoThumb
					key={`${file.name}-${file.lastModified}-${index}`}
					file={file}
					onRemove={() => onRemove(index)}
				/>
			))}
			{!addFirst && addTile}
		</div>
	)
}

function RequestSentMark() {
	const dots = [
		'left-3 top-4 w-1.5 h-1.5',
		'right-5 top-2 w-2 h-2',
		'right-2 top-10 w-1.5 h-1.5',
		'left-1 bottom-8 w-2 h-2',
		'right-4 bottom-4 w-1 h-1',
		'left-7 top-12 w-1 h-1',
	]

	return (
		<div className="relative w-36 h-36 mx-auto mb-2">
			{dots.map((dot) => (
				<span key={dot} className={`absolute rounded-full bg-[#1B8F3E]/75 ${dot}`} />
			))}
			<div className="absolute inset-5 rounded-full bg-[#E7F6EC] flex items-center justify-center">
				<Check className="w-12 h-12 text-[#1B8F3E]" strokeWidth={2.75} />
			</div>
		</div>
	)
}

function SummaryRow({ icon: Icon, title, children, last }) {
	return (
		<div className={`flex gap-3 lg:gap-4 px-4 py-4 lg:px-6 lg:py-5 ${last ? '' : 'border-b border-gray-100'}`}>
			<div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
				<Icon className="w-5 h-5 lg:w-6 lg:h-6 text-[#374151]" strokeWidth={1.75} />
			</div>
			<div className="min-w-0 flex-1 pt-0.5">
				<p className="text-sm lg:text-lg font-bold text-brand-dark leading-snug">{title}</p>
				{children ? (
					<div className="text-sm lg:text-base text-[#6B7280] mt-0.5 leading-snug space-y-0.5">{children}</div>
				) : null}
			</div>
		</div>
	)
}

export default function UploadPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, fetchUser, setSession } = useAuth()
	const { t } = useTranslation()
	const [searchParams, setSearchParams] = useSearchParams()

	const editId = searchParams.get('edit') || searchParams.get('requestId')
	const queryPath = searchParams.get('path')
	const noImageMode = searchParams.get('mode') === 'no-image'
	const requestSent = searchParams.get('sent') === '1'

	const initialStep = requestSent
		? 'success'
		: editId
		? 'details'
		: queryPath === 'protocol' || queryPath === 'known' || queryPath === 'unknown'
			? queryPath
			: noImageMode
				? 'known'
				: 'start'

	const [protocolFiles, setProtocolFiles] = useState([])
	const [photoFiles, setPhotoFiles] = useState([])
	const [vehicleData, setVehicleData] = useState({ make: '', model: '', year: '' })
	const [registrationNumber, setRegistrationNumber] = useState('')
	const [postalCode, setPostalCode] = useState('')
	const [description, setDescription] = useState('')
	const [casePath, setCasePath] = useState(
		queryPath === 'protocol' || queryPath === 'known' || queryPath === 'unknown'
			? queryPath
			: noImageMode
				? 'known'
				: ''
	)
	const [currentStep, setCurrentStep] = useState(initialStep)
	const [problemStarted, setProblemStarted] = useState('')
	const [contactName, setContactName] = useState('')
	const [contactPhone, setContactPhone] = useState('')
	const [fuelType, setFuelType] = useState('')
	const [email, setEmail] = useState('')
	const [existingRequest, setExistingRequest] = useState(null)
	const [isUploading, setIsUploading] = useState(false)
	const [carMakes, setCarMakes] = useState([])
	const [carModels, setCarModels] = useState([])
	const [makeSlug, setMakeSlug] = useState('')
	const [modelSlug, setModelSlug] = useState('')
	const [loadingMakes, setLoadingMakes] = useState(true)
	const [loadingModels, setLoadingModels] = useState(false)
	const [devMagicLinkUrl, setDevMagicLinkUrl] = useState('')
	const [showProtocolRemarks, setShowProtocolRemarks] = useState(false)
	const protocolPhotoInputRef = useRef(null)
	const [savedCars, setSavedCars] = useState([])
	const [savedCarsLoading, setSavedCarsLoading] = useState(false)
	const [selectedSavedCarKey, setSelectedSavedCarKey] = useState('')

	const userRole = user?.role?.toUpperCase()
	const isLoggedInCustomer = Boolean(user && userRole === 'CUSTOMER')

	useEffect(() => {
		if (user) {
			setContactName((prev) => prev || user.name || '')
			setContactPhone((prev) => prev || user.phone || '')
			setEmail((prev) => prev || user.email || '')
			setPostalCode((prev) => prev || user.postalCode || '')
		}
	}, [user])

	useEffect(() => {
		if (!isLoggedInCustomer || !user) {
			setSavedCars([])
			setSelectedSavedCarKey('')
			return undefined
		}
		let active = true
		setSavedCarsLoading(true)
		requestsAPI.getByCustomer(user.id || user._id)
			.then((response) => {
				if (!active) return
				const seen = new Set()
				const list = []
				for (const request of response.data || []) {
					const vehicle = request.vehicleId || {}
					const registration = request.registrationNumber || ''
					const key = `${vehicle.make || ''}|${vehicle.model || ''}|${registration}`
					if (seen.has(key)) continue
					seen.add(key)
					if (!vehicle.make && !registration) continue
					list.push({
						key,
						make: vehicle.make || '',
						model: vehicle.model || '',
						year: vehicle.year ?? '',
						makeSlug: vehicle.makeSlug || '',
						modelSlug: vehicle.modelSlug || '',
						registration,
					})
				}
				setSavedCars(list)
			})
			.catch(() => {
				if (active) setSavedCars([])
			})
			.finally(() => {
				if (active) setSavedCarsLoading(false)
			})
		return () => {
			active = false
		}
	}, [isLoggedInCustomer, user])

	useEffect(() => {
		if (requestSent) setCurrentStep('success')
	}, [requestSent])

	useEffect(() => {
		if (requestSent || editId) return
		if (queryPath === 'protocol' || queryPath === 'known' || queryPath === 'unknown') {
			setCasePath(queryPath)
			setCurrentStep((prev) => (PROBLEM_STEPS.has(prev) || prev === 'start' ? queryPath : prev))
			return
		}
		if (!queryPath && !noImageMode) {
			setCasePath('')
			setCurrentStep((prev) => (PROBLEM_STEPS.has(prev) ? 'start' : prev))
		}
	}, [queryPath, editId, requestSent, noImageMode])

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
	}, [])

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

	const handleMakeChange = (slugOrName, label) => {
		const selected = carMakes.find((m) => m.slug === slugOrName || m.name === slugOrName)
		setModelSlug('')
		if (selected) {
			setMakeSlug(selected.slug)
			setVehicleData((prev) => ({
				...prev,
				make: selected.name,
				model: '',
			}))
			return
		}
		const customName = (label || slugOrName || '').trim()
		const customSlug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
		setMakeSlug(customSlug || customName)
		setVehicleData((prev) => ({
			...prev,
			make: customName,
			model: '',
		}))
		setCarModels([])
	}

	const handleModelChange = (slugOrName, label) => {
		const selected = carModels.find((m) => m.slug === slugOrName || m.name === slugOrName)
		if (selected) {
			setModelSlug(selected.slug)
			setVehicleData((prev) => ({
				...prev,
				model: selected.name,
			}))
			return
		}
		const customName = (label || slugOrName || '').trim()
		const customSlug = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
		setModelSlug(customSlug || customName)
		setVehicleData((prev) => ({
			...prev,
			model: customName,
		}))
	}

	const applySavedCar = (carKey) => {
		setSelectedSavedCarKey(carKey)
		if (!carKey) return
		const car = savedCars.find((item) => item.key === carKey)
		if (!car) return
		setRegistrationNumber(formatSwedishRegistrationNumber(car.registration || ''))
		setVehicleData({
			make: car.make || '',
			model: car.model || '',
			year: car.year || '',
		})
		if (car.makeSlug) {
			setMakeSlug(car.makeSlug)
		} else if (car.make) {
			const matched = findMakeByName(carMakes, car.make)
			setMakeSlug(matched?.slug || car.make.toLowerCase().replace(/\s+/g, '-'))
		} else {
			setMakeSlug('')
		}
		if (car.modelSlug) {
			setModelSlug(car.modelSlug)
		} else if (car.model) {
			setModelSlug(car.model.toLowerCase().replace(/\s+/g, '-'))
		} else {
			setModelSlug('')
		}
	}

	const makeOptions = useMemo(
		() => carMakes.map((make) => ({ value: make.slug, label: make.name })),
		[carMakes]
	)
	const modelOptions = useMemo(
		() => carModels.map((model) => ({ value: model.slug, label: model.name })),
		[carModels]
	)

	const buildVehiclePayload = () => {
		const payload = {
			make: vehicleData.make?.trim() || '—',
			model: vehicleData.model?.trim() || '—',
			...(makeSlug && { makeSlug }),
			...(modelSlug && { modelSlug }),
		}
		if (vehicleData.year) payload.year = vehicleData.year
		return payload
	}

	const startedLabel = problemStarted
		? t(`upload.flow.started_${problemStarted}`)
		: ''

	const allFiles = useMemo(() => [...protocolFiles, ...photoFiles], [protocolFiles, photoFiles])

	const problemSummary = useMemo(() => {
		const text = description.trim()
		if (text && startedLabel) return `${text}\n\n(${t('upload.flow.started_prefix')}: ${startedLabel})`
		if (text) return text
		if (casePath === 'protocol' && protocolFiles.length > 0) return t('upload.flow.protocol_uploaded')
		return ''
	}, [description, startedLabel, casePath, protocolFiles.length, t])

	const problemDisplay = useMemo(() => {
		const text = description.trim()
		if (text && startedLabel) return `${text}\n\n(${t('upload.flow.started_prefix')}: ${startedLabel})`
		if (text) return text
		return ''
	}, [description, startedLabel, t])

	useEffect(() => {
		if (!editId) return
		const fetchRequest = async () => {
			try {
				const response = await requestsAPI.getById(editId)
				const request = response.data
				setExistingRequest(request)
				if (request.vehicleId) {
					setVehicleData({
						make: request.vehicleId.make || '',
						model: request.vehicleId.model || '',
						year: request.vehicleId.year ?? '',
					})
					if (request.vehicleId.makeSlug) setMakeSlug(request.vehicleId.makeSlug)
					if (request.vehicleId.modelSlug) setModelSlug(request.vehicleId.modelSlug)
				}
				if (request.registrationNumber) {
					setRegistrationNumber(formatSwedishRegistrationNumber(request.registrationNumber))
				}
				setDescription(request.description || '')
				setCasePath('known')
			} catch (error) {
				console.error('Fetch request for edit error:', error)
				toast.error('Failed to load request data')
			}
		}
		fetchRequest()
	}, [editId])

	useEffect(() => {
		if (!editId || !existingRequest?.vehicleId || carMakes.length === 0 || makeSlug) return
		const matchedMake = findMakeByName(carMakes, existingRequest.vehicleId.make)
		if (matchedMake) setMakeSlug(matchedMake.slug)
	}, [editId, existingRequest, carMakes, makeSlug])

	useEffect(() => {
		if (!editId || !existingRequest?.vehicleId || carModels.length === 0 || modelSlug) return
		const matchedModel = findModelByName(carModels, existingRequest.vehicleId.model)
		if (matchedModel) setModelSlug(matchedModel.slug)
	}, [editId, existingRequest, carModels, modelSlug])

	const onProtocolDrop = useCallback(
		(acceptedFiles) => {
			const validFiles = []
			acceptedFiles.forEach((file) => {
				const validation = validateFile(file, t)
				if (validation.isValid) validFiles.push(file)
				else toast.error(validation.error)
			})
			if (validFiles.length > 0) {
				setProtocolFiles((prev) => [...prev, ...validFiles].slice(0, 5))
			}
		},
		[t]
	)

	const addPhotoFiles = useCallback(
		(incoming) => {
			const validFiles = []
			incoming.forEach((file) => {
				const validation = validateFile(file, t)
				if (validation.isValid) validFiles.push(file)
				else toast.error(validation.error)
			})
			if (validFiles.length > 0) {
				setPhotoFiles((prev) => [...prev, ...validFiles].slice(0, 5))
			}
		},
		[t]
	)

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop: onProtocolDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
			'application/pdf': ['.pdf'],
		},
		maxFiles: 5,
		maxSize: 10 * 1024 * 1024,
		noClick: false,
		noDragEventsBubbling: true,
		multiple: true,
	})

	const handleBackRef = useRef(() => {})
	useRegisterMobileBack(
		() => handleBackRef.current?.(),
		currentStep !== 'start' && currentStep !== 'success'
	)

	if (authLoading) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="max-w-md mx-auto px-5 pt-8 pb-20 space-y-4">
					<Skeleton className="h-10 w-3/4" />
					<Skeleton className="h-16 w-full rounded-2xl" />
					<Skeleton className="h-16 w-full rounded-2xl" />
					<Skeleton className="h-16 w-full rounded-2xl" />
				</div>
			</div>
		)
	}

	if (!authLoading && editId && !isLoggedInCustomer) {
		navigate('/auth/signin', { replace: true })
		return null
	}

	const removeProtocolFile = (index) => {
		setProtocolFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const removePhotoFile = (index) => {
		setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
	}

	const goTo = (step) => {
		setCurrentStep(step)
		scrollTop()
	}

	const syncUploadPathParam = (path) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev)
			if (path) next.set('path', path)
			else next.delete('path')
			return next
		}, { replace: true })
	}

	const choosePath = (path) => {
		setCasePath(path)
		setProtocolFiles([])
		setPhotoFiles([])
		syncUploadPathParam(path)
		goTo(path)
	}

	const geocodePostalCode = async (usePostal) => {
		let geoLat = user?.latitude || 59.3293
		let geoLng = user?.longitude || 18.0686
		let geoCity = user?.city || 'Stockholm'
		if (!usePostal) return { geoLat, geoLng, geoCity }
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
		for (const file of allFiles) {
			const formData = new FormData()
			formData.append('file', file)
			const response = await uploadAPI.uploadFile(formData)
			uploadedFiles.push(response.data)
		}
		return uploadedFiles.map((file) => file.id || file._id).filter(Boolean)
	}

	const persistContactIfLoggedIn = async () => {
		if (!isLoggedInCustomer || !user?._id && !user?.id) return
		const userId = user._id || user.id
		const nextName = contactName.trim()
		const nextPhone = contactPhone.trim()
		if (!nextName && !nextPhone) return
		if (nextName === (user.name || '') && nextPhone === (user.phone || '')) return
		try {
			await authAPI.updateProfile(userId, {
				name: nextName || user.name,
				phone: nextPhone || user.phone,
			})
			await fetchUser?.()
		} catch (err) {
			console.warn('Could not update profile contact details:', err)
		}
	}

	const handleSend = async () => {
		if (!isValidSwedishRegistrationNumber(registrationNumber)) {
			toast.error(t('errors.registration_required'))
			return
		}
		if (!problemSummary) {
			toast.error(t('errors.description_required'))
			return
		}

		setIsUploading(true)
		try {
			if (editId && existingRequest) {
				const updateBody = {
					description: problemSummary,
					...((vehicleData.make !== existingRequest.vehicleId?.make ||
						vehicleData.model !== existingRequest.vehicleId?.model ||
						vehicleData.year !== existingRequest.vehicleId?.year)
						? { vehicleId: (await vehiclesAPI.create(buildVehiclePayload())).data._id }
						: {}),
				}
				await requestsAPI.update(editId, updateBody)
				toast.success(t('success.request_updated') || 'Request updated successfully')
				navigate('/contract')
				return
			}

			const usePostal = (postalCode || user?.postalCode || '').trim()
			const { geoLat, geoLng, geoCity } = await geocodePostalCode(usePostal)
			await persistContactIfLoggedIn()

			if (isLoggedInCustomer) {
				const reportIds = allFiles.length > 0 ? await uploadFiles() : []
				const vehicleResponse = await vehiclesAPI.create(buildVehiclePayload())
				const vehicleId = vehicleResponse.data._id || vehicleResponse.data.id
				await requestsAPI.create({
					vehicleId,
					reportIds,
					description: problemSummary,
					registrationNumber: normalizeSwedishRegistrationNumber(registrationNumber) || undefined,
					latitude: geoLat,
					longitude: geoLng,
					address: user?.address || geoCity,
					city: geoCity,
					postalCode: usePostal || '111 22',
					country: user?.country || 'SE',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				})
				toast.success(t('success.request_sent'))
				navigate('/upload?sent=1', { replace: true })
				goTo('success')
				return
			}

			const trimmedEmail = email.trim().toLowerCase()
			if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
				toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
				goTo('details')
				return
			}

			const reportIds = allFiles.length > 0 ? await uploadFiles() : []
			const response = await authAPI.sendMagicLink({
				email: trimmedEmail,
				requestData: {
					name: contactName.trim(),
					phone: contactPhone.trim(),
					reportIds,
					description: problemSummary,
					registrationNumber: normalizeSwedishRegistrationNumber(registrationNumber) || '',
					latitude: geoLat,
					longitude: geoLng,
					address: geoCity,
					city: geoCity,
					postalCode: usePostal || '111 22',
					country: 'SE',
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					vehicle: buildVehiclePayload(),
				},
				frontendUrl: window.location.origin,
			})
			const data = response.data || {}

			// First-time email → auto-login + success.
			if (data.token && data.user && !data.existingAccount) {
				await setSession(data.token, data.user)
				toast.success(t('success.request_sent'))
				navigate('/upload?sent=1', { replace: true })
				goTo('success')
				return
			}

			// Registered email → magic link sent; return to upload start with toast.
			toast.success(t('upload.flow.magic_link_sent') || 'Magic link sent successfully')
			resetWizard()
			navigate('/upload', { replace: true })
		} catch (error) {
			console.error('Upload error:', error)
			const errorCode = error.response?.data?.code
			const errorMessage =
				(errorCode === 'WORKSHOP_EMAIL' && (t('errors.workshop_email') || 'This is a workshop email. Please use a customer email.')) ||
				(errorCode === 'ADMIN_EMAIL' && (t('errors.admin_email') || 'This is an admin email. Please use a customer email.')) ||
				(errorCode === 'NON_CUSTOMER_EMAIL' && (t('errors.non_customer_email') || 'This email belongs to another account type. Please use a customer email.')) ||
				error.response?.data?.message ||
				error?.message ||
				t('errors.upload_failed')
			toast.error(errorMessage)
			if (errorCode === 'WORKSHOP_EMAIL' || errorCode === 'ADMIN_EMAIL' || errorCode === 'NON_CUSTOMER_EMAIL') {
				goTo('details')
			}
			if (error.response?.status === 409 || error.response?.data?.requiresSignIn) {
				setTimeout(() => navigate('/auth/signin'), 1500)
			}
		} finally {
			setIsUploading(false)
		}
	}

	const handleProblemContinue = () => {
		if (currentStep === 'protocol' && protocolFiles.length === 0) {
			toast.error(t('errors.file_required'))
			return
		}
		if ((currentStep === 'known' || currentStep === 'unknown') && !description.trim()) {
			toast.error(t('errors.description_required'))
			return
		}
		if (currentStep === 'unknown' && !problemStarted) {
			toast.error(t('errors.required_fields'))
			return
		}
		goTo('details')
	}

	const handleDetailsContinue = () => {
		if (!isValidSwedishRegistrationNumber(registrationNumber)) {
			toast.error(t('errors.registration_required'))
			return
		}
		if (!vehicleData.make?.trim() || !vehicleData.model?.trim()) {
			toast.error(t('errors.vehicle_info_required'))
			return
		}
		if (!problemSummary) {
			toast.error(t('errors.description_required'))
			return
		}
		if (!isLoggedInCustomer) {
			if (!contactName.trim()) {
				toast.error(t('errors.name_required') || 'Please enter your name')
				return
			}
			if (!contactPhone.trim()) {
				toast.error(t('errors.phone_required') || 'Please enter your phone number')
				return
			}
			const trimmedEmail = email.trim().toLowerCase()
			if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
				toast.error(t('errors.invalid_email_format') || 'Please enter a valid email address')
				return
			}
		}
		goTo('confirm')
	}

	const resetWizard = () => {
		setProtocolFiles([])
		setPhotoFiles([])
		setDescription('')
		setProblemStarted('')
		setRegistrationNumber('')
		setVehicleData({ make: '', model: '', year: '' })
		setCasePath('')
		setDevMagicLinkUrl('')
		syncUploadPathParam(null)
		setCurrentStep('start')
		scrollTop()
	}

	const handleBack = () => {
		if (currentStep === 'success') {
			resetWizard()
			return
		}
		if (currentStep === 'inbox') {
			goTo('confirm')
			return
		}
		if (currentStep === 'confirm') {
			goTo('details')
			return
		}
		if (currentStep === 'details') {
			if (casePath) {
				goTo(casePath)
				return
			}
			if (isLoggedInCustomer) {
				navigate(-1)
				return
			}
			goTo('start')
			return
		}
		if (PROBLEM_STEPS.has(currentStep)) {
			if (isLoggedInCustomer) {
				// History pop — avoids /contract remount flash.
				navigate(-1)
				return
			}
			syncUploadPathParam(null)
			setCasePath('')
			goTo('start')
			return
		}
		navigate(-1)
	}
	handleBackRef.current = handleBack

	const showBackArrow = currentStep !== 'start' && currentStep !== 'success'
	const backArrow = showBackArrow ? (
		<button
			type="button"
			onClick={handleBack}
			className="hidden lg:inline-flex items-center justify-center h-8 w-8 -ml-1 shrink-0 text-brand-navy hover:opacity-70"
			aria-label={t('common.back') || 'Back'}
		>
			<ArrowRight className="w-5 h-5 rotate-180" />
		</button>
	) : null

	const primaryBtn =
		'w-full min-h-[52px] lg:min-h-[64px] !rounded-md bg-brand-btn !text-white font-semibold text-base lg:text-lg leading-normal !shadow-none disabled:!bg-gray-300 disabled:opacity-60'
	const outlineBtn =
		'w-full !rounded-2xl lg:!min-h-[64px] lg:!text-lg !bg-white hover:!bg-[#E8F5EC] !text-[#1B8F3E] !border-[1.5px] !border-[#1B8F3E] !font-semibold !shadow-none'
	const fieldClass =
		'h-12 lg:h-14 text-sm lg:text-base border border-[#D7DEE8] rounded-xl bg-white text-[#05324f] placeholder:text-[#9CA3AF] focus-visible:ring-[#1B8F3E]/30'
	const selectTriggerClass = `${fieldClass} px-3.5 justify-between [&_svg]:text-[#05324f] [&_svg]:opacity-100`

	const carLine = [vehicleData.make, vehicleData.model, vehicleData.year].filter(Boolean).join(' · ') || '—'
	const contactEmail = email || user?.email || ''
	const contactDisplayName = contactName.trim() || user?.name || ''
	const uploadedCount = protocolFiles.length + photoFiles.length
	const problemText = problemDisplay || (protocolFiles.length > 0 ? t('upload.flow.protocol_uploaded') : '')

	return (
		<div className={`list-page-shell bg-white${isLoggedInCustomer ? ' customer-upload-page' : ''}`}>
			<Navbar />
			<div className="list-page-content lg:!max-w-7xl">
				<div className={`w-full ${isLoggedInCustomer && currentStep === 'start' ? 'pb-2' : 'pb-8'} ${currentStep === 'start' ? '' : 'max-w-md mx-auto lg:max-w-none'}`}>
					{currentStep === 'start' && (
						<CreateCaseStart onSelectPath={choosePath} />
					)}

					{currentStep === 'protocol' && (
						<div>
							<div className="flex items-center gap-1.5 lg:mb-4">
								{backArrow}
								<h1 className="page-title-hero !mb-0">
									{t('upload.flow.protocol_title')}
								</h1>
							</div>
							<p className="text-sm lg:text-lg text-[#374151] leading-relaxed mb-6 lg:mb-8 max-w-md">
								{t('upload.flow.protocol_subtitle')}
							</p>

							<div
								{...getRootProps()}
								className={`border-2 border-dashed rounded-xl lg:rounded-2xl px-5 py-7 lg:px-8 lg:py-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
									isDragActive
										? 'border-[#1B8F3E] bg-[#E8F8EC]'
										: 'border-[#86C59A] hover:border-[#1B8F3E] hover:bg-[#F3FBF6]'
								}`}
							>
								<input {...getInputProps()} />
								<FileDown className="w-14 h-14 lg:w-[4.25rem] lg:h-[4.25rem] mb-3 lg:mb-4 text-[#1B8F3E]" strokeWidth={1.5} />
								<p className="text-sm lg:text-lg font-bold text-brand-dark mb-1">
									{t('upload.flow.drag_drop')}
								</p>
								<p className="text-xs lg:text-sm text-[#6B7280] mb-5">
									{t('upload.flow.file_types')}
								</p>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										open()
									}}
									className="w-full max-w-[280px] min-h-[48px] px-6 rounded-xl bg-brand-btn text-white text-sm font-semibold"
								>
									{t('upload.flow.choose_file')}
								</button>
							</div>

							{protocolFiles.length > 0 && (
								<div className="mt-4 space-y-2">
									{protocolFiles.map((file, index) => (
										<div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 lg:p-4 bg-[#F8FAF9] rounded-xl border border-gray-100">
											<div className="flex items-center gap-3 min-w-0">
												<span className="text-xl">{getFileIcon(file.type)}</span>
												<div className="min-w-0">
													<p className="font-semibold text-xs lg:text-sm text-brand-navy truncate">{file.name}</p>
													<p className="text-[11px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => removeProtocolFile(index)}
												className="p-2 text-gray-400 hover:text-brand-dark"
												aria-label={t('common.delete')}
											>
												<X className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
							)}

							<div className="flex items-center gap-3 my-6">
								<div className="h-px bg-[#D1D5DB] flex-1" />
								<span className="text-xs lg:text-sm text-[#6B7280]">{t('common.or')}</span>
								<div className="h-px bg-[#D1D5DB] flex-1" />
							</div>

							<button
								type="button"
								onClick={() => setShowProtocolRemarks((prev) => !prev)}
								className="w-full text-center text-sm lg:text-base font-medium text-brand-dark hover:text-[#1B8F3E] mb-4"
							>
								{t('upload.flow.extra_remarks')}
							</button>

							{showProtocolRemarks && (
								<div className="mb-4">
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t('upload.flow.known_placeholder')}
										rows={3}
										maxLength={500}
										className="text-sm border border-gray-200 rounded-xl resize-none"
									/>
									<p className="text-[11px] text-gray-400 text-right mt-1">{description.length}/500</p>
								</div>
							)}

							<input
								ref={protocolPhotoInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
								multiple
								className="hidden"
								onChange={(e) => {
									const selected = Array.from(e.target.files || [])
									e.target.value = ''
									if (selected.length > 0) addPhotoFiles(selected)
								}}
							/>
							<button
								type="button"
								onClick={() => protocolPhotoInputRef.current?.click()}
								className="w-full flex items-center gap-3 rounded-xl bg-[#F3F4F6] px-4 py-3.5 text-left hover:bg-[#ECEEF1] transition-colors"
							>
								<div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
									<Camera className="w-5 h-5 text-[#1B8F3E]" strokeWidth={1.75} />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-brand-dark leading-snug">
										{t('upload.flow.photos_optional')}
									</p>
									<p className="text-xs text-[#6B7280] mt-0.5">
										{photoFiles.length}/5
									</p>
								</div>
							</button>

							{photoFiles.length > 0 && (
								<div className="mt-3">
									<PhotoGrid
										files={photoFiles}
										onRemove={removePhotoFile}
										onAddFiles={addPhotoFiles}
										addLabel={t('upload.flow.add_photo')}
										addFirst={false}
									/>
								</div>
							)}

							<Button
								type="button"
								onClick={handleProblemContinue}
								className={`${primaryBtn} mt-8`}
							>
								{t('upload.flow.continue')}
							</Button>
						</div>
					)}

					{currentStep === 'known' && (
						<div>
							<div className="flex items-center gap-1.5 lg:mb-4">
								{backArrow}
								<h1 className="page-title-hero !mb-0">
									{t('upload.flow.known_page_title')}
								</h1>
							</div>
							<p className="text-sm lg:text-lg text-gray-500 lg:text-[#374151] leading-relaxed mb-5 lg:mb-8">{t('upload.flow.known_page_subtitle')}</p>
							<Label className="text-sm font-semibold text-brand-navy mb-2 block">
								{t('upload.flow.what_needs_doing')}
							</Label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('upload.flow.known_placeholder')}
								rows={4}
								maxLength={500}
								className="text-sm lg:text-base lg:min-h-[160px] lg:p-5 border border-gray-200 rounded-xl lg:rounded-2xl resize-none"
							/>
							<p className="text-[11px] text-gray-400 text-right mt-1">{description.length}/500</p>
							<p className="text-sm font-medium text-brand-navy mt-5 mb-3">{t('upload.flow.have_photos')}</p>
							<PhotoGrid
								files={photoFiles}
								onRemove={removePhotoFile}
								onAddFiles={addPhotoFiles}
								addLabel={t('upload.flow.add_photo')}
							/>
							<Button
								type="button"
								onClick={handleProblemContinue}
								className={`${primaryBtn} mt-8`}
							>
								{t('upload.flow.continue')}
							</Button>
						</div>
					)}

					{currentStep === 'unknown' && (
						<div>
							<div className="flex items-center gap-1.5 lg:mb-4">
								{backArrow}
								<h1 className="page-title-hero !mb-0">
									{t('upload.flow.unknown_page_title')}
								</h1>
							</div>
							<p className="text-sm lg:text-lg text-gray-500 lg:text-[#374151] leading-relaxed mb-5 lg:mb-8">{t('upload.flow.unknown_page_subtitle')}</p>
							<Label className="text-sm font-semibold text-brand-navy mb-2 block">
								{t('upload.flow.describe_problem')}
							</Label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder={t('upload.flow.unknown_placeholder')}
								rows={4}
								maxLength={500}
								className="text-sm lg:text-base lg:min-h-[160px] lg:p-5 border border-gray-200 rounded-xl lg:rounded-2xl resize-none"
							/>
							<p className="text-[11px] text-gray-400 text-right mt-1">{description.length}/500</p>

							<p className="text-sm font-medium text-brand-navy mt-5 mb-3">{t('upload.flow.when_started')}</p>
							<div className="space-y-2">
								{[
									['recently', t('upload.flow.started_recently')],
									['weeks', t('upload.flow.started_weeks')],
									['month', t('upload.flow.started_month')],
								].map(([value, label]) => (
									<label key={value} className="flex items-center gap-3 lg:gap-4 rounded-xl lg:rounded-2xl border border-gray-100 px-3 py-2.5 lg:px-5 lg:py-4 lg:min-h-[64px] cursor-pointer">
										<input
											type="radio"
											name="started"
											checked={problemStarted === value}
											onChange={() => setProblemStarted(value)}
											className="accent-brand-green w-4 h-4 lg:w-5 lg:h-5"
										/>
										<span className="text-sm lg:text-base text-brand-navy">{label}</span>
									</label>
								))}
							</div>

							<p className="text-sm font-medium text-brand-navy mt-5 mb-3">{t('upload.flow.photos_optional')}</p>
							<PhotoGrid
								files={photoFiles}
								onRemove={removePhotoFile}
								onAddFiles={addPhotoFiles}
								addLabel={t('upload.flow.add_photo')}
							/>
							<Button
								type="button"
								onClick={handleProblemContinue}
								className={`${primaryBtn} mt-8`}
							>
								{t('upload.flow.continue')}
							</Button>
						</div>
					)}

					{currentStep === 'details' && (
						<div>
							<div className="flex items-center gap-1.5 lg:mb-3">
								{backArrow}
								<h1 className="page-title-hero !mb-0 text-[#05324f]">
									{t('upload.flow.details_title')}
								</h1>
							</div>
							<p className="text-sm lg:text-base text-[#4B5563] leading-relaxed mb-6 lg:mb-8 max-w-md">
								{t('upload.flow.details_subtitle')}
							</p>

							<p className="text-[15px] font-semibold text-[#05324f] mb-3">{t('upload.flow.car_details')}</p>
							<div className="space-y-3 mb-7">
								{isLoggedInCustomer && (savedCarsLoading || savedCars.length > 0) && (
									<div>
										<Select
											value={selectedSavedCarKey || undefined}
											onValueChange={applySavedCar}
											disabled={savedCarsLoading}
										>
											<SelectTrigger
												className={selectTriggerClass}
												placeholder={t('upload.flow.my_cars_placeholder') || 'Choose from My cars'}
											>
												<SelectValue placeholder={t('upload.flow.my_cars_placeholder') || 'Choose from My cars'} />
											</SelectTrigger>
											<SelectContent>
												{savedCars.map((car) => {
													const label = [car.make, car.model].filter(Boolean).join(' ')
													const sub = [car.registration, car.year].filter(Boolean).join(' · ')
													return (
														<SelectItem key={car.key} value={car.key} className="cursor-pointer text-sm py-2">
															{label || t('profile.my_cars_title')}
															{sub ? ` · ${sub}` : ''}
														</SelectItem>
													)
												})}
											</SelectContent>
										</Select>
										<p className="mt-1.5 text-xs text-[#9CA3AF]">{t('upload.flow.my_cars_hint') || 'Or fill in a new car below'}</p>
									</div>
								)}
								<div>
									<input
										value={registrationNumber}
										onChange={(e) => {
											setSelectedSavedCarKey('')
											setRegistrationNumber(formatSwedishRegistrationNumber(e.target.value))
										}}
										placeholder={t('upload.form.regnr_placeholder') || 'ABC 123'}
										maxLength={7}
										autoComplete="off"
										spellCheck={false}
										className="w-full h-12 lg:h-14 rounded-xl border border-[#D7DEE8] bg-white px-3.5 text-sm lg:text-base font-normal uppercase tracking-[0.08em] text-[#05324f] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-[#9CA3AF] focus:border-[#1B8F3E]"
									/>
									<p className="mt-1.5 text-xs text-[#9CA3AF]">{t('upload.form.regnr_label')}</p>
								</div>

								<SearchableSelect
									value={makeSlug || ''}
									selectedLabel={vehicleData.make}
									onValueChange={(value, label) => {
										setSelectedSavedCarKey('')
										handleMakeChange(value, label)
									}}
									options={makeOptions}
									disabled={loadingMakes}
									allowCustom
									placeholder={loadingMakes ? (t('common.loading') || 'Loading...') : t('upload.vehicle_info.make_placeholder')}
									searchPlaceholder={t('common.search')}
									emptyText={t('common.no_results')}
									triggerClassName={selectTriggerClass}
								/>
								<SearchableSelect
									value={modelSlug || ''}
									selectedLabel={vehicleData.model}
									onValueChange={handleModelChange}
									options={modelOptions}
									disabled={!vehicleData.make || loadingModels}
									allowCustom
									placeholder={
										!vehicleData.make
											? (t('upload.vehicle_info.select_make_first') || 'Select brand first')
											: loadingModels
												? (t('common.loading') || 'Loading...')
												: t('upload.vehicle_info.model_placeholder')
									}
									searchPlaceholder={t('common.search')}
									emptyText={t('common.no_results')}
									triggerClassName={selectTriggerClass}
								/>
								<Select
									value={vehicleData.year ? String(vehicleData.year) : ''}
									onValueChange={(value) => setVehicleData((prev) => ({ ...prev, year: parseInt(value, 10) }))}
								>
									<SelectTrigger
										className={selectTriggerClass}
										placeholder={t('upload.vehicle_info.year_placeholder') || 'Select year'}
									>
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
								<Select value={fuelType} onValueChange={setFuelType}>
									<SelectTrigger
										className={selectTriggerClass}
										placeholder={t('upload.flow.fuel_placeholder') || 'Select fuel type'}
									>
										<SelectValue placeholder={t('upload.flow.fuel_placeholder') || 'Select fuel type'} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="petrol">{t('upload.flow.fuel_petrol')}</SelectItem>
										<SelectItem value="diesel">{t('upload.flow.fuel_diesel')}</SelectItem>
										<SelectItem value="hybrid">{t('upload.flow.fuel_hybrid')}</SelectItem>
										<SelectItem value="electric">{t('upload.flow.fuel_electric')}</SelectItem>
										<SelectItem value="gas">{t('upload.flow.fuel_gas')}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<p className="text-[15px] font-semibold text-[#05324f] mb-3">{t('upload.flow.contact_details')}</p>
							<div className="space-y-3">
								<Input
									value={contactName}
									onChange={(e) => setContactName(e.target.value)}
									placeholder={t('upload.flow.name_placeholder')}
									className={fieldClass}
								/>
								<Input
									type="tel"
									inputMode="tel"
									autoComplete="tel-national"
									value={contactPhone}
									onChange={(e) => setContactPhone(formatSwedishPhone(e.target.value))}
									placeholder={t('upload.flow.phone_placeholder')}
									className={fieldClass}
								/>
								<Input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder={t('upload.flow.email_placeholder')}
									autoComplete="email"
									readOnly={isLoggedInCustomer}
									className={fieldClass}
								/>
							</div>

							<Button
								type="button"
								onClick={handleDetailsContinue}
								className={`${primaryBtn} mt-8 min-h-[52px]`}
							>
								{t('upload.flow.continue')}
							</Button>
						</div>
					)}

					{currentStep === 'confirm' && (
						<div>
							<div className="flex items-center gap-1.5 lg:mb-4">
								{backArrow}
								<h1 className="page-title-hero !mb-0">
									{t('upload.flow.confirm_title')}
								</h1>
							</div>
							<p className="text-sm lg:text-lg text-gray-500 lg:text-[#374151] leading-relaxed mb-5 lg:mb-8">
								{t('upload.flow.confirm_subtitle')}
							</p>

							<div className="rounded-2xl lg:rounded-3xl border border-gray-200 bg-white overflow-hidden">
								<div className="flex items-center justify-between px-4 py-3.5 lg:px-6 lg:py-5 border-b border-gray-100">
									<p className="text-sm lg:text-lg font-bold text-brand-dark">{t('upload.flow.summary')}</p>
									<button
										type="button"
										onClick={() => goTo('details')}
										className="text-sm lg:text-base font-semibold text-[#1B8F3E] hover:brightness-95"
									>
										{t('upload.flow.edit')}
									</button>
								</div>

								{problemText ? (
									<SummaryRow icon={Wrench} title={t('upload.flow.problem')}>
										<p className="whitespace-pre-line">{problemText}</p>
									</SummaryRow>
								) : null}

								<SummaryRow icon={Car} title={t('upload.flow.car')}>
									{carLine !== '—' ? <p>{carLine}</p> : null}
									{registrationNumber ? <p>{registrationNumber}</p> : null}
								</SummaryRow>

								<SummaryRow icon={User} title={t('upload.flow.contact')} last={uploadedCount === 0}>
									{contactDisplayName ? <p>{contactDisplayName}</p> : null}
									{contactPhone ? <p>{contactPhone}</p> : null}
									{contactEmail ? <p>{contactEmail}</p> : null}
								</SummaryRow>

								{uploadedCount > 0 && (
									<SummaryRow icon={ImageIcon} title={t('upload.flow.photos')} last>
										<p>{t('upload.flow.photos_count', { count: uploadedCount })}</p>
									</SummaryRow>
								)}
							</div>

							<div className="mt-4 lg:mt-6 mb-5 lg:mb-6 flex items-start gap-2.5 lg:gap-3 rounded-2xl bg-[#E8F8EC] px-3.5 py-3 lg:px-5 lg:py-4">
								<Lock className="w-4 h-4 lg:w-5 lg:h-5 text-[#1B8F3E] shrink-0 mt-0.5" strokeWidth={2} />
								<p className="text-xs lg:text-base text-[#05324f] leading-relaxed">{t('upload.flow.consent')}</p>
							</div>

							<Button type="button" onClick={handleSend} disabled={isUploading} className={primaryBtn}>
								{isUploading ? t('upload.submitting') : t('upload.flow.send_request')}
							</Button>
						</div>
					)}

					{currentStep === 'inbox' && (
						<div className="max-w-md mx-auto text-center pt-8">
							<div className="flex items-center justify-center gap-1.5 mb-3">
								{backArrow}
								<h1 className="page-title !mb-0">
									{t('upload.flow.guest_success_title')}
								</h1>
							</div>
							<p className="text-sm text-gray-500 leading-relaxed mb-4">
								{t('upload.flow.guest_success_subtitle')}
							</p>
							<p className="text-sm text-[#05324f] leading-relaxed mb-8">
								{t('upload.flow.guest_success_body')}
							</p>
							{devMagicLinkUrl && (
								<a href={devMagicLinkUrl} className={`${primaryBtn} mb-3`}>
									{t('upload.form.open_magic_link') || 'Open login link'}
								</a>
							)}
						</div>
					)}

					{currentStep === 'success' && (
						<div className="max-w-md mx-auto text-center pt-4 lg:pt-10">
							<RequestSentMark />
							<h1 className="page-title-hero !mb-3">
								{t('upload.flow.success_title')}
							</h1>
							<p className="text-sm lg:text-lg text-gray-500 leading-relaxed mb-6">
								{t('upload.flow.success_subtitle')}
							</p>
							<div className="rounded-2xl bg-[#F3FBF6] px-4 py-4 text-left space-y-4 mb-8">
								{[
									{ icon: Clock, text: t('upload.flow.success_time') },
									{ icon: Bell, text: t('upload.flow.success_notify') },
									{ icon: MapPin, text: t('upload.flow.success_follow') },
								].map(({ icon: Icon, text }) => (
									<div key={text} className="flex items-start gap-3">
										<Icon className="w-5 h-5 text-[#1B8F3E] shrink-0 mt-0.5" strokeWidth={1.75} />
										<p className="text-sm lg:text-base text-[#374151] leading-snug">{text}</p>
									</div>
								))}
							</div>
							<Button
								type="button"
								onClick={() => {
									const hasSession = Boolean(isLoggedInCustomer || localStorage.getItem('token'))
									navigate(hasSession ? '/contract' : '/auth/signin')
								}}
								className={`${primaryBtn} mb-3`}
							>
								{t('upload.flow.to_my_cases')}
							</Button>
							{devMagicLinkUrl && (
								<a href={devMagicLinkUrl} className={`${outlineBtn} mb-3`}>
									{t('upload.form.open_magic_link') || 'Open login link'}
								</a>
							)}
							<Button
								type="button"
								onClick={() => {
									resetWizard()
									navigate('/upload', { replace: true })
								}}
								className={outlineBtn}
							>
								{t('upload.flow.new_case')}
							</Button>
						</div>
					)}
				</div>
			</div>
			<Footer className={isLoggedInCustomer ? 'customer-upload-footer' : ''} />
		</div>
	)
}
