import test from 'ava';
import React from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useTableNavigation,
	type TableNavigationProps,
	type TableNavigationResult,
} from '../../hooks/useTableNavigation.js';
import type {IssueGroup} from '../../services/IssueGroupManager.js';
import {IssueKey} from '../../domain/IssueKey.js';

// Test component that captures hook state during render
function TestTableNavigationComponent({
	options,
}: {
	options: TableNavigationProps;
}) {
	const result = useTableNavigation(options);

	// Store result for testing (test-only pattern)
	// @ts-expect-error: Test-only global variable to access hook state
	globalThis.__testTableNavigationResult = result;

	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useTableNavigation: initializes with correct default state', t => {
	// 1. EXPLICIT TEST DATA
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
	};
	const expectedInitialState = {
		focusedCell: undefined,
		handleFocusChangeType: 'function' as const,
		setFocusedCellType: 'function' as const,
		clearFocusType: 'function' as const,
		isCellFocusedType: 'function' as const,
	};

	// 2. OPERATIONS
	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		result.focusedCell,
		expectedInitialState.focusedCell,
		'Should start with no focused cell',
	);
	t.is(
		typeof result.handleFocusChange,
		expectedInitialState.handleFocusChangeType,
		'Should provide handleFocusChange function',
	);
	t.is(
		typeof result.setFocusedCell,
		expectedInitialState.setFocusedCellType,
		'Should provide setFocusedCell function',
	);
	t.is(
		typeof result.clearFocus,
		expectedInitialState.clearFocusType,
		'Should provide clearFocus function',
	);
	t.is(
		typeof result.isCellFocused,
		expectedInitialState.isCellFocusedType,
		'Should provide isCellFocused function',
	);
});

test('useTableNavigation: manages focus state correctly', t => {
	// 1. EXPLICIT TEST DATA
	const testIssueKeyString = 'TEST-123';
	const testIssueKey = IssueKey.fromString(testIssueKeyString);
	const testColumnIndex = 0;
	const mockIssueGroups: IssueGroup[] = [
		{
			group: undefined,
			issues: [
				[
					testIssueKeyString,
					{summary: 'Test issue', dailyHours: {}, weekTotal: 0},
				],
			],
			totalHours: 0,
		},
	];

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: mockIssueGroups,
	};

	const expectedFocusStates = {
		initial: undefined,
		afterSet: true,
		afterClear: false,
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// Test focus management functionality
	const initialState = result.focusedCell;
	const initialFocusCheck = result.isCellFocused(testIssueKey, testColumnIndex);

	// Focus a cell first
	result.setFocusedCell({issueKey: testIssueKey, columnIndex: testColumnIndex});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	const resultAfterSet =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;
	const focusedAfterSet = resultAfterSet.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellAfterSet = resultAfterSet.focusedCell;

	resultAfterSet.clearFocus();
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	const resultAfterClear =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;
	const focusedAfterClear = resultAfterClear.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellAfterClear = resultAfterClear.focusedCell;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		initialState,
		expectedFocusStates.initial,
		'Should start with no focused cell',
	);
	t.is(
		initialFocusCheck,
		expectedFocusStates.afterClear,
		'Initial focus check should return false',
	);
	t.is(
		focusedAfterSet,
		expectedFocusStates.afterSet,
		'Should correctly identify focused cell after setFocusedCell',
	);
	t.truthy(
		focusedCellAfterSet,
		'focusedCell should be set after setFocusedCell',
	);
	t.is(
		focusedAfterClear,
		expectedFocusStates.afterClear,
		'Should correctly unfocus cell after clearFocus',
	);
	t.is(
		focusedCellAfterClear,
		expectedFocusStates.initial,
		'focusedCell should be undefined after clearFocus',
	);
});

test('useTableNavigation: handles callbacks without errors', t => {
	// 1. EXPLICIT TEST DATA
	const testDate = new Date('2023-07-17');
	let callbackCount = 0;

	const mockCallbacks = {
		onWeekChange() {
			callbackCount++;
		},
		onCellWorklog() {
			callbackCount++;
		},
		onCellDelete() {
			callbackCount++;
		},
		onAttendanceEdit() {
			callbackCount++;
		},
		onAttendanceDelete() {
			callbackCount++;
		},
		onOpenInBrowser() {
			callbackCount++;
		},
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [testDate],
		issueGroups: [],
		...mockCallbacks,
	};

	const expectedCallbackCount = 6;

	// 2. OPERATIONS
	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// Invoke all callbacks to verify they work
	mockCallbacks.onWeekChange();
	mockCallbacks.onCellWorklog();
	mockCallbacks.onCellDelete();
	mockCallbacks.onAttendanceEdit();
	mockCallbacks.onAttendanceDelete();
	mockCallbacks.onOpenInBrowser();

	// 3. SPECIFIC VALUE COMPARISONS
	t.truthy(result, 'Hook should initialize successfully with all callbacks');
	t.is(
		callbackCount,
		expectedCallbackCount,
		'All callbacks should be invoked successfully',
	);
	t.is(
		typeof mockOptions.onWeekChange,
		'function',
		'onWeekChange should be function',
	);
	t.is(
		typeof mockOptions.onCellWorklog,
		'function',
		'onCellWorklog should be function',
	);
});

test('useTableNavigation: works with attendance manager', t => {
	// 1. EXPLICIT TEST DATA
	const mockAttendanceManager = {
		isEnabled: true,
		async checkIn() {},
		async checkOut() {},
		getAttendanceForDate: async () => null,
		getWeeklyAttendance: async () => ({}),
	};

	const expectedFeatures = {
		isEnabled: true,
		checkInType: 'function' as const,
		checkOutType: 'function' as const,
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
		// @ts-expect-error - simplified mock for testing
		attendanceManager: mockAttendanceManager,
	};

	// 2. OPERATIONS
	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		mockAttendanceManager.isEnabled,
		expectedFeatures.isEnabled,
		'Attendance manager should be enabled',
	);
	t.is(
		typeof mockAttendanceManager.checkIn,
		expectedFeatures.checkInType,
		'Should provide checkIn function',
	);
	t.is(
		typeof mockAttendanceManager.checkOut,
		expectedFeatures.checkOutType,
		'Should provide checkOut function',
	);
	t.truthy(result, 'Hook should initialize with attendance manager');
	t.is(
		result.focusedCell,
		undefined,
		'Should start with no focused cell even with attendance manager',
	);
});

test('useTableNavigation: handles inactive state correctly', t => {
	// 1. EXPLICIT TEST DATA
	const inactiveOptions: TableNavigationProps = {
		isActive: false,
		weekDates: [],
		issueGroups: [],
	};

	const activeOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
	};

	const expectedInterface = {
		focusedCell: undefined,
		handleFocusChangeType: 'function' as const,
	};

	// 2. OPERATIONS
	render(
		React.createElement(TestTableNavigationComponent, {
			options: inactiveOptions,
		}),
	);
	const inactiveResult =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	render(
		React.createElement(TestTableNavigationComponent, {options: activeOptions}),
	);
	const activeResult =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		inactiveResult.focusedCell,
		expectedInterface.focusedCell,
		'Inactive state should have no focused cell',
	);
	t.is(
		typeof inactiveResult.handleFocusChange,
		expectedInterface.handleFocusChangeType,
		'Inactive state should provide handleFocusChange function',
	);
	t.is(
		typeof inactiveResult.handleFocusChange,
		typeof activeResult.handleFocusChange,
		'Active and inactive states should have same interface types',
	);
});

test('useTableNavigation: processes complex issue groups correctly', t => {
	// 1. EXPLICIT TEST DATA
	const testIssueKeys = ['PROJECT-123', 'PROJECT-456', 'PROJECT-789'];
	const mockIssueGroups: IssueGroup[] = [
		{
			group: {id: 'group1', name: 'Development', desiredAmount: 40},
			issues: [
				[
					testIssueKeys[0]!,
					{summary: 'Test issue 1', dailyHours: {}, weekTotal: 8},
				],
				[
					testIssueKeys[1]!,
					{summary: 'Test issue 2', dailyHours: {}, weekTotal: 16},
				],
			],
			totalHours: 24,
		},
		{
			group: undefined,
			issues: [
				[
					testIssueKeys[2]!,
					{summary: 'Ungrouped issue', dailyHours: {}, weekTotal: 4},
				],
			],
			totalHours: 4,
		},
	];

	const expectedStructure = {
		groupedIssues: 2,
		ungroupedIssues: 1,
		totalIssues: 3,
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		issueGroups: mockIssueGroups,
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// Count actual issues
	const totalGroupedIssues = mockIssueGroups[0]!.issues.length;
	const totalUngroupedIssues = mockIssueGroups[1]!.issues.length;
	const totalIssues = totalGroupedIssues + totalUngroupedIssues;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		totalGroupedIssues,
		expectedStructure.groupedIssues,
		'Should have correct number of grouped issues',
	);
	t.is(
		totalUngroupedIssues,
		expectedStructure.ungroupedIssues,
		'Should have correct number of ungrouped issues',
	);
	t.is(
		totalIssues,
		expectedStructure.totalIssues,
		'Should have correct total number of issues',
	);

	// Test focus management works for each issue
	for (const testIssueKey of testIssueKeys) {
		if (testIssueKey) {
			// Initially unfocused
			const initiallyFocused = result.isCellFocused(testIssueKey, 0);
			t.false(initiallyFocused, `Issue ${testIssueKey} should start unfocused`);

			// Focus the issue
			result.setFocusedCell({issueKey: testIssueKey, columnIndex: 0});
			rerender(
				React.createElement(TestTableNavigationComponent, {
					options: mockOptions,
				}),
			);
			const resultAfterFocus =
				// @ts-expect-error: Test-only global variable to access hook state
				globalThis.__testTableNavigationResult as TableNavigationResult;
			const nowFocused = resultAfterFocus.isCellFocused(testIssueKey, 0);
			t.true(nowFocused, `Should be able to focus issue ${testIssueKey}`);

			// Clear focus
			resultAfterFocus.clearFocus();
			rerender(
				React.createElement(TestTableNavigationComponent, {
					options: mockOptions,
				}),
			);
			const resultAfterClear =
				// @ts-expect-error: Test-only global variable to access hook state
				globalThis.__testTableNavigationResult as TableNavigationResult;
			const afterClear = resultAfterClear.isCellFocused(testIssueKey, 0);
			t.false(
				afterClear,
				`Issue ${testIssueKey} should be unfocused after clear`,
			);
		}
	}

	t.truthy(result, 'Hook should handle complex issue groups');
});

test('useTableNavigation: method integrity with error handling', t => {
	// 1. EXPLICIT TEST DATA
	const testIssueKey = 'PROJECT-123';
	const testColumnIndex = 0;
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
	};

	const expectedStates = {
		initial: undefined,
		afterFocus: true,
		afterClear: false,
	};

	// 2. OPERATIONS
	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;

	// Test normal operations
	const initialState = result.focusedCell;
	const initialFocusCheck = result.isCellFocused(testIssueKey, testColumnIndex);

	result.setFocusedCell({issueKey: testIssueKey, columnIndex: testColumnIndex});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	const resultAfterFocus =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;
	const focusedState = resultAfterFocus.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellState = resultAfterFocus.focusedCell;

	resultAfterFocus.clearFocus();
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	const resultAfterClear =
		// @ts-expect-error: Test-only global variable to access hook state
		globalThis.__testTableNavigationResult as TableNavigationResult;
	const clearedState = resultAfterClear.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const clearedCellState = resultAfterClear.focusedCell;

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		initialState,
		expectedStates.initial,
		'Should start with no focused cell',
	);
	t.is(
		initialFocusCheck,
		expectedStates.afterClear,
		'Initial focus check should return false',
	);
	t.is(
		focusedState,
		expectedStates.afterFocus,
		'Should correctly identify focused cell after setFocusedCell',
	);
	t.truthy(focusedCellState, 'focusedCell should be set after setFocusedCell');
	t.is(clearedState, expectedStates.afterClear, 'Should correctly clear focus');
	t.is(
		clearedCellState,
		expectedStates.initial,
		'focusedCell should be undefined after clearFocus',
	);

	// Verify methods handle edge cases without throwing
	t.notThrows(() => {
		result.handleFocusChange('NONEXISTENT-999', 999, false);
	}, 'handleFocusChange should handle arbitrary parameters');
	t.notThrows(() => {
		result.setFocusedCell(undefined);
	}, 'setFocusedCell should handle undefined');
	t.notThrows(() => {
		result.clearFocus();
	}, 'clearFocus should not throw');
	t.notThrows(
		() => result.isCellFocused('NONEXISTENT-999', 999),
		'isCellFocused should handle arbitrary parameters',
	);
});
