import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {AlignTimeConfirmation} from '../AlignTimeConfirmation.js';
import type {
	AlignmentResult,
	CreateWorklogsResult,
} from '../../services/RemainingTimeAlignment.js';

export interface AlignTimeConfirmationAreaProps {
	dayLabel: string;
	attendanceHours: number;
	currentLoggedHours: number;
	remainingHours: number;
	strategy: 'even' | 'proportional';
	mode: 'update' | 'create';
	previewResult?: AlignmentResult;
	createResult?: CreateWorklogsResult;
	isAligning: boolean;
	onConfirm: (confirmed: boolean) => void;
}

export function AlignTimeConfirmationArea({
	dayLabel,
	attendanceHours,
	currentLoggedHours,
	remainingHours,
	strategy,
	mode,
	previewResult,
	createResult,
	isAligning,
	onConfirm,
}: AlignTimeConfirmationAreaProps) {
	const loadingText =
		mode === 'create' ? 'Creating worklogs...' : 'Aligning time...';

	return (
		<ConfirmationDialog
			width={80}
			borderColor="cyan"
			isLoading={isAligning}
			loadingText={loadingText}
		>
			<AlignTimeConfirmation
				dayLabel={dayLabel}
				attendanceHours={attendanceHours}
				currentLoggedHours={currentLoggedHours}
				remainingHours={remainingHours}
				strategy={strategy}
				mode={mode}
				previewResult={previewResult}
				createResult={createResult}
				onConfirm={onConfirm}
			/>
		</ConfirmationDialog>
	);
}
