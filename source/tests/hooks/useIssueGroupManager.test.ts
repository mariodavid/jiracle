import test from 'ava';
import {IssueGroupManager} from '../../services/IssueGroupManager.js';

test('IssueGroupManager - groups issues correctly via hook pattern', t => {
	const config = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const manager = new IssueGroupManager(config);

	const issues: Array<[string, any]> = [
		['TEST-123', {weekTotal: 5}],
		['TEST-456', {weekTotal: 3}],
	];

	const result = manager.groupIssuesByResolvedGroup(issues);

	t.true(Array.isArray(result));
	t.true(result.length > 0);
});

test('IssueGroupManager - handles undefined config via hook pattern', t => {
	const manager = new IssueGroupManager(undefined);

	const issues: Array<[string, any]> = [['TEST-123', {weekTotal: 5}]];

	const result = manager.groupIssuesByResolvedGroup(issues);

	t.true(Array.isArray(result));
	t.is(result.length, 1);
	t.is(result[0]?.group, undefined);
});
