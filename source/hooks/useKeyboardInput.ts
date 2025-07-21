import {useInput} from 'ink';
import type {FocusedCell} from './useFocusManagement.js';

export type KeyboardInputHandlers = {
	handleArrowNavigation: (direction: 'up' | 'down' | 'left' | 'right') => void;
	handleReverseTabNavigation: () => void;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	onCellDelete?: (data: {issueKey: string; date: Date}) => void;
	onAttendanceEdit?: (data: {date: Date}) => void;
	onAttendanceDelete?: (data: {date: Date}) => void;
	onOpenInBrowser?: (issueKey: string) => void;
};

export type KeyboardInputOptions = {
	isActive: boolean;
	focusedCell: FocusedCell | undefined;
	weekDates: Date[];
	handlers: KeyboardInputHandlers;
};

export function useKeyboardInput({
	isActive,
	focusedCell,
	weekDates,
	handlers,
}: KeyboardInputOptions): void {
	const {
		handleArrowNavigation,
		handleReverseTabNavigation,
		onWeekChange,
		onCellWorklog,
		onCellDelete,
		onAttendanceEdit,
		onAttendanceDelete,
		onOpenInBrowser,
	} = handlers;

	useInput((_input, key) => {
		// Only handle input when table is active
		if (!isActive) {
			return;
		}

		// Arrow key navigation (without shift)
		if (!key.shift && key.upArrow) {
			handleArrowNavigation('up');
			return;
		}

		if (!key.shift && key.downArrow) {
			handleArrowNavigation('down');
			return;
		}

		if (!key.shift && key.leftArrow) {
			handleArrowNavigation('left');
			return;
		}

		if (!key.shift && key.rightArrow) {
			handleArrowNavigation('right');
			return;
		}

		// Week navigation with Shift+Arrow
		if (key.shift && key.leftArrow && onWeekChange) {
			onWeekChange('prev');
			return;
		}

		if (key.shift && key.rightArrow && onWeekChange) {
			onWeekChange('next');
			return;
		}

		// Shift+Tab for reverse tab navigation
		if (key.shift && key.tab) {
			handleReverseTabNavigation();
			return;
		}

		// Handle Enter for worklog editing (only for issue cells, not attendance)
		if (
			key.return &&
			onCellWorklog &&
			focusedCell &&
			!focusedCell.isAttendance
		) {
			const date = weekDates[focusedCell.columnIndex];
			if (date) {
				onCellWorklog({issueKey: focusedCell.issueKey, date});
			}

			return;
		}

		// Handle Enter for attendance editing
		if (
			key.return &&
			onAttendanceEdit &&
			focusedCell &&
			focusedCell.isAttendance
		) {
			const date = weekDates[focusedCell.columnIndex];
			if (date) {
				onAttendanceEdit({date});
			}

			return;
		}

		// Handle 'd' for delete
		if ((_input === 'd' || _input === 'D') && focusedCell) {
			const date = weekDates[focusedCell.columnIndex];
			if (date) {
				if (focusedCell.isAttendance && onAttendanceDelete) {
					// Delete attendance record
					onAttendanceDelete({date});
				} else if (!focusedCell.isAttendance && onCellDelete) {
					// Delete worklog
					onCellDelete({issueKey: focusedCell.issueKey, date});
				}
			}

			return;
		}

		// Handle 'O' for opening focused issue in browser
		if (
			(_input === 'o' || _input === 'O') &&
			onOpenInBrowser &&
			focusedCell &&
			!focusedCell.isAttendance
		) {
			onOpenInBrowser(focusedCell.issueKey);
		}

		// Note: Tab key is still handled by Ink's default focus system
	});
}
