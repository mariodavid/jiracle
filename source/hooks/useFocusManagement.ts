import {useState, useCallback} from 'react';

export type FocusedCell = {
	issueKey: string;
	columnIndex: number;
	isAttendance?: boolean;
};

export type UseFocusManagementResult = {
	focusedCell: FocusedCell | undefined;
	handleFocusChange: (
		issueKey: string,
		columnIndex: number,
		isFocused: boolean,
	) => void;
	setFocusedCell: (cell: FocusedCell | undefined) => void;
	clearFocus: () => void;
	isCellFocused: (issueKey: string, columnIndex: number) => boolean;
};

export function useFocusManagement(): UseFocusManagementResult {
	const [focusedCell, setFocusedCell] = useState<FocusedCell | undefined>(
		undefined,
	);

	const handleFocusChange = useCallback(
		(issueKey: string, columnIndex: number, isFocused: boolean) => {
			if (isFocused) {
				const isAttendance = issueKey.startsWith('attendance-');
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
		(issueKey: string, columnIndex: number): boolean => {
			return (
				focusedCell !== undefined &&
				focusedCell.issueKey === issueKey &&
				focusedCell.columnIndex === columnIndex
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
