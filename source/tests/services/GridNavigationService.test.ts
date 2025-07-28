import test from 'ava';
import {
	findInitialFocusItem,
	navigateInDirection,
	navigateToNextItem,
	type NavigationDirection,
	type NavigationContext,
} from '../../services/GridNavigationService.js';
import type {FocusableItem} from '../../utils/FocusableItemCalculator.js';
import {IssueKey} from '../../domain/IssueKey.js';

// Test data factories
const createFocusableItem = (
	issueKey: string,
	columnIndex: number,
	isAttendance = false,
): FocusableItem => ({
	focusId: isAttendance
		? `attendance-${issueKey}-${columnIndex}`
		: `issue-${issueKey}-${columnIndex}`,
	issueKey,
	columnIndex,
	isAttendance,
});

const createGridItems = (): FocusableItem[] => [
	// Attendance row (if present)
	createFocusableItem('ATTEND-0', 0, true),
	createFocusableItem('ATTEND-1', 1, true),
	createFocusableItem('ATTEND-2', 2, true),
	createFocusableItem('ATTEND-3', 3, true),
	createFocusableItem('ATTEND-4', 4, true),
	// Issue rows
	createFocusableItem('PROJECT-123', 0),
	createFocusableItem('PROJECT-123', 1),
	createFocusableItem('PROJECT-123', 2),
	createFocusableItem('PROJECT-123', 3),
	createFocusableItem('PROJECT-123', 4),
	createFocusableItem('PROJECT-456', 0),
	createFocusableItem('PROJECT-456', 1),
	createFocusableItem('PROJECT-456', 2),
	createFocusableItem('PROJECT-456', 3),
	createFocusableItem('PROJECT-456', 4),
];

const createSimpleGridItems = (): FocusableItem[] => [
	createFocusableItem('PROJECT-123', 0),
	createFocusableItem('PROJECT-123', 1),
	createFocusableItem('PROJECT-123', 2),
	createFocusableItem('PROJECT-456', 0),
	createFocusableItem('PROJECT-456', 1),
	createFocusableItem('PROJECT-456', 2),
];

const createNavigationContext = (
	focusedIssueKey: string,
	focusedColumnIndex: number,
	focusableItems: FocusableItem[] = createGridItems(),
	isAttendance = false,
): NavigationContext => ({
	focusedCell: {
		issueKey: IssueKey.fromString(focusedIssueKey),
		columnIndex: focusedColumnIndex,
		isAttendance,
	},
	focusableItems,
});

// Test navigation in all directions
test('navigateInDirection: up navigation with wraparound', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateInDirection('up', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'ATTEND-2');
	t.is(result.targetItem!.columnIndex, 2);
});

test('navigateInDirection: up navigation from top wraps to bottom', t => {
	const items = createGridItems();
	const context = createNavigationContext('ATTEND-2', 2, items, true);

	const result = navigateInDirection('up', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-456');
	t.is(result.targetItem!.columnIndex, 2);
});

test('navigateInDirection: down navigation', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateInDirection('down', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-456');
	t.is(result.targetItem!.columnIndex, 2);
});

test('navigateInDirection: down navigation from bottom wraps to top', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-456', 2, items);

	const result = navigateInDirection('down', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'ATTEND-2');
	t.is(result.targetItem!.columnIndex, 2);
});

test('navigateInDirection: left navigation', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateInDirection('left', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 1);
});

test('navigateInDirection: left navigation from leftmost wraps to rightmost', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 0, items);

	const result = navigateInDirection('left', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 4);
});

test('navigateInDirection: right navigation', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateInDirection('right', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 3);
});

test('navigateInDirection: right navigation from rightmost wraps to leftmost', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 4, items);

	const result = navigateInDirection('right', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 0);
});

test('navigateInDirection: invalid direction returns failure', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateInDirection('invalid' as NavigationDirection, context);

	t.false(result.success);
	t.is(result.targetItem, undefined);
});

test('navigateInDirection: focused cell not found returns failure', t => {
	const items = createGridItems();
	const context = createNavigationContext('NOTFOUND-123', 0, items);

	const result = navigateInDirection('up', context);

	t.false(result.success);
});

test('navigateInDirection: empty grid returns failure', t => {
	const context = createNavigationContext('PROJECT-123', 0, []);

	const result = navigateInDirection('up', context);

	t.false(result.success);
});

// Test custom column count
test('navigateInDirection: custom column count affects wraparound', t => {
	const items = createSimpleGridItems();
	const context = {
		...createNavigationContext('PROJECT-123', 2, items),
		columnCount: 3,
	};

	const result = navigateInDirection('right', context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 0); // Wraps to leftmost (column 0)
});

// Test sequential navigation (tab-like)
test('navigateToNextItem: next item navigation', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateToNextItem(context, 'next');

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 3);
});

test('navigateToNextItem: next from last item wraps to first', t => {
	const items = createGridItems();
	const lastItemIndex = items.length - 1;
	const lastItem = items[lastItemIndex]!;
	const context = createNavigationContext(
		lastItem.issueKey,
		lastItem.columnIndex,
		items,
	);

	const result = navigateToNextItem(context, 'next');

	t.true(result.success);
	t.is(result.targetItem!.issueKey, items[0]!.issueKey);
	t.is(result.targetItem!.columnIndex, items[0]!.columnIndex);
});

test('navigateToNextItem: previous item navigation', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateToNextItem(context, 'previous');

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 1);
});

test('navigateToNextItem: previous from first item wraps to last', t => {
	const items = createGridItems();
	const firstItem = items[0]!;
	const context = createNavigationContext(
		firstItem.issueKey,
		firstItem.columnIndex,
		items,
		true,
	);

	const result = navigateToNextItem(context, 'previous');

	t.true(result.success);
	const lastItem = items[items.length - 1]!;
	t.is(result.targetItem!.issueKey, lastItem.issueKey);
	t.is(result.targetItem!.columnIndex, lastItem.columnIndex);
});

test('navigateToNextItem: defaults to next direction', t => {
	const items = createGridItems();
	const context = createNavigationContext('PROJECT-123', 2, items);

	const result = navigateToNextItem(context);

	t.true(result.success);
	t.is(result.targetItem!.issueKey, 'PROJECT-123');
	t.is(result.targetItem!.columnIndex, 3);
});

// Test initial focus finding
test('findInitialFocusItem: finds item in preferred column', t => {
	const items = createGridItems();

	const result = findInitialFocusItem(items, 2);

	t.truthy(result);
	t.is(result!.columnIndex, 2);
	t.is(result!.issueKey, 'ATTEND-2'); // First item in column 2
});

test('findInitialFocusItem: falls back to first item when preferred column not found', t => {
	const items = createGridItems();

	const result = findInitialFocusItem(items, 10);

	t.truthy(result);
	t.is(result!.issueKey, items[0]!.issueKey);
	t.is(result!.columnIndex, items[0]!.columnIndex);
});

test('findInitialFocusItem: returns first item when no preferred column', t => {
	const items = createGridItems();

	const result = findInitialFocusItem(items);

	t.truthy(result);
	t.is(result!.issueKey, items[0]!.issueKey);
	t.is(result!.columnIndex, items[0]!.columnIndex);
});

test('findInitialFocusItem: returns undefined for empty grid', t => {
	const result = findInitialFocusItem([]);

	t.is(result, undefined);
});

// Test edge cases
test('navigateInDirection: single row grid navigation', t => {
	const items = [
		createFocusableItem('PROJECT-123', 0),
		createFocusableItem('PROJECT-123', 1),
		createFocusableItem('PROJECT-123', 2),
	];
	const context = createNavigationContext('PROJECT-123', 1, items);

	// Up and down should wrap to same row
	const upResult = navigateInDirection('up', context);
	t.true(upResult.success);
	t.is(upResult.targetItem!.issueKey, 'PROJECT-123');

	const downResult = navigateInDirection('down', context);
	t.true(downResult.success);
	t.is(downResult.targetItem!.issueKey, 'PROJECT-123');
});

test('navigateInDirection: single column grid navigation', t => {
	const items = [
		createFocusableItem('PROJECT-123', 0),
		createFocusableItem('PROJECT-456', 0),
		createFocusableItem('PROJECT-789', 0),
	];
	const context = createNavigationContext('PROJECT-456', 0, items);

	// Left and right should fail because no items exist in target columns
	const leftResult = navigateInDirection('left', context);
	t.false(leftResult.success); // Should fail because column 4 doesn't exist

	const rightResult = navigateInDirection('right', context);
	t.false(rightResult.success); // Should fail because column 1 doesn't exist
});

test('navigateInDirection: handles missing target items gracefully', t => {
	const items = [
		createFocusableItem('PROJECT-123', 0),
		createFocusableItem('PROJECT-123', 2), // Missing column 1
	];
	const context = createNavigationContext('PROJECT-123', 0, items);

	const result = navigateInDirection('right', context);

	t.false(result.success); // Should fail because column 1 doesn't exist
});
