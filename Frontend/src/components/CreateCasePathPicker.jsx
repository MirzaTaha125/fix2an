import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'

export const CASE_PATH_OPTIONS = [
	{ key: 'protocol', labelKey: 'upload.flow.case_path_failed' },
	{ key: 'known', labelKey: 'upload.flow.case_path_known' },
	{ key: 'unknown', labelKey: 'upload.flow.case_path_unknown' },
]

/** Select-style list (same look as Estimated time dropdown). */
export function CreateCasePathOptions({ onSelect, selectedKey = '', className = '' }) {
	const { t } = useTranslation()

	return (
		<div
			className={`max-h-96 w-full overflow-hidden rounded-md border bg-white text-gray-900 shadow-md ${className}`}
		>
			<div className="p-1 max-h-96 overflow-y-auto">
				{CASE_PATH_OPTIONS.map((item) => {
					const selected = item.key === selectedKey
					return (
						<button
							key={item.key}
							type="button"
							onClick={() => onSelect?.(item.key)}
							className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-left text-sm outline-none hover:bg-gray-100 hover:text-gray-900 ${
								selected ? 'bg-gray-100 text-gray-900' : ''
							}`}
						>
							{selected ? (
								<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
									<Check className="h-4 w-4" />
								</span>
							) : null}
							{t(item.labelKey)}
						</button>
					)
				})}
			</div>
		</div>
	)
}

/**
 * Dropdown anchored to trigger (Estimated time Select style) — not a centered modal.
 * Opens upward so it stays above the bottom CTA / nav.
 */
export default function CreateCasePathPicker({ open, onOpenChange, children }) {
	const navigate = useNavigate()

	const choose = (path) => {
		onOpenChange?.(false)
		navigate(`/upload?path=${path}`)
	}

	return (
		<div className="relative w-full">
			{children}
			{open ? (
				<>
					<div className="fixed inset-0 z-40" onClick={() => onOpenChange?.(false)} aria-hidden />
					<div className="absolute z-50 bottom-full left-0 right-0 mb-2">
						<CreateCasePathOptions onSelect={choose} />
					</div>
				</>
			) : null}
		</div>
	)
}
