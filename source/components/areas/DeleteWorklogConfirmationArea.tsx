import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {DeleteWorklogConfirmation} from '../DeleteWorklogConfirmation.js';
import type {DeleteCandidate} from '../../hooks/useDeleteOperations.js';
import type {LocalDate} from '../../domain/LocalDate.js';

export type DeleteWorklogConfirmationAreaProps = {
	deleteCandidate: DeleteCandidate;
	isDeleting: boolean;
	onConfirm: (confirmed: boolean) => void;
	formatDate: (date: LocalDate) => string;
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
