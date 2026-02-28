import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {
	readFileSync,
	writeFileSync,
	existsSync,
	unlinkSync,
	mkdirSync,
} from 'node:fs';
import process from 'node:process';
import test from 'ava';

const cliPath = join(process.cwd(), 'dist', 'cli.js');
const devConfigDir = join(process.cwd(), '.dev');
const originalConfigPath = join(devConfigDir, 'config.json');

function ensureDevConfigDir() {
	if (!existsSync(devConfigDir)) {
		mkdirSync(devConfigDir, {recursive: true});
	}
}

test.beforeEach(t => {
	t.timeout(30_000);
});

function runCli(args: string[]): {
	stdout: string;
	stderr: string;
	exitCode: number;
} {
	try {
		const stdout = execFileSync('node', [cliPath, ...args], {
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
			env: {
				...process.env,
				JIRACLE_DEV_MODE: 'true',
				JIRACLE_API_TOKEN: '',
				JIRACLE_JIRA_URL: '',
			},
		});
		return {stdout, stderr: '', exitCode: 0};
	} catch (error: unknown) {
		const error_ = error as any;
		return {
			stdout: error_.stdout ?? '',
			stderr: error_.stderr ?? '',
			exitCode: error_.status ?? 1,
		};
	}
}

test('worklog add - missing required flags shows error', t => {
	const result = runCli(['worklog', 'add']);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('All flags are required'));
});

test('worklog add - missing issue flag shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - missing date flag shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - missing time flag shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - missing comment flag shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - invalid date format shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - invalid time format shows error', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - valid time formats are accepted', t => {
	const validTimeFormats = ['5h', '30m', '2.5h', '1:30'];

	for (const timeFormat of validTimeFormats) {
		const result = runCli([
			'worklog',
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

test('worklog add - aliases work correctly', t => {
	const result = runCli([
		'worklog',
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

test('worklog add - unknown command shows error', t => {
	const result = runCli(['unknown', 'command']);

	t.is(result.exitCode, 1);
	t.true(result.stderr.includes('Unknown command: unknown command'));
});

test('worklog add - missing config file shows error', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	ensureDevConfigDir();

	if (existsSync(originalConfigPath)) {
		unlinkSync(originalConfigPath);
	}

	try {
		const result = runCli([
			'worklog',
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

test('worklog add - date validation edge cases', t => {
	const invalidDates = [
		'2025-13-01', // Invalid month
		'2025-02-30', // Invalid day
		'25-07-10', // Wrong year format
		'2025/07/10', // Wrong separator
	];

	for (const date of invalidDates) {
		const result = runCli([
			'worklog',
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
			'worklog',
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

test('worklog add - clean error messages for non-existent issue', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	ensureDevConfigDir();

	const testConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));

	try {
		const result = runCli([
			'worklog',
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

test('worklog add - time validation edge cases', t => {
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
			'worklog',
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
			'worklog',
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
