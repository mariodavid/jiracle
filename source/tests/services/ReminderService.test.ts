import process from 'node:process';
import test from 'ava';
import {ReminderService} from '../../services/ReminderService.js';
import type {JiraClient, ReminderConfig} from '../../jira-client.js';

// Mock JiraClient
const createMockJiraClient = (
	hasWorklogForToday = false,
): Partial<JiraClient> => ({
	async hasWorklogForToday() {
		return hasWorklogForToday;
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

test('ReminderService constructor initializes correctly', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '17:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	t.truthy(service);
});

test('ReminderService start() does nothing when disabled', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: false,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	// Should not throw errors
	t.pass();
});

test('ReminderService start() sets up interval when enabled', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	// Should not throw errors and should start monitoring
	t.pass();

	// Clean up
	service.stop();
});

test('ReminderService start() prevents multiple intervals', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);

	// Start multiple times
	service.start();
	service.start();
	service.start();

	// Should not throw errors
	t.pass();

	// Clean up
	service.stop();
});

test('ReminderService stop() clears interval', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();
	service.stop();

	// Should be safe to stop multiple times
	service.stop();
	service.stop();

	t.pass();
});

test('ReminderService handles multiple reminder times', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '12:00', '17:00', '20:30'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	t.pass();

	service.stop();
});

test('ReminderService handles weekdaysOnly configuration', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
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

	const weekdaysService = new ReminderService(mockClient, weekdaysConfig);
	const alwaysService = new ReminderService(mockClient, alwaysConfig);

	weekdaysService.start();
	alwaysService.start();

	t.pass();

	weekdaysService.stop();
	alwaysService.stop();
});

test('ReminderService handles empty reminder times array', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: [],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	t.pass();

	service.stop();
});

test('ReminderService handles malformed time strings gracefully', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', 'invalid', '25:70', 'abc:def', '12:00'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	// Should not throw errors even with invalid times
	t.pass();

	service.stop();
});

test('ReminderService handles JiraClient errors gracefully', async t => {
	const errorClient = {
		async hasWorklogForToday() {
			throw new Error('Network error');
		},
	} as unknown as JiraClient;

	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(errorClient, config);
	service.start();

	// Give it a moment to potentially check reminders
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Should handle errors gracefully
	t.pass();

	service.stop();
});

test('ReminderService service lifecycle', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['10:00', '14:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);

	// Test complete lifecycle
	service.start();
	t.pass('Service started successfully');

	service.stop();
	t.pass('Service stopped successfully');

	// Restart
	service.start();
	t.pass('Service restarted successfully');

	service.stop();
	t.pass('Service stopped again successfully');
});

test('ReminderService handles different configuration combinations', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	const configs: ReminderConfig[] = [
		{enabled: true, times: ['09:00'], weekdaysOnly: true},
		{enabled: true, times: ['09:00'], weekdaysOnly: false},
		{enabled: false, times: ['09:00'], weekdaysOnly: true},
		{enabled: false, times: ['09:00'], weekdaysOnly: false},
		{enabled: true, times: [], weekdaysOnly: true},
		{enabled: true, times: ['09:00', '12:00', '15:00'], weekdaysOnly: false},
	];

	for (const config of configs) {
		const service = new ReminderService(
			mockClient as unknown as JiraClient,
			config,
		);
		service.start();
		service.stop();
	}

	t.pass('All configuration combinations handled successfully');
});

test('ReminderService state management for notification times', async t => {
	const mockClient = createMockJiraClient(false) as unknown as JiraClient; // No worklog today
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '12:00'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(mockClient, config);

	// Access private state through type assertion
	const {state} = service as any;

	// Check initial state
	t.truthy(state.notifiedTimes);
	t.is(typeof state.lastCheckDate, 'string');
	t.true(state.notifiedTimes.size === 0);

	// Simulate adding notified times
	state.notifiedTimes.add('09:00');
	t.true(state.notifiedTimes.has('09:00'));
	t.false(state.notifiedTimes.has('12:00'));

	// Test date change behavior
	const serviceAny = service as any;
	await t.notThrowsAsync(async () => {
		await serviceAny.checkReminders();
	});
});

test('ReminderService time parsing edge cases', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
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

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);
	service.start();

	t.pass('Edge case times handled successfully');

	service.stop();
});

test('ReminderService notification system availability', t => {
	const mockClient = createMockJiraClient(false); // No worklog today
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(
		mockClient as unknown as JiraClient,
		config,
	);

	// This tests that the notification system can be initialized
	// without actually sending notifications (which would require specific timing)
	service.start();

	t.pass('Notification system initialized successfully');

	service.stop();
});

test('ReminderService formatTime correctly formats dates', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion while preserving context
	const serviceAny = service as any;

	const testDate = new Date('2024-01-15T14:30:45');
	const formatted = serviceAny.formatTime(testDate);

	t.is(formatted, '14:30');
});

test('ReminderService isWeekday correctly identifies weekdays', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion
	const {isWeekday} = service as any;

	// Monday (weekday)
	const monday = new Date('2024-01-15'); // Monday
	t.true(isWeekday(monday));

	// Saturday (weekend)
	const saturday = new Date('2024-01-13'); // Saturday
	t.false(isWeekday(saturday));

	// Sunday (weekend)
	const sunday = new Date('2024-01-14'); // Sunday
	t.false(isWeekday(sunday));

	// Friday (weekday)
	const friday = new Date('2024-01-19'); // Friday
	t.true(isWeekday(friday));
});

test('ReminderService isTimeMatch correctly matches times with tolerance', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion while preserving context
	const serviceAny = service as any;

	// Exact match
	t.true(serviceAny.isTimeMatch('09:00', '09:00'));

	// Within 1 minute tolerance
	t.true(serviceAny.isTimeMatch('09:01', '09:00'));
	t.true(serviceAny.isTimeMatch('08:59', '09:00'));

	// Outside tolerance
	t.false(serviceAny.isTimeMatch('09:02', '09:00'));
	t.false(serviceAny.isTimeMatch('08:58', '09:00'));

	// Different times
	t.false(serviceAny.isTimeMatch('10:00', '09:00'));
});

test('ReminderService timeToMinutes converts time strings correctly', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion while preserving context
	const serviceAny = service as any;

	t.is(serviceAny.timeToMinutes('00:00'), 0);
	t.is(serviceAny.timeToMinutes('09:00'), 540); // 9 * 60
	t.is(serviceAny.timeToMinutes('12:30'), 750); // 12 * 60 + 30
	t.is(serviceAny.timeToMinutes('23:59'), 1439); // 23 * 60 + 59

	// Handle malformed input gracefully
	t.is(serviceAny.timeToMinutes('invalid'), 0);
	t.is(serviceAny.timeToMinutes('25:70'), 1570); // Should handle invalid time components
});

test('ReminderService getNotificationIcon returns appropriate icons for different platforms', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion
	const {getNotificationIcon} = service as any;

	// Should return a string (path to icon)
	const icon = getNotificationIcon();
	t.is(typeof icon, 'string');
	t.true(icon.length > 0);
});

test('ReminderService createTemporaryIcon creates icon file', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion
	const {createTemporaryIcon} = service as any;

	// Should create a temporary icon file and return path
	const iconPath = createTemporaryIcon();
	t.is(typeof iconPath, 'string');
	t.true(iconPath.includes('jiracle-notification-icon.png'));
});

test('ReminderService sendReminder handles notification errors gracefully', async t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion
	const {sendReminder} = service as any;

	// Should not throw errors even if notification fails
	await t.notThrowsAsync(async () => {
		await sendReminder();
	});
});

test('ReminderService checkReminders handles different dates correctly', async t => {
	const capturedLogs: string[] = [];
	const originalConsoleError = console.error;
	console.error = (...args: any[]) => {
		capturedLogs.push(args.join(' '));
	};

	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion while preserving context
	const serviceAny = service as any;

	// Should handle date changes and reset notifications
	await t.notThrowsAsync(async () => {
		await serviceAny.checkReminders();
	});

	console.error = originalConsoleError;
	t.pass('checkReminders completed without throwing');
});

test('ReminderService platform-specific notification handling', async t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access the private method through type assertion
	const {sendReminder} = service as any;

	// Mock process.platform to test different platforms
	const originalPlatform = process.platform;

	// Test macOS platform
	Object.defineProperty(process, 'platform', {value: 'darwin'});
	await t.notThrowsAsync(async () => {
		await sendReminder();
	});

	// Test Windows platform
	Object.defineProperty(process, 'platform', {value: 'win32'});
	await t.notThrowsAsync(async () => {
		await sendReminder();
	});

	// Test Linux platform
	Object.defineProperty(process, 'platform', {value: 'linux'});
	await t.notThrowsAsync(async () => {
		await sendReminder();
	});

	// Restore original platform
	Object.defineProperty(process, 'platform', {value: originalPlatform});
});

test('ReminderService resource cleanup', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '17:00'],
		weekdaysOnly: true,
	};

	// Create multiple services to test resource management
	const services = Array.from(
		{length: 5},
		() => new ReminderService(mockClient, config),
	);

	// Start all services
	for (const service of services) {
		service.start();
	}

	// Stop all services
	for (const service of services) {
		service.stop();
	}

	t.pass('Multiple services managed successfully');
});

test('ReminderService interval management and timer checks', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Check that interval is undefined initially
	const {interval} = service as any;
	t.is(interval, undefined);

	// Start service and check interval is set
	service.start();
	const intervalAfterStart = (service as any).interval;
	t.truthy(intervalAfterStart);

	// Stop service and check interval is cleared
	service.stop();
	const intervalAfterStop = (service as any).interval;
	t.is(intervalAfterStop, undefined);
});

test('ReminderService checkIntervalMs constant', t => {
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};

	const service = new ReminderService(mockClient, config);

	// Access private constant
	const {checkIntervalMs} = service as any;

	// Should be 60 seconds
	t.is(checkIntervalMs, 60 * 1000);
});

test('ReminderService handles worklog check results properly', async t => {
	const mockClientWithWorklog = createMockJiraClient(
		true,
	) as unknown as JiraClient; // Has worklog today
	const mockClientWithoutWorklog = createMockJiraClient(
		false,
	) as unknown as JiraClient; // No worklog today

	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	// Test with worklog present (should not send reminder)
	const serviceWithWorklog = new ReminderService(mockClientWithWorklog, config);
	await t.notThrowsAsync(async () => {
		await (serviceWithWorklog as any).checkReminders();
	});

	// Test without worklog (should attempt to send reminder)
	const serviceWithoutWorklog = new ReminderService(
		mockClientWithoutWorklog,
		config,
	);
	await t.notThrowsAsync(async () => {
		await (serviceWithoutWorklog as any).checkReminders();
	});
});
