import { useNavigate } from 'react-router-dom'
import {
	Mail,
	Phone,
	MessageCircle,
	Clock,
	MapPin,
	HelpCircle,
	ChevronLeft,
	ChevronDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HelpSupportPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const [openFaq, setOpenFaq] = useState(null)

	const faqs = [
		{
			q: t('help.faq.q1') || 'How do I submit a service request?',
			a: t('help.faq.a1') || 'Upload your inspection report, fill in your vehicle details, and submit. Verified workshops near you will send offers.',
		},
		{
			q: t('help.faq.q2') || 'How do I accept an offer?',
			a: t('help.faq.a2') || 'Open My Cases, view available offers, and tap "Choose workshop" on the offer that suits you best.',
		},
		{
			q: t('help.faq.q3') || 'How do I cancel a booking?',
			a: t('help.faq.a3') || 'Open the booked case, tap "Cancel job", and provide a reason. Late cancellations may affect your trust score.',
		},
		{
			q: t('help.faq.q4') || 'Are workshops verified?',
			a: t('help.faq.a4') || 'Yes — only workshops approved through our verification process can receive requests and send offers.',
		},
		{
			q: t('help.faq.q5') || 'When do I pay?',
			a: t('help.faq.a5') || 'Payment is made directly to the workshop after the work is completed. Fixa2an does not handle payments.',
		},
	]

	return (
		<div className="min-h-screen bg-[#FAFBFC] flex flex-col">
			<Navbar />

			<div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-20 max-md:pb-24">
				{/* Back button */}
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mb-4 flex items-center gap-1 text-[#38BC54] font-bold text-sm active:opacity-70"
				>
					<ChevronLeft className="w-4 h-4" />
					{t('common.back') || 'Back'}
				</button>

				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl md:text-4xl font-black text-[#05324f] leading-tight mb-1.5">
						{t('help.title') || 'Help and support'}
					</h1>
					<p className="text-sm text-gray-500 leading-snug">
						{t('help.subtitle') || "We're here to help. Reach us anytime."}
					</p>
				</div>

				{/* Contact cards */}
				<div className="space-y-3 mb-8">
					<a
						href="mailto:info@fixa2an.se"
						className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
					>
						<div className="w-11 h-11 rounded-xl bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<Mail className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('help.email_label') || 'Email'}</p>
							<p className="text-sm font-black text-[#05324f] truncate">info@fixa2an.se</p>
						</div>
					</a>

					<a
						href="tel:+46101234567"
						className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
					>
						<div className="w-11 h-11 rounded-xl bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<Phone className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('help.phone_label') || 'Phone'}</p>
							<p className="text-sm font-black text-[#05324f]">+46 10 123 45 67</p>
						</div>
					</a>

					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
						<div className="w-11 h-11 rounded-xl bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<Clock className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('help.hours_label') || 'Support hours'}</p>
							<p className="text-sm font-black text-[#05324f]">{t('help.hours') || 'Mon–Fri 09:00–17:00'}</p>
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
						<div className="w-11 h-11 rounded-xl bg-[#F2F9F4] flex items-center justify-center shrink-0">
							<MapPin className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('help.address_label') || 'Office'}</p>
							<p className="text-sm font-black text-[#05324f]">Stockholm, Sweden</p>
						</div>
					</div>
				</div>

				{/* FAQ */}
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-3">
						<HelpCircle className="w-4 h-4 text-[#38BC54]" />
						<h2 className="text-lg font-black text-[#05324f]">
							{t('help.faq.title') || 'Frequently asked questions'}
						</h2>
					</div>
					<div className="space-y-2">
						{faqs.map((faq, i) => (
							<div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
								<button
									type="button"
									onClick={() => setOpenFaq(openFaq === i ? null : i)}
									className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50"
								>
									<span className="flex-1 text-sm font-bold text-[#05324f]">{faq.q}</span>
									<ChevronDown
										className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
									/>
								</button>
								{openFaq === i && (
									<div className="px-4 pb-4 -mt-1">
										<p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Contact CTA */}
				<a
					href="mailto:info@fixa2an.se"
					className="bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-2xl shadow-md shadow-green-200/50 p-4 flex items-center gap-3 active:scale-[0.99] transition-all"
				>
					<div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
						<MessageCircle className="w-5 h-5 text-white" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-black">{t('help.cta_title') || 'Still need help?'}</p>
						<p className="text-[11px] text-white/80 font-semibold leading-tight">{t('help.cta_subtitle') || 'Send us an email and we\'ll get back to you.'}</p>
					</div>
				</a>
			</div>

			<Footer />
		</div>
	)
}
