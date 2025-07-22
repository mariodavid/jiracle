import type {AttendanceManager} from '../attendance/attendance-manager.js';
import type {IssueGroup} from '../services/issue-group-manager.js';

export type FocusableItem = {
	focusId: string;
	issueKey: string;
	columnIndex: number;
	isAttendance: boolean;
};

export type FocusableItemCalculatorOptions = {
	attendanceManager: AttendanceManager | undefined | undefined;
	issueGroups: IssueGroup[];
	columnCount?: number;
};

// Monday to Friday
const DEFAULT_COLUMN_COUNT = 5;

export function calculateFocusableItems(
	options: FocusableItemCalculatorOptions,
): FocusableItem[] {
	const {
		attendanceManager,
		issueGroups,
		columnCount = DEFAULT_COLUMN_COUNT,
	} = options;
	const items: FocusableItem[] = [];

	// Add attendance cells first (they appear at the top of the grid)
	if (attendanceManager) {
		for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
			items.push({
				focusId: `attendance-attendance-${columnIndex}`,
				issueKey: 'attendance-attendance',
				columnIndex,
				isAttendance: true,
			});
		}
	}

	// Add issue cells after attendance rows
	for (const group of issueGroups) {
		for (const [issueKey] of group.issues) {
			for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
				items.push({
					focusId: `issue-${issueKey}-${columnIndex}`,
					issueKey,
					columnIndex,
					isAttendance: false,
				});
			}
		}
	}

	return items;
}

export function findFocusableItem(
	items: FocusableItem[],
	predicate: (item: FocusableItem) => boolean,
): FocusableItem | undefined {
	return items.find(item => predicate(item));
}

export function filterFocusableItems(
	items: FocusableItem[],
	predicate: (item: FocusableItem) => boolean,
): FocusableItem[] {
	return items.filter(item => predicate(item));
}

export function getFocusableItemsByColumn(
	items: FocusableItem[],
	columnIndex: number,
): FocusableItem[] {
	return items.filter(item => item.columnIndex === columnIndex);
}

export function getFocusableItemsByIssue(
	items: FocusableItem[],
	issueKey: string,
): FocusableItem[] {
	return items.filter(item => item.issueKey === issueKey);
}

export function getFocusableItemIndex(
	items: FocusableItem[],
	targetItem: Pick<FocusableItem, 'issueKey' | 'columnIndex'>,
): number {
	return items.findIndex(
		item =>
			item.issueKey === targetItem.issueKey &&
			item.columnIndex === targetItem.columnIndex,
	);
}
