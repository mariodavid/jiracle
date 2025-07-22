import React from 'react';
import {ConfirmationDialog} from '../confirmation-dialog.js';
import {CheckinConfirmation} from '../checkin-confirmation.js';

export type CheckinConfirmationAreaProps = {
	onConfirm: (confirmed: boolean) => void;
};

export function CheckinConfirmationArea({
	onConfirm,
}: CheckinConfirmationAreaProps) {
	return (
		<ConfirmationDialog width={50} borderColor="cyan">
			<CheckinConfirmation onConfirm={onConfirm} />
		</ConfirmationDialog>
	);
}
