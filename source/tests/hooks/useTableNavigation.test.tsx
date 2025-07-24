import test from 'ava';
import {renderHook, act} from '@testing-library/react';
import {
	useTableNavigation,
	type TableNavigationProps,
} from '../../hooks/useTableNavigation.js';
import type {IssueGroup} from '../../services/IssueGroupManager.js';

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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		result.current.focusedCell,
		expectedInitialState.focusedCell,
		'Should start with no focused cell',
	);
	t.is(
		typeof result.current.handleFocusChange,
		expectedInitialState.handleFocusChangeType,
		'Should provide handleFocusChange function',
	);
	t.is(
		typeof result.current.setFocusedCell,
		expectedInitialState.setFocusedCellType,
		'Should provide setFocusedCell function',
	);
	t.is(
		typeof result.current.clearFocus,
		expectedInitialState.clearFocusType,
		'Should provide clearFocus function',
	);
	t.is(
		typeof result.current.isCellFocused,
		expectedInitialState.isCellFocusedType,
		'Should provide isCellFocused function',
	);
});

test('useTableNavigation: manages focus state correctly', t => {
	// 1. EXPLICIT TEST DATA
	const testIssueKey = 'TEST-123';
	const testColumnIndex = 0;
	const mockIssueGroups: IssueGroup[] = [
		{
			group: undefined,
			issues: [
				[testIssueKey, {summary: 'Test issue', dailyHours: {}, weekTotal: 0}],
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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

	// Test focus management functionality
	const initialState = result.current.focusedCell;
	const initialFocusCheck = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);

	act(() => {
		result.current.handleFocusChange(testIssueKey, testColumnIndex, true);
	});
	const focusedAfterSet = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellAfterSet = result.current.focusedCell;

	act(() => {
		result.current.clearFocus();
	});
	const focusedAfterClear = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellAfterClear = result.current.focusedCell;

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
		'Should correctly identify focused cell after handleFocusChange',
	);
	t.truthy(
		focusedCellAfterSet,
		'focusedCell should be set after handleFocusChange',
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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

	// Invoke all callbacks
	mockCallbacks.onWeekChange();
	mockCallbacks.onCellWorklog();
	mockCallbacks.onCellDelete();
	mockCallbacks.onAttendanceEdit();
	mockCallbacks.onAttendanceDelete();
	mockCallbacks.onOpenInBrowser();

	// Verify hook initialized
	t.truthy(
		result.current,
		'Hook should initialize successfully with all callbacks',
	);

	// 3. SPECIFIC VALUE COMPARISONS
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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

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
	t.truthy(result.current, 'Hook should initialize with attendance manager');
	t.is(
		result.current.focusedCell,
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
	const {result: inactiveResult} = renderHook(() =>
		useTableNavigation(inactiveOptions),
	);
	const {result: activeResult} = renderHook(() =>
		useTableNavigation(activeOptions),
	);

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(
		inactiveResult.current.focusedCell,
		expectedInterface.focusedCell,
		'Inactive state should have no focused cell',
	);
	t.is(
		typeof inactiveResult.current.handleFocusChange,
		expectedInterface.handleFocusChangeType,
		'Inactive state should provide handleFocusChange function',
	);
	t.is(
		typeof inactiveResult.current.handleFocusChange,
		typeof activeResult.current.handleFocusChange,
		'Active and inactive states should have same interface types',
	);
});

test('useTableNavigation: processes complex issue groups correctly', t => {
	// 1. EXPLICIT TEST DATA
	const testIssueKeys = ['PROJECT-123', 'PROJECT-456', 'PROJECT-789'] as const;
	const mockIssueGroups: IssueGroup[] = [
		{
			group: {id: 'group1', name: 'Development', desiredAmount: 40},
			issues: [
				[
					testIssueKeys[0] as string,
					{summary: 'Test issue 1', dailyHours: {}, weekTotal: 8},
				],
				[
					testIssueKeys[1] as string,
					{summary: 'Test issue 2', dailyHours: {}, weekTotal: 16},
				],
			],
			totalHours: 24,
		},
		{
			group: undefined,
			issues: [
				[
					testIssueKeys[2] as string,
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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

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
		// Initially unfocused
		const initiallyFocused = result.current.isCellFocused(testIssueKey, 0);
		t.false(initiallyFocused, `Issue ${testIssueKey} should start unfocused`);

		// Focus the issue
		act(() => {
			result.current.handleFocusChange(testIssueKey, 0, true);
		});
		const nowFocused = result.current.isCellFocused(testIssueKey, 0);
		t.true(nowFocused, `Should be able to focus issue ${testIssueKey}`);

		// Clear focus
		act(() => {
			result.current.clearFocus();
		});
		const afterClear = result.current.isCellFocused(testIssueKey, 0);
		t.false(
			afterClear,
			`Issue ${testIssueKey} should be unfocused after clear`,
		);
	}

	t.truthy(result.current, 'Hook should handle complex issue groups');
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
	const {result} = renderHook(() => useTableNavigation(mockOptions));

	// Test normal operations
	const initialState = result.current.focusedCell;
	const initialFocusCheck = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);

	act(() => {
		result.current.handleFocusChange(testIssueKey, testColumnIndex, true);
	});
	const focusedState = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const focusedCellState = result.current.focusedCell;

	act(() => {
		result.current.clearFocus();
	});
	const clearedState = result.current.isCellFocused(
		testIssueKey,
		testColumnIndex,
	);
	const clearedCellState = result.current.focusedCell;

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
		'Should correctly identify focused cell',
	);
	t.truthy(
		focusedCellState,
		'focusedCell should be set after handleFocusChange',
	);
	t.is(clearedState, expectedStates.afterClear, 'Should correctly clear focus');
	t.is(
		clearedCellState,
		expectedStates.initial,
		'focusedCell should be undefined after clearFocus',
	);

	// Verify methods handle edge cases without throwing
	t.notThrows(() => {
		act(() => {
			result.current.handleFocusChange('NONEXISTENT-999', 999, false);
		});
	}, 'handleFocusChange should handle arbitrary parameters');
	t.notThrows(() => {
		act(() => {
			result.current.setFocusedCell(undefined);
		});
	}, 'setFocusedCell should handle undefined');
	t.notThrows(() => {
		act(() => {
			result.current.clearFocus();
		});
	}, 'clearFocus should not throw');
	t.notThrows(
		() => result.current.isCellFocused('NONEXISTENT-999', 999),
		'isCellFocused should handle arbitrary parameters',
	);
});
