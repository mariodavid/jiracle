import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';
import {groupVacationDates} from '../../components/VacationListView.js';
import type {Attendance} from '../../attendance/types.js';

test('groupVacationDates - groups consecutive vacation days', t => {
	// EXPLICIT TEST DATA
	const inputAttendance: Attendance[] = [
		{
			date: '2025-08-01',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2025-08-02',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2025-08-05',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
	];

	const expectedGroups = [
		{
			startDate: LocalDate.fromString('2025-08-01'),
			endDate: LocalDate.fromString('2025-08-02'),
			days: 2,
		},
		{
			startDate: LocalDate.fromString('2025-08-05'),
			endDate: LocalDate.fromString('2025-08-05'),
			days: 1,
		},
	];

	// OPERATIONS
	const result = groupVacationDates(inputAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.length, 2, 'Should create exactly 2 vacation groups');

	t.true(
		result[0]!.startDate.equals(expectedGroups[0]!.startDate),
		'First group start date should match',
	);
	t.true(
		result[0]!.endDate.equals(expectedGroups[0]!.endDate),
		'First group end date should match',
	);
	t.is(result[0]!.days, 2, 'First group should have 2 days');

	t.true(
		result[1]!.startDate.equals(expectedGroups[1]!.startDate),
		'Second group start date should match',
	);
	t.true(
		result[1]!.endDate.equals(expectedGroups[1]!.endDate),
		'Second group end date should match',
	);
	t.is(result[1]!.days, 1, 'Second group should have 1 day');
});

test('groupVacationDates - handles single vacation day', t => {
	// EXPLICIT TEST DATA
	const inputAttendance: Attendance[] = [
		{
			date: '2025-08-15',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
	];

	const expectedGroup = {
		startDate: LocalDate.fromString('2025-08-15'),
		endDate: LocalDate.fromString('2025-08-15'),
		days: 1,
	};

	// OPERATIONS
	const result = groupVacationDates(inputAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.length, 1, 'Should create exactly 1 vacation group');
	t.true(
		result[0]!.startDate.equals(expectedGroup.startDate),
		'Group start date should match',
	);
	t.true(
		result[0]!.endDate.equals(expectedGroup.endDate),
		'Group end date should match',
	);
	t.is(result[0]!.days, 1, 'Group should have 1 day');
});

test('groupVacationDates - filters out non-vacation attendance', t => {
	// EXPLICIT TEST DATA
	const inputAttendance: Attendance[] = [
		{
			date: '2025-08-01',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-08-02',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2025-08-03',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
	];

	// OPERATIONS
	const result = groupVacationDates(inputAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.length, 1, 'Should create exactly 1 vacation group');
	t.true(
		result[0]!.startDate.equals(LocalDate.fromString('2025-08-02')),
		'Should only include vacation day',
	);
});

test('groupVacationDates - returns empty array for no vacations', t => {
	// EXPLICIT TEST DATA
	const inputAttendance: Attendance[] = [
		{
			date: '2025-08-01',
			checkIn: '09:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
	];

	// OPERATIONS
	const result = groupVacationDates(inputAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.length, 0, 'Should return empty array when no vacations');
});

test('groupVacationDates - handles year boundary correctly', t => {
	// EXPLICIT TEST DATA
	const inputAttendance: Attendance[] = [
		{
			date: '2024-12-30',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2024-12-31',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2025-01-01',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
		{
			date: '2025-01-02',
			checkIn: 'VACATION',
			checkOut: 'VACATION',
			breakMinutes: 0,
		},
	];

	// OPERATIONS
	const result = groupVacationDates(inputAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		result.length,
		1,
		'Should create exactly 1 vacation group across year boundary',
	);
	t.true(
		result[0]!.startDate.equals(LocalDate.fromString('2024-12-30')),
		'Should start on Dec 30',
	);
	t.true(
		result[0]!.endDate.equals(LocalDate.fromString('2025-01-02')),
		'Should end on Jan 2',
	);
	t.is(result[0]!.days, 4, 'Should have 4 days total');
});
