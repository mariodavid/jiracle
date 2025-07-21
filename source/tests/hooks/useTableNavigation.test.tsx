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

// Test component that uses the hook
function TestTableNavigationComponent({
	options,
}: {
	options: TableNavigationProps;
}) {
	const result = useTableNavigation(options);

	// Store result for testing
	(globalThis as any).__testTableNavigationResult = result;

	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useTableNavigation: hook can be instantiated with minimal props', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
	};

	// Should not throw when rendering
	t.notThrows(() => {
		render(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);
	});
});

test('useTableNavigation: returns expected interface structure', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
	};

	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
	t.is(result.focusedCell, undefined);
	t.is(typeof result.handleFocusChange, 'function');
	t.is(typeof result.setFocusedCell, 'function');
	t.is(typeof result.clearFocus, 'function');
	t.is(typeof result.isCellFocused, 'function');
});

test('useTableNavigation: handles all optional callback props', t => {
	const mockIssueGroups: IssueGroup[] = [
		{
			group: undefined,
			issues: [
				['PROJECT-123', {summary: 'Test issue', dailyHours: {}, weekTotal: 0}],
			],
			totalHours: 0,
		},
	];

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		issueGroups: mockIssueGroups,
		onWeekChange() {},
		onCellWorklog() {},
		onCellDelete() {},
		onAttendanceEdit() {},
		onAttendanceDelete() {},
		onOpenInBrowser() {},
	};

	// Should not throw with all optional props
	t.notThrows(() => {
		render(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);
	});
});

test('useTableNavigation: works with attendance manager', t => {
	const mockAttendanceManager = {
		isEnabled: true,
		async checkIn() {},
		async checkOut() {},
		getAttendanceForDate: async () => null,
		getWeeklyAttendance: async () => ({}),
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
		// @ts-expect-error - simplified mock for testing
		attendanceManager: mockAttendanceManager,
	};

	// Should not throw with attendance manager
	t.notThrows(() => {
		render(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);
	});
});

test('useTableNavigation: handles inactive state', t => {
	const mockOptions: TableNavigationProps = {
		isActive: false, // Inactive
		weekDates: [],
		issueGroups: [],
	};

	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
	t.is(result.focusedCell, undefined);
});

test('useTableNavigation: works with complex issue groups', t => {
	const mockIssueGroups: IssueGroup[] = [
		{
			group: {
				id: 'group1',
				name: 'Development',
				desiredAmount: 40,
			},
			issues: [
				[
					'PROJECT-123',
					{summary: 'Test issue 1', dailyHours: {}, weekTotal: 8},
				],
				[
					'PROJECT-456',
					{summary: 'Test issue 2', dailyHours: {}, weekTotal: 16},
				],
			],
			totalHours: 24,
		},
		{
			group: undefined,
			issues: [
				[
					'PROJECT-789',
					{summary: 'Ungrouped issue', dailyHours: {}, weekTotal: 4},
				],
			],
			totalHours: 4,
		},
	];

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [
			new Date('2023-07-17'),
			new Date('2023-07-18'),
			new Date('2023-07-19'),
		],
		issueGroups: mockIssueGroups,
	};

	// Should not throw with complex issue groups
	t.notThrows(() => {
		render(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);
	});

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
});

test('useTableNavigation: validates required props types', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
	};

	// Verify prop types
	t.is(typeof mockOptions.isActive, 'boolean');
	t.true(Array.isArray(mockOptions.weekDates));
	t.true(Array.isArray(mockOptions.issueGroups));
	t.true(mockOptions.weekDates[0] instanceof Date);
});

test('useTableNavigation: accepts all callback function types', t => {
	const callbacks = {
		onWeekChange(_direction: 'prev' | 'next') {},
		onCellWorklog(_data: {issueKey: string; date: Date}) {},
		onCellDelete(_data: {issueKey: string; date: Date}) {},
		onAttendanceEdit(_data: {date: Date}) {},
		onAttendanceDelete(_data: {date: Date}) {},
		onOpenInBrowser(_issueKey: string) {},
	};

	// Verify callback types are functions
	t.is(typeof callbacks.onWeekChange, 'function');
	t.is(typeof callbacks.onCellWorklog, 'function');
	t.is(typeof callbacks.onCellDelete, 'function');
	t.is(typeof callbacks.onAttendanceEdit, 'function');
	t.is(typeof callbacks.onAttendanceDelete, 'function');
	t.is(typeof callbacks.onOpenInBrowser, 'function');

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
		...callbacks,
	};

	// Should not throw with all callbacks
	t.notThrows(() => {
		render(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);
	});
});

test('useTableNavigation: result methods maintain hook contract', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [],
		issueGroups: [],
	};

	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Verify that methods can be called without throwing
	t.notThrows(() => {
		result.handleFocusChange('PROJECT-123', 0, true);
	});
	t.notThrows(() => {
		result.setFocusedCell(undefined);
	});
	t.notThrows(() => {
		result.clearFocus();
	});
	t.notThrows(() => result.isCellFocused('PROJECT-123', 0));
});

test('useTableNavigation: handles focus state changes correctly', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		issueGroups: [
			{
				group: undefined,
				issues: [
					[
						'PROJECT-123',
						{summary: 'Test issue', dailyHours: {}, weekTotal: 0},
					],
				],
				totalHours: 0,
			},
		],
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	let result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Initially no cell is focused
	t.is(result.focusedCell, undefined);
	t.false(result.isCellFocused('PROJECT-123', 0));

	// Set focus programmatically
	result.setFocusedCell({
		issueKey: 'PROJECT-123',
		columnIndex: 0,
		isAttendance: false,
	});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result.focusedCell);
	t.is(result.focusedCell?.issueKey, 'PROJECT-123');
	t.is(result.focusedCell?.columnIndex, 0);
	t.true(result.isCellFocused('PROJECT-123', 0));

	// Clear focus
	result.clearFocus();
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.is(result.focusedCell, undefined);
	t.false(result.isCellFocused('PROJECT-123', 0));
});

test('useTableNavigation: handles focus changes through handleFocusChange method', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [
			{
				group: undefined,
				issues: [
					[
						'PROJECT-456',
						{summary: 'Another test issue', dailyHours: {}, weekTotal: 4},
					],
				],
				totalHours: 4,
			},
		],
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	let result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Focus a cell using handleFocusChange
	result.handleFocusChange('PROJECT-456', 0, true);
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result.focusedCell);
	t.is(result.focusedCell?.issueKey, 'PROJECT-456');
	t.is(result.focusedCell?.columnIndex, 0);
	t.true(result.isCellFocused('PROJECT-456', 0));
});

test('useTableNavigation: handles attendance cells correctly', t => {
	const mockAttendanceManager = {
		isEnabled: true,
		async checkIn() {
			return true;
		},
		async checkOut() {
			return true;
		},
		getAttendanceForDate: async () => null,
		getWeeklyAttendance: async () => ({}),
		async deleteAttendance() {
			return true;
		},
		async updateAttendance() {
			return true;
		},
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
		// @ts-expect-error - simplified mock for testing
		attendanceManager: mockAttendanceManager,
		onAttendanceEdit() {},
		onAttendanceDelete() {},
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	let result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Set focus on an attendance cell
	result.setFocusedCell({
		issueKey: 'attendance-attendance',
		columnIndex: 0,
		isAttendance: true,
	});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result.focusedCell);
	t.true(result.focusedCell?.isAttendance);
	t.true(result.isCellFocused('attendance-attendance', 0));
});

test('useTableNavigation: handles multiple week dates correctly', t => {
	const weekDates = [
		new Date('2023-07-17'), // Monday
		new Date('2023-07-18'), // Tuesday
		new Date('2023-07-19'), // Wednesday
		new Date('2023-07-20'), // Thursday
		new Date('2023-07-21'), // Friday
	];

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates,
		issueGroups: [
			{
				group: undefined,
				issues: [
					[
						'WEEK-123',
						{summary: 'Week test issue', dailyHours: {}, weekTotal: 20},
					],
				],
				totalHours: 20,
			},
		],
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Test focusing on different days
	for (let columnIndex = 0; columnIndex < weekDates.length; columnIndex++) {
		result.setFocusedCell({
			issueKey: 'WEEK-123',
			columnIndex,
			isAttendance: false,
		});
		rerender(
			React.createElement(TestTableNavigationComponent, {options: mockOptions}),
		);

		const updatedResult = (globalThis as any)
			.__testTableNavigationResult as TableNavigationResult;
		t.is(updatedResult.focusedCell?.columnIndex, columnIndex);
		t.true(updatedResult.isCellFocused('WEEK-123', columnIndex));

		// Other columns should not be focused
		for (let otherColumn = 0; otherColumn < weekDates.length; otherColumn++) {
			if (otherColumn !== columnIndex) {
				t.false(updatedResult.isCellFocused('WEEK-123', otherColumn));
			}
		}
	}
});

test('useTableNavigation: handles callback invocation patterns', t => {
	let weekChangeCallCount = 0;
	let cellWorklogCallCount = 0;
	let cellDeleteCallCount = 0;
	let attendanceEditCallCount = 0;
	let attendanceDeleteCallCount = 0;
	let openInBrowserCallCount = 0;

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
		onWeekChange() {
			weekChangeCallCount++;
		},
		onCellWorklog() {
			cellWorklogCallCount++;
		},
		onCellDelete() {
			cellDeleteCallCount++;
		},
		onAttendanceEdit() {
			attendanceEditCallCount++;
		},
		onAttendanceDelete() {
			attendanceDeleteCallCount++;
		},
		onOpenInBrowser() {
			openInBrowserCallCount++;
		},
	};

	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	// Verify callbacks are properly set up (they exist and are functions)
	t.is(weekChangeCallCount, 0);
	t.is(cellWorklogCallCount, 0);
	t.is(cellDeleteCallCount, 0);
	t.is(attendanceEditCallCount, 0);
	t.is(attendanceDeleteCallCount, 0);
	t.is(openInBrowserCallCount, 0);
});

test('useTableNavigation: handles edge cases with empty data', t => {
	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [], // Empty week dates
		issueGroups: [], // Empty issue groups
	};

	render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
	t.is(result.focusedCell, undefined);

	// Methods should still work even with empty data
	t.notThrows(() => {
		result.handleFocusChange('EMPTY-123', 0, true);
		result.setFocusedCell({
			issueKey: 'EMPTY-456',
			columnIndex: 0,
			isAttendance: false,
		});
		result.clearFocus();
		result.isCellFocused('EMPTY-789', 0);
	});
});

test('useTableNavigation: handles mixed issue groups with different structures', t => {
	const mockIssueGroups: IssueGroup[] = [
		// Group with explicit group info
		{
			group: {
				id: 'dev-group',
				name: 'Development',
				desiredAmount: 32,
			},
			issues: [
				[
					'DEV-101',
					{summary: 'Feature A', dailyHours: {'2023-07-17': 4}, weekTotal: 4},
				],
				[
					'DEV-102',
					{summary: 'Feature B', dailyHours: {'2023-07-18': 6}, weekTotal: 6},
				],
			],
			totalHours: 10,
		},
		// Group without explicit group info (ungrouped)
		{
			group: undefined,
			issues: [
				[
					'MISC-201',
					{summary: 'Miscellaneous task', dailyHours: {}, weekTotal: 2},
				],
			],
			totalHours: 2,
		},
		// Empty group
		{
			group: {
				id: 'empty-group',
				name: 'Empty Group',
				desiredAmount: 0,
			},
			issues: [],
			totalHours: 0,
		},
	];

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [
			new Date('2023-07-17'),
			new Date('2023-07-18'),
			new Date('2023-07-19'),
		],
		issueGroups: mockIssueGroups,
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);

	let result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Test focusing on issues from different groups
	result.setFocusedCell({
		issueKey: 'DEV-101',
		columnIndex: 0,
		isAttendance: false,
	});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.is(result.focusedCell?.issueKey, 'DEV-101');

	result.setFocusedCell({
		issueKey: 'MISC-201',
		columnIndex: 1,
		isAttendance: false,
	});
	rerender(
		React.createElement(TestTableNavigationComponent, {options: mockOptions}),
	);
	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.is(result.focusedCell?.issueKey, 'MISC-201');
	t.is(result.focusedCell?.columnIndex, 1);
});

test('useTableNavigation: maintains state consistency across rerenders', t => {
	const initialOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [
			{
				group: undefined,
				issues: [
					[
						'CONSISTENT-123',
						{summary: 'Consistency test', dailyHours: {}, weekTotal: 8},
					],
				],
				totalHours: 8,
			},
		],
	};

	const {rerender} = render(
		React.createElement(TestTableNavigationComponent, {
			options: initialOptions,
		}),
	);

	// Set initial focus
	let result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	result.setFocusedCell({
		issueKey: 'CONSISTENT-123',
		columnIndex: 0,
		isAttendance: false,
	});
	rerender(
		React.createElement(TestTableNavigationComponent, {
			options: initialOptions,
		}),
	);

	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result.focusedCell);
	const initialFocusState = result.focusedCell;

	// Rerender with same options - focus should be maintained
	rerender(
		React.createElement(TestTableNavigationComponent, {
			options: initialOptions,
		}),
	);
	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.deepEqual(result.focusedCell, initialFocusState);

	// Rerender with different but equivalent options
	const equivalentOptions: TableNavigationProps = {
		...initialOptions,
		issueGroups: [
			{
				group: undefined,
				issues: [
					[
						'CONSISTENT-123',
						{summary: 'Consistency test', dailyHours: {}, weekTotal: 8},
					],
				],
				totalHours: 8,
			},
		],
	};

	rerender(
		React.createElement(TestTableNavigationComponent, {
			options: equivalentOptions,
		}),
	);
	result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	// Focus state should still be maintained
	t.truthy(result.focusedCell);
	t.is(result.focusedCell?.issueKey, 'CONSISTENT-123');
});
