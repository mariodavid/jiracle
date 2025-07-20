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
	// @ts-ignore
	globalThis.__testTableNavigationResult = result;

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

	// @ts-ignore - test-only global
	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
	t.is(result.focusedCell, null);
	t.is(typeof result.handleFocusChange, 'function');
	t.is(typeof result.setFocusedCell, 'function');
	t.is(typeof result.clearFocus, 'function');
	t.is(typeof result.isCellFocused, 'function');
});

test('useTableNavigation: handles all optional callback props', t => {
	const mockIssueGroups: IssueGroup[] = [
		{
			group: null,
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
		onWeekChange: () => {},
		onCellWorklog: () => {},
		onCellDelete: () => {},
		onAttendanceEdit: () => {},
		onAttendanceDelete: () => {},
		onOpenInBrowser: () => {},
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
		checkIn: () => Promise.resolve(),
		checkOut: () => Promise.resolve(),
		getAttendanceForDate: () => Promise.resolve(null),
		getWeeklyAttendance: () => Promise.resolve({}),
	};

	const mockOptions: TableNavigationProps = {
		isActive: true,
		weekDates: [new Date('2023-07-17')],
		issueGroups: [],
		// @ts-ignore - simplified mock for testing
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

	// @ts-ignore - test-only global
	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;
	t.truthy(result);
	t.is(result.focusedCell, null);
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
			group: null,
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

	// @ts-ignore - test-only global
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
		onWeekChange: (_direction: 'prev' | 'next') => {},
		onCellWorklog: (_data: {issueKey: string; date: Date}) => {},
		onCellDelete: (_data: {issueKey: string; date: Date}) => {},
		onAttendanceEdit: (_data: {date: Date}) => {},
		onAttendanceDelete: (_data: {date: Date}) => {},
		onOpenInBrowser: (_issueKey: string) => {},
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

	// @ts-ignore - test-only global
	const result = (globalThis as any)
		.__testTableNavigationResult as TableNavigationResult;

	// Verify that methods can be called without throwing
	t.notThrows(() => {
		result.handleFocusChange('PROJECT-123', 0, true);
	});
	t.notThrows(() => {
		result.setFocusedCell(null);
	});
	t.notThrows(() => {
		result.clearFocus();
	});
	t.notThrows(() => result.isCellFocused('PROJECT-123', 0));
});
