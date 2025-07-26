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

test('ReminderService constructor initializes correctly', t => {
	// EXPLICIT TEST DATA
	const expectedConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00', '17:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, expectedConfig);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(service);
	t.is(typeof service.start, 'function');
	t.is(typeof service.stop, 'function');
});

test('ReminderService start() does nothing when disabled', t => {
	// EXPLICIT TEST DATA
	const disabledConfig: ReminderConfig = {
		enabled: false,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, disabledConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.is(interval, undefined, 'Interval should not be set when disabled');
});

test('ReminderService start() sets up interval when enabled', t => {
	// EXPLICIT TEST DATA
	const enabledConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, enabledConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(interval, 'Interval should be set when enabled');

	// Clean up
	service.stop();
});

test('ReminderService start() prevents multiple intervals', t => {
	// EXPLICIT TEST DATA
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	service.start();
	const firstInterval = (service as any).interval;
	service.start(); // Second start
	const secondInterval = (service as any).interval;

	// SPECIFIC VALUE COMPARISONS
	t.truthy(firstInterval, 'First interval should be set');
	t.is(
		firstInterval,
		secondInterval,
		'Multiple starts should not create new intervals',
	);

	// Clean up
	service.stop();
});

test('ReminderService stop() clears interval', t => {
	// EXPLICIT TEST DATA
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	service.start();
	const intervalBeforeStop = (service as any).interval;
	service.stop();
	const intervalAfterStop = (service as any).interval;

	// Multiple stops should be safe
	service.stop();
	service.stop();

	// SPECIFIC VALUE COMPARISONS
	t.truthy(intervalBeforeStop, 'Interval should exist before stop');
	t.is(intervalAfterStop, undefined, 'Interval should be cleared after stop');
});

test('ReminderService handles empty reminder times array', t => {
	// EXPLICIT TEST DATA
	const emptyTimesConfig: ReminderConfig = {
		enabled: true,
		times: [],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;

	// OPERATIONS
	const service = new ReminderService(mockClient, emptyTimesConfig);
	service.start();

	// SPECIFIC VALUE COMPARISONS
	const {interval} = service as any;
	t.truthy(
		interval,
		'Service should still start monitoring even with empty times',
	);

	service.stop();
});

test('ReminderService interval management and timer checks', t => {
	// EXPLICIT TEST DATA
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const expectedCheckInterval = 60 * 1000; // 60 seconds

	// OPERATIONS
	const service = new ReminderService(mockClient, config);
	const initialInterval = (service as any).interval;
	service.start();
	const intervalAfterStart = (service as any).interval;
	service.stop();
	const intervalAfterStop = (service as any).interval;

	// SPECIFIC VALUE COMPARISONS
	t.is(initialInterval, undefined, 'Interval should be undefined initially');
	t.truthy(intervalAfterStart, 'Interval should be set after start');
	t.is(intervalAfterStop, undefined, 'Interval should be cleared after stop');

	// Check interval constant
	const {checkIntervalMs} = service as any;
	t.is(
		checkIntervalMs,
		expectedCheckInterval,
		'Check interval should be 60 seconds',
	);
});

test('ReminderService handles different configuration combinations', t => {
	// EXPLICIT TEST DATA
	const configs: ReminderConfig[] = [
		{enabled: true, times: ['09:00'], weekdaysOnly: true},
		{enabled: true, times: ['09:00'], weekdaysOnly: false},
		{enabled: false, times: ['09:00'], weekdaysOnly: true},
		{enabled: false, times: ['09:00'], weekdaysOnly: false},
		{enabled: true, times: [], weekdaysOnly: true},
		{enabled: true, times: ['09:00', '12:00', '15:00'], weekdaysOnly: false},
	];
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const createdServices: ReminderService[] = [];

	// OPERATIONS
	for (const config of configs) {
		const service = new ReminderService(mockClient, config);
		service.start();
		createdServices.push(service);
		service.stop();
	}

	// SPECIFIC VALUE COMPARISONS
	t.is(
		createdServices.length,
		configs.length,
		'All configurations should create services',
	);
	for (const service of createdServices) {
		t.truthy(service, 'Each service should be created successfully');
	}
});

test('ReminderService resource cleanup with multiple services', t => {
	// EXPLICIT TEST DATA
	const config: ReminderConfig = {
		enabled: true,
		times: ['09:00', '17:00'],
		weekdaysOnly: true,
	};
	const mockClient = createMockJiraClient() as unknown as JiraClient;
	const serviceCount = 5;

	// OPERATIONS
	const services = Array.from(
		{length: serviceCount},
		() => new ReminderService(mockClient, config),
	);

	// Start all services
	for (const service of services) {
		service.start();
	}

	// Check intervals are set
	const intervalsAfterStart = services.map(
		service => (service as any).interval as NodeJS.Timeout | undefined,
	);

	// Stop all services
	for (const service of services) {
		service.stop();
	}

	// Check intervals are cleared
	const intervalsAfterStop = services.map(
		service => (service as any).interval as NodeJS.Timeout | undefined,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		services.length,
		serviceCount,
		'Should create correct number of services',
	);
	for (const interval of intervalsAfterStart) {
		t.truthy(interval, 'Each service should have interval after start');
	}

	for (const interval of intervalsAfterStop) {
		t.is(
			interval,
			undefined,
			'Each service should have cleared interval after stop',
		);
	}
});
