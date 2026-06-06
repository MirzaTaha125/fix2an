import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Card, CardContent } from './Card'

export function Dialog({ open, onOpenChange, children, className = '' }) {
	if (!open) return null

	const dialogContent = (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black/50"
				onClick={() => onOpenChange(false)}
			/>
			{/* Dialog Content */}
			<div className={`relative z-[10000] ${className}`}>
				{children}
			</div>
		</div>
	)

	// Use portal to render outside the DOM hierarchy
	return typeof document !== 'undefined' 
		? createPortal(dialogContent, document.body)
		: dialogContent
}

export function DialogContent({ children, onClose, className = '' }) {
	return (
		<div className={`relative ${className}`}>
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-[10001] p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
				>
					<X className="w-5 h-5" />
				</button>
			)}
			{children}
		</div>
	)
}

export function DialogTitle({ children, className = '' }) {
	return (
		<h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 ${className}`}>
			{children}
		</h2>
	)
}

export function DialogDescription({ children, className = '' }) {
	return (
		<p className={`text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 ${className}`}>
			{children}
		</p>
	)
}

export function DialogHeader({ children, className = '' }) {
	return (
		<div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
			{children}
		</div>
	)
}

export function DialogFooter({ children, className = '' }) {
	return (
		<div className={`flex w-full min-w-0 flex-col-reverse gap-3 sm:flex-row ${className}`}>
			{children}
		</div>
	)
}
