import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import process from 'node:process';
import test from 'ava';
import type {JiraConfig} from '../jira/types.js';
import {getConfigPath, openConfigInEditor} from './open-config-editor.js';

// EXPLICIT TEST DATA
const testConfig: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	editor: 'echo', // Use 'echo' command for testing (available on all platforms)
};

const testConfigWithoutEditor: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
};

test('getConfigPath returns JIRACLE_CONFIG_PATH when set', t => {
	// EXPLICIT TEST DATA
	const customPath = '/custom/path/config.json';

	// OPERATIONS
	const originalPath = process.env['JIRACLE_CONFIG_PATH'];
	process.env['JIRACLE_CONFIG_PATH'] = customPath;

	const result = getConfigPath();

	// Cleanup
	process.env['JIRACLE_CONFIG_PATH'] = originalPath ?? undefined;

	// SPECIFIC VALUE COMPARISONS
	t.is(result, customPath);
});

test('getConfigPath returns default path when JIRACLE_CONFIG_PATH not set', t => {
	// EXPLICIT TEST DATA
	const expectedDefaultPath = join(homedir(), '.config', 'jiracle.json');

	// OPERATIONS
	const originalPath = process.env['JIRACLE_CONFIG_PATH'];
	// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
	delete process.env['JIRACLE_CONFIG_PATH'];

	const result = getConfigPath();

	// Cleanup
	process.env['JIRACLE_CONFIG_PATH'] = originalPath;

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedDefaultPath);
});

test('openConfigInEditor returns error when config file does not exist', async t => {
	// EXPLICIT TEST DATA
	const nonExistentPath = '/non/existent/path/config.json';

	// OPERATIONS
	const originalPath = process.env['JIRACLE_CONFIG_PATH'];
	process.env['JIRACLE_CONFIG_PATH'] = nonExistentPath;

	const result = await openConfigInEditor(testConfig);

	// Cleanup
	process.env['JIRACLE_CONFIG_PATH'] = originalPath ?? undefined;

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success);
	t.true(result.message.includes('Configuration file not found'));
	t.true(result.message.includes(nonExistentPath));
});

test('openConfigInEditor returns error when no editor is configured or detected', async t => {
	// EXPLICIT TEST DATA
	const configPath = getConfigPath();

	// OPERATIONS
	// Only run this test if the actual config file exists
	if (!existsSync(configPath)) {
		t.pass('Skipping test - no config file exists');
		return;
	}

	// Clear environment variables that might provide an editor
	const originalEditor = process.env['EDITOR'];
	const originalVisual = process.env['VISUAL'];
	process.env['EDITOR'] = undefined;
	process.env['VISUAL'] = undefined;

	// Mock detectEditor to return undefined by temporarily changing platform
	const originalPlatform = process.platform;
	Object.defineProperty(process, 'platform', {
		value: 'unknown' as any,
		configurable: true,
	});

	const result = await openConfigInEditor(testConfigWithoutEditor);

	// Cleanup
	if (originalEditor) {
		process.env['EDITOR'] = originalEditor;
	}

	if (originalVisual) {
		process.env['VISUAL'] = originalVisual;
	}

	Object.defineProperty(process, 'platform', {
		value: originalPlatform,
		configurable: true,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success);
	t.true(result.message.includes('No editor configured'));
});

test('openConfigInEditor uses configured editor from config', async t => {
	// EXPLICIT TEST DATA
	const configPath = getConfigPath();

	// OPERATIONS
	// Only run this test if the actual config file exists
	if (!existsSync(configPath)) {
		t.pass('Skipping test - no config file exists');
		return;
	}

	const result = await openConfigInEditor(testConfig);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.success);
	t.true(result.message.includes('Configuration file opened in echo'));
});

test('openConfigInEditor handles editor command with arguments', async t => {
	// EXPLICIT TEST DATA
	const configWithEditorArgs: JiraConfig = {
		...testConfig,
		editor: 'echo --version', // Command with arguments
	};
	const configPath = getConfigPath();

	// OPERATIONS
	// Only run this test if the actual config file exists
	if (!existsSync(configPath)) {
		t.pass('Skipping test - no config file exists');
		return;
	}

	const result = await openConfigInEditor(configWithEditorArgs);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.success);
	t.true(result.message.includes('Configuration file opened in echo'));
});

test('openConfigInEditor falls back to environment variables', async t => {
	// EXPLICIT TEST DATA
	const configPath = getConfigPath();

	// OPERATIONS
	// Only run this test if the actual config file exists
	if (!existsSync(configPath)) {
		t.pass('Skipping test - no config file exists');
		return;
	}

	// Set EDITOR environment variable
	const originalEditor = process.env['EDITOR'];
	process.env['EDITOR'] = 'echo';

	const result = await openConfigInEditor(testConfigWithoutEditor);

	// Cleanup
	process.env['EDITOR'] = originalEditor ?? undefined;

	// SPECIFIC VALUE COMPARISONS
	t.true(result.success);
	t.true(result.message.includes('Configuration file opened in echo'));
});
