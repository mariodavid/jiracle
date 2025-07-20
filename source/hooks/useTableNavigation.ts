import {useCallback} from 'react';
import {useFocusManager} from 'ink';
import {GridNavigationService} from '../services/GridNavigationService.js';
import {
	FocusableItemCalculator,
	type FocusableItem,
} from '../utils/FocusableItemCalculator.js';
import type {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {IssueGroup} from '../services/IssueGroupManager.js';
import {
	useKeyboardInput,
	type KeyboardInputHandlers,
} from './useKeyboardInput.js';
import {useFocusManagement, type FocusedCell} from './useFocusManagement.js';

export type TableNavigationProps = {
	isActive: boolean;
	weekDates: Date[];
	attendanceManager?: AttendanceManager;
	issueGroups: IssueGroup[];
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	onCellDelete?: (data: {issueKey: string; date: Date}) => void;
	onAttendanceEdit?: (data: {date: Date}) => void;
	onAttendanceDelete?: (data: {date: Date}) => void;
	onOpenInBrowser?: (issueKey: string) => void;
};

export type TableNavigationResult = {
	focusedCell: FocusedCell | null;
	handleFocusChange: (
		issueKey: string,
		columnIndex: number,
		isFocused: boolean,
	) => void;
	setFocusedCell: (cell: FocusedCell | null) => void;
	clearFocus: () => void;
	isCellFocused: (issueKey: string, columnIndex: number) => boolean;
};

export function useTableNavigation({
	isActive,
	weekDates,
	attendanceManager,
	issueGroups,
	onWeekChange,
	onCellWorklog,
	onCellDelete,
	onAttendanceEdit,
	onAttendanceDelete,
	onOpenInBrowser,
}: TableNavigationProps): TableNavigationResult {
	// Core focus management
	const {
		focusedCell,
		handleFocusChange,
		setFocusedCell,
		clearFocus,
		isCellFocused,
	} = useFocusManagement();

	// Ink focus manager for programmatic focus control
	const {focus} = useFocusManager();

	// Helper function to get all focusable items
	const getAllFocusableItems = useCallback((): FocusableItem[] => {
		return FocusableItemCalculator.calculateFocusableItems({
			attendanceManager,
			issueGroups,
		});
	}, [attendanceManager, issueGroups]);

	// Arrow key navigation handler
	const handleArrowNavigation = useCallback(
		(direction: 'up' | 'down' | 'left' | 'right') => {
			if (!focusedCell) return;

			const focusableItems = getAllFocusableItems();
			const result = GridNavigationService.navigateInDirection(direction, {
				focusedCell,
				focusableItems,
			});

			if (result.success && result.targetItem) {
				focus(result.targetItem.focusId);
			}
		},
		[focusedCell, getAllFocusableItems, focus],
	);

	// Reverse tab navigation handler
	const handleReverseTabNavigation = useCallback(() => {
		if (!focusedCell) return;

		const focusableItems = getAllFocusableItems();
		const result = GridNavigationService.navigateToNextItem(
			{focusedCell, focusableItems},
			'previous',
		);

		if (result.success && result.targetItem) {
			focus(result.targetItem.focusId);
		}
	}, [focusedCell, getAllFocusableItems, focus]);

	// Create keyboard input handlers
	const keyboardHandlers: KeyboardInputHandlers = {
		handleArrowNavigation,
		handleReverseTabNavigation,
		onWeekChange,
		onCellWorklog,
		onCellDelete,
		onAttendanceEdit,
		onAttendanceDelete,
		onOpenInBrowser,
	};

	// Initialize keyboard input handling
	useKeyboardInput({
		isActive,
		focusedCell,
		weekDates,
		handlers: keyboardHandlers,
	});

	return {
		focusedCell,
		handleFocusChange,
		setFocusedCell,
		clearFocus,
		isCellFocused,
	};
}
