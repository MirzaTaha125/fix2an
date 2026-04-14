import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';

export default function RegisterTypeModal({ isOpen, onClose }) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent onClose={onClose}>
				<DialogTitle>{t('common.select_registration_type') || 'Select Registration Type'}</DialogTitle>
				<DialogDescription>
					{t('common.select_registration_type_desc') || 'Choose how you want to register'}
				</DialogDescription>
				<div className="space-y-2 sm:space-y-3">
					<Button
						onClick={() => {
							onClose();
							navigate('/auth/signup');
						}}
						className="w-full justify-start h-auto py-3 sm:py-4 px-3 sm:px-4"
						variant="outline"
					>
						<div className="flex items-center w-full">
							<div className="flex-1 text-left min-w-0">
								<div className="font-semibold text-sm sm:text-base text-gray-900">
									{t('common.register_as_customer') || 'Register as Customer'}
								</div>
								<div className="text-xs sm:text-sm text-gray-500 mt-0.5">
									{t('common.register_as_customer_desc') || 'Create an account to request services'}
								</div>
							</div>
						</div>
					</Button>
					<Button
						onClick={() => {
							onClose();
							navigate('/workshop/signup');
						}}
						className="w-full justify-start h-auto py-3 sm:py-4 px-3 sm:px-4 bg-transparent hover:bg-gray-50"
						variant="outline"
					>
						<div className="flex items-center w-full">
							<div className="flex-1 text-left min-w-0">
								<div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
									{t('common.register_as_workshop') || 'Register as Workshop'}
								</div>
								<div className="text-xs sm:text-sm text-gray-500 mt-0.5">
									{t('common.register_as_workshop_desc') || 'Register your workshop to offer services'}
								</div>
							</div>
						</div>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
