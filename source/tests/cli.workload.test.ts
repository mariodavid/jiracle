import test from 'ava';
import {execFileSync} from 'child_process';
import {join} from 'path';
import {readFileSync, writeFileSync, existsSync, unlinkSync} from 'fs';
import {homedir} from 'os';

const cliPath = join(process.cwd(), 'dist', 'cli.js');
const originalConfigPath = join(homedir(), '.config', 'jiracle.json');

function runCli(args: string[]): {
	stdout: string;
	stderr: string;
	exitCode: number;
} {
	try {
		const stdout = execFileSync('node', [cliPath, ...args], {
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return {stdout, stderr: '', exitCode: 0};
	} catch (error: any) {
		return {
			stdout: error.stdout || '',
			stderr: error.stderr || '',
			exitCode: error.status || 1,
		};
	}
}

test('workload add - missing required flags shows error', t => {
	const result = runCli(['workload', 'add']);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('workload add - missing issue flag shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--date',
		'2025-07-10',
		'--time',
		'2h',
		'--comment',
		'Test comment',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('workload add - missing date flag shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--issue',
		'TEST-123',
		'--time',
		'2h',
		'--comment',
		'Test comment',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('workload add - missing time flag shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--issue',
		'TEST-123',
		'--date',
		'2025-07-10',
		'--comment',
		'Test comment',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('workload add - missing comment flag shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--issue',
		'TEST-123',
		'--date',
		'2025-07-10',
		'--time',
		'2h',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('workload add - invalid date format shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--issue',
		'TEST-123',
		'--date',
		'07/10/2025',
		'--time',
		'2h',
		'--comment',
		'Test comment',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('Date must be in YYYY-MM-DD format'));
});

test('workload add - invalid time format shows error', t => {
	const result = runCli([
		'workload',
		'add',
		'--issue',
		'TEST-123',
		'--date',
		'2025-07-10',
		'--time',
		'invalid',
		'--comment',
		'Test comment',
	]);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('Time must be in format'));
});

test('workload add - valid time formats are accepted', t => {
	const validTimeFormats = ['5h', '30m', '2.5h', '1:30'];

	for (const timeFormat of validTimeFormats) {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			'2025-07-10',
			'--time',
			timeFormat,
			'--comment',
			'Test comment',
		]);

		t.false(
			result.stderr.includes('Time must be in format'),
			`Time format ${timeFormat} should be valid`,
		);
	}
});

test('workload add - aliases work correctly', t => {
	const result = runCli([
		'workload',
		'add',
		'-i',
		'TEST-123',
		'-d',
		'2025-07-10',
		'-t',
		'2h',
		'-c',
		'Test comment',
	]);

	t.false(result.stderr.includes('All flags are required'));
});

test('workload add - unknown command shows error', t => {
	const result = runCli(['unknown', 'command']);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('Unknown command: unknown command'));
});

test('workload add - missing config file shows error', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	if (existsSync(originalConfigPath)) {
		unlinkSync(originalConfigPath);
	}

	try {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			'2025-07-10',
			'--time',
			'2h',
			'--comment',
			'Test comment',
		]);

		t.is(result.exitCode, 1);
		t.true(result.stderr.includes('Error:'));
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		}
	}
});

test('workload add - date validation edge cases', t => {
	const invalidDates = [
		'2025-13-01', // Invalid month
		'2025-02-30', // Invalid day
		'25-07-10', // Wrong year format
		'2025/07/10', // Wrong separator
	];

	for (const date of invalidDates) {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			date,
			'--time',
			'2h',
			'--comment',
			'Test comment',
		]);

		t.is(result.exitCode, 1, `Date ${date} should be invalid`);
	}

	const validDates = ['2025-01-01', '2025-12-31', '2025-02-28', '2025-07-15'];

	for (const date of validDates) {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			date,
			'--time',
			'2h',
			'--comment',
			'Test comment',
		]);

		t.false(
			result.stderr.includes('Date must be in YYYY-MM-DD format'),
			`Date ${date} should be valid`,
		);
	}
});

test('workload add - clean error messages for non-existent issue', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	const testConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));

	try {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'NONEXISTENT-123',
			'--date',
			'2025-07-11',
			'--time',
			'2h',
			'--comment',
			'Test comment',
		]);

		t.is(result.exitCode, 1);
		// Should have a clean error message starting with "Error:"
		t.true(result.stderr.includes('Error:'));
		// Should NOT have ugly debug output
		t.false(result.stderr.includes('{"errorMessages":'));
		t.false(result.stderr.includes('error: Failed to add worklog'));
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		} else if (existsSync(originalConfigPath)) {
			unlinkSync(originalConfigPath);
		}
	}
});

test('workload add - time validation edge cases', t => {
	const validTimeFormats = [
		'1h', // Simple hour
		'30m', // Simple minutes
		'2.5h', // Decimal hours
		'0.25h', // Quarter hour
		'1:30', // Hour:minute format
		'8:00', // Full workday
		'0:15', // Quarter hour in h:m format
	];

	for (const time of validTimeFormats) {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			'2025-07-10',
			'--time',
			time,
			'--comment',
			'Test comment',
		]);

		t.false(
			result.stderr.includes('Time must be in format'),
			`Time format ${time} should be valid`,
		);
	}

	const invalidTimeFormats = [
		'h2', // Wrong order
		'30', // Missing unit
		'2 h', // Space in time
		'1.5', // Missing unit
		'25:70', // Invalid minutes
		'h:30', // Missing hour
		'1:', // Missing minutes
	];

	for (const time of invalidTimeFormats) {
		const result = runCli([
			'workload',
			'add',
			'--issue',
			'TEST-123',
			'--date',
			'2025-07-10',
			'--time',
			time,
			'--comment',
			'Test comment',
		]);

		t.is(result.exitCode, 1, `Time format ${time} should be invalid`);
		t.true(result.stderr.includes('Time must be in format'));
	}
});
