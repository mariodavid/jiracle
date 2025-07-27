import {useState, useCallback} from 'react';
import type {IssueKey} from '../domain/IssueKey.js';

export type FocusedCell = {
	issueKey: IssueKey;
	columnIndex: number;
	isAttendance?: boolean;
};

export type UseFocusManagementResult = {
	focusedCell: FocusedCell | undefined;
	handleFocusChange: (
		issueKey: IssueKey,
		columnIndex: number,
		isFocused: boolean,
	) => void;
	setFocusedCell: (cell: FocusedCell | undefined) => void;
	clearFocus: () => void;
	isCellFocused: (issueKey: IssueKey, columnIndex: number) => boolean;
};

export function useFocusManagement(): UseFocusManagementResult {
	const [focusedCell, setFocusedCell] = useState<FocusedCell | undefined>(
		undefined,
	);

	const handleFocusChange = useCallback(
		(issueKey: IssueKey, columnIndex: number, isFocused: boolean) => {
			if (isFocused) {
				const isAttendance = issueKey.toString().startsWith('attendance-');
				setFocusedCell({issueKey, columnIndex, isAttendance});
			}
			// Don't clear on blur - only update when we get a new focus
		},
		[],
	);

	const clearFocus = useCallback(() => {
		setFocusedCell(undefined);
	}, []);

	const isCellFocused = useCallback(
		(issueKey: IssueKey, columnIndex: number): boolean => {
			return (
				(focusedCell?.issueKey.equals(issueKey) &&
					focusedCell.columnIndex === columnIndex) ??
				false
			);
		},
		[focusedCell],
	);

	return {
		focusedCell,
		handleFocusChange,
		setFocusedCell,
		clearFocus,
		isCellFocused,
	};
}
