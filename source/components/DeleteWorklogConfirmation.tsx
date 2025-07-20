import React from 'react';
import {Confirmation} from './Confirmation.js';

type DeleteWorklogConfirmationProps = {
	issueKey: string;
	dayLabel: string;
	onConfirm: (confirmed: boolean) => void;
};

export function DeleteWorklogConfirmation({
	issueKey,
	dayLabel,
	onConfirm,
}: DeleteWorklogConfirmationProps) {
	return (
		<Confirmation
			message={`Delete all worklogs for ${issueKey} on ${dayLabel}?`}
			onConfirm={onConfirm}
		/>
	);
}
