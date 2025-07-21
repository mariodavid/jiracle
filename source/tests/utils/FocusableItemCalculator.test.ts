import test from 'ava';
import {
	calculateFocusableItems,
	findFocusableItem,
	filterFocusableItems,
	getFocusableItemsByColumn,
	getFocusableItemsByIssue,
	getFocusableItemIndex,
	type FocusableItem,
	type FocusableItemCalculatorOptions,
} from '../../utils/FocusableItemCalculator.js';
import type {AttendanceManager} from '../../attendance/AttendanceManager.js';
import type {IssueGroup} from '../../services/IssueGroupManager.js';

// Test data factories
const createMockAttendanceManager = (): AttendanceManager =>
	({} as AttendanceManager);

const createIssueGroup = (
	issueKeys: string[],
	groupName?: string,
): IssueGroup => ({
	group: groupName ? {id: groupName, name: groupName} : undefined,
	issues: issueKeys.map(key => [key, {summary: `Summary for ${key}`}]),
	totalHours: 0,
});

const createOptions = (
	overrides: Partial<FocusableItemCalculatorOptions> = {},
): FocusableItemCalculatorOptions => ({
	attendanceManager: undefined,
	issueGroups: [],
	...overrides,
});

// Helper to verify focusable item structure
const assertFocusableItem = (
	t: any,
	item: FocusableItem,
	expected: {
		focusId: string;
		issueKey: string;
		columnIndex: number;
		isAttendance: boolean;
	},
) => {
	t.is(item.focusId, expected.focusId);
	t.is(item.issueKey, expected.issueKey);
	t.is(item.columnIndex, expected.columnIndex);
	t.is(item.isAttendance, expected.isAttendance);
};

test('calculateFocusableItems: empty grid with no attendance and no issues', t => {
	const options = createOptions();
	const items = calculateFocusableItems(options);

	t.is(items.length, 0);
});

test('calculateFocusableItems: grid with attendance manager but no issues', t => {
	const options = createOptions({
		attendanceManager: createMockAttendanceManager(),
	});
	const items = calculateFocusableItems(options);

	t.is(items.length, 5); // 5 weekdays

	// Verify attendance items for all columns
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[i]!, {
			focusId: `attendance-attendance-${i}`,
			issueKey: 'attendance-attendance',
			columnIndex: i,
			isAttendance: true,
		});
	}
});

test('calculateFocusableItems: grid with issues but no attendance', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123', 'PROJECT-456'])];
	const options = createOptions({issueGroups});
	const items = calculateFocusableItems(options);

	t.is(items.length, 10); // 2 issues × 5 columns

	// Verify first issue across all columns
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[i]!, {
			focusId: `issue-PROJECT-123-${i}`,
			issueKey: 'PROJECT-123',
			columnIndex: i,
			isAttendance: false,
		});
	}

	// Verify second issue across all columns
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[5 + i]!, {
			focusId: `issue-PROJECT-456-${i}`,
			issueKey: 'PROJECT-456',
			columnIndex: i,
			isAttendance: false,
		});
	}
});

test('calculateFocusableItems: grid with both attendance and issues', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123'])];
	const options = createOptions({
		attendanceManager: createMockAttendanceManager(),
		issueGroups,
	});
	const items = calculateFocusableItems(options);

	t.is(items.length, 10); // 5 attendance + 5 issue cells

	// Verify attendance items come first
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[i]!, {
			focusId: `attendance-attendance-${i}`,
			issueKey: 'attendance-attendance',
			columnIndex: i,
			isAttendance: true,
		});
	}

	// Verify issue items come after attendance
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[5 + i]!, {
			focusId: `issue-PROJECT-123-${i}`,
			issueKey: 'PROJECT-123',
			columnIndex: i,
			isAttendance: false,
		});
	}
});

test('calculateFocusableItems: multiple issue groups', t => {
	const issueGroups = [
		createIssueGroup(['GROUP1-123'], 'Group 1'),
		createIssueGroup(['GROUP2-456', 'GROUP2-789'], 'Group 2'),
	];
	const options = createOptions({issueGroups});
	const items = calculateFocusableItems(options);

	t.is(items.length, 15); // 3 issues × 5 columns

	// Verify first group issue
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[i]!, {
			focusId: `issue-GROUP1-123-${i}`,
			issueKey: 'GROUP1-123',
			columnIndex: i,
			isAttendance: false,
		});
	}

	// Verify second group first issue
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[5 + i]!, {
			focusId: `issue-GROUP2-456-${i}`,
			issueKey: 'GROUP2-456',
			columnIndex: i,
			isAttendance: false,
		});
	}

	// Verify second group second issue
	for (let i = 0; i < 5; i++) {
		assertFocusableItem(t, items[10 + i]!, {
			focusId: `issue-GROUP2-789-${i}`,
			issueKey: 'GROUP2-789',
			columnIndex: i,
			isAttendance: false,
		});
	}
});

test('calculateFocusableItems: custom column count', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123'])];
	const options = createOptions({
		issueGroups,
		columnCount: 3,
	});
	const items = calculateFocusableItems(options);

	t.is(items.length, 3); // 1 issue × 3 columns

	for (let i = 0; i < 3; i++) {
		assertFocusableItem(t, items[i]!, {
			focusId: `issue-PROJECT-123-${i}`,
			issueKey: 'PROJECT-123',
			columnIndex: i,
			isAttendance: false,
		});
	}
});

test('findFocusableItem: finds item by predicate', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123'])];
	const options = createOptions({issueGroups});
	const items = calculateFocusableItems(options);

	const found = findFocusableItem(
		items,
		item => item.issueKey === 'PROJECT-123' && item.columnIndex === 2,
	);

	t.truthy(found);
	t.is(found!.focusId, 'issue-PROJECT-123-2');
});

test('findFocusableItem: returns undefined when not found', t => {
	const options = createOptions();
	const items = calculateFocusableItems(options);

	const found = findFocusableItem(
		items,
		item => item.issueKey === 'NONEXISTENT',
	);

	t.is(found, undefined);
});

test('filterFocusableItems: filters items by predicate', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123', 'PROJECT-456'])];
	const options = createOptions({
		attendanceManager: createMockAttendanceManager(),
		issueGroups,
	});
	const items = calculateFocusableItems(options);

	const attendanceItems = filterFocusableItems(
		items,
		item => item.isAttendance,
	);

	t.is(attendanceItems.length, 5);
	for (const item of attendanceItems) {
		t.true(item.isAttendance);
	}
});

test('getFocusableItemsByColumn: returns items for specific column', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123', 'PROJECT-456'])];
	const options = createOptions({
		attendanceManager: createMockAttendanceManager(),
		issueGroups,
	});
	const items = calculateFocusableItems(options);

	const column2Items = getFocusableItemsByColumn(items, 2);

	t.is(column2Items.length, 3); // 1 attendance + 2 issues
	for (const item of column2Items) {
		t.is(item.columnIndex, 2);
	}
});

test('getFocusableItemsByIssue: returns items for specific issue', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123', 'PROJECT-456'])];
	const options = createOptions({issueGroups});
	const items = calculateFocusableItems(options);

	const issueItems = getFocusableItemsByIssue(items, 'PROJECT-123');

	t.is(issueItems.length, 5); // 5 columns for this issue
	for (const item of issueItems) {
		t.is(item.issueKey, 'PROJECT-123');
	}
});

test('getFocusableItemIndex: finds correct index for target item', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123', 'PROJECT-456'])];
	const options = createOptions({
		attendanceManager: createMockAttendanceManager(),
		issueGroups,
	});
	const items = calculateFocusableItems(options);

	// Find PROJECT-456 at column 3 (should be at index 5 + 3 = 8)
	const index = getFocusableItemIndex(items, {
		issueKey: 'PROJECT-456',
		columnIndex: 3,
	});

	t.is(index, 13); // Attendance(5) + PROJECT-123(5) + PROJECT-456 column 3
	t.is(items[index]!.issueKey, 'PROJECT-456');
	t.is(items[index]!.columnIndex, 3);
});

test('getFocusableItemIndex: returns -1 when item not found', t => {
	const options = createOptions();
	const items = calculateFocusableItems(options);

	const index = getFocusableItemIndex(items, {
		issueKey: 'NONEXISTENT',
		columnIndex: 0,
	});

	t.is(index, -1);
});

test('calculateFocusableItems: handles undefined attendance manager', t => {
	const issueGroups = [createIssueGroup(['PROJECT-123'])];
	const options = createOptions({
		attendanceManager: undefined,
		issueGroups,
	});
	const items = calculateFocusableItems(options);

	t.is(items.length, 5); // Only issue items, no attendance
	for (const item of items) {
		t.false(item.isAttendance);
	}
});

test('calculateFocusableItems: handles single issue', t => {
	const issueGroups = [createIssueGroup(['SINGLE-123'])];
	const options = createOptions({issueGroups});
	const items = calculateFocusableItems(options);

	t.is(items.length, 5);
	for (const [index, item] of items.entries()) {
		t.is(item.issueKey, 'SINGLE-123');
		t.is(item.columnIndex, index);
		t.is(item.focusId, `issue-SINGLE-123-${index}`);
		t.false(item.isAttendance);
	}
});
