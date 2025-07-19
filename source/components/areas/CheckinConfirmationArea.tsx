import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {CheckinConfirmation} from '../CheckinConfirmation.js';

export interface CheckinConfirmationAreaProps {
	onConfirm: (confirmed: boolean) => void;
}

export function CheckinConfirmationArea({
	onConfirm,
}: CheckinConfirmationAreaProps) {
	return (
		<ConfirmationDialog width={50} borderColor="cyan">
			<CheckinConfirmation onConfirm={onConfirm} />
		</ConfirmationDialog>
	);
}
