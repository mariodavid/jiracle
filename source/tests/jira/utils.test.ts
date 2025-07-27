import test from 'ava';
import {
	getMostRecentCommentForIssue,
	getCommentWithPrefill,
} from '../../jira/utils.js';
import type {WorklogEntry, JiraConfig} from '../../jira/types.js';

test('getMostRecentCommentForIssue returns most recent non-empty comment within date range', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Old comment',
			started: '2024-01-01T09:00:00.000Z', // 22 days ago
			timeSpentSeconds: 3600,
		},
		{
			id: '2',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Recent comment',
			started: '2024-01-20T09:00:00.000Z', // 3 days ago
			timeSpentSeconds: 3600,
		},
		{
			id: '3',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Most recent comment',
			started: '2024-01-22T09:00:00.000Z', // 1 day ago
			timeSpentSeconds: 3600,
		},
	];

	// Mock current date to be 2024-01-23
	const originalDate = Date;
	global.Date = class extends Date {
		constructor(...args: unknown[]) {
			if (args.length === 0) {
				super('2024-01-23T12:00:00.000Z');
			} else {
				super(...(args as [string | number | Date]));
			}
		}
	} as any;

	const result = getMostRecentCommentForIssue(worklogs, 7);

	// Restore original Date
	global.Date = originalDate;

	t.is(result, 'Most recent comment');
});

test('getMostRecentCommentForIssue ignores comments outside date range', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Old comment',
			started: '2024-01-01T09:00:00.000Z', // 22 days ago
			timeSpentSeconds: 3600,
		},
	];

	// Mock current date to be 2024-01-23
	const originalDate = Date;
	global.Date = class extends Date {
		constructor(...args: unknown[]) {
			if (args.length === 0) {
				super('2024-01-23T12:00:00.000Z');
			} else {
				super(...(args as [string | number | Date]));
			}
		}
	} as any;

	const result = getMostRecentCommentForIssue(worklogs, 7);

	// Restore original Date
	global.Date = originalDate;

	t.is(result, undefined);
});

test('getMostRecentCommentForIssue ignores empty comments', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: undefined,
			started: '2024-01-22T09:00:00.000Z',
			timeSpentSeconds: 3600,
		},
		{
			id: '2',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: '',
			started: '2024-01-22T10:00:00.000Z',
			timeSpentSeconds: 3600,
		},
		{
			id: '3',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: '   ',
			started: '2024-01-22T11:00:00.000Z',
			timeSpentSeconds: 3600,
		},
	];

	// Mock current date to be 2024-01-23
	const originalDate = Date;
	global.Date = class extends Date {
		constructor(...args: unknown[]) {
			if (args.length === 0) {
				super('2024-01-23T12:00:00.000Z');
			} else {
				super(...(args as [string | number | Date]));
			}
		}
	} as any;

	const result = getMostRecentCommentForIssue(worklogs, 7);

	// Restore original Date
	global.Date = originalDate;

	t.is(result, undefined);
});

test('getMostRecentCommentForIssue returns undefined for empty worklogs', t => {
	const result = getMostRecentCommentForIssue([], 7);
	t.is(result, undefined);
});

test('getMostRecentCommentForIssue trims returned comment', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: '  Trimmed comment  ',
			started: '2024-01-22T09:00:00.000Z',
			timeSpentSeconds: 3600,
		},
	];

	// Mock current date to be 2024-01-23
	const originalDate = Date;
	global.Date = class extends Date {
		constructor(...args: unknown[]) {
			if (args.length === 0) {
				super('2024-01-23T12:00:00.000Z');
			} else {
				super(...(args as [string | number | Date]));
			}
		}
	} as any;

	const result = getMostRecentCommentForIssue(worklogs, 7);

	// Restore original Date
	global.Date = originalDate;

	t.is(result, 'Trimmed comment');
});

test('getMostRecentCommentForIssue uses custom reference date', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Old comment from July',
			started: '2025-07-23T09:00:00.000Z', // July 23rd
			timeSpentSeconds: 3600,
		},
		{
			id: '2',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Recent comment from August',
			started: '2025-08-20T09:00:00.000Z', // August 20th
			timeSpentSeconds: 3600,
		},
	];

	// Reference date: August 22nd (should look back 7 days to August 15th)
	const referenceDate = new Date('2025-08-22T12:00:00.000Z');
	const result = getMostRecentCommentForIssue(worklogs, 7, referenceDate);

	// Should find August 20th comment (within 7 days of August 22nd)
	// Should NOT find July 23rd comment (30 days old)
	t.is(result, 'Recent comment from August');
});

test('getMostRecentCommentForIssue with reference date excludes old worklogs', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Old comment from July',
			started: '2025-07-23T09:00:00.000Z', // July 23rd
			timeSpentSeconds: 3600,
		},
	];

	// Reference date: August 22nd (should look back 7 days to August 15th)
	const referenceDate = new Date('2025-08-22T12:00:00.000Z');
	const result = getMostRecentCommentForIssue(worklogs, 7, referenceDate);

	// July 23rd is more than 7 days before August 22nd, should return undefined
	t.is(result, undefined);
});

test('getCommentWithPrefill uses reference date for filtering', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Old comment from July',
			started: '2025-07-23T09:00:00.000Z', // July 23rd
			timeSpentSeconds: 3600,
		},
	];

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
		defaultComment: 'Fallback comment',
	};

	// Reference date: August 22nd
	const referenceDate = new Date('2025-08-22T12:00:00.000Z');

	const result = getCommentWithPrefill(config, 'TEST-123', worklogs, {
		isEditMode: false,
		referenceDate,
	});

	// Should fall back to config default since July worklog is too old
	t.is(result, 'Fallback comment');
});

test('getCommentWithPrefill finds recent comment with reference date', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Recent work on feature',
			started: '2025-08-20T09:00:00.000Z', // August 20th
			timeSpentSeconds: 3600,
		},
	];

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
		defaultComment: 'Fallback comment',
	};

	// Reference date: August 22nd
	const referenceDate = new Date('2025-08-22T12:00:00.000Z');

	const result = getCommentWithPrefill(config, 'TEST-123', worklogs, {
		isEditMode: false,
		referenceDate,
	});

	// Should use recent comment since it's within 7 days
	t.is(result, 'Recent work on feature');
});

test('getCommentWithPrefill respects configurable lookback days with reference date', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Comment from 10 days ago',
			started: '2025-08-12T09:00:00.000Z', // August 12th (10 days before Aug 22nd)
			timeSpentSeconds: 3600,
		},
	];

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 14, // 14 days should include August 12th
		defaultComment: 'Fallback comment',
		favorites: [
			{
				key: IssueKey.fromString('TEST-123'),
				commentPrefillDays: 5, // But issue-specific is only 5 days
			},
		],
	};

	// Reference date: August 22nd
	const referenceDate = new Date('2025-08-22T12:00:00.000Z');

	const result = getCommentWithPrefill(config, 'TEST-123', worklogs, {
		isEditMode: false,
		referenceDate,
	});

	// Should fall back to config since issue-specific is only 5 days (excludes Aug 12th)
	t.is(result, 'Fallback comment');
});

test('getCommentWithPrefill uses explicit default in edit mode regardless of reference date', t => {
	const worklogs: WorklogEntry[] = [
		{
			id: '1',
			issueId: '10001',
			author: {displayName: 'User', emailAddress: 'user@example.com'},
			comment: 'Recent comment',
			started: '2025-08-21T09:00:00.000Z',
			timeSpentSeconds: 3600,
		},
	];

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
	};

	const referenceDate = new Date('2025-08-22T12:00:00.000Z');

	const result = getCommentWithPrefill(config, 'TEST-123', worklogs, {
		isEditMode: true,
		explicitDefault: 'Edit mode comment',
		referenceDate,
	});

	// Should use explicit default in edit mode, ignoring recent worklogs
	t.is(result, 'Edit mode comment');
});
