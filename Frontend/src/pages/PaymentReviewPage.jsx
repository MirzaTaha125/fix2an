import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Download, Star, Heart, ChevronRight, ArrowLeft, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WorkshopImage from '../components/WorkshopImage'
import {
	addressLine,
	downloadInvoicePdf,
	longDate,
	money,
	orderNumber,
	resolveCustomer,
} from '../components/invoice/InvoiceDocument'
import { CostSummarySkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import { bookingsAPI, reviewsAPI } from '../services/api'
import { getCaseTitle, getVehicleLine } from '../components/cases/caseHelpers'

const REVIEW_TAGS = ['service', 'communication', 'value', 'quality', 'delivery']

export default function PaymentReviewPage({ embedded = false, bookingId: bookingIdProp, initialStep, onDone }) {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const bookingId = bookingIdProp || searchParams.get('bookingId')
	const startStep = initialStep || searchParams.get('step') || 'payment'

	const [booking, setBooking] = useState(null)
	const [loading, setLoading] = useState(true)
	const [step, setStep] = useState(startStep === 'quote' ? 'payment' : startStep) // payment | rate | preview | thanks | receipt
	const [rating, setRating] = useState(0)
	const [tags, setTags] = useState([])
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [hasReview, setHasReview] = useState(false)
	const [downloadingInvoice, setDownloadingInvoice] = useState(false)

	useEffect(() => {
		if (!authLoading && !user) navigate('/auth/signin', { replace: true })
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (!user) return undefined
		if (!bookingId) {
			setLoading(false)
			navigate('/contract', { replace: true })
			return undefined
		}
		let stop = false
		const load = async (silent) => {
			if (!silent) setLoading(true)
			try {
				const res = await bookingsAPI.getByCustomer(user.id || user._id)
				const found = (res.data || []).find((b) => String(b._id || b.id) === String(bookingId))
				if (!found) {
					if (!silent) {
						toast.error(t('payment.flow.not_found'))
						navigate('/contract', { replace: true })
					}
					return
				}
				if (!stop) setBooking(found)
				if (!stop && found) {
					try {
						const reviewRes = await reviewsAPI.getByBooking(bookingId)
						if (!stop) setHasReview(Boolean(reviewRes.data?.rating || reviewRes.data?._id))
					} catch {
						if (!stop) setHasReview(Boolean(found.hasReview))
					}
				}
			} catch (e) {
				if (!silent) toast.error(t('errors.fetch_failed') || 'Failed to load')
			} finally {
				if (!stop && !silent) setLoading(false)
			}
		}
		load(false)
		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') load(true)
		}, 8000)
		return () => {
			stop = true
			clearInterval(timer)
		}
	}, [bookingId, user, navigate, t])

	const request = booking?.requestId
	const caseId = request?._id || request?.id || (typeof request === 'string' ? request : null)

	useEffect(() => {
		if (embedded || !booking || !caseId) return
		const stepQuery = startStep && startStep !== 'payment' ? `&step=${startStep}` : ''
		navigate(`/contract?case=${caseId}&panel=payment&bookingId=${bookingId}${stepQuery}`, { replace: true })
	}, [embedded, booking, caseId, bookingId, startStep, navigate])

	const { labor, parts, vat, total, extras: approvedExtras = [] } = costBreakdown(booking)
	const workshop = booking?.workshopId
	const finish = () => {
		if (onDone) onDone()
		else navigate('/contract')
	}

	useRegisterMobileBack(finish, Boolean(booking) && step === 'payment')
	const paidWhen = longDate(booking?.paidAt || Date.now(), i18n.language)
	const caseWhen = longDate(booking?.scheduledAt || request?.createdAt || booking?.createdAt, i18n.language)
	const orderNo = orderNumber(booking, bookingId)
	const receiptRef = String(bookingId || '').replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase() || '0000'
	const ratingLabel = rating >= 4 ? t('payment.flow.excellent') : t('payment.flow.your_rating')
	const invoiceCustomer = resolveCustomer(booking?.customerId, request?.customerId, request?.customer, user)

	const handleDownloadInvoice = async () => {
		if (downloadingInvoice || !booking) return
		setDownloadingInvoice(true)
		try {
			await downloadInvoicePdf({
				t,
				request,
				workshop,
				customer: invoiceCustomer,
				costs: { labor, parts, vat, total },
				extras: approvedExtras,
				issuedWhen: caseWhen,
				orderNo,
				receiptRef,
			})
		} catch {
			toast.error(t('payment.flow.pay_failed'))
		} finally {
			setDownloadingInvoice(false)
		}
	}

	const toggleTag = (tag) => {
		setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
	}

	const handleSubmitReview = async () => {
		if (!rating) {
			toast.error(t('my_cases.rating_required') || 'Rating required')
			return
		}
		setSubmitting(true)
		try {
			const body = comment.trim()
			const tagText = tags.length ? `[${tags.join(', ')}]` : ''
			const fullComment = [body, tagText].filter(Boolean).join('\n')
			await reviewsAPI.create({
				bookingId,
				rating,
				comment: fullComment,
			})
			setHasReview(true)
			setStep('thanks')
		} catch (e) {
			toast.error(e.response?.data?.message || t('my_cases.review_error') || 'Failed')
		} finally {
			setSubmitting(false)
		}
	}

	if (!embedded && booking && caseId) return null

	if (authLoading || loading) {
		const loadingBody = <CostSummarySkeleton />
		if (embedded) return loadingBody
		return (
			<div className="list-page-shell bg-white">
				<Navbar />
				<div className="list-page-content">{loadingBody}</div>
			</div>
		)
	}

	if (!booking) return null

	const flow = (
			<div className={embedded ? 'w-full' : 'list-page-content max-w-md mx-auto lg:max-w-5xl'}>
				{step === 'payment' && (
					<div className="max-w-xl">
						<button
							type="button"
							onClick={finish}
							className="mb-5 -ml-1 p-1 text-brand-dark hover:opacity-70 max-lg:hidden"
							aria-label={t('common.back')}
						>
							<ArrowLeft className="w-5 h-5" strokeWidth={2} />
						</button>
						<h1 className="page-title lg:text-4xl">{t('payment.flow.overview_title')}</h1>
						<p className="text-sm lg:text-base text-[#6B7280] mb-5">{t('payment.flow.overview_sub')}</p>
						<CaseCard request={request} label={t('payment.flow.your_case')} />
						<WorkshopCard workshop={workshop} label={t('offers_page.workshop')} />
						{approvedExtras.length > 0 && (
							<section className="mb-5">
								<h2 className="text-[15px] font-bold text-[#0B2540] mb-3">
									{t('workshop.contracts.extra_approval.approved_title')}
								</h2>
								<div className="space-y-2.5">
									{approvedExtras.map((extra, index) => (
										<div
											key={extra._id || index}
											className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-3 flex items-center justify-between gap-3"
										>
											<p className="text-sm font-semibold text-[#05324f] leading-snug min-w-0">
												{extra.description || t('workshop.contracts.extra_approval.extra_line')}
											</p>
											<p className="text-sm font-bold text-[#05324f] shrink-0">{money(extra.price)}</p>
										</div>
									))}
								</div>
							</section>
						)}
						<div className="mt-2">
						<h2 className="text-[15px] font-bold text-[#0B2540] mb-3">{t('payment.flow.cost_title')}</h2>
						<div className="space-y-2.5 mb-3">
							<Row label={t('payment.flow.labor')} value={money(labor)} />
							<Row label={t('payment.flow.parts')} value={money(parts)} />
							<Row label={t('payment.flow.vat')} value={money(vat)} />
							{approvedExtras.map((extra, index) => (
								<Row
									key={`extra-cost-${index}`}
									label={`${t('workshop.contracts.extra_approval.extra_line')}${extra.description ? ` — ${extra.description}` : ''}`}
									value={money(extra.price)}
								/>
							))}
						</div>
						<div className="border-t border-gray-100 pt-3 mb-5 flex justify-between items-center">
							<span className="text-sm font-bold text-[#0B2540]">{t('payment.flow.total')}</span>
							<span className="text-sm font-bold text-[#1B8F3E]">{money(total)}</span>
						</div>
						{booking.status === 'DONE' && !hasReview && (
							<button type="button" onClick={() => setStep('rate')} className={btn}>
								{t('payment.flow.add_review')}
							</button>
						)}
						<button
							type="button"
							onClick={handleDownloadInvoice}
							disabled={downloadingInvoice}
							className={`${btnOutline} ${booking.status === 'DONE' && !hasReview ? 'mt-3' : ''}`}
						>
							{downloadingInvoice ? '...' : t('payment.flow.download_invoice')}
							<Download className="w-4 h-4" />
						</button>
						</div>
					</div>
				)}

				{step === 'receipt' && (
					<div className="max-w-xl">
						<h1 className="page-title">{t('payment.flow.receipt_title')}</h1>
						<p className="text-sm text-[#6B7280] mb-5">{t('payment.flow.thanks_paid')}</p>
						<div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-6 text-center mb-6">
							<div className="w-16 h-16 rounded-full bg-[#E7F6EC] flex items-center justify-center mx-auto mb-3">
								<Check className="w-8 h-8 text-[#1B8F3E]" strokeWidth={2.75} />
							</div>
							<p className="text-base font-bold text-[#0B2540]">{t('payment.flow.paid_success')}</p>
							<p className="text-[1.85rem] font-bold text-[#1B8F3E] mt-1 mb-5">{money(total)}</p>
							<div className="flex items-end justify-between text-left gap-3">
								<div>
									<p className="text-xs text-[#9CA3AF]">{t('payment.flow.paid_success')}</p>
									<p className="text-xs text-[#9CA3AF] mt-0.5">{t('payment.flow.reference', { id: receiptRef })}</p>
								</div>
								<p className="text-sm font-bold text-[#0B2540]">VISA</p>
							</div>
						</div>
						<h2 className="text-sm font-bold text-[#0B2540] mb-3">{t('payment.flow.method')}</h2>
						<div className="space-y-3 mb-6">
							<Row label={t('payment.flow.card')} value={t('payment.flow.card_value')} />
							<Row label={t('payment.flow.payment_date')} value={paidWhen.dateTime} />
							<Row label={t('payment.flow.order')} value={orderNo} />
							<div className="flex justify-between items-center gap-3 text-sm">
								<span className="text-[#6B7280]">{t('payment.flow.invoice')}</span>
								<button
									type="button"
									onClick={() => {
										downloadInvoicePdf({
											t,
											request,
											workshop,
											customer: invoiceCustomer,
											costs: { labor, parts, vat, total },
											extras: approvedExtras,
											issuedWhen: paidWhen,
											orderNo,
											receiptRef,
										}).catch(() => toast.error(t('payment.flow.pay_failed')))
									}}
									className="font-semibold text-[#1B8F3E]"
								>
									{t('payment.flow.download_pdf')}
								</button>
							</div>
						</div>
						<button type="button" onClick={finish} className={btn}>{t('payment.flow.to_cases')}</button>
						{!hasReview && (
							<button type="button" onClick={() => setStep('rate')} className={`${btnOutline} mt-3`}>
								{t('payment.flow.add_review')}
							</button>
						)}
					</div>
				)}

				{step === 'rate' && (
					<div className="max-w-xl">
						<h1 className="page-title">{t('payment.flow.rate_title')}</h1>
						<p className="text-sm text-[#6B7280] mb-5">{t('payment.flow.rate_sub')}</p>
						<p className="text-sm font-bold text-[#0B2540] mb-2">{t('payment.flow.overall')}</p>
						<div className="flex gap-2 mb-6">
							{[1, 2, 3, 4, 5].map((n) => (
								<button key={n} type="button" onClick={() => setRating(n)} aria-label={String(n)}>
									<Star className={`w-7 h-7 ${n <= rating ? 'fill-[#1B8F3E] text-[#1B8F3E]' : 'text-[#1B8F3E]'}`} strokeWidth={1.6} />
								</button>
							))}
						</div>
						<p className="text-sm font-bold text-[#0B2540] mb-2">{t('payment.flow.what_good')}</p>
						<div className="flex flex-wrap gap-2 mb-5">
							{REVIEW_TAGS.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => toggleTag(tag)}
									className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
										tags.includes(tag) ? 'bg-[#E8F5EC] border-[#1B8F3E] text-[#1B8F3E]' : 'border-gray-200 text-[#0B2540] bg-white'
									}`}
								>
									{t(`payment.flow.tag_${tag}`)}
								</button>
							))}
						</div>
						<label className="text-sm font-bold text-[#0B2540] block mb-2">{t('payment.flow.comment')}</label>
						<textarea
							value={comment}
							onChange={(e) => setComment(e.target.value.slice(0, 500))}
							rows={4}
							placeholder={t('payment.flow.comment_placeholder')}
							className="w-full rounded-xl border border-gray-200 p-3 text-sm placeholder:text-gray-400"
						/>
						<p className="text-xs text-gray-400 text-right mt-1 mb-5">{comment.length}/500</p>
						<button type="button" onClick={() => setStep('preview')} disabled={!rating} className={btn}>
							{t('payment.flow.continue')}
						</button>
					</div>
				)}

				{step === 'preview' && (
					<div className="max-w-xl">
						<h1 className="page-title">{t('payment.flow.preview_title')}</h1>
						<p className="text-sm text-[#6B7280] mb-5">{t('payment.flow.preview_sub')}</p>
						<div className="rounded-2xl border border-[#E5E7EB] px-4 py-3 flex items-center gap-3 mb-5">
							<div className="w-11 h-11 rounded-full overflow-hidden bg-[#0B2540] shrink-0">
								<WorkshopImage workshop={workshop} className="w-full h-full" />
							</div>
							<div>
								<p className="text-sm font-bold text-[#0B2540]">{t('payment.flow.overall')}</p>
								<p className="text-sm text-[#6B7280]">{ratingLabel}</p>
							</div>
						</div>
						<p className="text-sm font-bold text-[#0B2540] mb-2">{ratingLabel}</p>
						<div className="flex gap-1.5 mb-5">
							{[1, 2, 3, 4, 5].map((n) => (
								<Star key={n} className={`w-6 h-6 ${n <= rating ? 'fill-[#1B8F3E] text-[#1B8F3E]' : 'text-gray-200'}`} />
							))}
						</div>
						<p className="text-sm font-bold text-[#0B2540] mb-2">{t('payment.flow.your_comment')}</p>
						<div className="rounded-2xl bg-[#F3FBF6] px-4 py-3.5 flex items-center gap-3 mb-5">
							<Calendar className="w-5 h-5 text-[#1B8F3E] shrink-0" />
							<p className="text-sm text-[#1B8F3E] flex-1 min-w-0 line-clamp-2">{comment || '—'}</p>
							<button type="button" onClick={() => setStep('rate')} className="text-sm font-semibold text-[#1B8F3E] shrink-0">{t('payment.flow.edit')}</button>
						</div>
						<p className="text-sm font-bold text-[#0B2540] mb-2">{t('payment.flow.your_choices')}</p>
						<div className="flex flex-wrap gap-2 mb-6">
							{tags.map((tag) => (
								<span key={tag} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#E5E7EB] bg-white text-[#374151]">
									{t(`payment.flow.tag_${tag}`)}
								</span>
							))}
						</div>
						<button type="button" disabled={submitting} onClick={handleSubmitReview} className={btn}>
							{submitting ? '...' : t('payment.flow.send_review')}
						</button>
						<button type="button" onClick={() => setStep('rate')} className={`${btnOutline} mt-3`}>
							{t('payment.flow.back_edit')}
						</button>
					</div>
				)}

				{step === 'thanks' && (
					<div className="max-w-xl mx-auto text-center">
						<div className="w-[88px] h-[88px] rounded-full bg-[#F3FBF6] ring-8 ring-[#E7F6EC] flex items-center justify-center mx-auto mb-5">
							<Check className="w-9 h-9 text-[#1B8F3E]" strokeWidth={2.75} />
						</div>
						<h1 className="page-title !mb-2">{t('payment.flow.thanks_title')}</h1>
						<p className="text-sm text-[#6B7280] mb-6 max-w-xs mx-auto">{t('payment.flow.thanks_sub')}</p>
						<ThanksWorkshop workshop={workshop} rating={rating} language={i18n.language} reviewsLabel={t('payment.flow.reviews_count', { count: Math.max(1, Number(workshop?.reviewCount || 0) + 1) })} />
						<div className="rounded-2xl bg-[#F3FBF6] px-4 py-3.5 flex items-start gap-3 text-left mb-6">
							<Heart className="w-5 h-5 text-[#1B8F3E] shrink-0 mt-0.5" />
							<p className="text-sm text-[#0B2540]">{t('payment.flow.together')}</p>
						</div>
						<button type="button" onClick={finish} className={btn}>{t('payment.flow.to_cases')}</button>
						<button type="button" onClick={finish} className={`${btnOutline} mt-3`}>{t('payment.flow.see_workshops')}</button>
					</div>
				)}
			</div>
	)

	if (embedded) return flow

	return (
		<div className="list-page-shell bg-white font-sans">
			<Navbar />
			{flow}
			<Footer />
		</div>
	)
}

const btn = 'w-full min-h-[52px] bg-brand-btn disabled:opacity-40 text-white rounded-lg font-semibold flex items-center justify-center gap-2'
const btnOutline = 'w-full min-h-[52px] border-[1.5px] border-[#1B8F3E] text-[#1B8F3E] rounded-lg font-semibold flex items-center justify-center gap-2'

function approvedExtrasOf(booking) {
	return (booking?.extraApprovals || []).filter((item) => String(item.status).toUpperCase() === 'APPROVED')
}

function costBreakdown(booking) {
	const offer = booking?.offerId || {}
	const extras = approvedExtrasOf(booking)
	const extrasSum = extras.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
	const quoted = Number(booking?.totalAmount || offer.price || 0)
	const storedFinal = booking?.finalAmount != null ? Number(booking.finalAmount) : null
	const total = Number.isFinite(storedFinal) && storedFinal > 0 ? storedFinal : quoted + extrasSum
	const vatRate = Number(offer?.vatRate)
	const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 15
	const factor = 1 + rate / 100
	let labor = Number(offer.laborCost) || 0
	let parts = Number(offer.partsCost) || 0
	const quoteBase = quoted || Math.max(0, total - extrasSum)
	if (!labor && !parts && quoteBase) {
		const ex = Math.round(quoteBase / factor)
		labor = Math.round(ex * 0.4)
		parts = ex - labor
	}
	const base = labor + parts
	const vat = quoteBase > base ? quoteBase - base : Math.round(base * rate / 100)
	return { labor, parts, vat, extras, extrasSum, total }
}

function Row({ label, value }) {
	return (
		<div className="flex justify-between gap-3 text-sm">
			<span className="text-[#6B7280]">{label}</span>
			<span className="font-semibold text-[#0B2540] text-right">{value}</span>
		</div>
	)
}

function CaseCard({ request, label }) {
	const reg = request?.registrationNumber || request?.vehicleId?.registrationNumber
	const vehicle = getVehicleLine({ ...request, registrationNumber: reg })
	return (
		<div className="mb-3">
			<p className="text-xs font-medium text-[#6B7280] mb-1.5">{label}</p>
			<div className="rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-bold text-[#0B2540] truncate">{getCaseTitle(request)}</p>
					<p className="text-xs text-[#6B7280] mt-0.5 truncate">{vehicle}</p>
				</div>
				<ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
			</div>
		</div>
	)
}

function WorkshopCard({ workshop, label, caseLabel, dateLabel }) {
	const address = addressLine(workshop)
	return (
		<div className="mb-5">
			{label && <p className="text-xs font-medium text-[#6B7280] mb-1.5">{label}</p>}
			<div className="rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
				<div className="w-11 h-11 rounded-full overflow-hidden bg-[#0B2540] shrink-0">
					<WorkshopImage workshop={workshop} className="w-full h-full" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-bold text-[#0B2540] truncate">{workshop?.companyName}</p>
					{address && <p className="text-xs text-[#6B7280] truncate">{address}</p>}
					{caseLabel && <p className="text-xs text-[#6B7280] truncate">{caseLabel}</p>}
					{dateLabel && <p className="text-xs text-[#6B7280]">{dateLabel}</p>}
				</div>
			</div>
		</div>
	)
}

function ThanksWorkshop({ workshop, rating, language, reviewsLabel }) {
	const score = Number(workshop?.rating) || rating || 0
	const locale = String(language || '').startsWith('sv') ? 'sv-SE' : 'en-GB'
	const shown = score.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
	return (
		<div className="rounded-2xl border border-gray-100 p-4 text-left mb-4">
			<div className="flex items-center gap-3">
				<div className="w-11 h-11 rounded-full overflow-hidden bg-[#0B2540] shrink-0">
					<WorkshopImage workshop={workshop} className="w-full h-full" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold text-[#0B2540] truncate">{workshop?.companyName}</p>
					<p className="text-xs text-[#6B7280] mt-0.5">{shown} ({reviewsLabel})</p>
				</div>
			</div>
		</div>
	)
}
