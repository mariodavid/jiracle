import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {CheckoutConfirmation} from '../CheckoutConfirmation.js';

export type CheckoutConfirmationAreaProps = {
	onConfirm: (confirmed: boolean) => void;
};

export function CheckoutConfirmationArea({
	onConfirm,
}: CheckoutConfirmationAreaProps) {
	return (
		<ConfirmationDialog width={50} borderColor="yellow">
			<CheckoutConfirmation onConfirm={onConfirm} />
		</ConfirmationDialog>
	);
}
