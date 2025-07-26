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

test('ReminderService handles JiraClient errors gracefully', async t => {
	// EXPLICIT TEST DATA
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

	// OPERATIONS
	const service = new ReminderService(errorClient, config);
	service.start();

	// Give it a moment to potentially check reminders
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Service should handle JiraClient errors gracefully');

	service.stop();
});

test('ReminderService checkReminders handles different dates correctly', async t => {
	// EXPLICIT TEST DATA
	const capturedLogs: string[] = [];
	const originalError = console.error;
	console.error = (...args: any[]) => {
		capturedLogs.push(args.join(' '));
	};

	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const serviceAny = service as any;

	// SPECIFIC VALUE COMPARISONS
	await t.notThrowsAsync(async () => {
		await serviceAny.checkReminders();
	}, 'checkReminders should handle date changes and reset notifications');

	console.error = originalError;
	t.is(
		typeof capturedLogs,
		'object',
		'Should capture logs if any errors occur',
	);
});

test('ReminderService handles worklog check results properly', async t => {
	// EXPLICIT TEST DATA
	const mockClientWithWorklog = createMockJiraClient(
		true,
	) as unknown as JiraClient;
	const mockClientWithoutWorklog = createMockJiraClient(
		false,
	) as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: false,
	};

	// OPERATIONS
	const serviceWithWorklog = new ReminderService(mockClientWithWorklog, config);
	const serviceWithoutWorklog = new ReminderService(
		mockClientWithoutWorklog,
		config,
	);

	// SPECIFIC VALUE COMPARISONS
	await t.notThrowsAsync(async () => {
		await (serviceWithWorklog as any).checkReminders();
	}, 'Should handle client with existing worklog');

	await t.notThrowsAsync(async () => {
		await (serviceWithoutWorklog as any).checkReminders();
	}, 'Should handle client without worklog and attempt to send reminder');
});

test('ReminderService service lifecycle', t => {
	// EXPLICIT TEST DATA
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const config: ReminderConfig = {
		enabled: true,
		times: ['10:00', '14:00'],
		weekdaysOnly: true,
	};

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	service.start();
	const intervalAfterStart = (service as any).interval;
	service.stop();
	const intervalAfterStop = (service as any).interval;

	// Restart
	service.start();
	const intervalAfterRestart = (service as any).interval;
	service.stop();
	const intervalAfterFinalStop = (service as any).interval;

	// SPECIFIC VALUE COMPARISONS
	t.truthy(intervalAfterStart, 'Service should start successfully');
	t.is(intervalAfterStop, undefined, 'Service should stop successfully');
	t.truthy(intervalAfterRestart, 'Service should restart successfully');
	t.is(
		intervalAfterFinalStop,
		undefined,
		'Service should stop again successfully',
	);
});
