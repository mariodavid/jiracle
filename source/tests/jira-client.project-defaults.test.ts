import test from 'ava';
import {
	extractProjectKey,
	resolveDefaults,
	type JiraConfig,
} from '../jira-client.js';

test('extractProjectKey extracts project key from issue key', t => {
	t.is(extractProjectKey('JTS-2457'), 'JTS');
	t.is(extractProjectKey('GVV-123'), 'GVV');
	t.is(extractProjectKey('PROJ-9999'), 'PROJ');
	t.is(extractProjectKey('ABC-1'), 'ABC');
});

test('extractProjectKey returns null for invalid issue keys', t => {
	t.is(extractProjectKey('invalid'), null);
	t.is(extractProjectKey('JTS-'), null);
	t.is(extractProjectKey('-123'), null);
	t.is(extractProjectKey('jts-123'), null); // lowercase
	t.is(extractProjectKey(''), null);
});

test('resolveDefaults returns fallback values when no config provided', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
	};

	const result = resolveDefaults(config, 'JTS-123');

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

	const result = resolveDefaults(config, 'JTS-123');

	t.is(result.comment, 'Global comment');
	t.is(result.time, '4h');
	t.is(result.source.comment, 'global');
	t.is(result.source.time, 'global');
});

test('resolveDefaults uses project defaults when available', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		projects: [
			{
				key: 'JTS',
				defaultComment: 'JTS project work',
				defaultTime: '6h',
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

	t.is(result.comment, 'JTS project work');
	t.is(result.time, '6h');
	t.is(result.source.comment, 'project');
	t.is(result.source.time, 'project');
});

test('resolveDefaults uses issue defaults when available (highest priority)', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		projects: [
			{
				key: 'JTS',
				defaultComment: 'JTS project work',
				defaultTime: '6h',
			},
		],
		favorites: [
			{
				key: 'JTS-123',
				defaultComment: 'Specific issue work',
				defaultTime: '8h',
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

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
		projects: [
			{
				key: 'JTS',
				defaultComment: 'JTS project work',
				// No defaultTime in project
			},
		],
		favorites: [
			{
				key: 'JTS-123',
				// No defaultComment in favorite
				defaultTime: '8h',
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

	// Comment should come from project level
	t.is(result.comment, 'JTS project work');
	t.is(result.source.comment, 'project');

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
		projects: [
			{
				key: 'JTS',
				// No project comment or time
			},
		],
		favorites: [
			{
				key: 'JTS-123',
				// No issue defaults
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

	// Comment should come from global
	t.is(result.comment, 'Global comment');
	t.is(result.source.comment, 'global');

	// Time should fallback to default
	t.is(result.time, '1h');
	t.is(result.source.time, 'fallback');
});

test('resolveDefaults handles project without match', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		projects: [
			{
				key: 'DIFFERENT',
				defaultComment: 'Different project work',
				defaultTime: '6h',
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

	// Should use global defaults since JTS project not configured
	t.is(result.comment, 'Global comment');
	t.is(result.time, '4h');
	t.is(result.source.comment, 'global');
	t.is(result.source.time, 'global');
});

test('resolveDefaults handles partial project configuration', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global comment',
		defaultTime: '4h',
		projects: [
			{
				key: 'JTS',
				defaultTime: '6h',
				// No defaultComment
			},
		],
	};

	const result = resolveDefaults(config, 'JTS-123');

	// Comment should fall back to global
	t.is(result.comment, 'Global comment');
	t.is(result.source.comment, 'global');

	// Time should come from project
	t.is(result.time, '6h');
	t.is(result.source.time, 'project');
});
