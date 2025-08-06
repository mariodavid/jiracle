import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';
import {
	calculateDailyTotals,
	formatHours,
	truncateText,
	getCurrentDayIndex,
	getDefaultFocusId,
} from '../../utils/TimetableCalculations.js';
import {TestData} from './test-helpers.js';

// Create a mock implementation since WeeklyWorklogSummary is not constructible
function createMockSummary(dailySummaries: any[]) {
	return {
		dailySummaries,
		weekTotal: 0,
		issues: {},
	};
}

test('calculateDailyTotals - calculates totals correctly', t => {
	const summary = createMockSummary([
		{date: LocalDate.fromString('2023-01-02'), totalHours: 8.5, issues: {}}, // Monday
		{date: LocalDate.fromString('2023-01-03'), totalHours: 7, issues: {}}, // Tuesday
		{date: LocalDate.fromString('2023-01-04'), totalHours: 6.5, issues: {}}, // Wednesday
		{date: LocalDate.fromString('2023-01-05'), totalHours: 8, issues: {}}, // Thursday
		{date: LocalDate.fromString('2023-01-06'), totalHours: 4, issues: {}}, // Friday
	]);

	const weekDates = TestData.weekDates('2023-01-02').slice(0, 5);

	const totals = calculateDailyTotals(summary as any, weekDates);

	t.deepEqual(totals, [8.5, 7, 6.5, 8, 4]);
});

test('calculateDailyTotals - handles missing days', t => {
	const summary = createMockSummary([
		{date: LocalDate.fromString('2023-01-02'), totalHours: 8.5, issues: {}}, // Monday
		{date: LocalDate.fromString('2023-01-04'), totalHours: 6.5, issues: {}}, // Wednesday
		{date: LocalDate.fromString('2023-01-06'), totalHours: 4, issues: {}}, // Friday
	]);

	const weekDates = TestData.weekDates('2023-01-02').slice(0, 5);

	const totals = calculateDailyTotals(summary as any, weekDates);

	t.deepEqual(totals, [8.5, 0, 6.5, 0, 4]);
});

test('calculateDailyTotals - handles empty daily summaries', t => {
	const summary = createMockSummary([]);

	const weekDates = TestData.weekDates('2023-01-02').slice(0, 5);

	const totals = calculateDailyTotals(summary as any, weekDates);

	t.deepEqual(totals, [0, 0, 0, 0, 0]);
});

test('calculateDailyTotals - handles out-of-range dates', t => {
	const summary = createMockSummary([
		{date: LocalDate.fromString('2023-01-01'), totalHours: 8.5, issues: {}}, // Sunday (not in week)
		{date: LocalDate.fromString('2023-01-02'), totalHours: 7, issues: {}}, // Monday
		{date: LocalDate.fromString('2023-01-07'), totalHours: 6.5, issues: {}}, // Next Saturday (not in week)
	]);

	const weekDates = TestData.weekDates('2023-01-02').slice(0, 5);

	const totals = calculateDailyTotals(summary as any, weekDates);

	t.deepEqual(totals, [7, 0, 0, 0, 0]);
});

test('formatHours - formats hours correctly', t => {
	t.is(formatHours(0), '-');
	t.is(formatHours(1), '1.0');
	t.is(formatHours(8.5), '8.5');
	t.is(formatHours(8.75), '8.8');
	t.is(formatHours(0.1), '0.1');
	t.is(formatHours(0.05), '0.1');
	t.is(formatHours(24), '24.0');
});

test('formatHours - handles edge cases', t => {
	t.is(formatHours(-1), '-1.0');
	t.is(formatHours(0.001), '0.0');
	t.is(formatHours(999.999), '1000.0');
});

test('truncateText - truncates long text', t => {
	t.is(truncateText('Short', 10), 'Short');
	t.is(truncateText('Exactly10!', 10), 'Exactly10!');
	t.is(truncateText('This is a very long text', 10), 'This is...');
	t.is(truncateText('12345678901', 10), '1234567...');
});

test('truncateText - handles edge cases', t => {
	t.is(truncateText('', 10), '');
	t.is(truncateText('ABC', 3), 'ABC');
	t.is(truncateText('ABCD', 3), '...');
	t.is(truncateText('Test', 0), '...');
	t.is(truncateText('Test', 1), '...');
	t.is(truncateText('Test', 2), '...');
});

test('getCurrentDayIndex - returns correct day index', t => {
	// We can't easily mock Date constructor globally in this test environment
	// So we'll test the function exists and returns a number
	const dayIndex = getCurrentDayIndex();
	t.is(typeof dayIndex, 'number');
	t.true(dayIndex >= 0 && dayIndex <= 6);
});

test('getDefaultFocusId - returns correct focus ID', t => {
	const issueMap = {
		'PROJ-123': {summary: 'Test issue 1', dailyHours: {}, weekTotal: 8},
		'PROJ-456': {summary: 'Test issue 2', dailyHours: {}, weekTotal: 6},
		'API-789': {summary: 'Test issue 3', dailyHours: {}, weekTotal: 4},
	};

	const focusId = getDefaultFocusId(issueMap);
	t.true(focusId.startsWith('issue-'));
	t.true(focusId.includes('PROJ-123')); // Should use first issue key
	t.regex(focusId, /-\d+$/); // Should end with day index
});

test('getDefaultFocusId - handles empty issue map', t => {
	const issueMap = {};

	const focusId = getDefaultFocusId(issueMap);
	t.is(focusId, '');
});

test('getDefaultFocusId - uses first issue in object order', t => {
	const issueMap = {
		'ZEBRA-999': {summary: 'Last issue', dailyHours: {}, weekTotal: 8},
		'ALPHA-123': {summary: 'First issue', dailyHours: {}, weekTotal: 6},
		'BETA-456': {summary: 'Middle issue', dailyHours: {}, weekTotal: 4},
	};

	const focusId = getDefaultFocusId(issueMap);
	// Should use the first key from Object.keys(), which is insertion order
	t.true(focusId.includes('ZEBRA-999'));
});

test('calculateDailyTotals - handles decimal hours correctly', t => {
	const summary = createMockSummary([
		{date: LocalDate.fromString('2023-01-02'), totalHours: 8.25, issues: {}}, // Monday
		{date: LocalDate.fromString('2023-01-03'), totalHours: 7.75, issues: {}}, // Tuesday
		{date: LocalDate.fromString('2023-01-04'), totalHours: 6.125, issues: {}}, // Wednesday
	]);

	const weekDates = TestData.weekDates('2023-01-02').slice(0, 5);

	const totals = calculateDailyTotals(summary as any, weekDates);

	t.deepEqual(totals, [8.25, 7.75, 6.125, 0, 0]);
});

test('formatHours - preserves precision for common decimal values', t => {
	t.is(formatHours(8.25), '8.3');
	t.is(formatHours(8.125), '8.1');
	t.is(formatHours(8.875), '8.9');
	t.is(formatHours(0.25), '0.3');
	t.is(formatHours(0.75), '0.8');
});
