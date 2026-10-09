import { Link } from 'react-router-dom'
import {
	FileUp,
	Wrench,
	Search,
	ShieldCheck,
	Zap,
	ChevronRight,
} from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'

const primaryBtn =
	'w-full min-h-[52px] lg:min-h-[64px] px-5 lg:px-6 inline-flex items-center justify-center gap-2.5 font-semibold text-white text-base lg:text-lg bg-brand-btn !rounded-md transition-all active:scale-[0.99]'

export default function CreateCaseStart({ onSelectPath }) {
	const { t } = useTranslation()
	const ProtocolAction = onSelectPath ? 'button' : Link
	const protocolProps = onSelectPath
		? { type: 'button', onClick: () => onSelectPath('protocol') }
		: { to: '/upload?path=protocol' }

	const OptionAction = onSelectPath ? 'button' : Link

	return (
		<div className="w-full">
			<h1 className="page-title-hero lg:mb-4 whitespace-pre-line lg:whitespace-normal w-full max-w-none lg:max-w-3xl">
				<Trans
					i18nKey="upload.flow.start_title"
					components={{ hl: <span className="text-[#1B8F3E]" /> }}
				/>
			</h1>
			<p className="text-sm lg:text-lg text-[#6B7280] leading-relaxed mb-6 lg:mb-8 w-full max-w-none lg:max-w-2xl">
				{t('upload.flow.start_subtitle')}
			</p>

			{/* Primary protocol card */}
			<div className="rounded-xl lg:rounded-2xl bg-[#F0F7F2] p-5 lg:p-8 mb-5 lg:mb-6 lg:flex lg:items-center lg:gap-8">
				<div className="flex items-start gap-3 lg:gap-5 mb-4 lg:mb-0 min-w-0 flex-1">
					<div className="w-12 h-12 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full bg-white border border-[#1B8F3E]/25 flex items-center justify-center shrink-0">
						<FileUp className="w-6 h-6 lg:w-8 lg:h-8 text-[#1B8F3E]" strokeWidth={2} />
					</div>
					<div className="min-w-0 flex-1 pt-0.5">
						<p className="font-bold text-brand-dark text-[0.95rem] lg:text-xl leading-snug mb-1">
							{t('upload.flow.failed_title')}
						</p>
						<p className="text-sm lg:text-base text-[#4B5563] leading-snug mb-0.5">
							{t('upload.flow.failed_eyebrow')}
						</p>
						<p className="text-sm lg:text-base text-[#4B5563] leading-relaxed">
							{t('upload.flow.failed_desc')}
						</p>
					</div>
				</div>

				<ProtocolAction
					{...protocolProps}
					className={`${primaryBtn} lg:w-auto lg:shrink-0 lg:px-8`}
				>
					{t('upload.flow.upload_protocol')}
				</ProtocolAction>
			</div>

			{/* Divider */}
			<div className="w-full flex items-center justify-center gap-3 mb-5 lg:mb-6">
				<div className="h-px bg-[#D1D5DB] flex-1 min-w-0" />
				<span className="text-xs lg:text-sm text-[#9CA3AF] whitespace-nowrap shrink-0">{t('upload.flow.or_choose')}</span>
				<div className="h-px bg-[#D1D5DB] flex-1 min-w-0" />
			</div>

			{/* Known issue */}
			<OptionAction
				{...(onSelectPath
					? { type: 'button', onClick: () => onSelectPath('known') }
					: { to: '/upload?path=known' })}
				className="w-full text-left rounded-xl lg:rounded-2xl border border-gray-100 bg-white shadow-sm p-4 lg:p-6 mb-3 lg:mb-4 flex items-center gap-3 lg:gap-5 hover:border-[#1B8F3E]/30 transition-colors"
			>
				<div className="w-12 h-12 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full bg-[#E8F5EC] flex items-center justify-center shrink-0">
					<Wrench className="w-6 h-6 lg:w-8 lg:h-8 text-[#1B8F3E]" strokeWidth={1.75} />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-bold text-brand-dark text-sm lg:text-lg leading-snug">{t('upload.flow.known_title')}</p>
					<p className="text-[13px] lg:text-base text-[#6B7280] mt-0.5 leading-snug">{t('upload.flow.known_desc')}</p>
				</div>
				<ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark shrink-0" />
			</OptionAction>

			{/* Unknown issue */}
			<OptionAction
				{...(onSelectPath
					? { type: 'button', onClick: () => onSelectPath('unknown') }
					: { to: '/upload?path=unknown' })}
				className="w-full text-left rounded-xl lg:rounded-2xl border border-gray-100 bg-white shadow-sm p-4 lg:p-6 flex items-center gap-3 lg:gap-5 hover:border-[#1B8F3E]/30 transition-colors"
			>
				<div className="w-12 h-12 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full bg-[#E8F0FE] flex items-center justify-center shrink-0">
					<Search className="w-6 h-6 lg:w-8 lg:h-8 text-[#1C3F94]" strokeWidth={1.75} />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-bold text-brand-dark text-sm lg:text-lg leading-snug">{t('upload.flow.unknown_title')}</p>
					<p className="text-[13px] lg:text-base text-[#6B7280] mt-0.5 leading-snug">{t('upload.flow.unknown_desc')}</p>
				</div>
				<ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark shrink-0" />
			</OptionAction>

			{/* Trust badges */}
			<div className="mt-6 lg:mt-14 grid grid-cols-3 gap-2 lg:gap-10">
				{[
					{
						key: 'verified',
						icon: <ShieldCheck className="w-9 h-9 lg:w-14 lg:h-14 text-[#1B8F3E]" strokeWidth={1.75} />,
					},
					{
						key: 'free',
						icon: (
							<span className="w-11 h-11 lg:w-16 lg:h-16 rounded-full border-2 border-[#1B8F3E] text-[#1B8F3E] text-xs lg:text-lg font-semibold flex items-center justify-center leading-none">
								0kr
							</span>
						),
					},
					{
						key: 'fast',
						icon: <Zap className="w-9 h-9 lg:w-14 lg:h-14 text-[#1B8F3E]" strokeWidth={1.75} />,
					},
				].map(({ key, icon }) => (
					<div key={key} className="flex flex-col items-center text-center px-1">
						<div className="h-12 lg:h-16 flex items-center justify-center">{icon}</div>
						<p className="text-[11px] lg:text-lg font-medium text-brand-dark leading-snug mt-2">
							{t(`upload.flow.trust_${key}`)}
						</p>
					</div>
				))}
			</div>
		</div>
	)
}
