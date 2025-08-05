import test from 'ava';
import {MonthYear} from '../../domain/MonthYear.js';
import {LocalDate} from '../../domain/LocalDate.js';

test('MonthYear creation and validation', t => {
	// EXPLICIT TEST DATA
	const validYear = 2024;
	const validMonth = 3;
	const invalidMonth = 13;
	const invalidYear = 1800;

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const monthYear = new MonthYear(validYear, validMonth);
	t.is(monthYear.getYear(), validYear, 'Should store year correctly');
	t.is(monthYear.getMonth(), validMonth, 'Should store month correctly');

	// Invalid month should throw
	t.throws(
		() => new MonthYear(validYear, invalidMonth),
		{message: 'Invalid month: 13. Must be between 1 and 12'},
		'Should reject invalid month',
	);

	// Invalid year should throw
	t.throws(
		() => new MonthYear(invalidYear, validMonth),
		{message: 'Invalid year: 1800. Must be between 1900 and 2100'},
		'Should reject invalid year',
	);
});

test('MonthYear string parsing and formatting', t => {
	// EXPLICIT TEST DATA
	const validString = '2024-03';
	const invalidString = '2024-13';
	const malformedString = 'invalid';
	const expectedToString = '2024-03';
	const expectedDisplayName = 'March 2024';
	const expectedShortDisplayName = 'Mar 2024';

	// OPERATIONS
	const monthYear = MonthYear.fromString(validString);

	// SPECIFIC VALUE COMPARISONS
	t.is(monthYear.toString(), expectedToString, 'Should format as YYYY-MM');
	t.is(
		monthYear.getDisplayName(),
		expectedDisplayName,
		'Should show full month name',
	);
	t.is(
		monthYear.getShortDisplayName(),
		expectedShortDisplayName,
		'Should show abbreviated month',
	);

	// Invalid strings should throw
	t.throws(
		() => MonthYear.fromString(invalidString),
		{message: 'Invalid month: 13. Must be between 1 and 12'},
		'Should reject invalid month in string',
	);

	t.throws(
		() => MonthYear.fromString(malformedString),
		{message: 'Invalid month-year format: invalid. Expected YYYY-MM'},
		'Should reject malformed string',
	);
});

test('MonthYear date range calculation', t => {
	// EXPLICIT TEST DATA
	const marchYear = new MonthYear(2024, 3);
	const expectedStartDate = '2024-03-01';
	const expectedEndDate = '2024-03-31';

	// OPERATIONS
	const startDate = marchYear.getStartDate();
	const endDate = marchYear.getEndDate();

	// SPECIFIC VALUE COMPARISONS
	t.is(
		startDate.toISOString(),
		expectedStartDate,
		'Should calculate first day of month',
	);
	t.is(
		endDate.toISOString(),
		expectedEndDate,
		'Should calculate last day of month',
	);
});

test('MonthYear comparison operations', t => {
	// EXPLICIT TEST DATA
	const march2024 = new MonthYear(2024, 3);
	const april2024 = new MonthYear(2024, 4);
	const march2025 = new MonthYear(2025, 3);
	const anotherMarch2024 = new MonthYear(2024, 3);

	// SPECIFIC VALUE COMPARISONS
	t.true(march2024.isBefore(april2024), 'Should identify earlier month');
	t.true(march2024.isBefore(march2025), 'Should identify earlier year');
	t.true(april2024.isAfter(march2024), 'Should identify later month');
	t.true(march2025.isAfter(march2024), 'Should identify later year');
	t.true(march2024.equals(anotherMarch2024), 'Should identify equal months');
	t.false(march2024.equals(april2024), 'Should identify different months');
});

test('MonthYear current month detection', t => {
	// EXPLICIT TEST DATA
	const now = new Date();
	const currentMonthYear = MonthYear.current();
	const differentMonth = new MonthYear(2020, 1);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		currentMonthYear.getYear(),
		now.getFullYear(),
		'Should match current year',
	);
	t.is(
		currentMonthYear.getMonth(),
		now.getMonth() + 1,
		'Should match current month',
	);
	t.true(
		currentMonthYear.isCurrentMonth(),
		'Current month should be identified as current',
	);
	t.false(
		differentMonth.isCurrentMonth(),
		'Different month should not be current',
	);
});

test('MonthYear month arithmetic', t => {
	// EXPLICIT TEST DATA
	const startMonth = new MonthYear(2024, 3);
	const expectedNextMonth = new MonthYear(2024, 4);
	const expectedPreviousMonth = new MonthYear(2024, 2);
	const expectedNextYear = new MonthYear(2025, 3);

	// OPERATIONS
	const nextMonth = startMonth.addMonths(1);
	const previousMonth = startMonth.addMonths(-1);
	const nextYear = startMonth.addMonths(12);

	// SPECIFIC VALUE COMPARISONS
	t.true(nextMonth.equals(expectedNextMonth), 'Should add months correctly');
	t.true(
		previousMonth.equals(expectedPreviousMonth),
		'Should subtract months correctly',
	);
	t.true(nextYear.equals(expectedNextYear), 'Should handle year transitions');
});

test('MonthYear LocalDate integration', t => {
	// EXPLICIT TEST DATA
	const testDate = LocalDate.fromString('2024-03-15');
	const expectedMonthYear = new MonthYear(2024, 3);

	// OPERATIONS
	const monthYearFromDate = MonthYear.fromLocalDate(testDate);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		monthYearFromDate.equals(expectedMonthYear),
		'Should extract month/year from LocalDate',
	);
});

test('MonthYear plain object conversion', t => {
	// EXPLICIT TEST DATA
	const monthYear = new MonthYear(2024, 3);
	const expectedPlainObject = {year: 2024, month: 3};

	// OPERATIONS
	const plainObject = monthYear.toPlainObject();

	// SPECIFIC VALUE COMPARISONS
	t.deepEqual(
		plainObject,
		expectedPlainObject,
		'Should convert to plain object',
	);
});
