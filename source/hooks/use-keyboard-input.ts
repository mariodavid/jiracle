import {useInput} from 'ink';
import type {FocusedCell} from './use-focus-management.js';

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

function handleArrowKeys(
	key: any,
	handleArrowNavigation: KeyboardInputHandlers['handleArrowNavigation'],
): boolean {
	if (!key.shift && key.upArrow) {
		handleArrowNavigation('up');
		return true;
	}

	if (!key.shift && key.downArrow) {
		handleArrowNavigation('down');
		return true;
	}

	if (!key.shift && key.leftArrow) {
		handleArrowNavigation('left');
		return true;
	}

	if (!key.shift && key.rightArrow) {
		handleArrowNavigation('right');
		return true;
	}

	return false;
}

function handleWeekNavigation(
	key: any,
	onWeekChange?: (direction: 'prev' | 'next') => void,
): boolean {
	if (key.shift && key.leftArrow && onWeekChange) {
		onWeekChange('prev');
		return true;
	}

	if (key.shift && key.rightArrow && onWeekChange) {
		onWeekChange('next');
		return true;
	}

	return false;
}

function handleEnterKey(
	key: any,
	focusedCell: FocusedCell | undefined,
	weekDates: Date[],
	handlers: Pick<KeyboardInputHandlers, 'onCellWorklog' | 'onAttendanceEdit'>,
): boolean {
	if (!key.return || !focusedCell) {
		return false;
	}

	const date = weekDates[focusedCell.columnIndex];
	if (!date) {
		return false;
	}

	if (handlers.onCellWorklog && !focusedCell.isAttendance) {
		handlers.onCellWorklog({issueKey: focusedCell.issueKey, date});
		return true;
	}

	if (handlers.onAttendanceEdit && focusedCell.isAttendance) {
		handlers.onAttendanceEdit({date});
		return true;
	}

	return false;
}

function handleDeleteKey(
	input: string,
	focusedCell: FocusedCell | undefined,
	weekDates: Date[],
	handlers: Pick<KeyboardInputHandlers, 'onCellDelete' | 'onAttendanceDelete'>,
): boolean {
	if ((input !== 'd' && input !== 'D') || !focusedCell) {
		return false;
	}

	const date = weekDates[focusedCell.columnIndex];
	if (!date) {
		return false;
	}

	if (focusedCell.isAttendance && handlers.onAttendanceDelete) {
		handlers.onAttendanceDelete({date});
		return true;
	}

	if (!focusedCell.isAttendance && handlers.onCellDelete) {
		handlers.onCellDelete({issueKey: focusedCell.issueKey, date});
		return true;
	}

	return false;
}

function handleOpenInBrowser(
	input: string,
	focusedCell: FocusedCell | undefined,
	onOpenInBrowser?: KeyboardInputHandlers['onOpenInBrowser'],
): boolean {
	if (
		(input === 'o' || input === 'O') &&
		onOpenInBrowser &&
		focusedCell &&
		!focusedCell.isAttendance
	) {
		onOpenInBrowser(focusedCell.issueKey);
		return true;
	}

	return false;
}

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

	useInput((input, key) => {
		if (!isActive) {
			return;
		}

		// Handle arrow key navigation
		if (handleArrowKeys(key, handleArrowNavigation)) {
			return;
		}

		// Handle week navigation
		if (handleWeekNavigation(key, onWeekChange)) {
			return;
		}

		// Handle Shift+Tab
		if (key.shift && key.tab) {
			handleReverseTabNavigation();
			return;
		}

		// Handle Enter key
		if (
			handleEnterKey(key, focusedCell, weekDates, {
				onCellWorklog,
				onAttendanceEdit,
			})
		) {
			return;
		}

		// Handle delete key
		if (
			handleDeleteKey(input, focusedCell, weekDates, {
				onCellDelete,
				onAttendanceDelete,
			})
		) {
			return;
		}

		// Handle open in browser
		handleOpenInBrowser(input, focusedCell, onOpenInBrowser);
	});
}
