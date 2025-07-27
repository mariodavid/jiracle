import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {DeleteAttendanceConfirmation} from '../DeleteAttendanceConfirmation.js';
import type {DeleteAttendanceCandidate} from '../../hooks/useDeleteOperations.js';
import type {LocalDate} from '../../domain/LocalDate.js';

export type DeleteAttendanceConfirmationAreaProps = {
	deleteAttendanceCandidate: DeleteAttendanceCandidate;
	isDeletingAttendance: boolean;
	onConfirm: (confirmed: boolean) => void;
	formatDate: (date: LocalDate) => string;
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
