import React from 'react';
import {Confirmation} from './confirmation.js';

type DeleteAttendanceConfirmationProps = {
	dayLabel: string;
	onConfirm: (confirmed: boolean) => void;
};

export function DeleteAttendanceConfirmation({
	dayLabel,
	onConfirm,
}: DeleteAttendanceConfirmationProps) {
	return (
		<Confirmation
			message={`Delete attendance record for ${dayLabel}?`}
			onConfirm={onConfirm}
		/>
	);
}
