import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Tests for attendance integration and delta calculations

test('TimetableGrid shows attendance with working hours calculation', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '17:00',
				breakMinutes: 60,
			},
			'2024-10-15': {
				date: '2024-10-15',
				checkIn: '09:30',
				checkOut: '18:15',
				breakMinutes: 45,
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [],
		weekTotal: 0,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);

	// Wait for async effects to complete - this is how ink-testing-library handles it
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should show attendance row
	t.true(output.includes('Attendance'), 'Should show attendance row');

	// Should show working hours calculation: 8-17 on first line, 8 on second line (decimal hours)
	t.true(output.includes('8-17'), 'Should show Mon working hours 8-17');
	t.true(
		output.includes('8'),
		'Should show Mon working hours 8 (decimal hours)',
	);
	t.true(
		output.includes('9:30-18:15'),
		'Should show Tue working hours with minutes',
	);
});

test('TimetableGrid calculates working hours with different break times', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '17:00',
				breakMinutes: 30, // 30 minute break
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [],
		weekTotal: 0,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// 9 hours total - 0.5 hour break = 8.5 hours
	t.true(output.includes('8-17'), 'Should show time range 8-17');
	t.true(
		output.includes('8.5'),
		'Should show 8.5 with 30min break (decimal hours)',
	);
});

test('TimetableGrid uses config default break time when not specified', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '17:00',
				// No breakMinutes specified
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [],
		weekTotal: 0,
	};

	const config = {
		jiraUrl: 'test',
		username: 'test',
		apiToken: 'test',
		attendance: {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		},
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
		config,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should use config default break time (30 minutes)
	t.true(output.includes('8-17'), 'Should show time range 8-17');
	t.true(
		output.includes('8.5'),
		'Should use config default break time (decimal hours)',
	);
});

// Tests for Delta row functionality

test('TimetableGrid shows delta row with positive values in red', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '16:00', // 7.5 hours worked
				breakMinutes: 30,
				totalHours: 7.5,
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8, // Logged more than attended
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should show Delta row
	t.true(output.includes('Delta'), 'Should show Delta row');

	// Should show positive delta with + prefix (8.0 - 7.5 = +0.5)
	t.true(output.includes('+0.5'), 'Should show positive delta with + prefix');
});

test('TimetableGrid shows delta row with zero values in green', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '17:00', // 8.5 hours worked
				breakMinutes: 30,
				totalHours: 8.5,
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8.5, // Logged exactly same as attended
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8.5,
					},
				],
			},
		],
		weekTotal: 8.5,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);

	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should show Delta row
	t.true(output.includes('Delta'), 'Should show Delta row');

	// Should show zero delta (8.5 - 8.5 = 0.0)
	t.true(output.includes('0.0'), 'Should show zero delta');
});

test('TimetableGrid shows delta row with negative values in red', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '18:00', // 9.5 hours worked
				breakMinutes: 30,
				totalHours: 9.5,
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8, // Logged less than attended
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should show Delta row
	t.true(output.includes('Delta'), 'Should show Delta row');

	// Should show negative delta (8.0 - 9.5 = -1.5)
	t.true(output.includes('-1.5'), 'Should show negative delta');
});

test('TimetableGrid shows dash in delta row when no attendance data', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({}), // No attendance data
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8,
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;

	// Should show Delta row
	t.true(output.includes('Delta'), 'Should show Delta row');

	// Should show dash when no attendance data
	const lines = output.split('\n');
	const deltaLine = lines.find(line => line.includes('Delta'));
	t.truthy(deltaLine, 'Should find Delta row');
	if (deltaLine) {
		t.true(
			deltaLine.includes('-'),
			'Delta row should contain dash for missing data',
		);
	}
});

test('TimetableGrid shows attendance and delta rows at bottom after daily total', async t => {
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({
			'2024-10-14': {
				date: '2024-10-14',
				checkIn: '08:00',
				checkOut: '17:00',
				breakMinutes: 60,
				totalHours: 8,
			},
		}),
	};

	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8,
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		attendanceManager: mockAttendanceManager as any,
		attendanceRefreshKey: 1,
		favoriteIssues,
	};

	const {lastFrame, rerender} = render(
		React.createElement(TimetableGrid, props),
	);
	await InkTestHelpers.waitForEffects();
	rerender(React.createElement(TimetableGrid, props));
	await InkTestHelpers.waitForEffects();

	const output = lastFrame()!;
	const lines = output.split('\n');

	// Find the indices of different rows
	const worklogIndex = lines.findIndex(line => line.includes('Worklog'));
	const deltaIndex = lines.findIndex(line => line.includes('Delta'));
	const attendanceTimeIndex = lines.findIndex(
		(line, index) => line.includes('Attendance') && index < worklogIndex,
	); // First Attendance row (time ranges)

	// Verify row order: Attendance should come first, then Issues, then Worklog, then Attendance (hours), then Delta
	const attendanceHoursIndex = lines.findIndex(
		(line, index) => line.includes('Attendance') && index > worklogIndex,
	); // Second Attendance row (hours)

	t.true(attendanceTimeIndex !== -1, 'Should find Attendance time row');
	t.true(worklogIndex !== -1, 'Should find Worklog row');
	t.true(attendanceHoursIndex !== -1, 'Should find Attendance hours row');
	t.true(deltaIndex !== -1, 'Should find Delta row');

	t.true(
		attendanceTimeIndex < worklogIndex,
		'Attendance time row should come before Worklog',
	);
	t.true(
		worklogIndex < attendanceHoursIndex,
		'Worklog should come before Attendance hours',
	);
	t.true(
		attendanceHoursIndex < deltaIndex,
		'Attendance hours should come before Delta',
	);
});

test('TimetableGrid does not show delta row when no attendance manager', t => {
	const sampleData: WeeklyWorklogSummary = {
		weekStart: LocalDate.fromString('2024-10-14'),
		weekEnd: LocalDate.fromString('2024-10-20'),
		dailySummaries: [
			{
				date: LocalDate.fromString('2024-10-14'),
				totalHours: 8,
				issues: [
					{
						issueKey: 'TEST-123',
						issueSummary: 'Test work',
						hours: 8,
					},
				],
			},
		],
		weekTotal: 8,
	};

	const favoriteIssues = [
		{
			key: 'TEST-123',
			defaultTime: '4h',
		},
	];

	const props = {
		data: sampleData,
		isLoading: false,
		// No attendanceManager provided
		favoriteIssues,
	};

	const {lastFrame} = render(React.createElement(TimetableGrid, props));
	const output = lastFrame()!;

	// Should NOT show Delta row when no attendance manager
	t.false(
		output.includes('Delta'),
		'Should not show Delta row without attendance manager',
	);

	// Should still show Worklog
	t.true(output.includes('Worklog'), 'Should still show Worklog row');
});
