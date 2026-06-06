import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
	Upload,
	MessageCircle,
	Tag,
	ShieldCheck,
	Wrench,
	Banknote,
	Sparkles,
	Hand,
	ArrowRight,
	Lightbulb,
} from 'lucide-react'

const STEPS = [
	{ icon: Upload, titleKey: 'mobile_step1_title', descKey: 'mobile_step1_desc' },
	{ icon: MessageCircle, titleKey: 'mobile_step2_title', descKey: 'mobile_step2_desc' },
	{ icon: Tag, titleKey: 'mobile_step3_title', descKey: 'mobile_step3_desc' },
]

const BENEFITS = [
	{ icon: Banknote, labelKey: 'benefit_no_fees' },
	{ icon: Sparkles, labelKey: 'benefit_free' },
	{ icon: Hand, labelKey: 'benefit_you_choose' },
]

export default function HowItWorksPage() {
	const { t } = useTranslation()
	const prefix = 'homepage.how_it_works'

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="flex-1 max-w-2xl md:max-w-5xl mx-auto w-full px-4 pt-20 md:pt-28 pb-8">
				<div className="text-center mb-6 mt-4 sm:mt-5">
					<h1 className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-2">
						{t(`${prefix}.title`)}
					</h1>
					<p className="text-sm text-gray-500 leading-relaxed">
						{t(`${prefix}.intro`)}
					</p>
				</div>

				<div className="space-y-0 mb-6">
					{STEPS.map(({ icon: Icon, titleKey, descKey }, index) => (
						<div key={titleKey} className="flex gap-3">
							<div className="flex flex-col items-center shrink-0">
								<div className="w-10 h-10 rounded-xl bg-[#38BC54] flex items-center justify-center text-white shadow-sm">
									<Icon className="w-5 h-5" strokeWidth={2} />
								</div>
								{index < STEPS.length - 1 && (
									<div className="w-px flex-1 min-h-[2rem] my-1 border-l border-dashed border-[#38BC54]/40" />
								)}
							</div>
							<div className={`min-w-0 ${index < STEPS.length - 1 ? 'pb-5' : 'pb-1'}`}>
								<p className="text-sm font-semibold text-[#05324f] leading-snug mb-1">
									{index + 1}. {t(`${prefix}.${titleKey}`)}
								</p>
								<p className="text-xs text-gray-500 leading-relaxed">
									{t(`${prefix}.${descKey}`)}
								</p>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-3 mb-6">
					<div className="rounded-2xl border border-[#38BC54]/25 bg-[#F8FCF9] p-4 flex items-start gap-3">
						<div className="w-9 h-9 rounded-xl bg-[#E8F8EE] flex items-center justify-center shrink-0">
							<ShieldCheck className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-[#05324f] mb-1">{t(`${prefix}.why_title`)}</p>
							<p className="text-xs text-gray-500 leading-relaxed">{t(`${prefix}.why_desc`)}</p>
						</div>
					</div>

					<div className="rounded-2xl border border-[#38BC54]/25 bg-[#F8FCF9] p-4 flex items-start gap-3">
						<div className="w-9 h-9 rounded-xl bg-[#E8F8EE] flex items-center justify-center shrink-0">
							<Wrench className="w-5 h-5 text-[#38BC54]" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-[#05324f] mb-1">{t(`${prefix}.not_only_title`)}</p>
							<p className="text-xs text-gray-500 leading-relaxed">{t(`${prefix}.not_only_desc`)}</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-2 mb-8">
					{BENEFITS.map(({ icon: Icon, labelKey }) => (
						<div key={labelKey} className="flex flex-col items-center text-center px-1">
							<div className="w-10 h-10 rounded-xl bg-[#F2F9F4] flex items-center justify-center mb-2">
								<Icon className="w-5 h-5 text-[#38BC54]" strokeWidth={2} />
							</div>
							<p className="text-[10px] sm:text-[11px] font-semibold text-[#05324f] leading-tight">
								{t(`${prefix}.${labelKey}`)}
							</p>
						</div>
					))}
				</div>

				<Link
					to="/upload"
					className="w-full h-14 bg-[#38BC54] hover:bg-[#2eb34f] text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-md shadow-green-100 active:scale-[0.99] transition-all mb-4"
				>
					{t(`${prefix}.cta_button`)}
					<ArrowRight className="w-5 h-5" />
				</Link>

				<div className="text-center mb-6">
					<Link
						to="/"
						className="text-sm font-semibold text-[#05324f] underline underline-offset-4 hover:opacity-80 active:opacity-70 transition-opacity"
					>
						{t(`${prefix}.back_home`)}
					</Link>
				</div>

				<div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
					<div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
						<Lightbulb className="w-4 h-4 text-[#38BC54]" />
					</div>
					<p className="text-xs text-gray-500 leading-relaxed">
						{t(`${prefix}.tip`)}
					</p>
				</div>
			</main>

			<Footer />
		</div>
	)
}
