import test from 'ava';
import {ReminderService} from '../../services/ReminderService.js';
import type {JiraClient, ReminderConfig} from '../../jira-client.js';

// Mock JiraClient
const createMockJiraClient = (): Partial<JiraClient> => ({
	async hasWorklogForToday() {
		return false;
	},
});

test('ReminderService formatTime correctly formats dates', t => {
	// EXPLICIT TEST DATA
	const testDate = new Date('2024-01-15T14:30:45');
	const expectedTime = '14:30';
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const serviceAny = service as any;
	const formatted = serviceAny.formatTime(testDate);

	// SPECIFIC VALUE COMPARISONS
	t.is(formatted, expectedTime);
});

test('ReminderService isWeekday correctly identifies weekdays', t => {
	// EXPLICIT TEST DATA
	const monday = new Date('2024-01-15'); // Monday
	const saturday = new Date('2024-01-13'); // Saturday
	const sunday = new Date('2024-01-14'); // Sunday
	const friday = new Date('2024-01-19'); // Friday
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {isWeekday} = service as any;

	// SPECIFIC VALUE COMPARISONS
	t.true(isWeekday(monday), 'Monday should be weekday');
	t.false(isWeekday(saturday), 'Saturday should not be weekday');
	t.false(isWeekday(sunday), 'Sunday should not be weekday');
	t.true(isWeekday(friday), 'Friday should be weekday');
});

test('ReminderService isTimeMatch correctly matches times with tolerance', t => {
	// EXPLICIT TEST DATA
	const targetTime = '09:00';
	const exactMatch = '09:00';
	const withinToleranceBefore = '08:59';
	const withinToleranceAfter = '09:01';
	const outsideToleranceBefore = '08:58';
	const outsideToleranceAfter = '09:02';
	const differentTime = '10:00';
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const serviceAny = service as any;

	// SPECIFIC VALUE COMPARISONS
	t.true(
		serviceAny.isTimeMatch(exactMatch, targetTime),
		'Exact match should work',
	);
	t.true(
		serviceAny.isTimeMatch(withinToleranceBefore, targetTime),
		'Within tolerance before should match',
	);
	t.true(
		serviceAny.isTimeMatch(withinToleranceAfter, targetTime),
		'Within tolerance after should match',
	);
	t.false(
		serviceAny.isTimeMatch(outsideToleranceBefore, targetTime),
		'Outside tolerance before should not match',
	);
	t.false(
		serviceAny.isTimeMatch(outsideToleranceAfter, targetTime),
		'Outside tolerance after should not match',
	);
	t.false(
		serviceAny.isTimeMatch(differentTime, targetTime),
		'Different time should not match',
	);
});

test('ReminderService timeToMinutes converts time strings correctly', t => {
	// EXPLICIT TEST DATA
	const testCases = [
		{input: '00:00', expected: 0},
		{input: '09:00', expected: 540}, // 9 * 60
		{input: '12:30', expected: 750}, // 12 * 60 + 30
		{input: '23:59', expected: 1439}, // 23 * 60 + 59
		{input: 'invalid', expected: 0},
		{input: '25:70', expected: 1570}, // Should handle invalid time components
	];
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const serviceAny = service as any;

	// SPECIFIC VALUE COMPARISONS
	for (const testCase of testCases) {
		const result = serviceAny.timeToMinutes(testCase.input);
		t.is(
			result,
			testCase.expected,
			`timeToMinutes('${testCase.input}') should return ${testCase.expected}`,
		);
	}
});

test('ReminderService handles malformed time strings gracefully', t => {
	// EXPLICIT TEST DATA
	const malformedConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00', 'invalid', '25:70', 'abc:def', '12:00'],
		weekdaysOnly: false,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, malformedConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Service should start despite malformed times');

	service.stop();
});

test('ReminderService handles multiple reminder times', t => {
	// EXPLICIT TEST DATA
	const multiTimeConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00', '12:00', '17:00', '20:30'],
		weekdaysOnly: false,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, multiTimeConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Service should handle multiple reminder times');

	service.stop();
});

test('ReminderService handles weekdaysOnly configuration', t => {
	// EXPLICIT TEST DATA
	const weekdaysConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const alwaysConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const weekdaysService = new ReminderService(mockClient, weekdaysConfig);
	const alwaysService = new ReminderService(mockClient, alwaysConfig);
	weekdaysService.start();
	alwaysService.start();

	// SPECIFIC VALUE COMPARISONS
	const weekdaysInterval = (weekdaysService as any).interval;
	const alwaysInterval = (alwaysService as any).interval;
	t.truthy(weekdaysInterval, 'Weekdays-only service should start');
	t.truthy(alwaysInterval, 'Always service should start');

	weekdaysService.stop();
	alwaysService.stop();
});

test('ReminderService time parsing edge cases', t => {
	// EXPLICIT TEST DATA
	const edgeCaseConfig: ReminderConfig = {
		enabled: true,
		times: [
			'00:00', // Midnight
			'23:59', // End of day
			'12:00', // Noon
			'01:30', // Early morning
			'23:00', // Late evening
		],
		weekdaysOnly: false,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, edgeCaseConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Service should handle edge case times');

	service.stop();
});
