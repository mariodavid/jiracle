import test from 'ava';
import {LocalDate} from './LocalDate.js';
import {WeekRange} from './WeekRange.js';

test('WeekRange.fromDate creates correct week range for Monday', t => {
	// Explicit test data
	const mondayDate = LocalDate.fromString('2024-01-15'); // Known Monday
	const expectedStart = LocalDate.fromString('2024-01-15');
	const expectedEnd = LocalDate.fromString('2024-01-21');

	// Operations
	const weekRange = WeekRange.fromDate(mondayDate);

	// Specific value comparisons
	t.true(weekRange.getStart().equals(expectedStart));
	t.true(weekRange.getEnd().equals(expectedEnd));
});

test('WeekRange.fromDate creates correct week range for Wednesday', t => {
	// Explicit test data
	const wednesdayDate = LocalDate.fromString('2024-01-17'); // Wednesday
	const expectedStart = LocalDate.fromString('2024-01-15'); // Previous Monday
	const expectedEnd = LocalDate.fromString('2024-01-21'); // Following Sunday

	// Operations
	const weekRange = WeekRange.fromDate(wednesdayDate);

	// Specific value comparisons
	t.true(weekRange.getStart().equals(expectedStart));
	t.true(weekRange.getEnd().equals(expectedEnd));
});

test('WeekRange.fromDate creates correct week range for Sunday', t => {
	// Explicit test data
	const sundayDate = LocalDate.fromString('2024-01-21'); // Sunday
	const expectedStart = LocalDate.fromString('2024-01-15'); // Monday of same week
	const expectedEnd = LocalDate.fromString('2024-01-21'); // Same Sunday

	// Operations
	const weekRange = WeekRange.fromDate(sundayDate);

	// Specific value comparisons
	t.true(weekRange.getStart().equals(expectedStart));
	t.true(weekRange.getEnd().equals(expectedEnd));
});

test('WeekRange.current creates week range for current date', t => {
	// Explicit test data
	const today = LocalDate.today();
	const expectedWeekRange = WeekRange.fromDate(today);

	// Operations
	const currentWeek = WeekRange.current();

	// Specific value comparisons
	t.true(currentWeek.equals(expectedWeekRange));
});

test('WeekRange.parse creates correct week range from string', t => {
	// Explicit test data
	const weekString = '2024-01-15/2024-01-21';
	const expectedStart = LocalDate.fromString('2024-01-15');
	const expectedEnd = LocalDate.fromString('2024-01-21');

	// Operations
	const weekRange = WeekRange.parse(weekString);

	// Specific value comparisons
	t.true(weekRange.getStart().equals(expectedStart));
	t.true(weekRange.getEnd().equals(expectedEnd));
});

test('WeekRange.parse throws error for invalid format', t => {
	// Explicit test data
	const invalidWeekString = '2024-01-15';
	const expectedErrorMessage =
		"Invalid week string format: 2024-01-15. Expected 'YYYY-MM-DD/YYYY-MM-DD'";

	// Operations and specific value comparisons
	const error = t.throws(() => WeekRange.parse(invalidWeekString), {
		instanceOf: Error,
	});
	t.is(error!.message, expectedErrorMessage);
});

test('WeekRange constructor throws error for invalid week range', t => {
	// Explicit test data
	const invalidWeekString = '2024-01-15/2024-01-20'; // Only 5 days later

	// Operations and specific value comparisons
	const error = t.throws(() => WeekRange.parse(invalidWeekString), {
		instanceOf: Error,
	});
	t.is(
		error!.message,
		'Invalid week range: end must be exactly 6 days after start, and start must be Monday',
	);
});

test('WeekRange constructor throws error when start is not Monday', t => {
	// Explicit test data
	const tuesdayString = '2024-01-16/2024-01-22'; // Tuesday to Monday

	// Operations and specific value comparisons
	const error = t.throws(() => WeekRange.parse(tuesdayString), {
		instanceOf: Error,
	});
	t.is(
		error!.message,
		'Invalid week range: end must be exactly 6 days after start, and start must be Monday',
	);
});

test('WeekRange.contains returns true for dates within week', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const mondayDate = LocalDate.fromString('2024-01-15');
	const wednesdayDate = LocalDate.fromString('2024-01-17');
	const sundayDate = LocalDate.fromString('2024-01-21');

	// Operations and specific value comparisons
	t.true(weekRange.contains(mondayDate));
	t.true(weekRange.contains(wednesdayDate));
	t.true(weekRange.contains(sundayDate));
});

test('WeekRange.contains returns false for dates outside week', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const previousSunday = LocalDate.fromString('2024-01-14');
	const nextMonday = LocalDate.fromString('2024-01-22');

	// Operations and specific value comparisons
	t.false(weekRange.contains(previousSunday));
	t.false(weekRange.contains(nextMonday));
});

test('WeekRange.previous returns previous week', t => {
	// Explicit test data
	const currentWeek = WeekRange.fromDate(LocalDate.fromString('2024-01-15')); // Jan 15-21
	const expectedPreviousStart = LocalDate.fromString('2024-01-08'); // Jan 8-14
	const expectedPreviousEnd = LocalDate.fromString('2024-01-14');

	// Operations
	const previousWeek = currentWeek.previous();

	// Specific value comparisons
	t.true(previousWeek.getStart().equals(expectedPreviousStart));
	t.true(previousWeek.getEnd().equals(expectedPreviousEnd));
});

test('WeekRange.next returns next week', t => {
	// Explicit test data
	const currentWeek = WeekRange.fromDate(LocalDate.fromString('2024-01-15')); // Jan 15-21
	const expectedNextStart = LocalDate.fromString('2024-01-22'); // Jan 22-28
	const expectedNextEnd = LocalDate.fromString('2024-01-28');

	// Operations
	const nextWeek = currentWeek.next();

	// Specific value comparisons
	t.true(nextWeek.getStart().equals(expectedNextStart));
	t.true(nextWeek.getEnd().equals(expectedNextEnd));
});

test('WeekRange navigation is bidirectional', t => {
	// Explicit test data
	const originalWeek = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));

	// Operations
	const navigatedWeek = originalWeek.next().previous();

	// Specific value comparisons
	t.true(navigatedWeek.equals(originalWeek));
});

test('WeekRange.getDays returns all 7 days of week', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const expectedDays = [
		LocalDate.fromString('2024-01-15'), // Monday
		LocalDate.fromString('2024-01-16'), // Tuesday
		LocalDate.fromString('2024-01-17'), // Wednesday
		LocalDate.fromString('2024-01-18'), // Thursday
		LocalDate.fromString('2024-01-19'), // Friday
		LocalDate.fromString('2024-01-20'), // Saturday
		LocalDate.fromString('2024-01-21'), // Sunday
	];

	// Operations
	const days = weekRange.getDays();

	// Specific value comparisons
	t.is(days.length, 7);
	for (let i = 0; i < 7; i++) {
		t.true(days[i]!.equals(expectedDays[i]!));
	}
});

test('WeekRange.getWeekdays returns Monday to Friday', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const expectedWeekdays = [
		LocalDate.fromString('2024-01-15'), // Monday
		LocalDate.fromString('2024-01-16'), // Tuesday
		LocalDate.fromString('2024-01-17'), // Wednesday
		LocalDate.fromString('2024-01-18'), // Thursday
		LocalDate.fromString('2024-01-19'), // Friday
	];

	// Operations
	const weekdays = weekRange.getWeekdays();

	// Specific value comparisons
	t.is(weekdays.length, 5);
	for (let i = 0; i < 5; i++) {
		t.true(weekdays[i]!.equals(expectedWeekdays[i]!));
	}
});

test('WeekRange.toDisplayString formats week range', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const expectedDisplayString = '2024-01-15 - 2024-01-21';

	// Operations
	const displayString = weekRange.toDisplayString();

	// Specific value comparisons
	t.is(displayString, expectedDisplayString);
});

test('WeekRange.toWeekString formats week range for parsing', t => {
	// Explicit test data
	const weekRange = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const expectedWeekString = '2024-01-15/2024-01-21';

	// Operations
	const weekString = weekRange.toWeekString();

	// Specific value comparisons
	t.is(weekString, expectedWeekString);
});

test('WeekRange.equals compares week ranges correctly', t => {
	// Explicit test data
	const weekRange1 = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const weekRange2 = WeekRange.fromDate(LocalDate.fromString('2024-01-17')); // Same week
	const weekRange3 = WeekRange.fromDate(LocalDate.fromString('2024-01-22')); // Different week

	// Operations and specific value comparisons
	t.true(weekRange1.equals(weekRange2));
	t.false(weekRange1.equals(weekRange3));
});

test('WeekRange.getWeekNumber calculates ISO week number correctly', t => {
	// Explicit test data
	const weekRange2024Week3 = WeekRange.fromDate(
		LocalDate.fromString('2024-01-15'),
	); // Week 3 of 2024
	const weekRange2024Week1 = WeekRange.fromDate(
		LocalDate.fromString('2024-01-01'),
	); // Week 1 of 2024
	const expectedWeek3 = 3;
	const expectedWeek1 = 1;

	// Operations
	const week3Number = weekRange2024Week3.getWeekNumber();
	const week1Number = weekRange2024Week1.getWeekNumber();

	// Specific value comparisons
	t.is(week3Number, expectedWeek3);
	t.is(week1Number, expectedWeek1);
});

test('WeekRange.getYear returns correct year', t => {
	// Explicit test data
	const weekRange2024 = WeekRange.fromDate(LocalDate.fromString('2024-01-15'));
	const weekRange2023 = WeekRange.fromDate(LocalDate.fromString('2023-12-25'));
	const expectedYear2024 = 2024;
	const expectedYear2023 = 2023;

	// Operations
	const year2024 = weekRange2024.getYear();
	const year2023 = weekRange2023.getYear();

	// Specific value comparisons
	t.is(year2024, expectedYear2024);
	t.is(year2023, expectedYear2023);
});

test('WeekRange handles year boundary correctly', t => {
	// Explicit test data - week spanning year boundary
	const newYearWeek = WeekRange.fromDate(LocalDate.fromString('2024-01-01')); // Monday Jan 1, 2024
	const expectedStart = LocalDate.fromString('2024-01-01'); // Monday
	const expectedEnd = LocalDate.fromString('2024-01-07'); // Sunday

	// Operations
	const startDate = newYearWeek.getStart();
	const endDate = newYearWeek.getEnd();

	// Specific value comparisons
	t.true(startDate.equals(expectedStart));
	t.true(endDate.equals(expectedEnd));
});

test('WeekRange handles leap year correctly', t => {
	// Explicit test data - week in leap year
	const leapYearWeek = WeekRange.fromDate(LocalDate.fromString('2024-02-26')); // Monday in leap year
	const expectedStart = LocalDate.fromString('2024-02-26');
	const expectedEnd = LocalDate.fromString('2024-03-03'); // Crosses into March

	// Operations
	const startDate = leapYearWeek.getStart();
	const endDate = leapYearWeek.getEnd();

	// Specific value comparisons
	t.true(startDate.equals(expectedStart));
	t.true(endDate.equals(expectedEnd));
});
