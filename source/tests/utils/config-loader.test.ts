import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import test from 'ava';
import {loadJiraConfig} from '../../utils/config-loader.js';

const temporaryConfigDirectory = join(homedir(), '.config-test-temp');
const temporaryConfigPath = join(temporaryConfigDirectory, 'jiracle.json');

test.beforeEach(() => {
	// Clean up any existing temp directory
	try {
		rmSync(temporaryConfigDirectory, {recursive: true, force: true});
	} catch {
		// Ignore if directory doesn't exist
	}

	// Create temp config directory
	mkdirSync(temporaryConfigDirectory, {recursive: true});
});

test.afterEach(() => {
	// Clean up temp directory
	try {
		rmSync(temporaryConfigDirectory, {recursive: true, force: true});
	} catch {
		// Ignore cleanup errors
	}
});

test('loadJiraConfig - loads valid config from custom path', t => {
	const testConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	writeFileSync(temporaryConfigPath, JSON.stringify(testConfig, null, 2));

	const result = loadJiraConfig(temporaryConfigPath);

	t.deepEqual(result, testConfig);
});

test('loadJiraConfig - loads config from default path when no path provided', t => {
	const defaultConfigPath = join(homedir(), '.config', 'jiracle.json');

	// Skip test if default config doesn't exist
	try {
		readFileSync(defaultConfigPath, 'utf8');
	} catch {
		t.pass('Default config file does not exist, skipping test');
		return;
	}

	// Should not throw when loading from default path
	t.notThrows(() => {
		loadJiraConfig();
	});
});

test('loadJiraConfig - throws error for non-existent config file', t => {
	const nonExistentPath = join(temporaryConfigDirectory, 'does-not-exist.json');

	const error = t.throws(() => {
		loadJiraConfig(nonExistentPath);
	});

	t.true(error instanceof Error);
	if (error instanceof Error) {
		t.true(
			error.message.includes('ENOENT') ||
				error.message.includes('no such file'),
		);
	}
});

test('loadJiraConfig - throws error for malformed JSON', t => {
	const malformedConfig = '{ "jiraUrl": "https://test.com", invalid json }';

	writeFileSync(temporaryConfigPath, malformedConfig);

	const error = t.throws(() => {
		loadJiraConfig(temporaryConfigPath);
	});

	t.true(error instanceof SyntaxError);
});

test('loadJiraConfig - handles empty config file', t => {
	writeFileSync(temporaryConfigPath, '{}');

	const result = loadJiraConfig(temporaryConfigPath);

	t.deepEqual(result, {});
});

test('loadJiraConfig - includeEnvVars parameter works correctly', t => {
	const testConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
	};

	writeFileSync(temporaryConfigPath, JSON.stringify(testConfig, null, 2));

	// Test without env vars (default)
	const resultWithoutEnv = loadJiraConfig(temporaryConfigPath);
	t.deepEqual(resultWithoutEnv, testConfig);

	// Test with env vars explicitly disabled
	const resultExplicitlyDisabled = loadJiraConfig(temporaryConfigPath, false);
	t.deepEqual(resultExplicitlyDisabled, testConfig);

	// Test with env vars enabled
	const resultWithEnv = loadJiraConfig(temporaryConfigPath, true);
	// Should still have the base config
	t.is(resultWithEnv.jiraUrl, testConfig.jiraUrl);
	t.is(resultWithEnv.username, testConfig.username);
	t.is(resultWithEnv.apiToken, testConfig.apiToken);
});

test('loadJiraConfig - handles complex config with nested objects', t => {
	const complexConfig = {
		jiraUrl: 'https://test.atlassian.net/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultTime: '4h',
		defaultComment: 'Development work',
		projects: [
			{
				key: 'TEST',
				defaultTime: '6h',
				defaultComment: 'Testing work',
			},
		],
		favorites: [
			{
				key: 'TEST-123',
				defaultTime: '2h',
			},
		],
		attendance: {
			enabled: true,
			defaultCheckInTime: '08:00',
			defaultCheckOutTime: '17:00',
		},
	};

	writeFileSync(temporaryConfigPath, JSON.stringify(complexConfig, null, 2));

	const result = loadJiraConfig(temporaryConfigPath);

	t.deepEqual(result, complexConfig);
	t.true(Array.isArray(result.projects));
	t.true(Array.isArray(result.favorites));
	t.is(result.projects?.[0]?.key, 'TEST');
	t.is(result.attendance?.enabled, true);
});
