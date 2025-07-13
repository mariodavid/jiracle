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

function cleanup(configPath: string, csvPath?: string) {
	if (existsSync(configPath)) {
		unlinkSync(configPath);
	}
	if (csvPath && existsSync(csvPath)) {
		unlinkSync(csvPath);
	}
}

test.serial('should check in with current time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-11', // Use yesterday to test the "on date" functionality
	};

	const beforeCheckIn = new Date();
	const result = await executeCheckIn(params, configPath, csvPath);
	const afterCheckIn = new Date();

	t.true(result.success);
	t.regex(result.message, /✅ Checked in at \d{2}:\d{2} on 2025-07-11/);

	// Verify the time is within a reasonable range
	const timeMatch = result.message.match(/Checked in at (\d{2}:\d{2})/);
	t.truthy(timeMatch);

	const checkedInTime = timeMatch![1]!;
	const checkInDate = new Date(`2025-07-11T${checkedInTime}:00`);
	const beforeTime = new Date(
		`2025-07-11T${beforeCheckIn.toTimeString().substring(0, 5)}:00`,
	);
	const afterTime = new Date(
		`2025-07-11T${afterCheckIn.toTimeString().substring(0, 5)}:00`,
	);

	t.true(checkInDate >= new Date(beforeTime.getTime() - 60000)); // -1 minute
	t.true(checkInDate <= new Date(afterTime.getTime() + 60000)); // +1 minute

	cleanup(configPath, csvPath);
});

test.serial('should check in with custom time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-12',
		time: '08:30',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('Checked in at 08:30'));

	cleanup(configPath, csvPath);
});

test.serial('should fail check in with invalid time', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: '2025-07-11',
		time: 'invalid',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.false(result.success);
	t.true(result.message.includes('Time must be in HH:MM format'));

	cleanup(configPath, csvPath);
});

test.serial('should fail check in with invalid date', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: CheckInParams = {
		date: 'invalid-date',
	};

	const result = await executeCheckIn(params, configPath, csvPath);

	t.false(result.success);
	t.true(result.message.includes('Date must be in YYYY-MM-DD format'));

	cleanup(configPath, csvPath);
});

test.serial('should check out with current time', async t => {
	const {configPath, csvPath} = createTestConfig();

	// Check in first with specific time
	await executeCheckIn(
		{date: '2025-07-11', time: '08:00'},
		configPath,
		csvPath,
	);

	const params: CheckOutParams = {
		date: '2025-07-11',
	};

	const beforeCheckOut = new Date();
	const result = await executeCheckOut(params, configPath, csvPath);
	const afterCheckOut = new Date();

	t.true(result.success);
	t.regex(
		result.message,
		/✅ Checked out at \d{2}:\d{2} on 2025-07-11 \(08:00-\d{2}:\d{2}, [\d.]+h total\)/,
	);

	// Verify the time is within a reasonable range
	const timeMatch = result.message.match(/Checked out at (\d{2}:\d{2})/);
	t.truthy(timeMatch);

	const checkedOutTime = timeMatch![1]!;
	const checkOutDate = new Date(`2025-07-11T${checkedOutTime}:00`);
	const beforeTime = new Date(
		`2025-07-11T${beforeCheckOut.toTimeString().substring(0, 5)}:00`,
	);
	const afterTime = new Date(
		`2025-07-11T${afterCheckOut.toTimeString().substring(0, 5)}:00`,
	);

	t.true(checkOutDate >= new Date(beforeTime.getTime() - 60000)); // -1 minute
	t.true(checkOutDate <= new Date(afterTime.getTime() + 60000)); // +1 minute

	cleanup(configPath, csvPath);
});

test.serial('should check out with custom time', async t => {
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

	cleanup(configPath, csvPath);
});

test.serial('should show status for empty day', async t => {
	const {configPath, csvPath} = createTestConfig();

	const params: StatusParams = {
		date: '2025-07-11',
	};

	const result = await executeStatus(params, configPath, csvPath);

	t.true(result.success);
	t.true(result.message.includes('2025-07-11: No attendance recorded'));

	cleanup(configPath, csvPath);
});

test.serial('should show status after check in', async t => {
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

	cleanup(configPath, csvPath);
});

test.serial('should show status after full day', async t => {
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

	cleanup(configPath, csvPath);
});

test.serial('should fail when attendance is disabled', async t => {
	const configPath = createDisabledConfig();

	const params: CheckInParams = {
		date: '2025-07-11',
	};

	const result = await executeCheckIn(params, configPath);

	t.false(result.success);
	t.true(result.message.includes('Attendance tracking is not enabled'));

	cleanup(configPath);
});

test.serial('should handle missing config file', async t => {
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

test.serial('should validate time format strictly', async t => {
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

	cleanup(configPath, csvPath);
});

test.serial('should validate date format strictly', async t => {
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

	cleanup(configPath, csvPath);
});
