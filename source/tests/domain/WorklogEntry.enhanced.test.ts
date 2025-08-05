import test from 'ava';
import {WorklogEntry} from '../../domain/WorklogEntry.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {IssueKey} from '../../domain/IssueKey.js';

// TEST DATA
const VALID_ISSUE_KEY = IssueKey.fromString('TEST-123');
const VALID_DATE = LocalDate.fromString('2024-01-15');
const VALID_DURATION_SECONDS = 28_800; // 8 hours
const VALID_COMMENT = 'Development work';
const VALID_AUTHOR = {
	displayName: 'John Doe',
	emailAddress: 'john.doe@example.com',
};

const DIFFERENT_DATE = LocalDate.fromString('2024-01-20');
const DATE_RANGE_START = LocalDate.fromString('2024-01-10');
const DATE_RANGE_END = LocalDate.fromString('2024-01-20');
const DATE_OUTSIDE_RANGE = LocalDate.fromString('2024-01-25');

test('WorklogEntry.getTotalHours returns hours as decimal', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});
	const expectedHours = 8; // 28800 seconds = 8 hours

	const totalHours = worklogEntry.getTotalHours();

	t.is(totalHours, expectedHours);
});

test('WorklogEntry.isOnDate returns true for matching date', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isOnDate(VALID_DATE);

	t.true(result);
});

test('WorklogEntry.isOnDate returns false for different date', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isOnDate(DIFFERENT_DATE);

	t.false(result);
});

test('WorklogEntry.isInDateRange returns true for date within range', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE, // 2024-01-15, within range
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isInDateRange(DATE_RANGE_START, DATE_RANGE_END);

	t.true(result);
});

test('WorklogEntry.isInDateRange returns true for date on range boundary', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: DATE_RANGE_START, // Exactly on start boundary
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isInDateRange(DATE_RANGE_START, DATE_RANGE_END);

	t.true(result);
});

test('WorklogEntry.isInDateRange returns false for date outside range', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: DATE_OUTSIDE_RANGE, // 2024-01-25, outside range
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isInDateRange(DATE_RANGE_START, DATE_RANGE_END);

	t.false(result);
});

test('WorklogEntry.isByAuthor returns true for matching email', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.isByAuthor(VALID_AUTHOR.emailAddress);

	t.true(result);
});

test('WorklogEntry.isByAuthor handles case-insensitive email comparison', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});
	const uppercaseEmail = VALID_AUTHOR.emailAddress.toUpperCase();

	const result = worklogEntry.isByAuthor(uppercaseEmail);

	t.true(result);
});

test('WorklogEntry.isByAuthor returns false for different email', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});
	const differentEmail = 'different@example.com';

	const result = worklogEntry.isByAuthor(differentEmail);

	t.false(result);
});

test('WorklogEntry.hasComment returns true for non-empty comment', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.hasComment();

	t.true(result);
});

test('WorklogEntry.hasComment returns false for empty comment', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: '',
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.hasComment();

	t.false(result);
});

test('WorklogEntry.hasComment returns false for whitespace-only comment', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: '   \t\n   ',
		author: VALID_AUTHOR,
	});

	const result = worklogEntry.hasComment();

	t.false(result);
});

test('Enhanced methods work with existing WorklogEntry functionality', t => {
	const worklogEntry = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	// Test that enhanced methods work alongside existing functionality
	t.is(worklogEntry.getTotalHours(), worklogEntry.durationHours);
	t.is(worklogEntry.isOnDate(VALID_DATE), worklogEntry.isSameDay(VALID_DATE));
	t.is(
		worklogEntry.isByAuthor(VALID_AUTHOR.emailAddress),
		worklogEntry.isEditableBy(VALID_AUTHOR.emailAddress),
	);
});

test('Enhanced methods handle edge cases correctly', t => {
	// Test with minimal duration
	const minimalWorklog = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: 1, // 1 second
		comment: 'Minimal work',
		author: VALID_AUTHOR,
	});
	const expectedMinimalHours = 1 / 3600; // 1 second in hours

	t.is(minimalWorklog.getTotalHours(), expectedMinimalHours);

	// Test with zero-length comment after trimming
	const trimmedWorklog = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: '   ', // Will be trimmed to empty
		author: VALID_AUTHOR,
	});

	t.false(trimmedWorklog.hasComment());
});

test('Enhanced methods maintain immutability', t => {
	const originalWorklog = WorklogEntry.create({
		issueKey: VALID_ISSUE_KEY,
		date: VALID_DATE,
		duration: VALID_DURATION_SECONDS,
		comment: VALID_COMMENT,
		author: VALID_AUTHOR,
	});

	// Call enhanced methods - should not modify original
	originalWorklog.getTotalHours();
	originalWorklog.isOnDate(DIFFERENT_DATE);
	originalWorklog.isInDateRange(DATE_RANGE_START, DATE_RANGE_END);
	originalWorklog.isByAuthor('different@example.com');
	originalWorklog.hasComment();

	// Original should remain unchanged
	t.is(originalWorklog.duration, VALID_DURATION_SECONDS);
	t.is(originalWorklog.comment, VALID_COMMENT);
	t.true(originalWorklog.date.equals(VALID_DATE));
});
