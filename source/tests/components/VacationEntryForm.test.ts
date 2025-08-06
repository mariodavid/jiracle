import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';

test('LocalDate - addDays works correctly for vacation date ranges', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-08-01');
	const expectedEndDate = LocalDate.fromString('2025-08-05');

	// OPERATIONS
	const calculatedEndDate = startDate.addDays(4);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		calculatedEndDate.equals(expectedEndDate),
		'Adding 4 days to Aug 1 should result in Aug 5',
	);
});

test('LocalDate - handles month boundary correctly', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-07-30');
	const expectedEndDate = LocalDate.fromString('2025-08-02');

	// OPERATIONS
	const calculatedEndDate = startDate.addDays(3);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		calculatedEndDate.equals(expectedEndDate),
		'Adding 3 days to July 30 should cross month boundary to Aug 2',
	);
});

test('LocalDate - handles year boundary correctly', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2024-12-30');
	const expectedEndDate = LocalDate.fromString('2025-01-02');

	// OPERATIONS
	const calculatedEndDate = startDate.addDays(3);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		calculatedEndDate.equals(expectedEndDate),
		'Adding 3 days to Dec 30 should cross year boundary to Jan 2',
	);
});

test('LocalDate - date comparison works correctly', t => {
	// EXPLICIT TEST DATA
	const date1 = LocalDate.fromString('2025-08-01');
	const date2 = LocalDate.fromString('2025-08-05');
	const date1Copy = LocalDate.fromString('2025-08-01');

	// OPERATIONS
	const isEarlier = date1.toISOString() < date2.toISOString();
	const isLater = date1.toISOString() > date2.toISOString();
	const isEqual = date1.equals(date1Copy);

	// SPECIFIC VALUE COMPARISONS
	t.true(isEarlier, 'Aug 1 should be earlier than Aug 5');
	t.false(isLater, 'Aug 1 should not be later than Aug 5');
	t.true(isEqual, 'Aug 1 should equal Aug 1');
});

test('LocalDate - weekend detection logic', t => {
	// EXPLICIT TEST DATA
	const monday = LocalDate.fromString('2025-08-04'); // Monday
	const tuesday = LocalDate.fromString('2025-08-05'); // Tuesday
	const saturday = LocalDate.fromString('2025-08-09'); // Saturday
	const sunday = LocalDate.fromString('2025-08-10'); // Sunday

	// OPERATIONS
	const mondayDayOfWeek = monday.toDate().getDay();
	const tuesdayDayOfWeek = tuesday.toDate().getDay();
	const saturdayDayOfWeek = saturday.toDate().getDay();
	const sundayDayOfWeek = sunday.toDate().getDay();

	// SPECIFIC VALUE COMPARISONS
	t.is(mondayDayOfWeek, 1, 'Monday should have day of week 1');
	t.is(tuesdayDayOfWeek, 2, 'Tuesday should have day of week 2');
	t.is(saturdayDayOfWeek, 6, 'Saturday should have day of week 6');
	t.is(sundayDayOfWeek, 0, 'Sunday should have day of week 0');

	// Weekend detection
	const mondayIsWeekend = mondayDayOfWeek === 0 || mondayDayOfWeek === 6;
	const saturdayIsWeekend = saturdayDayOfWeek === 0 || saturdayDayOfWeek === 6;
	const sundayIsWeekend = sundayDayOfWeek === 0 || sundayDayOfWeek === 6;

	t.false(mondayIsWeekend, 'Monday should not be weekend');
	t.true(saturdayIsWeekend, 'Saturday should be weekend');
	t.true(sundayIsWeekend, 'Sunday should be weekend');
});

test('vacation range calculation - single day', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-08-15');
	const endDate = LocalDate.fromString('2025-08-15');

	// OPERATIONS
	let count = 0;
	let currentDate = startDate;

	while (currentDate.toISOString() <= endDate.toISOString()) {
		count++;
		currentDate = currentDate.addDays(1);
	}

	// SPECIFIC VALUE COMPARISONS
	t.is(count, 1, 'Single day vacation should count as 1 day');
});

test('vacation range calculation - multi day', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-08-01');
	const endDate = LocalDate.fromString('2025-08-05');

	// OPERATIONS
	let count = 0;
	let currentDate = startDate;

	while (currentDate.toISOString() <= endDate.toISOString()) {
		count++;
		currentDate = currentDate.addDays(1);
	}

	// SPECIFIC VALUE COMPARISONS
	t.is(count, 5, 'Aug 1-5 vacation should count as 5 days');
});

test('vacation range calculation - crosses month boundary', t => {
	// EXPLICIT TEST DATA
	const startDate = LocalDate.fromString('2025-07-30');
	const endDate = LocalDate.fromString('2025-08-03');

	// OPERATIONS
	let count = 0;
	let currentDate = startDate;

	while (currentDate.toISOString() <= endDate.toISOString()) {
		count++;
		currentDate = currentDate.addDays(1);
	}

	// SPECIFIC VALUE COMPARISONS
	t.is(count, 5, 'July 30 - Aug 3 vacation should count as 5 days');
});
