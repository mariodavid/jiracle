import React from 'react';
import {ConfirmationDialog} from '../ConfirmationDialog.js';
import {AlignTimeConfirmation} from '../AlignTimeConfirmation.js';
import type {AlignmentResult} from '../../services/RemainingTimeAlignment.js';

export interface AlignTimeConfirmationAreaProps {
	dayLabel: string;
	attendanceHours: number;
	currentLoggedHours: number;
	remainingHours: number;
	strategy: 'even' | 'proportional';
	previewResult: AlignmentResult;
	isAligning: boolean;
	onConfirm: (confirmed: boolean) => void;
}

export function AlignTimeConfirmationArea({
	dayLabel,
	attendanceHours,
	currentLoggedHours,
	remainingHours,
	strategy,
	previewResult,
	isAligning,
	onConfirm,
}: AlignTimeConfirmationAreaProps) {
	return (
		<ConfirmationDialog
			width={80}
			borderColor="cyan"
			isLoading={isAligning}
			loadingText="Aligning time..."
		>
			<AlignTimeConfirmation
				dayLabel={dayLabel}
				attendanceHours={attendanceHours}
				currentLoggedHours={currentLoggedHours}
				remainingHours={remainingHours}
				strategy={strategy}
				previewResult={previewResult}
				onConfirm={onConfirm}
			/>
		</ConfirmationDialog>
	);
}
