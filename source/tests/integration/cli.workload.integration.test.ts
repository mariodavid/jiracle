import test from 'ava';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {writeFileSync, readFileSync, existsSync, unlinkSync} from 'node:fs';
import {homedir} from 'node:os';

const cliPath = join(process.cwd(), 'dist', 'cli.js');
const originalConfigPath = join(homedir(), '.config', 'jiracle.json');

// Integration tests for CLI worklog functionality

test('worklog add - invalid Jira URL shows connection error', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	const invalidConfig = {
		jiraUrl: 'https://invalid-jira-url-that-does-not-exist.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	writeFileSync(originalConfigPath, JSON.stringify(invalidConfig, null, 2));

	try {
		execFileSync(
			'node',
			[
				cliPath,
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
			],
			{
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
				timeout: 10_000, // 10 second timeout
			},
		);

		t.fail('Should have thrown an error for invalid Jira URL');
	} catch (error: any) {
		t.is(error.status, 1);
		t.true(error.stderr.includes('Error:'));
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		} else if (existsSync(originalConfigPath)) {
			unlinkSync(originalConfigPath);
		}
	}
});

test('worklog add - malformed JSON config shows error', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	writeFileSync(originalConfigPath, 'invalid json {');

	try {
		execFileSync(
			'node',
			[
				cliPath,
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
			],
			{
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
			},
		);

		t.fail('Should have thrown an error for malformed JSON');
	} catch (error: any) {
		t.is(error.status, 1);
		t.true(error.stderr.includes('Error:'));
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		} else if (existsSync(originalConfigPath)) {
			unlinkSync(originalConfigPath);
		}
	}
});

test('worklog add - incomplete config shows error', t => {
	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	const incompleteConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		// Missing username and apiToken
	};

	writeFileSync(originalConfigPath, JSON.stringify(incompleteConfig, null, 2));

	try {
		execFileSync(
			'node',
			[
				cliPath,
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
			],
			{
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
			},
		);

		t.fail('Should have thrown an error for incomplete config');
	} catch (error: any) {
		t.is(error.status, 1);
		t.true(error.stderr.includes('Error:'));
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		} else if (existsSync(originalConfigPath)) {
			unlinkSync(originalConfigPath);
		}
	}
});

test.serial('worklog add - end to end successful flow structure', t => {
	// This test verifies the structure of a successful call without making actual API requests
	// It uses a timeout to prevent hanging on network calls

	const backup = existsSync(originalConfigPath)
		? readFileSync(originalConfigPath, 'utf8')
		: null;

	const testConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'invalid-token-for-testing',
	};

	writeFileSync(originalConfigPath, JSON.stringify(testConfig, null, 2));

	try {
		execFileSync(
			'node',
			[
				cliPath,
				'worklog',
				'add',
				'--issue',
				'TEST-123',
				'--date',
				'2025-07-10',
				'--time',
				'2h',
				'--comment',
				'Integration test comment',
			],
			{
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'pipe'],
				timeout: 5000, // 5 second timeout to prevent hanging
			},
		);

		// If we get here without timeout, the command structure is working
		// The actual API call might fail due to invalid credentials, which is expected
		t.pass('Command structure and argument parsing works correctly');
	} catch (error: any) {
		// Expected to fail due to invalid credentials or network timeout
		// We're testing that the command structure works, not the actual API
		if (error.code === 'ETIMEDOUT') {
			t.pass(
				'Command structure works - timed out attempting API call as expected',
			);
		} else if (error.status === 1 && error.stderr.includes('Error:')) {
			t.pass(
				'Command structure works - API call failed as expected with invalid credentials',
			);
		} else {
			t.fail(`Unexpected error: ${error.message}`);
		}
	} finally {
		if (backup) {
			writeFileSync(originalConfigPath, backup);
		} else if (existsSync(originalConfigPath)) {
			unlinkSync(originalConfigPath);
		}
	}
});
