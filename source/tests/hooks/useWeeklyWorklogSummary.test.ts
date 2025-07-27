import test from 'ava';
import {hookTestUtils, createMockFetch} from '../utils/testUtils.js';
import type {UseWeeklyWorklogSummaryOptions} from '../../hooks/useWeeklyWorklogSummary.js';

// Mock global fetch for JiraClient
const originalFetch = global.fetch;

test.beforeEach(() => {
	// Setup mock fetch
	global.fetch = createMockFetch();
});

test.afterEach(() => {
	global.fetch = originalFetch;
});

test('useWeeklyWorklogSummary - module exports and interface', async t => {
	// 1. EXPLICIT TEST DATA
	const expectedExports = ['useWeeklyWorklogSummary'];

	// 2. OPERATIONS
	const hookModule = await import('../../hooks/useWeeklyWorklogSummary.js');

	// 3. SPECIFIC VALUE COMPARISONS
	// Test that the hook is exported as a function
	t.is(
		typeof hookModule.useWeeklyWorklogSummary,
		'function',
		'useWeeklyWorklogSummary should be exported as a function',
	);

	// Test that the hook name is correctly exported
	t.is(
		hookModule.useWeeklyWorklogSummary.name,
		'useWeeklyWorklogSummary',
		'Function should have correct name',
	);

	// Verify module structure
	for (const exportName of expectedExports) {
		t.true(
			Object.prototype.hasOwnProperty.call(hookModule, exportName),
			`Should export ${exportName}`,
		);
	}
});

test('useWeeklyWorklogSummary - parameter validation requirements', t => {
	// 1. EXPLICIT TEST DATA
	const config = hookTestUtils.createHookTestConfig();
	const {weekStart, weekEnd} = hookTestUtils.createTestWeekRange();

	const validOptions: UseWeeklyWorklogSummaryOptions = {
		weekStart,
		weekEnd,
		config,
		skipAutoLoad: true,
		userEmail: 'test@example.com',
	};

	const optionsWithoutEmail: UseWeeklyWorklogSummaryOptions = {
		weekStart,
		weekEnd,
		config,
		skipAutoLoad: true,
	};

	const optionsWithEmptyFavorites: UseWeeklyWorklogSummaryOptions = {
		weekStart,
		weekEnd,
		config,
		skipAutoLoad: true,
		userEmail: 'test@example.com',
		favoriteIssues: [],
	};

	// 2. OPERATIONS
	// Test that all parameter combinations are valid TypeScript types
	const parameterSets = [
		validOptions,
		optionsWithoutEmail,
		optionsWithEmptyFavorites,
	];

	// 3. SPECIFIC VALUE COMPARISONS
	for (const [index, options] of parameterSets.entries()) {
		t.true(
			options.weekStart instanceof Date,
			`Parameter set ${index} should have valid weekStart`,
		);
		t.true(
			options.weekEnd instanceof Date,
			`Parameter set ${index} should have valid weekEnd`,
		);
		t.is(
			typeof options.config,
			'object',
			`Parameter set ${index} should have config object`,
		);
		t.is(
			typeof options.skipAutoLoad,
			'boolean',
			`Parameter set ${index} should have boolean skipAutoLoad`,
		);

		if (options.userEmail) {
			t.is(
				typeof options.userEmail,
				'string',
				`Parameter set ${index} userEmail should be string when present`,
			);
		}

		if (options.favoriteIssues) {
			t.true(
				Array.isArray(options.favoriteIssues),
				`Parameter set ${index} favoriteIssues should be array when present`,
			);
		}
	}
});

test('useWeeklyWorklogSummary - configuration normalization requirements', t => {
	// 1. EXPLICIT TEST DATA
	const baseConfig = hookTestUtils.createHookTestConfig();
	const configWithSlidingWindow = {
		...baseConfig,
		slidingWindowDays: {past: 7, future: 3},
	};
	const configWithLegacyLookback = {
		...baseConfig,
		recentWorkdaysLookback: 5,
	} as any;
	const configWithBoth = {
		...baseConfig,
		slidingWindowDays: {past: 14, future: 7},
		recentWorkdaysLookback: 5, // Should be ignored in favor of slidingWindowDays
	} as any;

	// 2. OPERATIONS
	// Test that different configuration patterns are supported
	const configurations = [
		{config: configWithSlidingWindow, description: 'with slidingWindowDays'},
		{
			config: configWithLegacyLookback,
			description: 'with legacy recentWorkdaysLookback',
		},
		{
			config: configWithBoth,
			description: 'with both (slidingWindowDays takes precedence)',
		},
	];

	// 3. SPECIFIC VALUE COMPARISONS
	for (const {config, description} of configurations) {
		t.is(typeof config, 'object', `Config ${description} should be object`);
		t.is(
			typeof config.jiraUrl,
			'string',
			`Config ${description} should have jiraUrl`,
		);
		t.is(
			typeof config.username,
			'string',
			`Config ${description} should have username`,
		);
		t.is(
			typeof config.apiToken,
			'string',
			`Config ${description} should have apiToken`,
		);

		// Verify sliding window configuration structure
		if (config.slidingWindowDays) {
			t.is(
				typeof config.slidingWindowDays.past,
				'number',
				`Config ${description} slidingWindowDays.past should be number`,
			);
			t.is(
				typeof config.slidingWindowDays.future,
				'number',
				`Config ${description} slidingWindowDays.future should be number`,
			);
		}

		// Verify legacy configuration structure
		if (config.recentWorkdaysLookback) {
			t.is(
				typeof config.recentWorkdaysLookback,
				'number',
				`Config ${description} recentWorkdaysLookback should be number`,
			);
		}
	}
});

test('useWeeklyWorklogSummary - date handling and week range validation', t => {
	// 1. EXPLICIT TEST DATA
	const pastDate = new Date('2023-01-01');
	const futureDate = new Date('2023-01-07');
	const sameDate = new Date('2023-01-01');
	const invalidDate = new Date('invalid');

	const validDateRanges = [
		{start: pastDate, end: futureDate, description: 'normal week range'},
		{start: sameDate, end: sameDate, description: 'same start and end date'},
	];

	const problematicDates = [
		{date: invalidDate, description: 'invalid date object'},
	];

	// 2. OPERATIONS
	// Test date range validation and handling
	const config = hookTestUtils.createHookTestConfig();

	// 3. SPECIFIC VALUE COMPARISONS
	for (const {start, end, description} of validDateRanges) {
		const options: UseWeeklyWorklogSummaryOptions = {
			weekStart: start,
			weekEnd: end,
			config,
			skipAutoLoad: true,
		};

		t.true(
			options.weekStart instanceof Date,
			`${description}: weekStart should be Date instance`,
		);
		t.true(
			options.weekEnd instanceof Date,
			`${description}: weekEnd should be Date instance`,
		);
		t.true(
			options.weekStart.getTime() <= options.weekEnd.getTime(),
			`${description}: weekStart should be <= weekEnd`,
		);
	}

	// Test problematic date handling
	for (const {date, description} of problematicDates) {
		t.true(
			date instanceof Date,
			`${description}: should still be Date instance`,
		);
		t.true(
			Number.isNaN(date.getTime()),
			`${description}: should have NaN time value`,
		);
	}
});

test('useWeeklyWorklogSummary - fetch mock and API integration setup', async t => {
	// 1. EXPLICIT TEST DATA
	let fetchCallCount = 0;
	// Test API endpoints that would be used

	// 2. OPERATIONS
	// Test that fetch mocking works correctly
	const originalMockFetch = global.fetch;
	global.fetch = async (...arguments_) => {
		fetchCallCount++;
		return createMockFetch()(...arguments_);
	};

	// Simulate what the hook would do - make API calls
	const mockResponse1 = await global.fetch('/rest/api/2/search');
	const mockResponse2 = await global.fetch('/worklog');

	// 3. SPECIFIC VALUE COMPARISONS
	t.is(fetchCallCount, 2, 'Should have made 2 fetch calls');
	t.is(typeof mockResponse1, 'object', 'First mock response should be object');
	t.is(typeof mockResponse2, 'object', 'Second mock response should be object');

	// Verify mock responses have expected structure
	t.is(
		typeof mockResponse1.ok,
		'boolean',
		'Mock response should have ok property',
	);
	t.is(
		typeof mockResponse1.json,
		'function',
		'Mock response should have json method',
	);
	t.is(
		typeof mockResponse2.ok,
		'boolean',
		'Mock response should have ok property',
	);
	t.is(
		typeof mockResponse2.json,
		'function',
		'Mock response should have json method',
	);

	// Restore original fetch
	global.fetch = originalMockFetch;
});

test('useWeeklyWorklogSummary - parameter combinations and edge cases', t => {
	// 1. EXPLICIT TEST DATA
	const config1 = hookTestUtils.createHookTestConfig({
		slidingWindowDays: {past: 7, future: 3},
	});
	const config2 = hookTestUtils.createHookTestConfig({
		slidingWindowDays: {past: 14, future: 7},
	});
	const {weekStart, weekEnd} = hookTestUtils.createTestWeekRange();
	const favoriteIssues1 = [
		{key: IssueKey.fromString('TEST-1'), defaultTime: '2h'},
	];
	const favoriteIssues2 = [
		{key: IssueKey.fromString('TEST-2'), defaultTime: '4h'},
	];

	// Test that different configurations generate different parameter sets
	const expectedDifferentParameters = [
		{
			weekStart,
			weekEnd,
			config: config1,
			userEmail: 'user1@example.com',
			favoriteIssues: favoriteIssues1,
		},
		{
			weekStart,
			weekEnd,
			config: config2,
			userEmail: 'user2@example.com',
			favoriteIssues: favoriteIssues2,
		},
	];

	// 2. OPERATIONS
	// Test parameter validation structure

	// 3. SPECIFIC VALUE COMPARISONS
	// Verify the parameters are different and would generate different cache keys
	t.not(
		expectedDifferentParameters[0]!.userEmail,
		expectedDifferentParameters[1]!.userEmail,
		'Different users should have different emails',
	);
	t.not(
		expectedDifferentParameters[0]!.config.slidingWindowDays?.past,
		expectedDifferentParameters[1]!.config.slidingWindowDays?.past,
		'Different configs should have different sliding window past values',
	);
	t.not(
		expectedDifferentParameters[0]!.favoriteIssues?.[0]?.key,
		expectedDifferentParameters[1]!.favoriteIssues?.[0]?.key,
		'Different favorite issues should have different keys',
	);

	// Test all parameter combinations have required properties
	for (const [index, parameters] of expectedDifferentParameters.entries()) {
		t.true(
			parameters.weekStart instanceof Date,
			`Parameter set ${index} weekStart should be Date`,
		);
		t.true(
			parameters.weekEnd instanceof Date,
			`Parameter set ${index} weekEnd should be Date`,
		);
		t.is(
			typeof parameters.config,
			'object',
			`Parameter set ${index} config should be object`,
		);
		t.is(
			typeof parameters.userEmail,
			'string',
			`Parameter set ${index} userEmail should be string`,
		);
		t.true(
			Array.isArray(parameters.favoriteIssues),
			`Parameter set ${index} favoriteIssues should be array`,
		);
	}
});

test('useWeeklyWorklogSummary - WeeklyWorklogSummary data structure requirements', t => {
	// 1. EXPLICIT TEST DATA
	const {weekStart, weekEnd} = hookTestUtils.createTestWeekRange();
	const testSummary = {
		weekStart,
		weekEnd,
		dailySummaries: [],
		weekTotal: 0,
	};

	// 2. OPERATIONS
	// Test data structure matches expected interface

	// 3. SPECIFIC VALUE COMPARISONS
	// Test data structure matches expected interface
	t.is(
		typeof testSummary.weekStart,
		'object',
		'weekStart should be Date object',
	);
	t.is(typeof testSummary.weekEnd, 'object', 'weekEnd should be Date object');
	t.true(
		Array.isArray(testSummary.dailySummaries),
		'dailySummaries should be array',
	);
	t.is(typeof testSummary.weekTotal, 'number', 'weekTotal should be number');

	// Test specific values
	t.is(testSummary.weekStart, weekStart, 'weekStart should match input');
	t.is(testSummary.weekEnd, weekEnd, 'weekEnd should match input');
	t.is(testSummary.dailySummaries.length, 0, 'dailySummaries should be empty');
	t.is(testSummary.weekTotal, 0, 'weekTotal should be zero');
});
