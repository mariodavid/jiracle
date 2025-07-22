import React from 'react';
import {ConfirmationDialog} from '../confirmation-dialog.js';
import {DeleteAttendanceConfirmation} from '../delete-attendance-confirmation.js';
import type {DeleteAttendanceCandidate} from '../../hooks/use-delete-operations.js';

export type DeleteAttendanceConfirmationAreaProps = {
	deleteAttendanceCandidate: DeleteAttendanceCandidate;
	isDeletingAttendance: boolean;
	onConfirm: (confirmed: boolean) => void;
	formatDate: (date: Date) => string;
};

export function DeleteAttendanceConfirmationArea({
	deleteAttendanceCandidate,
	isDeletingAttendance,
	onConfirm,
	formatDate,
}: DeleteAttendanceConfirmationAreaProps) {
	return (
		<ConfirmationDialog
			width={68}
			borderColor="red"
			paddingX={2}
			isLoading={isDeletingAttendance}
			loadingText="Deleting attendance..."
		>
			<DeleteAttendanceConfirmation
				dayLabel={formatDate(deleteAttendanceCandidate.date)}
				onConfirm={onConfirm}
			/>
		</ConfirmationDialog>
	);
}
