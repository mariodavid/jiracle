import test from 'ava';
import {WorklogEntry} from '../../domain/WorklogEntry.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {WorklogEntry as ApiWorklogEntry} from '../../jira/types.js';
import {IssueKey} from '../../domain/IssueKey.js';

// TEST DATA: Expected inputs and outputs for all test scenarios
const validAuthor = {
	displayName: 'John Doe',
	emailAddress: 'john.doe@example.com',
};

const validCreateOptions = {
	issueKey: IssueKey.fromString('ABC-123'),
	duration: 3600, // 1 hour in seconds
	comment: 'Test comment',
	date: LocalDate.fromString('2024-01-15').toDate(),
	author: validAuthor,
};

const validApiEntry: ApiWorklogEntry = {
	id: 'worklog-123',
	issueId: 'issue-456',
	author: validAuthor,
	comment: 'API comment',
	started: '2024-01-15T10:00:00.000+0000',
	timeSpentSeconds: 7200, // 2 hours
};

test('WorklogEntry.create - creates valid worklog entry', t => {
	// OPERATIONS
	const worklog = WorklogEntry.create(validCreateOptions);

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.issueKey.toString(), 'ABC-123');
	t.is(worklog.duration, 3600);
	t.is(worklog.durationHours, 1);
	t.is(worklog.comment, 'Test comment');
	t.deepEqual(worklog.author, validAuthor);
	t.true(worklog.isTemporary);
	t.true(worklog.id.startsWith('temp-'));
});

test('WorklogEntry.create - normalizes issue key to uppercase', t => {
	// TEST DATA
	const options = {
		...validCreateOptions,
		issueKey: IssueKey.fromString('abc-123'),
	};

	// OPERATIONS
	const worklog = WorklogEntry.create(options);

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.issueKey.toString(), 'ABC-123');
});

test('WorklogEntry.create - trims whitespace from inputs', t => {
	// TEST DATA
	const options = {
		...validCreateOptions,
		issueKey: IssueKey.fromString('  ABC-123  '),
		comment: '  Test comment  ',
	};

	// OPERATIONS
	const worklog = WorklogEntry.create(options);

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.issueKey.toString(), 'ABC-123');
	t.is(worklog.comment, 'Test comment');
});

test('WorklogEntry.create - rounds duration to nearest second', t => {
	// TEST DATA
	const options = {...validCreateOptions, duration: 3600.7};

	// OPERATIONS
	const worklog = WorklogEntry.create(options);

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.duration, 3601);
});

test('WorklogEntry.create - validates issue key format', t => {
	// TEST DATA
	const invalidKeys = ['', '   ', 'INVALID', '123-ABC', 'AB_123'];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const invalidKey of invalidKeys) {
		const options = {...validCreateOptions, issueKey: invalidKey};
		const error = t.throws(() => WorklogEntry.create(options), {
			instanceOf: Error,
		});
		if (invalidKey === '' || invalidKey === '   ') {
			t.is(error!.message, 'Issue key is required and cannot be empty');
		} else {
			t.regex(error!.message, /invalid issue key format/i);
		}
	}
});

test('WorklogEntry.create - validates duration is positive', t => {
	// TEST DATA
	const invalidDurations = [0, -1, -3600];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const duration of invalidDurations) {
		const options = {...validCreateOptions, duration};
		const error = t.throws(() => WorklogEntry.create(options), {
			instanceOf: Error,
		});
		t.is(error!.message, 'Duration must be greater than 0');
	}
});

test('WorklogEntry.create - validates author is provided', t => {
	// TEST DATA
	const invalidAuthors = [
		undefined,
		{displayName: '', emailAddress: 'test@example.com'},
		{displayName: 'Test User', emailAddress: ''},
		{displayName: 'Test User'},
		{emailAddress: 'test@example.com'},
	];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const author of invalidAuthors) {
		const options = {...validCreateOptions, author: author as any};
		const error = t.throws(() => WorklogEntry.create(options), {
			instanceOf: Error,
		});
		t.is(error!.message, 'Author displayName and emailAddress are required');
	}
});

test('WorklogEntry.fromApiResponse - creates worklog from API data', t => {
	// OPERATIONS
	const worklog = WorklogEntry.fromApiResponse(validApiEntry, 'DEF-456');

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.id, 'worklog-123');
	t.is(worklog.issueKey.toString(), 'DEF-456');
	t.is(worklog.duration, 7200);
	t.is(worklog.durationHours, 2);
	t.is(worklog.comment, 'API comment');
	t.deepEqual(worklog.author, validAuthor);
	t.false(worklog.isTemporary);
	t.is(worklog.date.getFullYear(), 2024);
	t.is(worklog.date.getMonth(), 0); // January = 0
	t.is(worklog.date.getDate(), 15);
});

test('WorklogEntry.fromApiResponse - handles missing comment', t => {
	// TEST DATA
	const apiEntry = {...validApiEntry, comment: undefined};

	// OPERATIONS
	const worklog = WorklogEntry.fromApiResponse(apiEntry, 'ABC-123');

	// SPECIFIC VALUE COMPARISONS
	t.is(worklog.comment, '');
});

test('WorklogEntry.fromApiResponse - validates API entry has id', t => {
	// TEST DATA
	const apiEntry = {...validApiEntry, id: ''};

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const error = t.throws(
		() => WorklogEntry.fromApiResponse(apiEntry, 'ABC-123'),
		{instanceOf: Error},
	);
	t.is(error!.message, 'API worklog entry must have an id');
});

test('WorklogEntry.fromApiResponse - validates issue key is provided', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const error = t.throws(
		() => WorklogEntry.fromApiResponse(validApiEntry, ''),
		{
			instanceOf: Error,
		},
	);
	t.is(error!.message, 'Issue key is required and cannot be empty');
});

test('WorklogEntry.fromApiResponse - validates started date format', t => {
	// TEST DATA
	const apiEntry = {...validApiEntry, started: 'invalid-date'};

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const error = t.throws(
		() => WorklogEntry.fromApiResponse(apiEntry, 'ABC-123'),
		{instanceOf: TypeError},
	);
	t.is(error!.message, 'Invalid started date: invalid-date');
});

test('WorklogEntry - isEditableBy returns true for matching email', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(worklog.isEditableBy('john.doe@example.com'));
	t.true(worklog.isEditableBy('JOHN.DOE@EXAMPLE.COM')); // Case insensitive
});

test('WorklogEntry - isEditableBy returns false for different email', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.false(worklog.isEditableBy('jane.doe@example.com'));
	t.false(worklog.isEditableBy(''));
});

test('WorklogEntry - canBeDeletedBy delegates to isEditableBy', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(worklog.canBeDeletedBy('john.doe@example.com'));
	t.false(worklog.canBeDeletedBy('jane.doe@example.com'));
});

test('WorklogEntry - updateDuration creates new instance with updated duration', t => {
	// TEST DATA
	const originalWorklog = WorklogEntry.create(validCreateOptions);
	const newDuration = 7200; // 2 hours

	// OPERATIONS
	const updatedWorklog = originalWorklog.updateDuration(newDuration);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedWorklog.duration, 7200);
	t.is(updatedWorklog.durationHours, 2);
	t.is(originalWorklog.duration, 3600); // Original unchanged
	t.not(updatedWorklog, originalWorklog); // Different instances
	t.is(updatedWorklog.issueKey, originalWorklog.issueKey); // Other properties preserved
});

test('WorklogEntry - updateDuration validates positive duration', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const error = t.throws(() => worklog.updateDuration(0), {instanceOf: Error});
	t.is(error!.message, 'Duration must be greater than 0');
});

test('WorklogEntry - updateDuration rounds to nearest second', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS
	const updated = worklog.updateDuration(3600.7);

	// SPECIFIC VALUE COMPARISONS
	t.is(updated.duration, 3601);
});

test('WorklogEntry - updateComment creates new instance with updated comment', t => {
	// TEST DATA
	const originalWorklog = WorklogEntry.create(validCreateOptions);
	const newComment = 'Updated comment';

	// OPERATIONS
	const updatedWorklog = originalWorklog.updateComment(newComment);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedWorklog.comment, 'Updated comment');
	t.is(originalWorklog.comment, 'Test comment'); // Original unchanged
	t.not(updatedWorklog, originalWorklog); // Different instances
	t.is(updatedWorklog.issueKey, originalWorklog.issueKey); // Other properties preserved
});

test('WorklogEntry - updateComment trims whitespace', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS
	const updated = worklog.updateComment('  New comment  ');

	// SPECIFIC VALUE COMPARISONS
	t.is(updated.comment, 'New comment');
});

test('WorklogEntry - isSameDay compares dates correctly', t => {
	// TEST DATA
	const worklog = WorklogEntry.create({
		...validCreateOptions,
		date: LocalDate.fromString('2024-01-15').toDate(),
	});
	const sameDay = LocalDate.fromString('2024-01-15');
	const differentDay = LocalDate.fromString('2024-01-16');
	const otherWorklog = WorklogEntry.create({
		...validCreateOptions,
		date: sameDay.toDate(),
	});

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(worklog.isSameDay(sameDay.toDate()));
	t.true(worklog.isSameDay(otherWorklog));
	t.false(worklog.isSameDay(differentDay.toDate()));
});

test('WorklogEntry - toApiRequest formats request correctly', t => {
	// TEST DATA
	const worklog = WorklogEntry.create({
		...validCreateOptions,
		date: LocalDate.fromString('2024-01-15').toDate(),
		duration: 5400, // 1.5 hours
		comment: 'API request comment',
	});

	// OPERATIONS
	const apiRequest = worklog.toApiRequest();

	// SPECIFIC VALUE COMPARISONS
	t.is(apiRequest.timeSpent, '1h 30m');
	t.is(apiRequest.comment, 'API request comment');
	t.is(apiRequest.started, '2024-01-15T09:00:00.000+0000');
});

test('WorklogEntry - toApiRequest uses default comment when empty', t => {
	// TEST DATA
	const worklog = WorklogEntry.create({
		...validCreateOptions,
		comment: '',
	});

	// OPERATIONS
	const apiRequest = worklog.toApiRequest();

	// SPECIFIC VALUE COMPARISONS
	t.is(apiRequest.comment, 'Work logged via Jiracle');
});

test('WorklogEntry - formatDurationAsTimeSpent formats various durations', t => {
	// TEST DATA
	const testCases = [
		{seconds: 1800, expected: '30m'}, // 30 minutes
		{seconds: 3600, expected: '1h'}, // 1 hour
		{seconds: 5400, expected: '1h 30m'}, // 1.5 hours
		{seconds: 7200, expected: '2h'}, // 2 hours
		{seconds: 9000, expected: '2h 30m'}, // 2.5 hours
	];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const worklog = WorklogEntry.create({
			...validCreateOptions,
			duration: testCase.seconds,
		});
		t.is(worklog.formatDurationAsTimeSpent(), testCase.expected);
	}
});

test('WorklogEntry - equals compares worklogs correctly', t => {
	// TEST DATA
	const worklog1 = WorklogEntry.create(validCreateOptions);
	const worklog2 = WorklogEntry.create(validCreateOptions);
	const worklog3 = WorklogEntry.create({
		...validCreateOptions,
		comment: 'Different comment',
	});

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.false(worklog1.equals(worklog2)); // Different IDs (temp IDs are unique)
	t.false(worklog1.equals(worklog3)); // Different comments

	// Create from API to get predictable IDs
	const apiWorklog1 = WorklogEntry.fromApiResponse(validApiEntry, 'ABC-123');
	const apiWorklog2 = WorklogEntry.fromApiResponse(validApiEntry, 'ABC-123');
	t.true(apiWorklog1.equals(apiWorklog2)); // Same API data should be equal
});

test('WorklogEntry - toString formats correctly', t => {
	// TEST DATA
	const worklog = WorklogEntry.create({
		...validCreateOptions,
		issueKey: IssueKey.fromString('ABC-123'),
		duration: 5400, // 1.5 hours
		date: LocalDate.fromString('2024-01-15').toDate(),
	});

	// OPERATIONS
	const stringRepresentation = worklog.toString();

	// SPECIFIC VALUE COMPARISONS
	t.is(stringRepresentation, 'WorklogEntry(ABC-123, 1h 30m, 2024-01-15)');
});

test('WorklogEntry - getters return defensive copies', t => {
	// TEST DATA
	const worklog = WorklogEntry.create(validCreateOptions);

	// OPERATIONS
	const date1 = worklog.date;
	const date2 = worklog.date;
	const author1 = worklog.author;
	const author2 = worklog.author;

	// SPECIFIC VALUE COMPARISONS
	t.is(date1.getTime(), date2.getTime()); // Date equality via timestamp
	t.deepEqual(date1, date2); // Same values
	t.not(author1, author2); // Different instances
	t.deepEqual(author1, author2); // Same values

	// Verify mutations don't affect original
	// Note: LocalDate is immutable, so we test that the returned instances are separate
	author1.displayName = 'Modified';
	t.truthy(worklog.date); // Date should be present and unchanged
	t.not(worklog.author.displayName, 'Modified');
});
