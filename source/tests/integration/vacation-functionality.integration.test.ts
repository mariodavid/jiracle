import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';
import {groupVacationDates} from '../../components/VacationListView.js';
import type {Attendance} from '../../attendance/types.js';

test('vacation integration - basic grouping functionality', t => {
	// EXPLICIT TEST DATA
	const inputData: Attendance[] = [
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
	];

	const expectedStartDate = LocalDate.fromString('2025-08-01');
	const expectedEndDate = LocalDate.fromString('2025-08-02');

	// OPERATIONS
	const result = groupVacationDates(inputData);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.length, 1, 'Should create one vacation group');
	t.true(
		result[0]!.startDate.equals(expectedStartDate),
		'Start date should match expected',
	);
	t.true(
		result[0]!.endDate.equals(expectedEndDate),
		'End date should match expected',
	);
	t.is(result[0]!.getDurationDays(), 2, 'Should have 2 days');
});

test('vacation integration - date range calculation', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-08-01');
	const endDate = LocalDate.fromString('2025-08-05');

	// OPERATIONS
	let dayCount = 0;
	let currentDate = startDate;

	while (currentDate.isBeforeOrEqual(endDate)) {
		dayCount++;
		currentDate = currentDate.addDays(1);
	}

	// SPECIFIC VALUE COMPARISONS
	t.is(dayCount, 5, 'Aug 1-5 should be 5 days total');
});

test('vacation integration - weekend detection', t => {
	// EXPLICIT TEST DATA
	const monday = LocalDate.fromString('2025-08-04');
	const saturday = LocalDate.fromString('2025-08-09');

	// OPERATIONS
	const mondayDayOfWeek = monday.toDate().getDay();
	const saturdayDayOfWeek = saturday.toDate().getDay();

	// SPECIFIC VALUE COMPARISONS
	t.is(mondayDayOfWeek, 1, 'Monday should be day 1');
	t.is(saturdayDayOfWeek, 6, 'Saturday should be day 6');
});
