import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Card, CardContent } from './Card'

export function Dialog({ open, onOpenChange, children, className = '' }) {
	if (!open) return null

	const dialogContent = (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={() => onOpenChange(false)}
			/>
			{/* Dialog Content */}
			<div className={`relative z-[10000] w-full mx-auto ${className || 'max-w-md'}`}>
				<Card className="shadow-2xl">
					<CardContent className="p-4 sm:p-6">
						{children}
					</CardContent>
				</Card>
			</div>
		</div>
	)

	// Use portal to render outside the DOM hierarchy
	return typeof document !== 'undefined' 
		? createPortal(dialogContent, document.body)
		: dialogContent
}

export function DialogContent({ children, onClose }) {
	return (
		<div className="relative">
			{onClose && (
				<button
					onClick={onClose}
					className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>
			)}
			{children}
		</div>
	)
}

export function DialogTitle({ children }) {
	return (
		<h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">
			{children}
		</h2>
	)
}

export function DialogDescription({ children }) {
	return (
		<p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
			{children}
		</p>
	)
}

