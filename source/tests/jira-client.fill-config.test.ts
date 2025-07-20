import test from 'ava';
import {
	resolveAlignRemainingStrategy,
	validateDefaultStories,
	type JiraConfig,
	type DefaultStory,
} from '../jira-client.js';

test('resolveAlignRemainingStrategy - uses fill.alignRemainingStrategy with highest priority', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'test',
		alignRemainingStrategy: 'even',
		fill: {
			alignRemainingStrategy: 'proportional',
		},
	};

	const result = resolveAlignRemainingStrategy(config);
	t.is(result, 'proportional');
});

test('resolveAlignRemainingStrategy - falls back to root alignRemainingStrategy', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'test',
		alignRemainingStrategy: 'proportional',
	};

	const result = resolveAlignRemainingStrategy(config);
	t.is(result, 'proportional');
});

test('resolveAlignRemainingStrategy - defaults to even when nothing configured', t => {
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'test',
	};

	const result = resolveAlignRemainingStrategy(config);
	t.is(result, 'even');
});

test('validateDefaultStories - valid configuration with percentages summing to 100', t => {
	const stories: DefaultStory[] = [
		{issueKey: 'PROJECT-123', percentage: 60},
		{issueKey: 'PROJECT-456', percentage: 30},
		{issueKey: 'PROJECT-789', percentage: 10},
	];

	const result = validateDefaultStories(stories);
	t.true(result.valid);
	t.is(result.error, undefined);
});

test('validateDefaultStories - invalid when percentages do not sum to 100', t => {
	const stories: DefaultStory[] = [
		{issueKey: 'PROJECT-123', percentage: 60},
		{issueKey: 'PROJECT-456', percentage: 30},
	];

	const result = validateDefaultStories(stories);
	t.false(result.valid);
	t.true(result.error?.includes('must sum to 100%'));
});

test('validateDefaultStories - invalid when duplicate issue keys exist', t => {
	const stories: DefaultStory[] = [
		{issueKey: 'PROJECT-123', percentage: 50},
		{issueKey: 'PROJECT-123', percentage: 50},
	];

	const result = validateDefaultStories(stories);
	t.false(result.valid);
	t.true(result.error?.includes('Duplicate issue keys'));
});

test('validateDefaultStories - invalid when percentage is zero or negative', t => {
	const stories: DefaultStory[] = [
		{issueKey: 'PROJECT-123', percentage: -10},
		{issueKey: 'PROJECT-456', percentage: 110},
	];

	const result = validateDefaultStories(stories);
	t.false(result.valid);
	// Should catch the negative percentage since the sum is 100%
	t.true(
		result.error?.includes(
			'Invalid percentage for PROJECT-123: -10%. Must be between 0 and 100.',
		),
	);
});

test('validateDefaultStories - invalid when percentage exceeds 100', t => {
	const stories: DefaultStory[] = [{issueKey: 'PROJECT-123', percentage: 150}];

	const result = validateDefaultStories(stories);
	t.false(result.valid);
	t.true(
		result.error?.includes(
			'Default stories percentages must sum to 100%, got 150%',
		),
	);
});

test('validateDefaultStories - invalid when no stories provided', t => {
	const stories: DefaultStory[] = [];

	const result = validateDefaultStories(stories);
	t.false(result.valid);
	t.true(result.error?.includes('No default stories configured'));
});

test('validateDefaultStories - handles floating point precision correctly', t => {
	const stories: DefaultStory[] = [
		{issueKey: 'PROJECT-123', percentage: 33.33},
		{issueKey: 'PROJECT-456', percentage: 33.33},
		{issueKey: 'PROJECT-789', percentage: 33.34},
	];

	const result = validateDefaultStories(stories);
	t.true(result.valid); // Should be valid despite floating point precision
});
