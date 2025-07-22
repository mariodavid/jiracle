import React from 'react';
import {ConfirmationDialog} from '../confirmation-dialog.js';
import {DeleteWorklogConfirmation} from '../delete-worklog-confirmation.js';
import type {DeleteCandidate} from '../../hooks/use-delete-operations.js';

export type DeleteWorklogConfirmationAreaProps = {
	deleteCandidate: DeleteCandidate;
	isDeleting: boolean;
	onConfirm: (confirmed: boolean) => void;
	formatDate: (date: Date) => string;
};

export function DeleteWorklogConfirmationArea({
	deleteCandidate,
	isDeleting,
	onConfirm,
	formatDate,
}: DeleteWorklogConfirmationAreaProps) {
	return (
		<ConfirmationDialog
			width={68}
			borderColor="red"
			isLoading={isDeleting}
			loadingText="Deleting worklogs..."
		>
			<DeleteWorklogConfirmation
				issueKey={deleteCandidate.issueKey}
				dayLabel={formatDate(deleteCandidate.date)}
				onConfirm={onConfirm}
			/>
		</ConfirmationDialog>
	);
}
