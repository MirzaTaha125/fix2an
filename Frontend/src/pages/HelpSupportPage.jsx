import {
	Mail,
	Phone,
	Clock,
	HelpCircle,
	ChevronDown,
	ChevronRight,
	Lock,
	FileText,
	Shield,
	Lightbulb,
	MessageCircle,
	Send,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useRegisterMobileBack } from '../context/MobileBackContext'
import { supportAPI } from '../services/api'

const TABS = ['faq', 'contact', 'policy']

export default function HelpSupportPage() {
	const { t } = useTranslation()
	const { tab } = useParams()
	const active = TABS.includes(tab) ? tab : 'faq'

	if (!TABS.includes(tab)) {
		return <Navigate to="/support/faq" replace />
	}

	return (
		<div className="list-page-shell bg-[#FAFBFC]">
			<Navbar />
			<div className="list-page-content">
				<div className="mb-5 lg:mb-8">
					<h1 className={`page-title lg:mb-4${active === 'contact' ? ' support-page-title' : ''}`}>
						{active === 'faq' && (t('help.faq_page_title') || 'Frequently asked questions')}
						{active === 'contact' && (t('help.contact_page_title') || 'Help & contact')}
						{active === 'policy' && (t('help.policy_page_title') || 'Policy & terms')}
					</h1>
					<p className="text-sm lg:text-lg text-[#6B7280] leading-relaxed">
						{active === 'faq' && (t('help.faq_page_subtitle') || 'Answers to common questions.')}
						{active === 'contact' && (t('help.contact_page_subtitle') || 'We are here if you need help.')}
						{active === 'policy' && (t('help.policy_page_subtitle') || 'Important information about your data and rights.')}
					</p>
				</div>

				{active === 'faq' && <FaqPanel />}
				{active === 'contact' && <ContactPanel />}
				{active === 'policy' && <PolicyPanel />}
			</div>
		</div>
	)
}

export function FaqPanel() {
	const { t } = useTranslation()
	const [openFaq, setOpenFaq] = useState(null)
	const faqs = [
		{ q: t('help.faq.q1'), a: t('help.faq.a1') },
		{ q: t('help.faq.q2'), a: t('help.faq.a2') },
		{ q: t('help.faq.q3'), a: t('help.faq.a3') },
		{ q: t('help.faq.q4'), a: t('help.faq.a4') },
		{ q: t('help.faq.q5'), a: t('help.faq.a5') },
	]

	return (
		<div className="space-y-2">
			{faqs.map((faq, i) => (
				<div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
					<button
						type="button"
						onClick={() => setOpenFaq(openFaq === i ? null : i)}
						className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50"
					>
						<HelpCircle className="w-4 h-4 text-[#1B8F3E] shrink-0" />
						<span className="flex-1 text-sm font-medium text-[#05324f]">{faq.q}</span>
						<ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
					</button>
					{openFaq === i && (
						<div className="px-4 pb-4">
							<p className="text-sm text-gray-600 leading-relaxed pl-7">{faq.a}</p>
						</div>
					)}
				</div>
			))}
		</div>
	)
}

export function PolicyPanel({ onSelect } = {}) {
	const { t } = useTranslation()
	const items = [
		{
			key: 'privacy',
			to: '/privacy',
			icon: <Lock className="w-5 h-5 text-[#1B8F3E]" />,
			title: t('help.policy_privacy') || 'Privacy policy',
			desc: t('help.policy_privacy_desc') || 'How we collect and protect your data.',
		},
		{
			key: 'terms',
			to: '/terms',
			icon: <FileText className="w-5 h-5 text-[#1B8F3E]" />,
			title: t('help.policy_terms') || 'Terms of use',
			desc: t('help.policy_terms_desc') || 'Rules for using Fixa2an.',
		},
		{
			key: 'cookies',
			to: '/cookies',
			icon: <Shield className="w-5 h-5 text-[#1B8F3E]" />,
			title: t('help.policy_cookies') || 'Cookies',
			desc: t('help.policy_cookies_desc') || 'How cookies are used on the platform.',
		},
	]

	return (
		<div className="space-y-3">
			{items.map((item) => {
				const className = 'w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 text-left'
				const body = (
					<>
						<div className="w-11 h-11 rounded-full bg-[#E8F5EC] flex items-center justify-center shrink-0">
							{item.icon}
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-[15px] font-semibold text-[#05324f]">{item.title}</p>
							<p className="text-sm text-[#9CA3AF] mt-0.5">{item.desc}</p>
						</div>
						<ChevronRight className="text-gray-300 shrink-0" size={20} />
					</>
				)

				if (typeof onSelect === 'function') {
					return (
						<button
							key={item.key}
							type="button"
							onClick={() => onSelect(item.key)}
							className={className}
						>
							{body}
						</button>
					)
				}

				return (
					<Link key={item.key} to={item.to} className={className}>
						{body}
					</Link>
				)
			})}
		</div>
	)
}

export function ContactPanel() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [subject, setSubject] = useState('')
	const [message, setMessage] = useState('')
	const [sending, setSending] = useState(false)
	const [tickets, setTickets] = useState([])
	const [activeTicketId, setActiveTicketId] = useState(null)
	const [reply, setReply] = useState('')
	const [loadingTicket, setLoadingTicket] = useState(false)
	const [ticket, setTicket] = useState(null)
	const endRef = useRef(null)

	const subjects = useMemo(() => ([
		t('help.subject_message') || 'Message',
		t('help.subject_billing') || 'Billing',
		t('help.subject_booking') || 'Booking',
		t('help.subject_other') || 'Other',
	]), [t])

	const loadTickets = async () => {
		if (!user || user.role !== 'CUSTOMER') return
		try {
			const res = await supportAPI.listMine()
			setTickets(Array.isArray(res.data) ? res.data : [])
		} catch {
			setTickets([])
		}
	}

	useEffect(() => {
		loadTickets()
	}, [user])

	useEffect(() => {
		if (!activeTicketId) {
			setTicket(null)
			return
		}
		let stop = false
		setLoadingTicket(true)
		supportAPI.getMine(activeTicketId)
			.then((res) => { if (!stop) setTicket(res.data) })
			.catch(() => { if (!stop) setTicket(null) })
			.finally(() => { if (!stop) setLoadingTicket(false) })
		return () => { stop = true }
	}, [activeTicketId])

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [ticket?.messages?.length])

	useRegisterMobileBack(() => setActiveTicketId(null), Boolean(activeTicketId))

	const handleCreate = async (e) => {
		e.preventDefault()
		if (!user || user.role !== 'CUSTOMER') {
			toast.error(t('errors.session_expired') || 'Please sign in')
			return
		}
		if (!subject) {
			toast.error(t('help.subject_placeholder') || 'Select a subject')
			return
		}
		if (!message.trim()) {
			toast.error(t('errors.description_required') || 'Please enter a message')
			return
		}
		setSending(true)
		try {
			const res = await supportAPI.create({ subject, message: message.trim() })
			toast.success(t('help.message_sent') || 'Message sent')
			setMessage('')
			setSubject('')
			setActiveTicketId(res.data._id || res.data.id)
			await loadTickets()
		} catch (error) {
			toast.error(error.response?.data?.message || t('errors.generic_error'))
		} finally {
			setSending(false)
		}
	}

	const handleReply = async (e) => {
		e.preventDefault()
		if (!reply.trim() || !activeTicketId) return
		setSending(true)
		try {
			const res = await supportAPI.sendMessage(activeTicketId, { message: reply.trim() })
			setTicket(res.data)
			setReply('')
			await loadTickets()
		} catch (error) {
			toast.error(error.response?.data?.message || t('errors.generic_error'))
		} finally {
			setSending(false)
		}
	}

	if (activeTicketId) {
		return (
			<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[420px]">
				<div className="px-4 py-3 border-b border-gray-100">
					<p className="text-sm font-medium text-[#05324f] truncate">{ticket?.subject || t('help.contact_page_title')}</p>
					<p className="text-xs text-[#9CA3AF] mt-0.5">{t('help.chat_with_admin') || 'Chat with Fixa2an support'}</p>
				</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FAFBFC]">
					{loadingTicket ? (
						<div className="space-y-3 py-2">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex gap-2">
									<Skeleton className="w-8 h-8 rounded-full shrink-0" />
									<Skeleton className="h-16 flex-1 rounded-2xl" />
								</div>
							))}
						</div>
					) : (ticket?.messages || []).map((msg) => {
						const mine = msg.senderRole === 'CUSTOMER'
						return (
							<div key={msg._id || `${msg.createdAt}-${msg.body}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
								<div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
									mine ? 'bg-brand-btn text-white' : 'bg-white border border-gray-100 text-[#05324f]'
								}`}>
									{msg.body}
								</div>
							</div>
						)
					})}
					<div ref={endRef} />
				</div>
				<form onSubmit={handleReply} className="p-3 border-t border-gray-100 flex items-center gap-2">
					<input
						value={reply}
						onChange={(e) => setReply(e.target.value)}
						placeholder={t('help.reply_placeholder') || 'Write a message...'}
						className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-sm"
					/>
					<button
						type="submit"
						disabled={sending || !reply.trim()}
						className="h-11 w-11 rounded-xl bg-brand-btn text-white flex items-center justify-center disabled:opacity-50"
					>
						<Send className="w-4 h-4" />
					</button>
				</form>
			</div>
		)
	}

	return (
		<div className="space-y-5">
			<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 lg:gap-6 items-start">
				<form
					onSubmit={handleCreate}
					className="bg-white rounded-2xl border border-[#EEF1F4] shadow-sm p-5 lg:p-7 space-y-5"
				>
					<div>
						<p className="text-h4 lg:text-h3">{t('help.contact_us')}</p>
						<p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
							{t('help.contact_form_desc')}
						</p>
					</div>
					<label className="block">
						<span className="text-sm font-medium text-[#05324f] mb-1.5 block">{t('help.subject_label')}</span>
						<select
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-white text-sm font-normal text-[#05324f] outline-none focus:border-[#1B8F3E]"
						>
							<option value="" disabled>
								{t('help.subject_placeholder')}
							</option>
							{subjects.map((item) => (
								<option key={item} value={item}>{item}</option>
							))}
						</select>
					</label>
					<label className="block">
						<span className="text-sm font-medium text-[#05324f] mb-1.5 block">{t('help.message_label')}</span>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={6}
							maxLength={2000}
							placeholder={t('help.message_placeholder')}
							className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm font-normal text-[#05324f] placeholder:text-[#9CA3AF] resize-none outline-none focus:border-[#1B8F3E]"
						/>
					</label>
					<button
						type="submit"
						disabled={sending}
						className="w-full min-h-[52px] rounded-xl bg-brand-btn text-white text-base font-medium disabled:opacity-60 transition-colors hover:brightness-105"
					>
						{sending ? (t('common.loading') || '...') : t('help.send_message')}
					</button>
				</form>

				<div className="space-y-4">
					<div className="bg-white rounded-2xl border border-[#EEF1F4] shadow-sm p-5 lg:p-6 space-y-5">
						<p className="text-h4 lg:text-h3">{t('help.contact_info_title')}</p>
						<a href="mailto:info@fixa2an.se" className="flex items-start gap-3.5">
							<Mail className="w-5 h-5 text-[#05324f] shrink-0 mt-0.5" strokeWidth={1.75} />
							<div className="min-w-0">
								<p className="text-sm font-semibold text-[#05324f]">{t('help.email_label')}</p>
								<p className="text-sm font-normal text-[#6B7280] mt-0.5">info@fixa2an.se</p>
							</div>
						</a>
						<div className="flex items-start gap-3.5">
							<Clock className="w-5 h-5 text-[#05324f] shrink-0 mt-0.5" strokeWidth={1.75} />
							<div className="min-w-0">
								<p className="text-sm font-semibold text-[#05324f]">{t('help.response_label')}</p>
								<p className="text-sm font-normal text-[#6B7280] mt-0.5">{t('help.response_value')}</p>
							</div>
						</div>
						<a href="tel:+4681234567" className="flex items-start gap-3.5">
							<Phone className="w-5 h-5 text-[#05324f] shrink-0 mt-0.5" strokeWidth={1.75} />
							<div className="min-w-0">
								<p className="text-sm font-semibold text-[#05324f]">{t('help.phone_label')}</p>
								<p className="text-sm font-normal text-[#6B7280] mt-0.5">
									08-123 45 67
									<span className="text-[#9CA3AF]">, {t('help.phone_hours')}</span>
								</p>
							</div>
						</a>
					</div>

					<div className="rounded-2xl bg-[#E8F5EC] px-5 py-4 flex items-center gap-3">
						<p className="text-sm font-normal text-[#05324f] leading-snug flex-1 min-w-0">
							{t('help.faq_tip')}
						</p>
						<Lightbulb className="w-6 h-6 text-[#1B8F3E] shrink-0" strokeWidth={1.75} />
					</div>
				</div>
			</div>

			{tickets.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium text-[#05324f]">{t('help.your_conversations')}</p>
					{tickets.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setActiveTicketId(item.id)}
							className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 text-left flex items-center gap-3"
						>
							<div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
								<MessageCircle className="w-4 h-4 text-[#05324f]" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-[#05324f] truncate">{item.subject}</p>
								<p className="text-xs text-[#9CA3AF] truncate mt-0.5">{item.preview}</p>
							</div>
							<ChevronRight className="text-gray-300 shrink-0" size={18} />
						</button>
					))}
				</div>
			)}
		</div>
	)
}
