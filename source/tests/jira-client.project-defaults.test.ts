import test from 'ava';
import {
	extractProjectKey,
	resolveDefaults,
	type JiraConfig,
} from '../jira-client.js';
import {IssueKey} from '../domain/IssueKey.js';

test('extractProjectKey extracts project key from issue key', t => {
	t.is(extractProjectKey(IssueKey.fromString('DEF-2457')), 'DEF');
	t.is(extractProjectKey(IssueKey.fromString('ABC-123')), 'ABC');
	t.is(extractProjectKey(IssueKey.fromString('PROJ-9999')), 'PROJ');
	t.is(extractProjectKey(IssueKey.fromString('ABC-1')), 'ABC');
});

test('extractProjectKey returns null for invalid issue keys', t => {
	t.is(extractProjectKey('invalid'), undefined);
	t.is(extractProjectKey('DEF-'), undefined);
	t.is(extractProjectKey('-123'), undefined);
	t.is(extractProjectKey('def-123'), undefined); // Lowercase
	t.is(extractProjectKey(''), undefined);
});

test('resolveDefaults returns fallback values when no config provided', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	t.is(result.comment, '');
	t.is(result.time, '1h');
	t.is(result.source.comment, 'fallback');
	t.is(result.source.time, 'fallback');
});

test('resolveDefaults uses global defaults when available', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	t.is(result.comment, 'Global comment');
	t.is(result.time, '4h');
	t.is(result.source.comment, 'global');
	t.is(result.source.time, 'global');
});

test('resolveDefaults uses issue defaults when available (highest priority)', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Group work',
				defaultTime: '6h',
			},
		],
		projects: [
			{
				key: 'DEF',
				groupId: 'dev',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				defaultComment: 'Specific issue work',
				defaultTime: '8h',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	t.is(result.comment, 'Specific issue work');
	t.is(result.time, '8h');
	t.is(result.source.comment, 'issue');
	t.is(result.source.time, 'issue');
});

test('resolveDefaults mixes sources correctly', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Group work',
				// No defaultTime in group
			},
		],
		projects: [
			{
				key: 'DEF',
				groupId: 'dev',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				// No defaultComment in favorite
				defaultTime: '8h',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Comment should come from group level
	t.is(result.comment, 'Group work');
	t.is(result.source.comment, 'group');

	// Time should come from issue level
	t.is(result.time, '8h');
	t.is(result.source.time, 'issue');
});

test('resolveDefaults falls back through hierarchy correctly', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		// No global time
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				// No issue defaults
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Comment should come from global
	t.is(result.comment, 'Global comment');
	t.is(result.source.comment, 'global');

	// Time should fallback to default
	t.is(result.time, '1h');
	t.is(result.source.time, 'fallback');
});

test('resolveDefaults handles project without group assignment', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		groups: [
			{
				id: 'other',
				name: 'Other Team',
				defaultComment: 'Other group work',
				defaultTime: '6h',
			},
		],
		projects: [
			{
				key: 'DIFFERENT',
				groupId: 'other',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Should use global defaults since DEF project has no group
	t.is(result.comment, 'Global comment');
	t.is(result.time, '4h');
	t.is(result.source.comment, 'global');
	t.is(result.source.time, 'global');
});

// Group functionality tests

test('resolveDefaults uses group defaults from issue group assignment', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Development work',
				defaultTime: '6h',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				groupId: 'dev',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	t.is(result.comment, 'Development work');
	t.is(result.source.comment, 'group');
	t.is(result.time, '6h');
	t.is(result.source.time, 'group');
	t.is(result.group?.id, 'dev');
	t.is(result.group?.name, 'Dev Team');
});

test('resolveDefaults uses group defaults from project group assignment', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'monitoring',
				name: 'Monitoring & Ops',
				defaultComment: 'Monitoring tasks',
				defaultTime: '2h',
			},
		],
		projects: [
			{
				key: 'MON',
				groupId: 'monitoring',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('MON-456'));

	t.is(result.comment, 'Monitoring tasks');
	t.is(result.source.comment, 'group');
	t.is(result.time, '2h');
	t.is(result.source.time, 'group');
	t.is(result.group?.id, 'monitoring');
	t.is(result.group?.name, 'Monitoring & Ops');
});

test('resolveDefaults prioritizes issue group over project group', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Development work',
				defaultTime: '6h',
			},
			{
				id: 'monitoring',
				name: 'Monitoring & Ops',
				defaultComment: 'Monitoring tasks',
				defaultTime: '2h',
			},
		],
		projects: [
			{
				key: 'DEF',
				groupId: 'dev',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				groupId: 'monitoring',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Should use issue group (monitoring), not project group (dev)
	t.is(result.comment, 'Monitoring tasks');
	t.is(result.source.comment, 'group');
	t.is(result.time, '2h');
	t.is(result.source.time, 'group');
	t.is(result.group?.id, 'monitoring');
});

test('resolveDefaults respects priority hierarchy with groups: issue > group > global', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '1h',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Group comment',
				defaultTime: '6h',
			},
		],
		projects: [
			{
				key: 'DEF',
				groupId: 'dev',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				defaultComment: 'Issue comment',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Comment: issue wins
	t.is(result.comment, 'Issue comment');
	t.is(result.source.comment, 'issue');

	// Time: should fall back to group (no issue time defined)
	t.is(result.time, '6h');
	t.is(result.source.time, 'group');
});

test('resolveDefaults falls back through group hierarchy correctly', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '8h',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Group comment',
				// No defaultTime defined
			},
		],
		projects: [
			{
				key: 'DEF',
				groupId: 'dev',
				// Project only has group assignment
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				// No issue defaults defined
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Comment: should use group
	t.is(result.comment, 'Group comment');
	t.is(result.source.comment, 'group');

	// Time: should fall back to global (group doesn't have defaultTime)
	t.is(result.time, '8h');
	t.is(result.source.time, 'global');
});

test('resolveDefaults handles invalid group references gracefully', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		groups: [
			{
				id: 'existing',
				name: 'Existing Group',
				defaultComment: 'Group comment',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				groupId: 'nonexistent',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Should fall back to global since group doesn't exist
	t.is(result.comment, 'Global comment');
	t.is(result.source.comment, 'global');
	t.is(result.time, '4h');
	t.is(result.source.time, 'global');
	t.is(result.group, undefined);
});

test('resolveDefaults works with groups containing only partial defaults', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '2h',
		groups: [
			{
				id: 'partial',
				name: 'Partial Group',
				defaultTime: '8h',
				// No defaultComment
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				groupId: 'partial',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	// Comment: should fall back to global (group doesn't have defaultComment)
	t.is(result.comment, 'Global comment');
	t.is(result.source.comment, 'global');

	// Time: should use group
	t.is(result.time, '8h');
	t.is(result.source.time, 'group');
	t.is(result.group?.id, 'partial');
});

test('resolveDefaults includes group desiredAmount in result', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Development work',
				defaultTime: '6h',
				desiredAmount: 25,
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('DEF-123'),
				groupId: 'dev',
			},
		],
	};

	const result = resolveDefaults(config, IssueKey.fromString('DEF-123'));

	t.is(result.group?.desiredAmount, 25);
});
