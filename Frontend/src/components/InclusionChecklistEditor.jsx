import { Check, Plus, X } from 'lucide-react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Label } from './ui/Label'
import { useTranslation } from 'react-i18next'

export default function InclusionChecklistEditor({ items, onChange, disabled = false }) {
	const { t } = useTranslation()

	const updateItem = (index, value) => {
		const next = [...items]
		next[index] = value
		onChange(next)
	}

	const addItem = () => onChange([...items, ''])

	const removeItem = (index) => {
		if (items.length <= 1) {
			onChange([''])
			return
		}
		onChange(items.filter((_, i) => i !== index))
	}

	return (
		<div className="space-y-2.5">
			<Label className="text-sm font-semibold text-[#05324f]">
				{t('offers_page.included_question') || "What's included in the price?"}
			</Label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div key={index} className="flex items-center gap-2">
						<Check size={16} className="text-[#38BC54] shrink-0" strokeWidth={3} />
						<Input
							value={item}
							disabled={disabled}
							onChange={(e) => updateItem(index, e.target.value)}
							placeholder={t('workshop.offer.inclusion_item_placeholder') || 'e.g. Brake pad replacement'}
							className="h-10 rounded-xl border-gray-200 text-sm flex-1 min-w-0"
						/>
						{!disabled && items.length > 1 && (
							<button
								type="button"
								onClick={() => removeItem(index)}
								className="shrink-0 w-9 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
								aria-label={t('common.delete') || 'Remove'}
							>
								<X size={16} />
							</button>
						)}
					</div>
				))}
			</div>
			{!disabled && (
				<Button
					type="button"
					variant="outline"
					onClick={addItem}
					className="w-full h-10 rounded-xl border-gray-200 text-xs font-semibold text-[#05324f] hover:bg-gray-50"
				>
					<Plus size={14} className="mr-1.5" />
					{t('workshop.offer.add_inclusion_item') || 'Add item'}
				</Button>
			)}
		</div>
	)
}
