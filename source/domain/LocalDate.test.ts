import test from 'ava';
import {LocalDate} from './LocalDate.js';

// EXPLICIT TEST DATA
const testDates = {
	mondayJan15: '2024-01-15', // Monday
	tuesdayJan16: '2024-01-16', // Tuesday
	sundayJan21: '2024-01-21', // Sunday (end of week)
	leapYearFeb29: '2024-02-29', // Leap year
	yearEnd: '2023-12-31',
	yearStart: '2024-01-01',
} as const;

const expectedWeekBoundaries = {
	jan15Week: {start: '2024-01-15', end: '2024-01-21'}, // Mon-Sun
	jan16Week: {start: '2024-01-15', end: '2024-01-21'}, // Same week as Monday
	yearEndWeek: {start: '2023-12-25', end: '2023-12-31'},
} as const;

const expectedArithmetic = {
	jan15Plus7Days: '2024-01-22',
	jan15Minus7Days: '2024-01-08',
	leapYearPlus1Day: '2024-03-01',
} as const;

test('fromString creates LocalDate from valid date string', t => {
	// OPERATIONS
	const date = LocalDate.fromString(testDates.mondayJan15);

	// SPECIFIC VALUE COMPARISONS
	t.is(date.toISOString(), testDates.mondayJan15);
});

test('today creates LocalDate for current date', t => {
	// EXPLICIT TEST DATA
	const expectedToday = new Date().toISOString().slice(0, 10);

	// OPERATIONS
	const today = LocalDate.today();

	// SPECIFIC VALUE COMPARISONS
	t.is(today.toISOString(), expectedToday);
});

test('fromDate creates LocalDate from Date object', t => {
	// EXPLICIT TEST DATA
	const inputDate = new Date('2024-01-15T10:30:00Z');

	// OPERATIONS
	const localDate = LocalDate.fromDate(inputDate);

	// SPECIFIC VALUE COMPARISONS
	t.is(localDate.toISOString(), testDates.mondayJan15);
});

test('equals compares LocalDate instances correctly', t => {
	// OPERATIONS
	const date1 = LocalDate.fromString(testDates.mondayJan15);
	const date2 = LocalDate.fromString(testDates.mondayJan15);
	const date3 = LocalDate.fromString(testDates.tuesdayJan16);

	// SPECIFIC VALUE COMPARISONS
	t.true(date1.equals(date2));
	t.false(date1.equals(date3));
});

test('addDays performs date arithmetic correctly', t => {
	// OPERATIONS
	const baseDate = LocalDate.fromString(testDates.mondayJan15);
	const plus7 = baseDate.addDays(7);
	const minus7 = baseDate.addDays(-7);

	// SPECIFIC VALUE COMPARISONS
	t.is(plus7.toISOString(), expectedArithmetic.jan15Plus7Days);
	t.is(minus7.toISOString(), expectedArithmetic.jan15Minus7Days);
});

test('addDays handles month boundaries correctly', t => {
	// OPERATIONS
	const leapDate = LocalDate.fromString(testDates.leapYearFeb29);
	const nextDay = leapDate.addDays(1);

	// SPECIFIC VALUE COMPARISONS
	t.is(nextDay.toISOString(), expectedArithmetic.leapYearPlus1Day);
});

test('getWeekStart returns Monday for any day in week', t => {
	// OPERATIONS
	const mondayStart = LocalDate.fromString(
		testDates.mondayJan15,
	).getWeekStart();
	const tuesdayStart = LocalDate.fromString(
		testDates.tuesdayJan16,
	).getWeekStart();
	const sundayStart = LocalDate.fromString(
		testDates.sundayJan21,
	).getWeekStart();

	// SPECIFIC VALUE COMPARISONS
	t.is(mondayStart.toISOString(), expectedWeekBoundaries.jan15Week.start);
	t.is(tuesdayStart.toISOString(), expectedWeekBoundaries.jan16Week.start);
	t.is(sundayStart.toISOString(), expectedWeekBoundaries.jan15Week.start);
});

test('getWeekEnd returns Sunday for any day in week', t => {
	// OPERATIONS
	const mondayEnd = LocalDate.fromString(testDates.mondayJan15).getWeekEnd();
	const tuesdayEnd = LocalDate.fromString(testDates.tuesdayJan16).getWeekEnd();
	const sundayEnd = LocalDate.fromString(testDates.sundayJan21).getWeekEnd();

	// SPECIFIC VALUE COMPARISONS
	t.is(mondayEnd.toISOString(), expectedWeekBoundaries.jan15Week.end);
	t.is(tuesdayEnd.toISOString(), expectedWeekBoundaries.jan16Week.end);
	t.is(sundayEnd.toISOString(), expectedWeekBoundaries.jan15Week.end);
});

test('getWeekStart handles year boundaries correctly', t => {
	// OPERATIONS
	const yearEndWeekStart = LocalDate.fromString(
		testDates.yearEnd,
	).getWeekStart();

	// SPECIFIC VALUE COMPARISONS
	t.is(
		yearEndWeekStart.toISOString(),
		expectedWeekBoundaries.yearEndWeek.start,
	);
});

test('toDisplayString formats date for UI display', t => {
	// EXPLICIT TEST DATA
	const expectedDisplay = '2024-01-15';

	// OPERATIONS
	const date = LocalDate.fromString(testDates.mondayJan15);
	const display = date.toDisplayString();

	// SPECIFIC VALUE COMPARISONS
	t.is(display, expectedDisplay);
});

test('fromString throws error for invalid date format', t => {
	// EXPLICIT TEST DATA
	const invalidFormats = ['invalid', '2024-13-01', '2024-01-32', '24-01-01'];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const invalid of invalidFormats) {
		t.throws(() => LocalDate.fromString(invalid), {
			message: /Invalid date format/,
		});
	}
});

test('immutability: addDays does not modify original instance', t => {
	// OPERATIONS
	const original = LocalDate.fromString(testDates.mondayJan15);
	const modified = original.addDays(7);

	// SPECIFIC VALUE COMPARISONS
	t.is(original.toISOString(), testDates.mondayJan15);
	t.is(modified.toISOString(), expectedArithmetic.jan15Plus7Days);
	t.false(original.equals(modified));
});

test('immutability: getWeekStart does not modify original instance', t => {
	// OPERATIONS
	const original = LocalDate.fromString(testDates.tuesdayJan16);
	const weekStart = original.getWeekStart();

	// SPECIFIC VALUE COMPARISONS
	t.is(original.toISOString(), testDates.tuesdayJan16);
	t.is(weekStart.toISOString(), expectedWeekBoundaries.jan16Week.start);
	t.false(original.equals(weekStart));
});

test('formatForJql returns date in YYYY-MM-DD format for JQL queries', t => {
	// EXPLICIT TEST DATA
	const expectedJqlFormat = '2024-01-15';

	// OPERATIONS
	const date = LocalDate.fromString(testDates.mondayJan15);
	const jqlFormat = date.formatForJql();

	// SPECIFIC VALUE COMPARISONS
	t.is(jqlFormat, expectedJqlFormat);
	t.is(jqlFormat, date.toISOString()); // Should be same as toISOString
});

test('fromDateUTC extracts UTC date from Date with time', t => {
	// EXPLICIT TEST DATA
	const inputDate = new Date('2024-01-15T23:59:59.999Z');
	const expectedDateString = '2024-01-15';

	// OPERATIONS
	const localDate = LocalDate.fromDateUTC(inputDate);

	// SPECIFIC VALUE COMPARISONS
	t.is(localDate.toISOString(), expectedDateString);
	t.is(localDate.formatForJql(), expectedDateString);
});
