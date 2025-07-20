import type {FocusableItem} from '../utils/FocusableItemCalculator.js';

export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

export type NavigationContext = {
	focusedCell: {
		issueKey: string;
		columnIndex: number;
		isAttendance?: boolean;
	};
	focusableItems: FocusableItem[];
	columnCount?: number;
};

export type NavigationResult = {
	success: boolean;
	targetItem?: FocusableItem;
	newIndex?: number;
};

export class GridNavigationService {
	private static get DEFAULT_COLUMN_COUNT() {
		return 5;
	} // Monday to Friday

	static navigateInDirection(
		direction: NavigationDirection,
		context: NavigationContext,
	): NavigationResult {
		const {
			focusedCell,
			focusableItems,
			columnCount = this.DEFAULT_COLUMN_COUNT,
		} = context;

		const currentIndex = this.findCurrentItemIndex(focusedCell, focusableItems);
		if (currentIndex === -1) {
			return {success: false};
		}

		let newIndex: number;

		switch (direction) {
			case 'up': {
				newIndex = this.navigateUp(focusedCell, focusableItems);
				break;
			}
			case 'down': {
				newIndex = this.navigateDown(focusedCell, focusableItems);
				break;
			}
			case 'left': {
				newIndex = this.navigateLeft(focusedCell, focusableItems, columnCount);
				break;
			}
			case 'right': {
				newIndex = this.navigateRight(focusedCell, focusableItems, columnCount);
				break;
			}
			default: {
				return {success: false};
			}
		}

		if (newIndex >= 0 && newIndex < focusableItems.length) {
			const targetItem = focusableItems[newIndex];
			if (targetItem) {
				return {
					success: true,
					targetItem,
					newIndex,
				};
			}
		}

		return {success: false};
	}

	static navigateToNextItem(
		context: NavigationContext,
		direction: 'next' | 'previous' = 'next',
	): NavigationResult {
		const {focusedCell, focusableItems} = context;

		const currentIndex = this.findCurrentItemIndex(focusedCell, focusableItems);
		if (currentIndex === -1) {
			return {success: false};
		}

		let newIndex: number;
		if (direction === 'next') {
			newIndex =
				currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
		} else {
			newIndex =
				currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
		}

		const targetItem = focusableItems[newIndex];
		if (targetItem) {
			return {
				success: true,
				targetItem,
				newIndex,
			};
		}

		return {success: false};
	}

	private static findCurrentItemIndex(
		focusedCell: NavigationContext['focusedCell'],
		focusableItems: FocusableItem[],
	): number {
		return focusableItems.findIndex(
			item =>
				item.issueKey === focusedCell.issueKey &&
				item.columnIndex === focusedCell.columnIndex,
		);
	}

	private static navigateUp(
		focusedCell: NavigationContext['focusedCell'],
		focusableItems: FocusableItem[],
	): number {
		// Move to previous row (same column) with wraparound
		const currentColumnIndex = focusedCell.columnIndex;
		const sameDayItems = focusableItems.filter(
			item => item.columnIndex === currentColumnIndex,
		);
		const currentRowIndex = sameDayItems.findIndex(
			item => item.issueKey === focusedCell.issueKey,
		);

		// Wrap to bottom if at top, otherwise go up
		const targetRowIndex =
			currentRowIndex > 0 ? currentRowIndex - 1 : sameDayItems.length - 1;

		const targetItem = sameDayItems[targetRowIndex];
		if (targetItem) {
			return focusableItems.findIndex(
				item =>
					item.issueKey === targetItem.issueKey &&
					item.columnIndex === targetItem.columnIndex,
			);
		}

		return -1;
	}

	private static navigateDown(
		focusedCell: NavigationContext['focusedCell'],
		focusableItems: FocusableItem[],
	): number {
		// Move to next row (same column) with wraparound
		const currentColumnIndex = focusedCell.columnIndex;
		const sameDayItems = focusableItems.filter(
			item => item.columnIndex === currentColumnIndex,
		);
		const currentRowIndex = sameDayItems.findIndex(
			item => item.issueKey === focusedCell.issueKey,
		);

		// Wrap to top if at bottom, otherwise go down
		const targetRowIndex =
			currentRowIndex < sameDayItems.length - 1 ? currentRowIndex + 1 : 0;

		const targetItem = sameDayItems[targetRowIndex];
		if (targetItem) {
			return focusableItems.findIndex(
				item =>
					item.issueKey === targetItem.issueKey &&
					item.columnIndex === targetItem.columnIndex,
			);
		}

		return -1;
	}

	private static navigateLeft(
		focusedCell: NavigationContext['focusedCell'],
		focusableItems: FocusableItem[],
		columnCount: number,
	): number {
		// Move to previous column (same row) with wraparound
		const targetColumnIndex =
			focusedCell.columnIndex > 0
				? focusedCell.columnIndex - 1
				: columnCount - 1;

		return focusableItems.findIndex(
			item =>
				item.issueKey === focusedCell.issueKey &&
				item.columnIndex === targetColumnIndex,
		);
	}

	private static navigateRight(
		focusedCell: NavigationContext['focusedCell'],
		focusableItems: FocusableItem[],
		columnCount: number,
	): number {
		// Move to next column (same row) with wraparound
		const targetColumnIndex =
			focusedCell.columnIndex < columnCount - 1
				? focusedCell.columnIndex + 1
				: 0;

		return focusableItems.findIndex(
			item =>
				item.issueKey === focusedCell.issueKey &&
				item.columnIndex === targetColumnIndex,
		);
	}

	static findInitialFocusItem(
		focusableItems: FocusableItem[],
		preferredColumnIndex?: number,
	): FocusableItem | null {
		if (focusableItems.length === 0) {
			return null;
		}

		// Try to find item in preferred column
		if (preferredColumnIndex !== undefined) {
			const preferredItem = focusableItems.find(
				item => item.columnIndex === preferredColumnIndex,
			);
			if (preferredItem) {
				return preferredItem;
			}
		}

		// Fallback to first item
		return focusableItems[0] || null;
	}
}
