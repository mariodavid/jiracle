import test from 'ava';
import {IssueGroupManager} from '../../services/IssueGroupManager.js';
import type {JiraConfig} from '../../jira-client.js';

test('IssueGroupManager - groups issues by resolved groups', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'frontend',
				name: 'Frontend Team',
				desiredAmount: 20,
			},
			{
				id: 'backend',
				name: 'Backend Team',
				desiredAmount: 25,
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'frontend',
			},
		],
		favorites: [
			{
				key: 'PROJ-123',
				groupId: 'backend',
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [
		['PROJ-123', {weekTotal: 8}],
		['PROJ-456', {weekTotal: 6}],
		['OTHER-789', {weekTotal: 4}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 3);

	// Backend group (PROJ-123 has explicit backend assignment via favorites)
	const backendGroup = groups.find(g => g.group?.id === 'backend');
	t.truthy(backendGroup);
	t.is(backendGroup!.issues.length, 1);
	t.is(backendGroup!.issues[0]?.[0], 'PROJ-123');
	t.is(backendGroup!.totalHours, 8);
	t.is(backendGroup!.group!.name, 'Backend Team');

	// Frontend group (PROJ-456 inherits from project default)
	const frontendGroup = groups.find(g => g.group?.id === 'frontend');
	t.truthy(frontendGroup);
	t.is(frontendGroup!.issues.length, 1);
	t.is(frontendGroup!.issues[0]?.[0], 'PROJ-456');
	t.is(frontendGroup!.totalHours, 6);
	t.is(frontendGroup!.group!.name, 'Frontend Team');

	// Ungrouped issues
	const ungroupedGroup = groups.find(g => g.group === null);
	t.truthy(ungroupedGroup);
	t.is(ungroupedGroup!.issues.length, 1);
	t.is(ungroupedGroup!.issues[0]?.[0], 'OTHER-789');
	t.is(ungroupedGroup!.totalHours, 4);
});

test('IssueGroupManager - handles null config gracefully', t => {
	const manager = new IssueGroupManager(null);
	const issues: Array<[string, any]> = [
		['PROJ-123', {weekTotal: 8}],
		['PROJ-456', {weekTotal: 6}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 1);
	t.is(groups[0]?.group, null);
	t.is(groups[0]?.issues.length, 2);
	t.is(groups[0]?.totalHours, 14);
});

test('IssueGroupManager - sorts groups by name', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'zebra',
				name: 'Zebra Team',
				desiredAmount: 20,
			},
			{
				id: 'alpha',
				name: 'Alpha Team',
				desiredAmount: 25,
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'zebra',
			},
			{
				key: 'TEST',
				groupId: 'alpha',
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [
		['PROJ-123', {weekTotal: 8}],
		['TEST-456', {weekTotal: 6}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 2);
	t.is(groups[0]?.group?.name, 'Alpha Team');
	t.is(groups[1]?.group?.name, 'Zebra Team');
});

test('IssueGroupManager - sorts issues within groups by key', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'team',
				name: 'Team',
				desiredAmount: 20,
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'team',
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [
		['PROJ-456', {weekTotal: 6}],
		['PROJ-123', {weekTotal: 8}],
		['PROJ-789', {weekTotal: 4}],
		['PROJ-12', {weekTotal: 2}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 1);
	const sortedKeys = groups[0]?.issues.map(([key]) => key);
	t.deepEqual(sortedKeys, ['PROJ-12', 'PROJ-123', 'PROJ-456', 'PROJ-789']);
});

test('IssueGroupManager - handles different project prefixes in sorting', t => {
	const manager = new IssueGroupManager(null);
	const issues: Array<[string, any]> = [
		['ZEBRA-456', {weekTotal: 6}],
		['ALPHA-123', {weekTotal: 8}],
		['BETA-789', {weekTotal: 4}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 1);
	const sortedKeys = groups[0]?.issues.map(([key]) => key);
	t.deepEqual(sortedKeys, ['ALPHA-123', 'BETA-789', 'ZEBRA-456']);
});

test('IssueGroupManager - calculates total hours correctly', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'team',
				name: 'Team',
				desiredAmount: 20,
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'team',
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [
		['PROJ-123', {weekTotal: 8.5}],
		['PROJ-456', {weekTotal: 6.25}],
		['PROJ-789', {weekTotal: 0}],
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 1);
	t.is(groups[0]?.totalHours, 14.75);
});

test('IssueGroupManager - handles empty issues array', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'team',
				name: 'Team',
				desiredAmount: 20,
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 0);
});

test('IssueGroupManager - handles issues with malformed keys', t => {
	const manager = new IssueGroupManager(null);
	const issues: Array<[string, any]> = [
		['PROJ', {weekTotal: 8}], // No number
		['123', {weekTotal: 6}], // No project
		['PROJ-ABC', {weekTotal: 4}], // Non-numeric part
		['PROJ-123', {weekTotal: 2}], // Valid
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 1);
	t.is(groups[0]?.issues.length, 4);

	// Should handle malformed keys gracefully in sorting
	const sortedKeys = groups[0]?.issues.map(([key]) => key);
	t.truthy(sortedKeys);
	t.truthy(sortedKeys!.includes('PROJ-123'));
	t.truthy(sortedKeys!.includes('PROJ'));
});

test('IssueGroupManager - preserves ungrouped issues at the end', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test',
		apiToken: 'test',
		groups: [
			{
				id: 'team',
				name: 'Team',
				desiredAmount: 20,
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'team',
			},
		],
	};

	const manager = new IssueGroupManager(config);
	const issues: Array<[string, any]> = [
		['PROJ-123', {weekTotal: 8}], // Grouped
		['OTHER-456', {weekTotal: 6}], // Ungrouped
		['PROJ-789', {weekTotal: 4}], // Grouped
	];

	const groups = manager.groupIssuesByResolvedGroup(issues);

	t.is(groups.length, 2);
	t.is(groups[0]?.group?.name, 'Team'); // Grouped comes first
	t.is(groups[1]?.group, null); // Ungrouped comes last
	t.is(groups[1]?.issues.length, 1);
	t.is(groups[1]?.issues[0]?.[0], 'OTHER-456');
});
