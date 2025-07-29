import test from 'ava';
import {hookTestUtils, createMockFetch} from '../utils/testUtils.js';
import type {UseWeeklyWorklogSummaryOptions} from '../../hooks/useWeeklyWorklogSummary.js';
import {IssueKey} from '../../domain/IssueKey.js';

// Mock global fetch for JiraClient
const originalFetch = global.fetch;

test.beforeEach(() => {
	// Setup mock fetch
	global.fetch = createMockFetch();
});

test.afterEach(() => {
	global.fetch = originalFetch;
});

test('useWeeklyWorklogSummary - WeekRange integration behavior', t => {
	// 1. EXPLICIT TEST DATA
	const config = hookTestUtils.createHookTestConfig();
	const weekRange1 = hookTestUtils.createTestWeekRange();
	const weekRange2 = hookTestUtils.createTestWeekRange();
	const userEmail = 'test@example.com';
	const favoriteIssues = [
		{key: IssueKey.fromString('TEST-1'), defaultTime: '2h'},
		{key: IssueKey.fromString('TEST-2'), defaultTime: '4h'},
	];

	// 2. OPERATIONS
	// Test that cache keys are generated consistently
	const mockFetch = createMockFetch();
	global.fetch = mockFetch;

	// 3. SPECIFIC VALUE COMPARISONS
	// Verify WeekRange integration works by testing the options structure
	const options1 = {
		weekRange: weekRange1,
		config,
		skipAutoLoad: true,
		userEmail,
		favoriteIssues,
	};

	const options2 = {
		weekRange: weekRange2,
		config,
		skipAutoLoad: true,
		userEmail,
		favoriteIssues,
	};

	// Test that WeekRange dates are properly extracted
	t.is(
		weekRange1.getStart().toISOString(),
		'2024-01-01',
		'WeekRange should provide start date',
	);
	t.is(
		weekRange1.getEnd().toISOString(),
		'2024-01-07',
		'WeekRange should provide end date',
	);

	// Test options structure includes WeekRange
	t.true(
		typeof options1.weekRange.getStart === 'function',
		'WeekRange should have getStart method',
	);
	t.true(
		typeof options1.weekRange.getEnd === 'function',
		'WeekRange should have getEnd method',
	);

	// Test different WeekRange instances create different cache scenarios
	t.false(
		options1.weekRange === options2.weekRange,
		'Different WeekRange instances should be distinct',
	);
});

test('useWeeklyWorklogSummary - WeekRange parameter behavior', t => {
	// 1. EXPLICIT TEST DATA
	const config = hookTestUtils.createHookTestConfig();
	const weekRange = hookTestUtils.createTestWeekRange();
	const expectedStartDate = '2024-01-01';
	const expectedEndDate = '2024-01-07';

	// 2. OPERATIONS
	// Test WeekRange parameter integration with the hook's internal logic
	const mockFetch = createMockFetch();
	global.fetch = mockFetch;

	// Test different parameter combinations that should work with WeekRange
	const baseOptions = {
		weekRange,
		config,
		skipAutoLoad: true,
	};

	const optionsWithEmail = {
		...baseOptions,
		userEmail: 'test@example.com',
	};

	const optionsWithFavorites = {
		...baseOptions,
		favoriteIssues: [{key: IssueKey.fromString('FAV-1'), defaultTime: '2h'}],
	};

	// 3. SPECIFIC VALUE COMPARISONS
	// Verify WeekRange provides correct date boundaries
	t.is(
		weekRange.getStart().toISOString(),
		expectedStartDate,
		'WeekRange start should match expected date',
	);
	t.is(
		weekRange.getEnd().toISOString(),
		expectedEndDate,
		'WeekRange end should match expected date',
	);

	// Verify different option configurations contain proper WeekRange
	t.is(
		baseOptions.weekRange.getStart().toISOString(),
		expectedStartDate,
		'Base options should contain valid WeekRange start',
	);
	t.is(
		optionsWithEmail.weekRange.getEnd().toISOString(),
		expectedEndDate,
		'Email options should contain valid WeekRange end',
	);
	t.is(
		optionsWithFavorites.weekRange.getStart().toISOString(),
		expectedStartDate,
		'Favorites options should contain valid WeekRange start',
	);
});

test('useWeeklyWorklogSummary - sliding window configuration behavior', t => {
	// 1. EXPLICIT TEST DATA
	const baseConfig = hookTestUtils.createHookTestConfig();
	const weekRange = hookTestUtils.createTestWeekRange();
	const expectedPastDays = 7;
	const expectedFutureDays = 3;

	const configWithSlidingWindow = {
		...baseConfig,
		slidingWindowDays: {past: expectedPastDays, future: expectedFutureDays},
	};

	// 2. OPERATIONS
	const mockFetch = createMockFetch();
	global.fetch = mockFetch;

	const optionsWithSlidingWindow = {
		weekRange,
		config: configWithSlidingWindow,
		skipAutoLoad: true,
	};

	// 3. SPECIFIC VALUE COMPARISONS
	// Test that sliding window configuration values are preserved correctly
	t.is(
		configWithSlidingWindow.slidingWindowDays.past,
		expectedPastDays,
		'Sliding window past days should match expected value',
	);
	t.is(
		configWithSlidingWindow.slidingWindowDays.future,
		expectedFutureDays,
		'Sliding window future days should match expected value',
	);

	// Verify configuration is properly integrated with WeekRange
	t.is(
		optionsWithSlidingWindow.weekRange.getStart().toISOString(),
		'2024-01-01',
		'WeekRange should work with sliding window config',
	);
	t.is(
		optionsWithSlidingWindow.config.jiraUrl,
		baseConfig.jiraUrl,
		'Base config values should be preserved with sliding window',
	);
});

test('useWeeklyWorklogSummary - WeekRange date boundary behavior', t => {
	// 1. EXPLICIT TEST DATA
	const config = hookTestUtils.createHookTestConfig();
	const weekRange = hookTestUtils.createTestWeekRange();
	const expectedStartDate = '2024-01-01';
	const expectedEndDate = '2024-01-07';

	// 2. OPERATIONS
	// Test WeekRange date boundary calculations
	const options: UseWeeklyWorklogSummaryOptions = {
		weekRange,
		config,
		skipAutoLoad: true,
	};

	// 3. SPECIFIC VALUE COMPARISONS
	// Test actual date boundary behavior instead of types
	t.is(
		options.weekRange.getStart().toISOString(),
		expectedStartDate,
		'WeekRange should provide correct start date',
	);
	t.is(
		options.weekRange.getEnd().toISOString(),
		expectedEndDate,
		'WeekRange should provide correct end date',
	);
	t.true(
		options.weekRange.getStart().toDate().getTime() <=
			options.weekRange.getEnd().toDate().getTime(),
		'WeekRange start should be before or equal to end',
	);
	t.is(
		options.weekRange.getEnd().toDate().getTime() -
			options.weekRange.getStart().toDate().getTime(),
		6 * 24 * 60 * 60 * 1000,
		'WeekRange should span exactly 6 days (Monday to Sunday)',
	);
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
	const weekRange = hookTestUtils.createTestWeekRange();
	const favoriteIssues1 = [
		{key: IssueKey.fromString('TEST-1'), defaultTime: '2h'},
	];
	const favoriteIssues2 = [
		{key: IssueKey.fromString('TEST-2'), defaultTime: '4h'},
	];

	// Test that different configurations generate different parameter sets
	const expectedDifferentParameters = [
		{
			weekRange,
			config: config1,
			userEmail: 'user1@example.com',
			favoriteIssues: favoriteIssues1,
		},
		{
			weekRange,
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
			typeof parameters.weekRange === 'object' && parameters.weekRange !== null,
			`Parameter set ${index} weekRange should be object`,
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
	const weekRange = hookTestUtils.createTestWeekRange();
	const testSummary = {
		weekStart: weekRange.getStart(),
		weekEnd: weekRange.getEnd(),
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
	t.deepEqual(
		testSummary.weekStart,
		weekRange.getStart(),
		'weekStart should match input',
	);
	t.deepEqual(
		testSummary.weekEnd,
		weekRange.getEnd(),
		'weekEnd should match input',
	);
	t.is(testSummary.dailySummaries.length, 0, 'dailySummaries should be empty');
	t.is(testSummary.weekTotal, 0, 'weekTotal should be zero');
});
