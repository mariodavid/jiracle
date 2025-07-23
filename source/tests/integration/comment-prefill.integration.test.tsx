import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {InlineWorklogForm} from '../../components/InlineWorklogForm.js';
import type {JiraConfig, WorklogEntry} from '../../jira/types.js';

// Mock worklog data for testing
const oldWorklogFromJuly: WorklogEntry[] = [
	{
		id: '1',
		issueId: '10001',
		author: {displayName: 'Test User', emailAddress: 'test@example.com'},
		comment: 'Old comment from July',
		started: '2025-07-23T09:00:00.000+0200',
		timeSpentSeconds: 3600,
	},
];

const recentWorklogFromAugust: WorklogEntry[] = [
	{
		id: '2',
		issueId: '10002',
		author: {displayName: 'Test User', emailAddress: 'test@example.com'},
		comment: 'Recent work on feature',
		started: '2025-08-20T09:00:00.000+0200',
		timeSpentSeconds: 3600,
	},
];

test('comment prefill respects reference date - excludes old worklogs', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
		defaultComment: 'Default fallback comment',
	};

	// Reference date: August 22nd, 2025 (30 days after July 23rd worklog)
	const selectedDate = new Date('2025-08-22T12:00:00.000Z');

	const {lastFrame} = render(
		<InlineWorklogForm
			issueKey="TEST-123"
			date={selectedDate}
			config={config}
			recentWorklogs={oldWorklogFromJuly}
			onSubmit={() => {}}
			onCancel={() => {}}
		/>,
	);

	// Should fall back to config default since July worklog is more than 7 days old from August 22nd
	t.true(lastFrame()?.includes('Default fallback comment') ?? false);
	t.false(lastFrame()?.includes('Old comment from July') ?? true);
});

test('comment prefill respects reference date - includes recent worklogs', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
		defaultComment: 'Default fallback comment',
	};

	// Reference date: August 22nd, 2025 (2 days after August 20th worklog)
	const selectedDate = new Date('2025-08-22T12:00:00.000Z');

	const {lastFrame} = render(
		<InlineWorklogForm
			issueKey="TEST-456"
			date={selectedDate}
			config={config}
			recentWorklogs={recentWorklogFromAugust}
			onSubmit={() => {}}
			onCancel={() => {}}
		/>,
	);

	// Should use recent comment since August 20th is within 7 days of August 22nd
	t.true(lastFrame()?.includes('Recent work on feature') ?? false);
	t.false(lastFrame()?.includes('Default fallback comment') ?? true);
});

test('comment prefill with configurable lookback days based on reference date', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 3, // Only 3 days lookback
		defaultComment: 'Default fallback comment',
	};

	// Reference date: August 22nd, 2025 (2 days after August 20th worklog)
	const selectedDate = new Date('2025-08-22T12:00:00.000Z');

	const {lastFrame} = render(
		<InlineWorklogForm
			issueKey="TEST-456"
			date={selectedDate}
			config={config}
			recentWorklogs={recentWorklogFromAugust}
			onSubmit={() => {}}
			onCancel={() => {}}
		/>,
	);

	// Should use recent comment since August 20th is within 3 days of August 22nd
	t.true(lastFrame()?.includes('Recent work on feature') ?? false);
});

test('comment prefill in edit mode uses explicit default regardless of reference date', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		commentPrefillDays: 7,
	};

	const selectedDate = new Date('2025-08-22T12:00:00.000Z');

	const {lastFrame} = render(
		<InlineWorklogForm
			issueKey="TEST-456"
			date={selectedDate}
			defaultComment="Edit mode comment"
			isEditMode={true}
			config={config}
			recentWorklogs={recentWorklogFromAugust}
			onSubmit={() => {}}
			onCancel={() => {}}
		/>,
	);

	// In edit mode, should use explicit default immediately without considering recent worklogs
	t.true(lastFrame()?.includes('Edit mode comment') ?? false);
	t.false(lastFrame()?.includes('Recent work on feature') ?? true);
});
