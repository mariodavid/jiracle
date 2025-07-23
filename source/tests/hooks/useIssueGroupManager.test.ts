import test from 'ava';
import {useIssueGroupManager} from '../../hooks/useIssueGroupManager.js';

test('useIssueGroupManager - hook provides grouping functionality', t => {
	const config = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const {groupIssuesByResolvedGroup} = useIssueGroupManager(config);

	t.is(typeof groupIssuesByResolvedGroup, 'function');
});

test('useIssueGroupManager - groups issues correctly', t => {
	const config = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	const {groupIssuesByResolvedGroup} = useIssueGroupManager(config);

	const issues: Array<[string, any]> = [
		['TEST-123', {weekTotal: 5}],
		['TEST-456', {weekTotal: 3}],
	];

	const result = groupIssuesByResolvedGroup(issues);

	t.true(Array.isArray(result));
	t.true(result.length > 0);
});

test('useIssueGroupManager - handles undefined config', t => {
	const {groupIssuesByResolvedGroup} = useIssueGroupManager(undefined);

	const issues: Array<[string, any]> = [['TEST-123', {weekTotal: 5}]];

	const result = groupIssuesByResolvedGroup(issues);

	t.true(Array.isArray(result));
	t.is(result.length, 1);
	t.is(result[0]?.group, undefined);
});
