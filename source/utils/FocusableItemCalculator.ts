import type {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {IssueGroup} from '../services/IssueGroupManager.js';

export interface FocusableItem {
	focusId: string;
	issueKey: string;
	columnIndex: number;
	isAttendance: boolean;
}

export interface FocusableItemCalculatorOptions {
	attendanceManager: AttendanceManager | null | undefined;
	issueGroups: IssueGroup[];
	columnCount?: number;
}

export class FocusableItemCalculator {
	private static readonly DEFAULT_COLUMN_COUNT = 5; // Monday to Friday

	static calculateFocusableItems(
		options: FocusableItemCalculatorOptions,
	): FocusableItem[] {
		const {
			attendanceManager,
			issueGroups,
			columnCount = this.DEFAULT_COLUMN_COUNT,
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

	static findFocusableItem(
		items: FocusableItem[],
		predicate: (item: FocusableItem) => boolean,
	): FocusableItem | undefined {
		return items.find(item => predicate(item));
	}

	static filterFocusableItems(
		items: FocusableItem[],
		predicate: (item: FocusableItem) => boolean,
	): FocusableItem[] {
		return items.filter(item => predicate(item));
	}

	static getFocusableItemsByColumn(
		items: FocusableItem[],
		columnIndex: number,
	): FocusableItem[] {
		return items.filter(item => item.columnIndex === columnIndex);
	}

	static getFocusableItemsByIssue(
		items: FocusableItem[],
		issueKey: string,
	): FocusableItem[] {
		return items.filter(item => item.issueKey === issueKey);
	}

	static getFocusableItemIndex(
		items: FocusableItem[],
		targetItem: Pick<FocusableItem, 'issueKey' | 'columnIndex'>,
	): number {
		return items.findIndex(
			item =>
				item.issueKey === targetItem.issueKey &&
				item.columnIndex === targetItem.columnIndex,
		);
	}
}
