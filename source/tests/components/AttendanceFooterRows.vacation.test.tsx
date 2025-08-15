import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {AttendanceFooterRows} from '../../components/AttendanceFooterRows.js';
import type {WeeklyAttendance} from '../../attendance/types.js';

// Test Data Pattern: Expected inputs and outputs
const testData = {
	weekDates: [
		new Date('2025-01-13'), // Monday - work day
		new Date('2025-01-14'), // Tuesday - vacation day
		new Date('2025-01-15'), // Wednesday - work day
		new Date('2025-01-16'), // Thursday - vacation day
		new Date('2025-01-17'), // Friday - work day
	],
	weeklyAttendance: {
		'2025-01-13': {
			date: '2025-01-13',
			type: 'WORK' as const,
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 60,
		},
		'2025-01-14': {
			date: '2025-01-14',
			type: 'VACATION' as const,
			breakMinutes: 0,
		},
		'2025-01-15': {
			date: '2025-01-15',
			type: 'WORK' as const,
			checkIn: '09:00',
			checkOut: '18:00',
			breakMinutes: 60,
		},
		'2025-01-16': {
			date: '2025-01-16',
			type: 'VACATION' as const,
			breakMinutes: 0,
		},
		'2025-01-17': {
			date: '2025-01-17',
			type: 'WORK' as const,
			checkIn: '08:30',
			checkOut: '17:30',
			breakMinutes: 60,
		},
	} as WeeklyAttendance,
	dailyLoggedHours: {
		'2025-01-13': 8,
		'2025-01-14': 0, // No worklog hours on vacation
		'2025-01-15': 8.5,
		'2025-01-16': 0, // No worklog hours on vacation
		'2025-01-17': 8,
	},
	expectedAttendanceHours: ['8', '-', '8', '-', '8'],
	expectedTotalAttendanceHours: '24.0',
};

test('AttendanceFooterRows shows dash (-) for vacation days', t => {
	// EXPLICIT TEST DATA (at the top)
	const {
		weekDates,
		weeklyAttendance,
		dailyLoggedHours,
		expectedAttendanceHours,
		expectedTotalAttendanceHours,
	} = testData;

	// OPERATIONS (in the middle)
	const {lastFrame} = render(
		<AttendanceFooterRows
			weekDates={weekDates}
			weeklyAttendance={weeklyAttendance}
			dailyLoggedHours={dailyLoggedHours}
		/>,
	);

	const output = lastFrame();

	// SPECIFIC VALUE COMPARISONS (at the bottom)
	t.truthy(output, 'Output should be defined');
	// Verify each day shows correct attendance values
	for (const [, expectedHours] of expectedAttendanceHours.entries()) {
		t.true(
			output!.includes(expectedHours),
			'Expected attendance hours not found in output',
		);
	}

	// Verify total attendance hours excludes vacation days
	t.true(
		output!.includes(expectedTotalAttendanceHours),
		'Expected total attendance hours not found in output',
	);

	// Verify "Attendance" label is present
	t.true(output!.includes('Attendance'), 'Should contain "Attendance" label');
});

test('AttendanceFooterRows handles holiday and sick days like vacation', t => {
	// EXPLICIT TEST DATA (at the top)
	const holidayAttendance: WeeklyAttendance = {
		'2025-01-13': {
			date: '2025-01-13',
			type: 'HOLIDAY',
			breakMinutes: 0,
		},
		'2025-01-14': {
			date: '2025-01-14',
			type: 'SICK',
			breakMinutes: 0,
		},
		'2025-01-15': {
			date: '2025-01-15',
			type: 'WORK',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 60,
		},
	};
	const weekDates = [
		new Date('2025-01-13'),
		new Date('2025-01-14'),
		new Date('2025-01-15'),
	];
	const dailyLoggedHours = {
		'2025-01-13': 0,
		'2025-01-14': 0,
		'2025-01-15': 8,
	};
	const expectedResults = ['-', '-', '8'];

	// OPERATIONS (in the middle)
	const {lastFrame} = render(
		<AttendanceFooterRows
			weekDates={weekDates}
			weeklyAttendance={holidayAttendance}
			dailyLoggedHours={dailyLoggedHours}
		/>,
	);

	const output = lastFrame();

	// SPECIFIC VALUE COMPARISONS (at the bottom)
	t.truthy(output, 'Output should be defined');
	// Verify holiday and sick days show dash
	for (const [, expected] of expectedResults.entries()) {
		t.true(
			output!.includes(expected),
			'Expected holiday/sick day format not found in output',
		);
	}
});

test('AttendanceFooterRows calculates working hours correctly for work days', t => {
	// EXPLICIT TEST DATA (at the top)
	const workDayAttendance: WeeklyAttendance = {
		'2025-01-13': {
			date: '2025-01-13',
			type: 'WORK',
			checkIn: '08:00',
			checkOut: '17:00', // 9 hours - 1 hour break = 8 hours
			breakMinutes: 60,
		},
		'2025-01-14': {
			date: '2025-01-14',
			type: 'WORK',
			checkIn: '09:30',
			checkOut: '18:00', // 8.5 hours - 0.5 hour break = 8 hours
			breakMinutes: 30,
		},
	};
	const weekDates = [new Date('2025-01-13'), new Date('2025-01-14')];
	const dailyLoggedHours = {
		'2025-01-13': 8,
		'2025-01-14': 8,
	};
	const expectedWorkingHours = ['8', '8'];

	// OPERATIONS (in the middle)
	const {lastFrame} = render(
		<AttendanceFooterRows
			weekDates={weekDates}
			weeklyAttendance={workDayAttendance}
			dailyLoggedHours={dailyLoggedHours}
		/>,
	);

	const output = lastFrame();

	// SPECIFIC VALUE COMPARISONS (at the bottom)
	t.truthy(output, 'Output should be defined');
	// Verify work days show calculated hours
	for (const [, expected] of expectedWorkingHours.entries()) {
		t.true(
			output!.includes(expected),
			'Expected working hours not found in output',
		);
	}
});
