import test from 'ava';
import {DateTime} from './DateTime.js';
import {LocalDate} from './LocalDate.js';
import {Time} from './Time.js';

test('DateTime.fromLocalDateAndTime creates DateTime from components', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('14:30');
	const expectedDateTimeString = '2024-01-15 14:30';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);

	// Specific value comparisons
	t.is(dateTime.getLocalDate().toISOString(), '2024-01-15');
	t.is(dateTime.getTimeOfDay().toString(), '14:30');
	t.is(dateTime.toDisplayString(), expectedDateTimeString);
});

test('DateTime.fromJiraApi parses Jira API timestamp format', t => {
	// Explicit test data
	const jiraTimestamp = '2024-01-15T14:30:00+0000';
	const expectedDate = '2024-01-15';
	const expectedTime = '14:30';

	// Operations
	const dateTime = DateTime.fromJiraApi(jiraTimestamp);

	// Specific value comparisons
	t.is(dateTime.getLocalDate().toISOString(), expectedDate);
	t.is(dateTime.getTimeOfDay().toString(), expectedTime);
});

test('DateTime.fromJiraApi parses Jira API timestamp with milliseconds', t => {
	// Explicit test data
	const jiraTimestamp = '2024-01-15T14:30:00.123+0000';
	const expectedDate = '2024-01-15';
	const expectedTime = '14:30';

	// Operations
	const dateTime = DateTime.fromJiraApi(jiraTimestamp);

	// Specific value comparisons
	t.is(dateTime.getLocalDate().toISOString(), expectedDate);
	t.is(dateTime.getTimeOfDay().toString(), expectedTime);
});

test('DateTime.fromJiraApi throws TypeError for invalid timestamp', t => {
	// Explicit test data
	const invalidTimestamp = 'invalid-timestamp';
	const expectedErrorMessage = 'Invalid Jira API timestamp: invalid-timestamp';

	// Operations & Specific value comparisons
	const error = t.throws(() => DateTime.fromJiraApi(invalidTimestamp), {
		instanceOf: TypeError,
	});
	t.is(error?.message, expectedErrorMessage);
});

test('DateTime.now creates current DateTime', t => {
	// Explicit test data
	const beforeCreation = new Date();

	// Operations
	const dateTime = DateTime.now();
	const afterCreation = new Date();

	// Specific value comparisons
	const dateTimeAsDate = dateTime.toDate();
	t.true(dateTimeAsDate >= beforeCreation);
	t.true(dateTimeAsDate <= afterCreation);
});

test('DateTime.fromDate creates DateTime from JavaScript Date', t => {
	// Explicit test data
	const jsDate = new Date('2024-01-15T14:30:00.000Z');
	const expectedDate = '2024-01-15';
	const expectedTime = '14:30';

	// Operations
	const dateTime = DateTime.fromDate(jsDate);

	// Specific value comparisons
	t.is(dateTime.getLocalDate().toISOString(), expectedDate);
	t.is(dateTime.getTimeOfDay().toString(), expectedTime);
});

test('DateTime.toJiraApiFormat returns correct format', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('14:30');
	const expectedFormat = '2024-01-15T14:30:00.000+0000';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);
	const jiraFormat = dateTime.toJiraApiFormat();

	// Specific value comparisons
	t.is(jiraFormat, expectedFormat);
});

test('DateTime.equals compares DateTime objects correctly', t => {
	// Explicit test data
	const date1 = LocalDate.fromString('2024-01-15');
	const time1 = Time.fromString('14:30');
	const date2 = LocalDate.fromString('2024-01-15');
	const time2 = Time.fromString('14:30');
	const date3 = LocalDate.fromString('2024-01-16');
	const time3 = Time.fromString('14:30');

	// Operations
	const dateTime1 = DateTime.fromLocalDateAndTime(date1, time1);
	const dateTime2 = DateTime.fromLocalDateAndTime(date2, time2);
	const dateTime3 = DateTime.fromLocalDateAndTime(date3, time3);

	// Specific value comparisons
	t.true(dateTime1.equals(dateTime2));
	t.false(dateTime1.equals(dateTime3));
});

test('DateTime.isBefore and isAfter compare DateTime objects', t => {
	// Explicit test data
	const earlierDate = LocalDate.fromString('2024-01-15');
	const laterDate = LocalDate.fromString('2024-01-16');
	const testTime = Time.fromString('14:30');

	// Operations
	const earlierDateTime = DateTime.fromLocalDateAndTime(earlierDate, testTime);
	const laterDateTime = DateTime.fromLocalDateAndTime(laterDate, testTime);

	// Specific value comparisons
	t.true(earlierDateTime.isBefore(laterDateTime));
	t.false(laterDateTime.isBefore(earlierDateTime));
	t.true(laterDateTime.isAfter(earlierDateTime));
	t.false(earlierDateTime.isAfter(laterDateTime));
});

test('DateTime.addHours adds hours correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('14:30');
	const hoursToAdd = 2;
	const expectedTime = '16:30';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);
	const newDateTime = dateTime.addHours(hoursToAdd);

	// Specific value comparisons
	t.is(newDateTime.getTimeOfDay().toString(), expectedTime);
	t.is(newDateTime.getLocalDate().toISOString(), '2024-01-15');
});

test('DateTime.addMinutes adds minutes correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('14:30');
	const minutesToAdd = 45;
	const expectedTime = '15:15';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);
	const newDateTime = dateTime.addMinutes(minutesToAdd);

	// Specific value comparisons
	t.is(newDateTime.getTimeOfDay().toString(), expectedTime);
	t.is(newDateTime.getLocalDate().toISOString(), '2024-01-15');
});

test('DateTime.addDays adds days correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('14:30');
	const daysToAdd = 3;
	const expectedDate = '2024-01-18';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);
	const newDateTime = dateTime.addDays(daysToAdd);

	// Specific value comparisons
	t.is(newDateTime.getLocalDate().toISOString(), expectedDate);
	t.is(newDateTime.getTimeOfDay().toString(), '14:30');
});

test('DateTime handles day rollover when adding hours', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const testTime = Time.fromString('23:30');
	const hoursToAdd = 2;
	const expectedDate = '2024-01-16';
	const expectedTime = '01:30';

	// Operations
	const dateTime = DateTime.fromLocalDateAndTime(testDate, testTime);
	const newDateTime = dateTime.addHours(hoursToAdd);

	// Specific value comparisons
	t.is(newDateTime.getLocalDate().toISOString(), expectedDate);
	t.is(newDateTime.getTimeOfDay().toString(), expectedTime);
});
