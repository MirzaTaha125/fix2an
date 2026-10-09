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

			<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8">
				<div className="text-left mb-8 mt-4 sm:mt-5">
					<h1 className="page-title-hero">
						{t(`${prefix}.title`)}
					</h1>
					<p className="text-sm lg:text-base text-[#6B7280] leading-relaxed">
						{t(`${prefix}.intro`)}
					</p>
				</div>

				<div className="space-y-0 mb-8">
					{STEPS.map(({ icon: Icon, titleKey, descKey }, index) => (
						<div key={titleKey} className="flex gap-4">
							<div className="flex flex-col items-center shrink-0">
								<div className="w-10 h-10 rounded-2xl bg-[#1B8F3E] flex items-center justify-center text-white shadow-sm">
									<Icon className="w-5 h-5" strokeWidth={2} />
								</div>
								{index < STEPS.length - 1 && (
									<div className="w-px flex-1 min-h-[2.5rem] my-1.5 border-l border-dashed border-[#1B8F3E]/40" />
								)}
							</div>
							<div className={`min-w-0 pt-0.5 ${index < STEPS.length - 1 ? 'pb-7' : 'pb-1'}`}>
								<p className="text-sm lg:text-xl font-bold text-[#05324f] leading-[1.4] mb-2">
									{index + 1}. {t(`${prefix}.${titleKey}`)}
								</p>
								<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">
									{t(`${prefix}.${descKey}`)}
								</p>
							</div>
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
					<div className="rounded-2xl border border-[#1B8F3E]/25 bg-[#F8FCF9] p-5 flex items-start gap-3 h-full">
						<div className="w-9 h-9 rounded-xl bg-[#E8F8EE] flex items-center justify-center shrink-0">
							<ShieldCheck className="w-5 h-5 text-[#1B8F3E]" />
						</div>
						<div className="min-w-0">
							<p className="text-sm lg:text-xl font-bold text-[#05324f] leading-[1.4] mb-2">{t(`${prefix}.why_title`)}</p>
							<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">{t(`${prefix}.why_desc`)}</p>
						</div>
					</div>

					<div className="rounded-2xl border border-[#1B8F3E]/25 bg-[#F8FCF9] p-5 flex items-start gap-3 h-full">
						<div className="w-9 h-9 rounded-xl bg-[#E8F8EE] flex items-center justify-center shrink-0">
							<Wrench className="w-5 h-5 text-[#1B8F3E]" />
						</div>
						<div className="min-w-0">
							<p className="text-sm lg:text-xl font-bold text-[#05324f] leading-[1.4] mb-2">{t(`${prefix}.not_only_title`)}</p>
							<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">{t(`${prefix}.not_only_desc`)}</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-3 mb-8">
					{BENEFITS.map(({ icon: Icon, labelKey }) => (
						<div key={labelKey} className="flex flex-col items-center text-center px-2 py-1">
							<div className="w-10 h-10 rounded-xl bg-[#F2F9F4] flex items-center justify-center mb-3">
								<Icon className="w-5 h-5 text-[#1B8F3E]" strokeWidth={2} />
							</div>
							<p className="text-sm lg:text-base font-medium text-[#05324f]">
								{t(`${prefix}.${labelKey}`)}
							</p>
						</div>
					))}
				</div>

				<div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
					<div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
						<Lightbulb className="w-4 h-4 text-[#1B8F3E]" />
					</div>
					<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">
						{t(`${prefix}.tip`)}
					</p>
				</div>
			</main>

			<Footer />
		</div>
	)
}
