import test from 'ava';
import {
	detectWorklogForEdit,
	findWorklogEntryForIssue,
} from '../../utils/worklog-detection.js';
import type {IssueWorklogEntry} from '../../domain/WeeklyWorklogSummary.js';

test('detectWorklogForEdit - no worklog entry', t => {
	const result = detectWorklogForEdit(undefined);

	t.false(result.hasWorklog);
	t.false(result.isEditable);
	t.is(result.worklogId, undefined);
	t.is(result.comment, undefined);
	t.is(result.timeSpent, undefined);
});

test('detectWorklogForEdit - zero hours worklog', t => {
	const entry: IssueWorklogEntry = {
		issueKey: 'TEST-123',
		issueSummary: 'Test issue',
		hours: 0,
	};

	const result = detectWorklogForEdit(entry);

	t.false(result.hasWorklog);
	t.false(result.isEditable);
	t.is(result.worklogId, undefined);
	t.is(result.comment, undefined);
	t.is(result.timeSpent, undefined);
});

test('detectWorklogForEdit - single editable worklog with ID', t => {
	const entry: IssueWorklogEntry = {
		issueKey: 'TEST-123',
		issueSummary: 'Test issue',
		hours: 2.5,
		worklogId: 'worklog-456',
		comment: 'Development work',
	};

	const result = detectWorklogForEdit(entry);

	t.true(result.hasWorklog);
	t.true(result.isEditable);
	t.is(result.worklogId, 'worklog-456');
	t.is(result.comment, 'Development work');
	t.is(result.timeSpent, '2h30m');
});

test('detectWorklogForEdit - single editable worklog with empty comment', t => {
	const entry: IssueWorklogEntry = {
		issueKey: 'TEST-123',
		issueSummary: 'Test issue',
		hours: 1,
		worklogId: 'worklog-456',
	};

	const result = detectWorklogForEdit(entry);

	t.true(result.hasWorklog);
	t.true(result.isEditable);
	t.is(result.worklogId, 'worklog-456');
	t.is(result.comment, '');
	t.is(result.timeSpent, '1h');
});

test('detectWorklogForEdit - aggregated worklog (not editable)', t => {
	const entry: IssueWorklogEntry = {
		issueKey: 'TEST-123',
		issueSummary: 'Test issue',
		hours: 4,
		// No worklogId means multiple worklogs aggregated
	};

	const result = detectWorklogForEdit(entry);

	t.true(result.hasWorklog);
	t.false(result.isEditable);
	t.is(result.worklogId, undefined);
	t.is(result.comment, undefined);
	t.is(result.timeSpent, undefined);
});

test('detectWorklogForEdit - time spent formatting', t => {
	const testCases = [
		{hours: 1, expected: '1h'},
		{hours: 0.5, expected: '30m'},
		{hours: 2.25, expected: '2h15m'},
		{hours: 0.25, expected: '15m'},
		{hours: 3, expected: '3h'},
		{hours: 0.1, expected: '6m'},
		{hours: 8.75, expected: '8h45m'},
	];

	for (const {hours, expected} of testCases) {
		const entry: IssueWorklogEntry = {
			issueKey: 'TEST-123',
			issueSummary: 'Test issue',
			hours,
			worklogId: 'worklog-456',
		};

		const result = detectWorklogForEdit(entry);
		t.is(
			result.timeSpent,
			expected,
			`Expected ${hours} hours to format as "${expected}"`,
		);
	}
});

test('findWorklogEntryForIssue - finds matching issue', t => {
	const dailyIssues: IssueWorklogEntry[] = [
		{
			issueKey: 'TEST-123',
			issueSummary: 'First issue',
			hours: 2,
		},
		{
			issueKey: 'TEST-456',
			issueSummary: 'Second issue',
			hours: 3,
			worklogId: 'worklog-789',
		},
		{
			issueKey: 'TEST-789',
			issueSummary: 'Third issue',
			hours: 1,
		},
	];

	const result = findWorklogEntryForIssue('TEST-456', dailyIssues);

	t.truthy(result);
	t.is(result!.issueKey, 'TEST-456');
	t.is(result!.issueSummary, 'Second issue');
	t.is(result!.hours, 3);
	t.is(result!.worklogId, 'worklog-789');
});

test('findWorklogEntryForIssue - returns undefined for non-existent issue', t => {
	const dailyIssues: IssueWorklogEntry[] = [
		{
			issueKey: 'TEST-123',
			issueSummary: 'First issue',
			hours: 2,
		},
	];

	const result = findWorklogEntryForIssue('NONEXISTENT-999', dailyIssues);

	t.is(result, undefined);
});

test('findWorklogEntryForIssue - empty array', t => {
	const result = findWorklogEntryForIssue('TEST-123', []);

	t.is(result, undefined);
});

test('detectWorklogForEdit - edge case with very small hours', t => {
	const entry: IssueWorklogEntry = {
		issueKey: 'TEST-123',
		issueSummary: 'Test issue',
		hours: 0.01,
		worklogId: 'worklog-456',
	};

	const result = detectWorklogForEdit(entry);

	t.true(result.hasWorklog);
	t.true(result.isEditable);
	t.is(result.timeSpent, '1m'); // Should round to at least 1 minute
});
