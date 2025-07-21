import {writeFileSync, unlinkSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import test from 'ava';
import {executeWorklogAdd, type WorklogAddParams} from '../cli.js';
import type {JiraConfig} from '../jira-client.js';

// Mock fetch setup
const originalFetch = global.fetch;
let mockFetchResponse: {
	status: number;
	ok: boolean;
	json?: () => Promise<any>;
	text?: () => Promise<string>;
} | null = null;

function setupMockFetch(response: typeof mockFetchResponse) {
	mockFetchResponse = response;
	global.fetch = async () => {
		if (!mockFetchResponse) {
			throw new Error('No mock response configured');
		}
		return {
			...mockFetchResponse,
			headers: {
				entries: () => [],
			},
		} as unknown as Response;
	};
}

function restoreFetch() {
	global.fetch = originalFetch;
	mockFetchResponse = null;
}

// Test config setup
function createTestConfig(config: JiraConfig): string {
	const configPath = join(tmpdir(), `jiracle-test-${Date.now()}.json`);
	writeFileSync(configPath, JSON.stringify(config, null, 2));
	return configPath;
}

function cleanupTestConfig(configPath: string) {
	if (existsSync(configPath)) {
		unlinkSync(configPath);
	}
}

const validParams: WorklogAddParams = {
	issue: 'TEST-123',
	date: '2025-07-11',
	time: '2h',
	comment: 'Test worklog entry',
};

const testConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
};

test.afterEach(() => {
	restoreFetch();
});

// Parameter validation tests
test('executeWorklogAdd - validates required parameters', async t => {
	const configPath = createTestConfig(testConfig);

	try {
		// Missing issue
		await t.throwsAsync(
			async () => executeWorklogAdd({...validParams, issue: ''}, configPath),
			{message: /All flags are required/},
		);

		// Missing date
		await t.throwsAsync(
			async () => executeWorklogAdd({...validParams, date: ''}, configPath),
			{message: /All flags are required/},
		);

		// Missing time
		await t.throwsAsync(
			async () => executeWorklogAdd({...validParams, time: ''}, configPath),
			{message: /All flags are required/},
		);

		// Missing comment
		await t.throwsAsync(
			async () => executeWorklogAdd({...validParams, comment: ''}, configPath),
			{message: /All flags are required/},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - validates date format', async t => {
	const configPath = createTestConfig(testConfig);

	try {
		const invalidDates = [
			'07/11/2025', // Wrong format
			'2025-13-01', // Invalid month
			'2025-02-30', // Invalid day
			'25-07-11', // Wrong year format
		];

		for (const invalidDate of invalidDates) {
			await t.throwsAsync(
				async () =>
					executeWorklogAdd({...validParams, date: invalidDate}, configPath),
				{message: /Date must be in YYYY-MM-DD format/},
			);
		}

		// Valid dates should not throw on validation (they might throw later due to no mock setup)
		const validDates = ['2025-01-01', '2025-12-31', '2025-07-15'];
		for (const validDate of validDates) {
			// We don't set up fetch mock here, so it will throw a different error
			// But the date validation should pass
			try {
				await executeWorklogAdd({...validParams, date: validDate}, configPath);
				t.fail('Should have thrown due to no fetch mock, not date validation');
			} catch (error: unknown) {
				// Should not be date validation error
				t.false(
					(error as Error).message.includes(
						'Date must be in YYYY-MM-DD format',
					),
				);
			}
		}
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - validates time format', async t => {
	const configPath = createTestConfig(testConfig);

	try {
		const invalidTimes = [
			'invalid', // Not a time format
			'2 h', // Space not allowed
			'25:70', // Invalid minutes
			'h2', // Wrong order
		];

		for (const invalidTime of invalidTimes) {
			await t.throwsAsync(
				async () =>
					executeWorklogAdd({...validParams, time: invalidTime}, configPath),
				{message: /Time must be in format/},
			);
		}

		// Valid time formats should not throw on validation
		const validTimes = ['1h', '30m', '2.5h', '1:30', '8:00'];
		for (const validTime of validTimes) {
			try {
				await executeWorklogAdd({...validParams, time: validTime}, configPath);
				t.fail('Should have thrown due to no fetch mock, not time validation');
			} catch (error: unknown) {
				// Should not be time validation error
				t.false((error as Error).message.includes('Time must be in format'));
			}
		}
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - handles missing config file', async t => {
	const nonExistentConfigPath = join(tmpdir(), 'non-existent-config.json');

	await t.throwsAsync(
		async () => executeWorklogAdd(validParams, nonExistentConfigPath),
		{message: /Invalid configuration file format|ENOENT/},
	);
});

test('executeWorklogAdd - handles malformed config file', async t => {
	const configPath = join(tmpdir(), `jiracle-malformed-${Date.now()}.json`);
	writeFileSync(configPath, 'invalid json {');

	try {
		await t.throwsAsync(
			async () => executeWorklogAdd(validParams, configPath),
			{
				message: /Invalid configuration file format/,
			},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});

// HTTP error scenario tests
test('executeWorklogAdd - handles 404 Issue Does Not Exist', async t => {
	const configPath = createTestConfig(testConfig);
	setupMockFetch({
		status: 404,
		ok: false,
		text: async () => '{"errorMessages":["Issue Does Not Exist"],"errors":{}}',
	});

	try {
		await t.throwsAsync(
			async () => executeWorklogAdd(validParams, configPath),
			{
				message: /Issue 'TEST-123' does not exist/,
			},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - handles 401 Unauthorized', async t => {
	const configPath = createTestConfig(testConfig);
	setupMockFetch({
		status: 401,
		ok: false,
		text: async () => 'Unauthorized',
	});

	try {
		await t.throwsAsync(
			async () => executeWorklogAdd(validParams, configPath),
			{
				message: /Invalid Jira credentials or insufficient permissions/,
			},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - handles 403 Forbidden', async t => {
	const configPath = createTestConfig(testConfig);
	setupMockFetch({
		status: 403,
		ok: false,
		text: async () => 'Forbidden',
	});

	try {
		await t.throwsAsync(
			async () => executeWorklogAdd(validParams, configPath),
			{
				message: /Access denied to issue 'TEST-123'/,
			},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - handles success scenario', async t => {
	const configPath = createTestConfig(testConfig);
	setupMockFetch({
		status: 201,
		ok: true,
		json: async () => ({}),
	});

	try {
		const result = await executeWorklogAdd(validParams, configPath);
		t.true(result.success);
		t.true(result.message.includes('Successfully logged 2h to TEST-123'));
	} finally {
		cleanupTestConfig(configPath);
	}
});

test('executeWorklogAdd - handles network error', async t => {
	const configPath = createTestConfig(testConfig);
	global.fetch = async () => {
		throw new Error('fetch failed');
	};

	try {
		await t.throwsAsync(
			async () => executeWorklogAdd(validParams, configPath),
			{
				message: /Cannot connect to Jira server/,
			},
		);
	} finally {
		cleanupTestConfig(configPath);
	}
});
