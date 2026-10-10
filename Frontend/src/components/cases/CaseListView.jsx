import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../utils/cn'
import EmptyState from '../ui/EmptyState'
import CreateCasePathPicker from '../CreateCasePathPicker'
import { getCaseId, getCaseTitle, getVehicleLine, getCaseStatusKey, getCaseStatusLabel, getActiveBooking } from './caseHelpers'

const STATUS_PILL = {
	offers: 'bg-[#FFF4E5] text-[#C2410C] border-[#FDBA74]',
	new: 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]',
	scheduled: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
	booked: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
	rescheduled: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
	received: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
	repair: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
	ready: 'bg-[#ECFDF5] text-[#1B8F3E] border-[#86EFAC]',
	pickup: 'bg-[#ECFDF5] text-[#1B8F3E] border-[#86EFAC]',
	closed: 'bg-[#ECFDF5] text-[#1B8F3E] border-[#86EFAC]',
	expired: 'bg-gray-50 text-gray-500 border-gray-200',
}

function formatUpdatedLabel(request, booking, t, language) {
	const raw = booking?.updatedAt || booking?.scheduledAt || request?.updatedAt || request?.createdAt
	if (!raw) return ''
	const date = new Date(raw)
	const now = new Date()
	const isToday =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate()
	const time = date.toLocaleTimeString(language === 'sv' ? 'sv-SE' : 'en-GB', {
		hour: '2-digit',
		minute: '2-digit',
	})
	if (isToday) {
		return `${t('my_cases.flow.last_updated')}: ${t('my_cases.flow.today')} ${time}`
	}
	return `${t('my_cases.flow.last_updated')}: ${formatDateTime(date, language)}`
}

export default function CaseListView({
	currentRequests,
	closedRequests,
	activeTab,
	onTabChange,
	onOpenCase,
	selectedId,
}) {
	const { t, i18n } = useTranslation()
	const [pathPickerOpen, setPathPickerOpen] = useState(false)
	const list = activeTab === 'closed' ? closedRequests : currentRequests

	return (
		<div className="flex flex-col min-h-0 h-full overflow-hidden">
			<div className="mb-5 shrink-0">
				<h1 className="page-title">{t('my_cases.flow.list_title')}</h1>
				<p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
					{t('my_cases.flow.list_subtitle')}
				</p>
			</div>

			<div className="shrink-0 flex w-full border-b border-gray-200 mb-4">
				{[
					['current', t('my_cases.flow.tab_current')],
					['closed', t('my_cases.flow.tab_closed')],
				].map(([key, label]) => (
					<button
						key={key}
						type="button"
						onClick={() => onTabChange(key)}
						className={`flex-1 min-w-0 pb-3 text-[13px] font-semibold text-center border-b-2 -mb-px ${
							activeTab === key
								? 'text-[#1B8F3E] border-[#1B8F3E]'
								: 'text-[#9CA3AF] border-transparent'
						}`}
					>
						{label}
					</button>
				))}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain">
			{list.length === 0 ? (
				<div className="flex flex-col items-center">
					<EmptyState
						title={
							activeTab === 'closed'
								? t('common.empty.cases_closed_title')
								: t('common.empty.cases_title')
						}
						description={
							activeTab === 'closed'
								? t('common.empty.cases_closed_desc')
								: t('common.empty.cases_desc')
						}
					/>
					<div className="w-full max-w-[200px] -mt-2">
						<CreateCasePathPicker open={pathPickerOpen} onOpenChange={setPathPickerOpen}>
							<button
								type="button"
								onClick={() => setPathPickerOpen((v) => !v)}
								className="w-full min-h-[42px] py-2.5 text-sm font-semibold bg-brand-btn text-white rounded-xl"
							>
								{t('navigation.create_case')}
							</button>
						</CreateCasePathPicker>
					</div>
				</div>
			) : (
				<div className="space-y-3 pb-2">
					{list.map((request) => {
						const id = getCaseId(request)
						const statusKey = getCaseStatusKey(request)
						const booking = getActiveBooking(request)
						const selected = selectedId === String(id)
						const shortId = String(id).slice(-4).toUpperCase()
						const pill = STATUS_PILL[statusKey] || STATUS_PILL.new
						const statusLabel = getCaseStatusLabel(statusKey, t)

						return (
							<button
								key={id}
								type="button"
								onClick={() => onOpenCase(id)}
								className={`w-full text-left rounded-2xl border bg-white p-4 flex items-center gap-2 transition-colors ${
									selected ? 'border-[#1B8F3E]/40 bg-[#F0F7F2]' : 'border-gray-100 hover:border-gray-200'
								}`}
							>
								<div className="min-w-0 flex-1 pr-1">
									<p className="text-[11px] text-gray-400 mb-2">
										{t('my_cases.flow.case_no', { id: shortId })}
									</p>
									<p className="font-bold text-brand-dark text-[15px] leading-snug line-clamp-2">
										{getCaseTitle(request)}
									</p>
									<p className="text-sm text-[#374151] mt-1">{getVehicleLine(request)}</p>
									<p className="text-xs text-[#6B7280] mt-2">
										{formatUpdatedLabel(request, booking, t, i18n.language)}
									</p>
								</div>
								<div className="relative shrink-0 self-stretch flex items-center justify-end min-w-[3.25rem]">
									<span
										className={`absolute top-0 right-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${pill}`}
									>
										{statusLabel}
									</span>
									<ChevronRight className="w-5 h-5 text-brand-dark shrink-0 translate-y-1" />
								</div>
							</button>
						)
					})}
				</div>
			)}
			</div>

			{list.length > 0 ? (
				<div className="shrink-0 mt-2">
					<CreateCasePathPicker open={pathPickerOpen} onOpenChange={setPathPickerOpen}>
						<button
							type="button"
							onClick={() => setPathPickerOpen((v) => !v)}
							className="w-full min-h-[42px] py-2.5 text-sm font-medium bg-brand-btn text-white rounded-lg lg:rounded-xl flex items-center justify-center lg:min-h-[52px] lg:py-3.5 lg:text-base"
						>
							{t('my_cases.flow.create_new')}
						</button>
					</CreateCasePathPicker>
				</div>
			) : null}
		</div>
	)
}
