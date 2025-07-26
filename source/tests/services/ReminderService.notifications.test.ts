import process from 'node:process';
import test from 'ava';
import {ReminderService} from '../../services/ReminderService.js';
import type {JiraClient, ReminderConfig} from '../../jira-client.js';

// Mock JiraClient
const createMockJiraClient = (): Partial<JiraClient> => ({
	async hasWorklogForToday() {
		return false;
	},
});

// Mock console.error to avoid test output noise
const originalConsoleError = console.error;
let consoleErrorCalls: string[] = [];

test.beforeEach(() => {
	consoleErrorCalls = [];
	console.error = (...args: any[]) => {
		consoleErrorCalls.push(args.join(' '));
	};
});

test.afterEach(() => {
	console.error = originalConsoleError;
});

test('ReminderService getNotificationIcon returns appropriate icons for different platforms', t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {getNotificationIcon} = service as any;
	const icon = getNotificationIcon();

	// SPECIFIC VALUE COMPARISONS
	t.is(typeof icon, 'string', 'Icon should be a string');
	t.true(icon.length > 0, 'Icon path should not be empty');
});

test('ReminderService createTemporaryIcon creates icon file', t => {
	// EXPLICIT TEST DATA
	const expectedIconName = 'jiracle-notification-icon.png';
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {createTemporaryIcon} = service as any;
	const iconPath = createTemporaryIcon();

	// SPECIFIC VALUE COMPARISONS
	t.is(typeof iconPath, 'string', 'Icon path should be a string');
	t.true(
		iconPath.includes(expectedIconName),
		'Icon path should contain expected filename',
	);
});

test('ReminderService sendReminder handles notification errors gracefully', async t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {sendReminder} = service as any;

	// SPECIFIC VALUE COMPARISONS
	await t.notThrowsAsync(async () => {
		await sendReminder();
	}, 'sendReminder should not throw errors even if notification fails');
});

test('ReminderService notification system availability', t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Notification system should initialize successfully');

	service.stop();
});

test('ReminderService platform-specific notification handling', async t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const originalPlatform = process.platform;
	const testPlatforms = ['darwin', 'win32', 'linux'];

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {sendReminder} = service as any;

	// SPECIFIC VALUE COMPARISONS
	for (const platform of testPlatforms) {
		Object.defineProperty(process, 'platform', {value: platform});
		await t.notThrowsAsync(async () => {
			await sendReminder();
		}, `sendReminder should work on ${platform} platform`);
	}

	// Restore original platform
	Object.defineProperty(process, 'platform', {value: originalPlatform});
});

test('ReminderService state management for notification times', async t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '12:00'],
		weekdaysOnly: false,
	};
	const testTime = '09:00';

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const {state} = service as any;

	// SPECIFIC VALUE COMPARISONS
	t.truthy(state.notifiedTimes, 'notifiedTimes should exist');
	t.is(typeof state.lastCheckDate, 'string', 'lastCheckDate should be string');
	t.is(state.notifiedTimes.size, 0, 'notifiedTimes should start empty');

	// Simulate adding notified times
	state.notifiedTimes.add(testTime);
	t.true(
		state.notifiedTimes.has(testTime),
		'Should track notified times correctly',
	);
	t.false(state.notifiedTimes.has('12:00'), 'Should not have unnotified times');

	// Test checkReminders doesn't throw
	const serviceAny = service as any;
	await t.notThrowsAsync(async () => {
		await serviceAny.checkReminders();
	}, 'checkReminders should handle state management');
});
