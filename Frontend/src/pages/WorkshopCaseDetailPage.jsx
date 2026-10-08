import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, FileText, Phone, Mail, Check, User, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import WorkshopShell from '../components/workshop/WorkshopShell'
import { CaseDetailSkeleton } from '../components/ui/Skeleton'
import CaseChat from '../components/cases/CaseChat'
import {
	downloadInvoicePdf,
	longDate,
	orderNumber,
	resolveCustomer,
} from '../components/invoice/InvoiceDocument'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import { useAuth } from '../context/AuthContext'
import { requestsAPI, workshopAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'
import { formatPrice, parseInclusionItems } from '../utils/cn'
import { getRequestVehicle, formatRequestRegistration } from '../components/VehicleRequestCard'

function isImageFile(file) {
	const url = file?.fileUrl || file?.url || ''
	return String(file?.mimeType || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|gif)$/i.test(url)
}

function quoteCosts(offer) {
	const total = Number(offer?.price) || 0
	const labor = Number(offer?.laborCost) || 0
	const parts = Number(offer?.partsCost) || 0
	const vatRate = Number(offer?.vatRate)
	const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 15
	const factor = 1 + rate / 100
	const exVat = total ? Math.round(total / factor) : labor + parts
	const other = Math.max(0, exVat - labor - parts)
	const base = labor + parts + other
	const vat = total > base ? total - base : Math.round(base * rate / 100)
	return { labor, parts, other, vat, total: total || base + vat }
}

function SentQuote({ t, offer, onDownloadInvoice, downloadingInvoice = false }) {
	const costs = quoteCosts(offer)
	const inclusions = parseInclusionItems(offer?.inclusions)
	const rows = [
		[t('payment.flow.labor'), costs.labor],
		[t('payment.flow.parts'), costs.parts],
		...(costs.other ? [[t('workshop.offer.other'), costs.other]] : []),
		[t('payment.flow.vat'), costs.vat],
	]
	return (
		<section className="rounded-2xl bg-[#F5F7F9] p-4 mt-5">
			<h2 className="text-base font-bold text-brand-dark mb-3">{t('workshop.panel.your_quote')}</h2>
			<div className="space-y-2.5 mb-3">
				{rows.map(([label, value]) => (
					<div key={label} className="flex justify-between gap-3 text-sm">
						<span className="text-[#6B7280]">{label}</span>
						<span className="font-semibold text-[#111827]">{formatPrice(value)}</span>
					</div>
				))}
			</div>
			<div className="border-t border-gray-200 pt-3 flex justify-between items-center">
				<span className="text-sm font-bold text-[#0B2540]">{t('payment.flow.total')}</span>
				<span className="text-sm font-bold text-[#008037]">{formatPrice(costs.total)}</span>
			</div>
			{inclusions.length > 0 && (
				<div className="mt-4">
					<h3 className="text-sm font-bold text-[#0B2540] mb-2">{t('quotes.flow.whats_included')}</h3>
					<ul className="space-y-2">
						{inclusions.map((item) => (
							<li key={item} className="flex items-start gap-2 text-sm text-[#111827]">
								<Check className="w-4 h-4 text-[#008037] shrink-0 mt-0.5" strokeWidth={3} />
								{item}
							</li>
						))}
					</ul>
				</div>
			)}
			{offer?.note && (
				<div className="mt-4">
					<h3 className="text-sm font-bold text-[#0B2540] mb-1">{t('quotes.flow.workshop_comment')}</h3>
					<p className="text-sm text-[#4B5563] leading-relaxed">{offer.note}</p>
				</div>
			)}
			{onDownloadInvoice ? (
				<button
					type="button"
					onClick={onDownloadInvoice}
					disabled={downloadingInvoice}
					className="mt-4 w-full min-h-[48px] rounded-xl border-[1.5px] border-[#9AD4B0] text-[#008037] text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
				>
					<Download className="w-4 h-4" />
					{downloadingInvoice ? '...' : t('payment.flow.download_invoice')}
				</button>
			) : null}
		</section>
	)
}

export function WorkshopCasePanel({ requestId, onBack, onCreateQuote, embedded = false, quoteSent = false, quote = null, suspendBack = false }) {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { user } = useAuth()
	const [request, setRequest] = useState(null)
	const [loading, setLoading] = useState(true)
	const [panel, setPanel] = useState('details')
	const [photoTab, setPhotoTab] = useState('photos')
	const [workshopId, setWorkshopId] = useState('')
	const [workshopProfile, setWorkshopProfile] = useState(null)
	const onBackRef = useRef(onBack)
	onBackRef.current = onBack
	const [downloadingInvoice, setDownloadingInvoice] = useState(false)
	useRegisterMobileBack(onBack, Boolean(onBack) && !suspendBack)

	useEffect(() => {
		if (!requestId) return undefined
		let stop = false
		setLoading(true)
		setPanel('details')
		requestsAPI.getById(requestId)
			.then((response) => {
				if (!stop) setRequest(response.data)
			})
			.catch((error) => {
				toast.error(error.response?.data?.message || t('errors.fetch_failed'))
				if (!embedded) navigate('/workshop/requests', { replace: true })
				else onBackRef.current?.()
			})
			.finally(() => {
				if (!stop) setLoading(false)
			})
		return () => {
			stop = true
		}
	}, [requestId, navigate, t, embedded])

	useEffect(() => {
		let stop = false
		workshopAPI.getProfile()
			.then((response) => {
				if (stop) return
				const workshop = response.data?.workshop || null
				setWorkshopProfile(workshop)
				setWorkshopId(workshop?.id || workshop?._id || '')
			})
			.catch(() => {
				if (!stop) {
					setWorkshopId('')
					setWorkshopProfile(null)
				}
			})
		return () => { stop = true }
	}, [])

	const vehicle = getRequestVehicle(request)
	const customer = resolveCustomer(request?.customerId, request?.customer)
	const reports = [
		...(request?.reportId ? [request.reportId] : []),
		...(Array.isArray(request?.reportIds) ? request.reportIds : []),
	].filter(Boolean)
	const photos = reports.filter(isImageFile)
	const protocols = reports.filter((file) => !isImageFile(file))
	const caseNo = String(requestId || '').slice(-5).toUpperCase()
	const vehicleTitle = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ')
	const registration = formatRequestRegistration(request)
	const locale = i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-GB'
	const created = request?.createdAt
		? new Date(request.createdAt).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
		: ''

	const offerForInvoice = quote || (request?.offers || []).find((item) => ['SENT', 'ACCEPTED', 'DONE'].includes(String(item.status || '').toUpperCase())) || (request?.offers || [])[0] || null
	const bookingForInvoice = (request?.bookings || []).find((item) => {
		const offerId = item.offerId?._id || item.offerId?.id || item.offerId
		const currentOfferId = offerForInvoice?._id || offerForInvoice?.id
		return currentOfferId && String(offerId) === String(currentOfferId)
	}) || (request?.bookings || [])[0] || null
	const quoteAlreadySent = quoteSent || Boolean(offerForInvoice) || (request?.offers || []).length > 0
	const statusLabel = quoteAlreadySent ? t('workshop.panel.offer_sent') : t('workshop.panel.new_badge')
	const summary = [
		[t('my_cases.flow.summary_status'), statusLabel],
		[t('workshop.requests.location_label'), request?.city || '—'],
		[t('upload.flow.registration'), registration || '—'],
		[t('workshop.panel.created'), created || '—'],
	]
	const panels = ['details', 'photos', 'messages']
	const invoiceCosts = offerForInvoice ? quoteCosts(offerForInvoice) : null
	const invoiceExtras = (bookingForInvoice?.extraApprovals || []).filter((item) => String(item.status).toUpperCase() === 'APPROVED')
	const invoiceIssued = longDate(bookingForInvoice?.scheduledAt || bookingForInvoice?.createdAt || offerForInvoice?.createdAt || request?.createdAt, i18n.language)
	const invoiceOrderNo = orderNumber(bookingForInvoice, bookingForInvoice?._id || bookingForInvoice?.id || offerForInvoice?._id || offerForInvoice?.id)
	const invoiceRef = String(bookingForInvoice?._id || bookingForInvoice?.id || offerForInvoice?._id || offerForInvoice?.id || '').replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase()

	const handleDownloadInvoice = async () => {
		if (downloadingInvoice || !offerForInvoice || !invoiceCosts || !request) return
		setDownloadingInvoice(true)
		try {
			await downloadInvoicePdf({
				t,
				request,
				workshop: workshopProfile || { companyName: user?.name, phone: user?.phone, email: user?.email },
				customer,
				costs: invoiceCosts,
				extras: invoiceExtras,
				issuedWhen: invoiceIssued,
				orderNo: invoiceOrderNo,
				receiptRef: invoiceRef,
			})
		} catch {
			toast.error(t('payment.flow.pay_failed'))
		} finally {
			setDownloadingInvoice(false)
		}
	}

	const messagesOpen = panel === 'messages'

	return (
		<div className={`w-full ${messagesOpen ? 'case-detail-chat-lock max-lg:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px)-var(--bottom-nav-height)-env(safe-area-inset-bottom,0px))]' : ''}`}>
			{onBack && (
				<button type="button" onClick={onBack} className="hidden lg:inline-flex items-center gap-1 text-sm font-semibold text-[#008037] mb-4 shrink-0">
					<ArrowLeft className="w-4 h-4" />
					{t('workshop.panel.back')}
				</button>
			)}
			{loading || !request ? (
				<CaseDetailSkeleton />
			) : (
				<>
					<div className={messagesOpen ? 'shrink-0' : ''}>
					<div className="flex items-start justify-between gap-3">
						<h1 className="page-title">
							{t('workshop.panel.case_no', { id: caseNo })}
						</h1>
						<span className={`mt-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
							quoteAlreadySent
								? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
								: 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
						}`}>
							{statusLabel}
						</span>
					</div>
					<p className="text-sm font-bold text-[#111827] mt-2">
						{[vehicleTitle, registration !== '—' ? registration : ''].filter(Boolean).join(' · ')}
					</p>
					{created && (
						<p className="text-xs text-[#9CA3AF] mt-1">{t('workshop.panel.created')}: {created}</p>
					)}

					<div className={`flex gap-2 mt-5 overflow-x-auto ${messagesOpen ? 'mb-3' : 'mb-6'}`}>
						{panels.map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setPanel(key)}
								className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold ${panel === key ? 'bg-brand-btn text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
							>
								{t(`my_cases.flow.panel_${key}`)}
							</button>
						))}
					</div>
					</div>

					{messagesOpen ? (
						workshopId ? (
							<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
								<CaseChat
									requestId={requestId}
									workshopId={workshopId}
									title={customer?.name || t('workshop.panel.customer')}
									viewerRole="WORKSHOP"
									variant="workshop"
								/>
							</div>
						) : (
							<p className="text-sm text-gray-500">{t('workshop.panel.chat_pick')}</p>
						)
					) : (
					<>

					{panel === 'photos' && (
						<div className="flex gap-6 mb-5 border-b border-gray-100">
							{[
								{ key: 'photos', label: t('my_cases.flow.photos') },
								{ key: 'documents', label: t('my_cases.flow.documents') },
							].map((tab) => (
								<button
									key={tab.key}
									type="button"
									onClick={() => setPhotoTab(tab.key)}
									className={`pb-2 text-sm transition-colors ${
										photoTab === tab.key
											? 'text-[#008037] font-semibold border-b-2 border-[#008037] -mb-px'
											: 'text-gray-400 font-medium'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					)}

					{panel === 'details' && (
						<div>
							<h2 className="text-sm font-bold text-[#111827] mb-1">{t('workshop.panel.description')}</h2>
							<p className="text-sm text-[#4B5563] leading-relaxed">{request.description || '—'}</p>

							{offerForInvoice ? (
								<SentQuote
									t={t}
									offer={offerForInvoice}
									onDownloadInvoice={handleDownloadInvoice}
									downloadingInvoice={downloadingInvoice}
								/>
							) : !quoteAlreadySent && (
								<section className="rounded-2xl bg-[#F5F7F9] p-4 mt-5">
									<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
										<div className="min-w-0">
											<h2 className="text-base font-bold text-brand-dark mb-1.5">{t('my_cases.flow.next_step')}</h2>
											<p className="text-sm text-[#4B5563] leading-relaxed">{t('workshop.panel.create_quote_body')}</p>
										</div>
										{onCreateQuote ? (
											<button
												type="button"
												onClick={onCreateQuote}
												className="w-full lg:w-auto lg:shrink-0 px-6 lg:px-5 min-h-[52px] lg:min-h-[44px] lg:text-sm bg-brand-btn text-white rounded-xl font-semibold flex items-center justify-center"
											>
												{t('workshop.panel.create_quote')}
											</button>
										) : (
											<Link
												to={`/workshop/requests?case=${requestId}&panel=quote`}
												className="w-full lg:w-auto lg:shrink-0 px-6 lg:px-5 min-h-[52px] lg:min-h-[44px] lg:text-sm bg-brand-btn text-white rounded-xl font-semibold flex items-center justify-center"
											>
												{t('workshop.panel.create_quote')}
											</Link>
										)}
									</div>
								</section>
							)}

							<div className="mt-5 border-t border-gray-100 pt-4">
								<h2 className="text-base font-bold text-[#111827] mb-1">{t('my_cases.flow.summary')}</h2>
								<div className="divide-y divide-gray-100">
									{summary.map(([label, value]) => (
										<div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
											<span className="text-[#6B7280]">{label}</span>
											<span className="font-semibold text-[#111827] text-right">{value}</span>
										</div>
									))}
								</div>
							</div>

							{protocols.length > 0 && (
								<div className="mt-5">
									<h2 className="text-sm font-bold text-[#111827] mb-2">{t('workshop.panel.attached')}</h2>
									{protocols.map((report, index) => {
										const file = report.fileUrl || report.url
										const name = report.fileName || report.name || t('workshop.panel.protocol')
										return (
											<a
												key={report._id || index}
												href={file ? getFullUrl(file) : undefined}
												target="_blank"
												rel="noreferrer"
												className="flex items-center justify-between gap-3 rounded-xl bg-[#F3F4F6] px-3 py-3 mb-2"
											>
												<span className="flex items-center gap-2 min-w-0 text-sm text-[#111827]">
													<FileText className="w-4 h-4 text-[#6B7280] shrink-0" />
													<span className="truncate">{name}</span>
												</span>
												<span className="text-sm font-semibold text-[#008037] shrink-0">{t('workshop.panel.download')}</span>
											</a>
										)
									})}
								</div>
							)}

							<h2 className="text-sm font-bold text-[#111827] mt-5 mb-2">{t('workshop.panel.customer')}</h2>
							<p className="flex items-center gap-2 text-sm text-[#6B7280]">
								<User className="w-3.5 h-3.5" /> {customer?.name || '—'}
							</p>
							{customer?.phone && (
								<p className="flex items-center gap-2 text-sm text-[#6B7280] mt-1.5">
									<Phone className="w-3.5 h-3.5" /> {customer.phone}
								</p>
							)}
							{customer?.email && (
								<p className="flex items-center gap-2 text-sm text-[#6B7280] mt-1">
									<Mail className="w-3.5 h-3.5" /> {customer.email}
								</p>
							)}
						</div>
					)}

					{panel === 'photos' && (
						<div>
							{photoTab === 'photos' ? (
								<>
									<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.uploaded_photos')}</h2>
									{photos.length === 0 ? (
										<p className="text-sm text-gray-500">{t('my_cases.flow.no_documents')}</p>
									) : (
										<div className="grid grid-cols-2 gap-3 lg:max-w-sm">
											{photos.map((file, index) => (
												<div key={file._id || index} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
													<img src={getFullUrl(file.fileUrl || file.url)} alt="" className="w-full h-full object-cover" />
												</div>
											))}
										</div>
									)}
									<div className="mt-6 rounded-2xl bg-[#E8F5EC] px-4 py-3.5 flex items-start gap-3">
										<ShieldCheck className="w-5 h-5 text-[#008037] shrink-0 mt-0.5" strokeWidth={2} />
										<p className="text-sm text-[#1F2937] leading-snug">{t('my_cases.flow.photos_private')}</p>
									</div>
								</>
							) : (
								<>
									<h2 className="text-base font-bold text-brand-dark mb-3">{t('my_cases.flow.documents')}</h2>
									{protocols.length === 0 ? (
										<p className="text-sm text-gray-500">{t('my_cases.flow.no_documents')}</p>
									) : (
										<div className="rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
											{protocols.map((file, index) => (
												<a
													key={file._id || index}
													href={getFullUrl(file.fileUrl || file.url)}
													target="_blank"
													rel="noreferrer"
													className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-brand-dark hover:bg-gray-50"
												>
													<span className="flex items-center gap-2 min-w-0">
														<FileText className="w-4 h-4 text-[#6B7280] shrink-0" />
														<span className="truncate">{file.fileName || file.name || t('workshop.panel.protocol')}</span>
													</span>
													<span className="text-sm font-semibold text-[#008037] shrink-0">{t('workshop.panel.download')}</span>
												</a>
											))}
										</div>
									)}
								</>
							)}
						</div>
					)}

					</>
					)}
				</>
			)}
		</div>
	)
}

export default function WorkshopCaseDetailPage() {
	const { id } = useParams()
	const navigate = useNavigate()
	return (
		<WorkshopShell>
			<div className="workshop-cases-page list-page-shell bg-transparent flex flex-col">
				<div className="list-page-content !px-6 sm:!px-8 lg:!px-10 flex-1 !min-h-0 flex flex-col overflow-hidden">
					<WorkshopCasePanel requestId={id} onBack={() => navigate('/workshop/requests')} />
				</div>
			</div>
		</WorkshopShell>
	)
}
