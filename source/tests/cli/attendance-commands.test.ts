import test from 'ava';
import {join} from 'path';
import {tmpdir} from 'os';
import {writeFileSync, unlinkSync, existsSync} from 'fs';
import {
	executeCheckIn,
	executeCheckOut,
	executeStatus,
	type CheckInParams,
	type CheckOutParams,
	type StatusParams,
} from '../../cli/attendance-commands.js';
import type {JiraConfig} from '../../jira-client.js';

function createTestConfig(): {configPath: string; csvPath: string} {
	const configPath = join(
		tmpdir(),
		`jiracle-attendance-test-${Date.now()}.json`,
	);
	const csvPath = join(
		tmpdir(),
		`attendance-test-${Date.now()}-${Math.random()
			.toString(36)
			.substring(7)}.csv`,
	);

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		attendance: {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		},
	};

	writeFileSync(configPath, JSON.stringify(config, null, 2));
	return {configPath, csvPath};
}

function createDisabledConfig(): string {
	const configPath = join(tmpdir(), `jiracle-disabled-test-${Date.now()}.json`);

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		// No attendance config = disabled
	};

	writeFileSync(configPath, JSON.stringify(config, null, 2));
	return configPath;
}

function cleanup(configPath: string) {
	if (existsSync(configPath)) {
		unlinkSync(configPath);
	}
}

test('should check in with default time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-11', // Use yesterday to test the "on date" functionality
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('Checked in at 08:00'));
	t.true(result.message.includes('on 2025-07-11'));

	cleanup(configPath);
});

test('should check in with custom time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-12',
		time: '08:30',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('Checked in at 08:30'));

	cleanup(configPath);
});

test('should fail check in with invalid time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-11',
		time: 'invalid',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.false(result.success);
	t.true(result.message.includes('Time must be in HH:MM format'));

	cleanup(configPath);
});

test('should fail check in with invalid date', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: 'invalid-date',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.false(result.success);
	t.true(result.message.includes('Date must be in YYYY-MM-DD format'));

	cleanup(configPath);
});

test('should check out with default time', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Check in first
	await executeCheckIn({date: '2025-07-11'}, configPath, csvPath);

	const params: CheckOutParams = {
		date: '2025-07-11',
	};

	const result = await executeCheckOut(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('Checked out at 17:00'));
	t.true(result.message.includes('8.5h total'));

	cleanup(configPath);
});

test('should check out with custom time', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Check in first
	await executeCheckIn(
		{date: '2025-07-11', time: '08:30'},
		configPath,
		csvPath,
	);

	const params: CheckOutParams = {
		date: '2025-07-11',
		time: '17:30',
	};

	const result = await executeCheckOut(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('Checked out at 17:30'));
	t.true(result.message.includes('8.5h total'));

	cleanup(configPath);
});

test('should show status for empty day', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: StatusParams = {
		date: '2025-07-11',
	};

	const result = await executeStatus(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('2025-07-11: No attendance recorded'));

	cleanup(configPath);
});

test('should show status after check in', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Check in first
	await executeCheckIn(
		{date: '2025-07-11', time: '08:00'},
		configPath,
		csvPath,
	);

	const params: StatusParams = {
		date: '2025-07-11',
	};

	const result = await executeStatus(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('2025-07-11: Checked in at 08:00'));

	cleanup(configPath);
});

test('should show status after full day', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Full day
	await executeCheckIn(
		{date: '2025-07-11', time: '08:00'},
		configPath,
		csvPath,
	);
	await executeCheckOut(
		{date: '2025-07-11', time: '17:00'},
		configPath,
		csvPath,
	);

	const params: StatusParams = {
		date: '2025-07-11',
	};

	const result = await executeStatus(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('2025-07-11: 08:00-17:00'));
	t.true(result.message.includes('8h 30m'));
	t.true(result.message.includes('Target: 8h'));

	cleanup(configPath);
});

test('should fail when attendance is disabled', async t => {
	const configPath = createDisabledConfig();

	const params: CheckInParams = {
		date: '2025-07-11',
	};

	const result = await executeCheckIn(params, configPath);

	t.false(result.success);
	t.true(result.message.includes('Attendance tracking is not enabled'));

	cleanup(configPath);
});

test('should handle missing config file', async t => {
	const nonExistentPath = '/tmp/non-existent-config.json';

	const params: CheckInParams = {
		date: '2025-07-11',
	};

	const result = await executeCheckIn(params, nonExistentPath);

	t.false(result.success);
	t.true(
		result.message.includes('ENOENT') ||
			result.message.includes('no such file'),
	);
});

test('should validate time format strictly', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Test various invalid time formats
	const invalidTimes = ['8:30', '08:3', '25:00', '12:60', '24:00', '08:30:00'];

	for (const invalidTime of invalidTimes) {
		const params: CheckInParams = {
			date: '2025-07-11',
			time: invalidTime,
		};

		const result = await executeCheckIn(params, configPath, csvPath);
		t.false(result.success, `Time ${invalidTime} should be invalid`);
		t.true(result.message.includes('Time must be in HH:MM format'));
	}

	cleanup(configPath);
});

test('should validate date format strictly', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Test various invalid date formats
	const invalidDates = [
		'2025-7-11',
		'25-07-11',
		'2025/07/11',
		'invalid',
		'2025-13-01',
		'2025-02-30',
	];

	for (const invalidDate of invalidDates) {
		const params: CheckInParams = {
			date: invalidDate,
		};

		const result = await executeCheckIn(params, configPath, csvPath);
		t.false(result.success, `Date ${invalidDate} should be invalid`);
		t.true(result.message.includes('Date must be in YYYY-MM-DD format'));
	}

	cleanup(configPath);
});
