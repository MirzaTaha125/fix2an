import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { Building2, Calendar, Check, Download, FileText, Mail, Phone, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getCaseTitle, getVehicleLine } from '../cases/caseHelpers'
import { formatSwedishPhone } from '../../utils/swedishPhone'
import mainLogo from '../../assets/main_logo.png'

export function money(n) {
	return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))} kr`
}

export function addressLine(workshop) {
	const street = typeof workshop?.address === 'string' ? workshop.address : ''
	const cityLine = [workshop?.postalCode, workshop?.city].filter(Boolean).join(' ')
	return [street, cityLine].filter(Boolean).join(', ')
}

export function resolveCustomer(...sources) {
	for (const source of sources) {
		if (!source) continue
		if (typeof source === 'object' && (source.name || source.email || source.phone)) return source
	}
	return {}
}

export function longDate(value, language) {
	const d = value ? new Date(value) : new Date()
	if (Number.isNaN(d.getTime())) return { date: '', dateTime: '' }
	const locale = String(language || '').startsWith('sv') ? 'sv-SE' : 'en-GB'
	const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
	const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
	return { date, dateTime: `${date}, ${time}` }
}

export function orderNumber(booking, bookingId) {
	const year = new Date(booking?.paidAt || booking?.createdAt || Date.now()).getFullYear()
	const tail = String(bookingId || booking?._id || booking?.id || '').replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase() || '0000'
	return `FX2-${year}-${tail}`
}

function loadLogo(src) {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => {
			const canvas = document.createElement('canvas')
			canvas.width = image.naturalWidth
			canvas.height = image.naturalHeight
			canvas.getContext('2d').drawImage(image, 0, 0)
			resolve({
				dataUrl: canvas.toDataURL('image/png'),
				width: image.naturalWidth,
				height: image.naturalHeight,
			})
		}
		image.onerror = reject
		image.src = src
	})
}

function parseInclusions(offer) {
	const raw = (offer?.inclusions || '').trim()
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw)
		if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
	} catch {
		/* plain text */
	}
	return raw
		.split(/[\n|;]+/)
		.map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim())
		.filter(Boolean)
}

export async function downloadInvoicePdf({
	t,
	request,
	workshop,
	customer,
	costs,
	extras = [],
	issuedWhen,
	orderNo,
	receiptRef,
}) {
	const doc = new jsPDF({ unit: 'mm', format: 'a4' })
	const pageWidth = doc.internal.pageSize.getWidth()
	const logo = await loadLogo(mainLogo)
	const logoWidth = 42
	const logoHeight = (logo.height / logo.width) * logoWidth
	doc.addImage(logo.dataUrl, 'PNG', (pageWidth - logoWidth) / 2, 14, logoWidth, logoHeight)

	let y = 14 + logoHeight + 12
	doc.setFont('helvetica', 'bold')
	doc.setFontSize(18)
	doc.setTextColor(11, 37, 64)
	doc.text(String(t('payment.flow.invoice')), 20, y)
	y += 8
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(10)
	doc.setTextColor(107, 114, 128)
	doc.text(`${t('payment.flow.invoice_no')}: ${orderNo || '—'}`, 20, y)
	y += 5
	doc.text(`${t('payment.flow.invoice_date')}: ${issuedWhen?.dateTime || '—'}`, 20, y)
	y += 5
	if (receiptRef) {
		doc.text(String(t('payment.flow.reference', { id: receiptRef })), 20, y)
		y += 5
	}
	y += 4

	const workshopName = workshop?.companyName || t('offers_page.workshop')
	const workshopAddress = addressLine(workshop)
	const workshopPhone = formatSwedishPhone(workshop?.phone || workshop?.userId?.phone) || workshop?.phone || ''
	const customerName = customer?.name || '—'
	const customerPhone = formatSwedishPhone(customer?.phone) || customer?.phone || '—'
	const customerEmail = customer?.email || '—'

	doc.setFont('helvetica', 'bold')
	doc.setFontSize(11)
	doc.setTextColor(11, 37, 64)
	doc.text(String(t('payment.flow.workshop_details')), 20, y)
	doc.text(String(t('payment.flow.bill_to')), pageWidth / 2 + 4, y)
	y += 6
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(10)
	doc.setTextColor(55, 65, 81)
	const leftLines = [workshopName, workshopAddress, workshopPhone].filter(Boolean)
	const rightLines = [
		`${t('payment.flow.customer_name')}: ${customerName}`,
		`${t('payment.flow.customer_phone')}: ${customerPhone}`,
		`${t('payment.flow.customer_email')}: ${customerEmail}`,
	]
	const blockLines = Math.max(leftLines.length, rightLines.length)
	for (let i = 0; i < blockLines; i += 1) {
		if (leftLines[i]) doc.text(String(leftLines[i]), 20, y)
		if (rightLines[i]) doc.text(String(rightLines[i]), pageWidth / 2 + 4, y)
		y += 5
	}
	y += 6

	doc.setDrawColor(229, 231, 235)
	doc.line(20, y, pageWidth - 20, y)
	y += 8
	doc.setFont('helvetica', 'bold')
	doc.setFontSize(11)
	doc.setTextColor(11, 37, 64)
	doc.text(getCaseTitle(request), 20, y)
	y += 5
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(10)
	doc.setTextColor(107, 114, 128)
	doc.text(`${t('payment.flow.vehicle_label')}: ${getVehicleLine(request)}`, 20, y)
	y += 5
	doc.text(`${t('payment.flow.case_ref')}: ${String(request?._id || request?.id || '').slice(-6).toUpperCase() || '—'}`, 20, y)
	y += 10

	const rows = [
		[t('payment.flow.labor'), money(costs.labor)],
		[t('payment.flow.parts'), money(costs.parts)],
		[t('payment.flow.vat'), money(costs.vat)],
		...extras.map((extra) => [
			`${t('workshop.contracts.extra_approval.extra_line')}${extra.description ? ` — ${extra.description}` : ''}`,
			money(extra.price),
		]),
	]
	rows.forEach(([label, value]) => {
		doc.setFont('helvetica', 'normal')
		doc.setFontSize(11)
		doc.setTextColor(107, 114, 128)
		const labelLines = doc.splitTextToSize(String(label), pageWidth - 70)
		doc.text(labelLines, 20, y)
		doc.setFont('helvetica', 'bold')
		doc.setTextColor(11, 37, 64)
		doc.text(String(value), pageWidth - 20, y, { align: 'right' })
		y += Math.max(7, labelLines.length * 5)
	})
	y += 2
	doc.setDrawColor(229, 231, 235)
	doc.line(20, y, pageWidth - 20, y)
	y += 8
	doc.setFont('helvetica', 'bold')
	doc.setFontSize(13)
	doc.setTextColor(11, 37, 64)
	doc.text(String(t('payment.flow.total_short')), 20, y)
	doc.setTextColor(0, 128, 55)
	doc.text(money(costs.total), pageWidth - 20, y, { align: 'right' })
	y += 14
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(9)
	doc.setTextColor(156, 163, 175)
	const note = doc.splitTextToSize(String(t('payment.flow.invoice_note')), pageWidth - 40)
	doc.text(note, 20, y)
	y += note.length * 4 + 4
	doc.text(String(t('payment.flow.issued_by')), 20, y)

	const file = String(orderNo || workshopName).replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').slice(0, 40) || 'invoice'
	doc.save(`Fixa2an-invoice-${file}.pdf`)
}

function Row({ label, value }) {
	return (
		<div className="flex justify-between gap-3 text-sm">
			<span className="text-[#6B7280]">{label}</span>
			<span className="font-semibold text-[#0B2540] text-right">{value}</span>
		</div>
	)
}

export default function InvoiceDocument({
	request,
	workshop,
	offer,
	customer,
	costs,
	extras = [],
	issuedWhen,
	orderNo,
	receiptRef,
	onBack,
	showBack = true,
}) {
	const { t } = useTranslation()
	const [downloading, setDownloading] = useState(false)
	const inclusions = parseInclusions(offer)
	const name = workshop?.companyName || t('offers_page.workshop')
	const workshopAddress = addressLine(workshop)
	const workshopPhone = formatSwedishPhone(workshop?.phone || workshop?.userId?.phone) || workshop?.phone || ''
	const customerName = customer?.name || '—'
	const customerPhone = formatSwedishPhone(customer?.phone) || customer?.phone || '—'
	const customerEmail = customer?.email || '—'
	const caseRef = String(request?._id || request?.id || '').slice(-6).toUpperCase() || '—'

	const handleDownload = async () => {
		if (downloading) return
		setDownloading(true)
		try {
			await downloadInvoicePdf({
				t,
				request,
				workshop,
				customer,
				costs,
				extras,
				issuedWhen,
				orderNo,
				receiptRef,
			})
		} catch {
			toast.error(t('payment.flow.pay_failed'))
		} finally {
			setDownloading(false)
		}
	}

	return (
		<div className="w-full max-w-lg">
			{showBack && onBack ? (
				<button type="button" onClick={onBack} className="mb-4 -ml-1 p-1 text-[#0B2540] hover:opacity-70 max-lg:hidden" aria-label={t('common.back')}>
					<span className="text-sm font-semibold text-[#1B8F3E]">{t('common.back')}</span>
				</button>
			) : null}

			<div className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-b from-[#F7FBF8] via-white to-white overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,0.06)] mb-4">
				<div className="px-5 pt-5 pb-4 bg-[#0B2540] text-white">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">{t('payment.flow.issued_by')}</p>
							<p className="text-xl font-bold mt-1">{t('payment.flow.invoice')}</p>
						</div>
						<div className="w-11 h-11 rounded-2xl bg-[#1B8F3E] flex items-center justify-center shrink-0">
							<FileText className="w-5 h-5 text-white" strokeWidth={2} />
						</div>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-3">
						<div className="rounded-xl bg-white/10 px-3 py-2.5">
							<p className="text-[10px] font-medium uppercase tracking-wide text-white/60">{t('payment.flow.invoice_no')}</p>
							<p className="text-sm font-semibold mt-0.5">{orderNo || '—'}</p>
						</div>
						<div className="rounded-xl bg-white/10 px-3 py-2.5 text-right">
							<p className="text-[10px] font-medium uppercase tracking-wide text-white/60">{t('payment.flow.invoice_date')}</p>
							<p className="text-sm font-semibold mt-0.5 flex items-center justify-end gap-1.5">
								<Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
								<span>{issuedWhen?.dateTime || '—'}</span>
							</p>
						</div>
					</div>
					{receiptRef ? (
						<p className="text-xs text-white/65 mt-3">{t('payment.flow.reference', { id: receiptRef })}</p>
					) : null}
				</div>

				<div className="px-5 py-4 grid sm:grid-cols-2 gap-3">
					<div className="rounded-2xl border border-[#E8F5EC] bg-[#F3FBF6] p-3.5">
						<p className="text-[11px] font-semibold text-[#1B8F3E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
							<Building2 className="w-3.5 h-3.5" />
							{t('payment.flow.workshop_details')}
						</p>
						<p className="text-sm font-bold text-[#0B2540]">{name}</p>
						{workshopAddress ? <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{workshopAddress}</p> : null}
						{workshopPhone ? (
							<p className="text-xs text-[#6B7280] mt-1.5 flex items-center gap-1.5">
								<Phone className="w-3 h-3 text-[#1B8F3E]" />
								{workshopPhone}
							</p>
						) : null}
					</div>
					<div className="rounded-2xl border border-[#E5E7EB] bg-white p-3.5">
						<p className="text-[11px] font-semibold text-[#1B8F3E] uppercase tracking-wide mb-2 flex items-center gap-1.5">
							<User className="w-3.5 h-3.5" />
							{t('payment.flow.bill_to')}
						</p>
						<p className="text-sm font-bold text-[#0B2540]">{customerName}</p>
						<p className="text-xs text-[#6B7280] mt-1.5 flex items-center gap-1.5">
							<Phone className="w-3 h-3 text-[#1B8F3E]" />
							{customerPhone}
						</p>
						<p className="text-xs text-[#6B7280] mt-1 flex items-start gap-1.5 break-all">
							<Mail className="w-3 h-3 text-[#1B8F3E] shrink-0 mt-0.5" />
							{customerEmail}
						</p>
					</div>
				</div>

				<div className="mx-5 mb-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5">
					<p className="text-sm font-bold text-[#0B2540]">{getCaseTitle(request)}</p>
					<p className="text-xs text-[#6B7280] mt-1">{t('payment.flow.vehicle_label')}: {getVehicleLine(request)}</p>
					<p className="text-xs text-[#6B7280] mt-0.5">{t('payment.flow.case_ref')}: {caseRef}</p>
					<div className="mt-3 flex items-end justify-between gap-3">
						<span className="text-sm font-bold text-[#0B2540]">{t('payment.flow.total_short')}</span>
						<span className="text-[1.75rem] font-bold text-[#1B8F3E] leading-none">{money(costs.total)}</span>
					</div>
				</div>

				<div className="px-5 pb-4">
					<div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 space-y-2.5">
						<Row label={t('payment.flow.labor')} value={money(costs.labor)} />
						<Row label={t('payment.flow.parts')} value={money(costs.parts)} />
						<Row label={t('payment.flow.vat')} value={money(costs.vat)} />
						{extras.map((extra, index) => (
							<Row
								key={extra._id || index}
								label={`${t('workshop.contracts.extra_approval.extra_line')}${extra.description ? ` — ${extra.description}` : ''}`}
								value={money(extra.price)}
							/>
						))}
						<div className="border-t border-gray-100 pt-3 flex justify-between items-center">
							<span className="text-sm font-bold text-[#0B2540]">{t('payment.flow.total_short')}</span>
							<span className="text-sm font-bold text-[#1B8F3E]">{money(costs.total)}</span>
						</div>
					</div>
				</div>

				{(inclusions.length > 0 || offer?.note || offer?.warranty) && (
					<div className="px-5 pb-4">
						<div className="rounded-2xl bg-[#F3FBF6] border border-[#DCEFE3] p-3.5">
							{inclusions.length > 0 && (
								<div className="mb-2">
									<h2 className="text-xs font-bold text-[#0B2540] mb-2">{t('quotes.flow.whats_included')}</h2>
									<ul className="space-y-1.5">
										{inclusions.map((item) => (
											<li key={item} className="flex items-start gap-2 text-xs text-[#0B2540]">
												<Check className="w-3.5 h-3.5 text-[#1B8F3E] shrink-0 mt-0.5" strokeWidth={3} />
												{item}
											</li>
										))}
									</ul>
								</div>
							)}
							{offer?.warranty && (
								<p className="text-xs text-[#4B5563]"><span className="font-semibold text-[#0B2540]">{offer.warranty}</span></p>
							)}
							{offer?.note && <p className="text-xs text-[#4B5563] mt-1.5">{offer.note}</p>}
						</div>
					</div>
				)}

				<p className="px-5 pb-5 text-[11px] text-[#9CA3AF] leading-relaxed">{t('payment.flow.invoice_note')}</p>
			</div>

			<button
				type="button"
				onClick={handleDownload}
				disabled={downloading}
				className="w-full min-h-[52px] bg-brand-btn disabled:opacity-40 text-white rounded-lg font-semibold flex items-center justify-center gap-2 mb-3"
			>
				<Download className="w-4 h-4" />
				{downloading ? '...' : t('payment.flow.download_invoice')}
			</button>
			{showBack && onBack ? (
				<button
					type="button"
					onClick={onBack}
					className="w-full min-h-[52px] border-[1.5px] border-[#9AD4B0] text-[#1B8F3E] rounded-lg font-semibold flex items-center justify-center gap-2 max-lg:hidden"
				>
					{t('common.back')}
				</button>
			) : null}
		</div>
	)
}
